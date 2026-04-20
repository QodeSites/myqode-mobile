import { Dimensions } from 'react-native';
import { useWindowDimensions } from 'react-native';

// Baseline design canvas (iPhone 15 Pro = 393×852, rounded to 390×844)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Width-percent: converts a percentage to pixels based on current screen width.
 * Use for horizontal sizing that should scale with the device.
 */
export function wp(pct: number): number {
  return (SCREEN_WIDTH * pct) / 100;
}

/**
 * Height-percent: converts a percentage to pixels based on current screen height.
 * Use for vertical sizing that should scale with the device.
 */
export function hp(pct: number): number {
  return (SCREEN_HEIGHT * pct) / 100;
}

/**
 * Moderately scales a size from the 390px baseline.
 * factor=0 → no scaling (constant), factor=1 → full linear scaling.
 * Default factor=0.35 keeps sizes close to design while adapting gently.
 */
export function scale(size: number, factor = 0.35): number {
  const ratio = SCREEN_WIDTH / BASE_WIDTH;
  return size + (ratio * size - size) * factor;
}

/**
 * Same as scale() but based on screen height.
 */
export function vScale(size: number, factor = 0.35): number {
  const ratio = SCREEN_HEIGHT / BASE_HEIGHT;
  return size + (ratio * size - size) * factor;
}

/** True on small phones (iPhone SE, older Androids) */
export const isSmallDevice = SCREEN_WIDTH < 375;

/** True on tablets / large iPads */
export const isTablet = SCREEN_WIDTH >= 768;

/**
 * Hook that returns reactive responsive values — updates on orientation change.
 * Use inside components. For module-level constants use the non-hook helpers above.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isSmall = width < 375;
  const isTabletLocal = width >= 768;
  const isLandscape = width > height;

  return {
    width,
    height,
    isSmall,
    isTablet: isTabletLocal,
    isLandscape,
    /** Horizontal percentage */
    wp: (pct: number) => (width * pct) / 100,
    /** Vertical percentage */
    hp: (pct: number) => (height * pct) / 100,
    /** Chart height: ~24% of screen, capped for tablets */
    chartHeight: Math.min(Math.round(height * 0.24), isTabletLocal ? 320 : 260),
    /** Drawdown chart height: ~21% of screen */
    drawdownHeight: Math.min(Math.round(height * 0.21), isTabletLocal ? 280 : 230),
  };
}
