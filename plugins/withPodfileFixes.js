// Expo config plugin — patches the generated iOS Podfile so the fixes survive
// every `expo prebuild`. Two things:
//
//   1. Scoped `:modular_headers => true` for the Firebase/Google ObjC pods so
//      Firebase's Swift pods (FirebaseCoreInternal, etc.) can import them.
//      A *global* use_modular_headers! collides with React Native's new-arch
//      modulemaps ("Redefinition of module 'react_runtime'"), and switching to
//      use_frameworks! :static breaks RN Firebase's ObjC modules on Xcode 26 —
//      so we keep the default linkage and just modularize the Google pods.
//
//   2. post_install: patch `fmt`'s base.h to disable consteval — Xcode 26's
//      Clang rejects fmt 11.0.2's consteval `FMT_STRING(...)` path
//      ("call to consteval function ... is not a constant expression").
//      fmt 11.1+ fixes this upstream; remove that bit when RN bumps its fmt pin.
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MODULAR_HEADERS_BLOCK = `
  # [withPodfileFixes] Firebase Swift pods need module maps from the ObjC pods
  # they depend on. Scoped, not global use_modular_headers!, to avoid colliding
  # with React Native's new-arch modulemaps.
  pod 'GoogleUtilities', :modular_headers => true
  pod 'FirebaseCore', :modular_headers => true
  pod 'FirebaseCoreInternal', :modular_headers => true
  pod 'FirebaseInstallations', :modular_headers => true
  pod 'GoogleDataTransport', :modular_headers => true
  pod 'nanopb', :modular_headers => true
  pod 'PromisesObjC', :modular_headers => true
`;

const FMT_PATCH_BLOCK = `
    # [withPodfileFixes] Xcode 26 / fmt 11.0.2 consteval workaround.
    fmt_base = File.join(installer.sandbox.root.to_s, 'fmt', 'include', 'fmt', 'base.h')
    if File.exist?(fmt_base)
      src = File.read(fmt_base)
      unless src.include?('FMT_PATCHED_NO_CONSTEVAL')
        src = src.sub(
          "#elif defined(__cpp_consteval)\\n#  define FMT_USE_CONSTEVAL 1\\n#elif FMT_GCC_VERSION >= 1002 || FMT_CLANG_VERSION >= 1101\\n#  define FMT_USE_CONSTEVAL 1",
          "#elif defined(__cpp_consteval)  // FMT_PATCHED_NO_CONSTEVAL\\n#  define FMT_USE_CONSTEVAL 0\\n#elif FMT_GCC_VERSION >= 1002 || FMT_CLANG_VERSION >= 1101\\n#  define FMT_USE_CONSTEVAL 0"
        )
        File.write(fmt_base, src)
        Pod::UI.puts "[withPodfileFixes] Patched fmt base.h to disable consteval".green
      end
    end
`;

module.exports = function withPodfileFixes(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      // 1) modular headers — insert right after `use_expo_modules!`
      if (!contents.includes("pod 'GoogleUtilities', :modular_headers => true")) {
        contents = contents.replace(
          /(\n\s*use_expo_modules!\s*\n)/,
          `$1${MODULAR_HEADERS_BLOCK}`
        );
      }

      // 2) fmt patch — append after react_native_post_install(...)
      if (!contents.includes('FMT_PATCHED_NO_CONSTEVAL')) {
        contents = contents.replace(
          /(react_native_post_install\([\s\S]*?\n\s*\)\s*\n)/,
          `$1${FMT_PATCH_BLOCK}`
        );
      }

      fs.writeFileSync(podfilePath, contents);
      return cfg;
    },
  ]);
};
