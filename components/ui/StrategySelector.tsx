/**
 * StrategySelector — pill + modal for switching the active portfolio scope.
 *
 * Visibility rules:
 *  - Example 1 (1 investor, multiple strategies):
 *      All Strategies  ← aggregate
 *      QGF
 *      QTF
 *      QAW
 *  - Example 2 (1 investor, 1 strategy):
 *      QAW
 *  - Example 3 (head of family, multiple investors):
 *      Combined Family View
 *      All Strategies (Investor 1)
 *      All Strategies (Investor 2)
 *      — Investor 1 —
 *        QGF  QTF  QAW
 *      — Investor 2 —
 *        QGF  QAW
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useAuthStore, StrategyKey, strategyFromAccountId } from '@/store/authStore';
import { usePortfolioSnapshot, usePortfolioPerformance } from '@/hooks/usePortfolio';

export const STRATEGY_LABELS: Record<string, string> = {
  all:    'All Strategies',
  QAW:    'Qode All Weather',
  QTF:    'Qode Tactical Fund',
  QGF:    'Qode Growth Fund',
  owner:  'All My Accounts',
  family: 'Entire Family',
};

// Strategy account codes follow `Q` + 2 letters (QAW, QTF, QGF, QLF, ...).
// Matching the pattern (rather than an explicit whitelist) means a new
// strategy launched on the backend shows up here without a code change.
const STRATEGY_PREFIX_PATTERN = /^Q[A-Z]{2}$/;
const isStrategyPrefix = (prefix: string) => STRATEGY_PREFIX_PATTERN.test(prefix);

interface Option {
  key: string;
  label: string;
  accountId: string;
  accountIds?: string[];  // set for aggregate scopes → triggers combined endpoints
  isAggregate: boolean;
  isHeader?: boolean;     // non-selectable section divider
  indented?: boolean;     // visually indented under a section header
}

export function StrategySelector() {
  const user = useAuthStore((s) => s.user);
  const selectedAccountId = useAuthStore((s) => s.selectedAccountId);
  const setSelectedAccount = useAuthStore((s) => s.setSelectedAccount);
  const setScopeOwner = useAuthStore((s) => s.setScopeOwner);

  const [modalVisible, setModalVisible] = useState(false);

  const { data: snapshot } = usePortfolioSnapshot();
  const performance = usePortfolioPerformance();
  const isClosed = performance.data?.isClosed ?? false;

  // Scope metadata from snapshot
  const groupId: string | null = snapshot?.groupId ?? null;
  const isHeadOfFamily: boolean = snapshot?.isHeadOfFamily ?? false;
  const ownerNodes = snapshot?.children?.filter((n) => n.type === 'person') ?? [];
  const multipleOwners = ownerNodes.length > 1;

  // Track closed strategies
  const closedFromSnapshot = useMemo(() => {
    const closed = new Set<StrategyKey>();
    const walk = (node: any) => {
      if (node?.type === 'account' && (node.isClosed || node.status === 'closed')) {
        const k = strategyFromAccountId(node.id);
        if (k !== 'all' && k !== 'owner' && k !== 'family') closed.add(k);
      }
      for (const child of node?.children ?? []) walk(child);
    };
    if (snapshot) walk(snapshot);
    return closed;
  }, [snapshot]);

  const learnedClosed = useRef<Set<StrategyKey>>(new Set());
  useEffect(() => {
    const k = strategyFromAccountId(selectedAccountId);
    if (isClosed && k !== 'all' && k !== 'owner' && k !== 'family') {
      learnedClosed.current.add(k);
    }
  }, [isClosed, selectedAccountId]);

  const isStrategyClosed = (key: string) => {
    // key may be 'QGF', 'QGF:OWN-A', etc — extract the prefix part
    const prefix = key.split(':')[0];
    return (
      isStrategyPrefix(prefix) &&
      (closedFromSnapshot.has(prefix as StrategyKey) ||
        learnedClosed.current.has(prefix as StrategyKey))
    );
  };

  // Build option list
  const options = useMemo((): Option[] => {
    const result: Option[] = [];

    // ── Level 1: Family aggregate ─────────────────────────────────────────
    if (isHeadOfFamily && groupId) {
      result.push({
        key: 'family',
        label: 'Combined Family View',
        accountId: groupId,
        isAggregate: true,
      });
    }

    if (ownerNodes.length > 0) {
      // ── Snapshot available: build hierarchical structure ─────────────────

      // Helper: get strategy prefix for an account node (prefer strategyPrefix field)
      const getPrefix = (acc: any): string =>
        ((acc.strategyPrefix as string | undefined) ?? acc.id.slice(0, 3)).toUpperCase();

      // Helper: is this node a strategy account?
      // Exclude closed accounts (two consecutive 0 portfolio values) so they
      // don't pollute the selector — clients shouldn't be navigating to dead accounts.
      const isStrategyAccount = (a: any) => {
        const pfx = getPrefix(a);
        return isStrategyPrefix(pfx) && !a.isClosed && a.status !== 'closed';
      };

      // "All Strategies (Name)" per owner — only if >1 strategy account for that owner
      for (const owner of ownerNodes) {
        const stratAccounts = (owner.children ?? []).filter(isStrategyAccount);
        if (stratAccounts.length > 1) {
          result.push({
            key: `owner:${owner.id}`,
            label: multipleOwners
              ? `All Strategies (${owner.label})`
              : 'All Strategies',
            accountId: owner.id,
            accountIds: stratAccounts.map((a) => a.id),
            isAggregate: true,
          });
        }
      }

      // Individual accounts grouped by owner
      for (const owner of ownerNodes) {
        const stratAccounts = (owner.children ?? []).filter(isStrategyAccount);
        if (stratAccounts.length === 0) continue;

        if (multipleOwners) {
          // Section header (non-selectable)
          result.push({
            key: `header:${owner.id}`,
            label: owner.label,
            accountId: owner.id,
            isAggregate: false,
            isHeader: true,
          });
        }

        const seenKeys = new Set<string>();
        for (const acc of stratAccounts) {
          const prefix = getPrefix(acc);
          const key = multipleOwners ? `${prefix}:${owner.id}` : prefix;
          if (seenKeys.has(key)) continue; // deduplicate same prefix per owner
          seenKeys.add(key);
          result.push({
            key,
            label: (acc.strategyName as string | undefined) ?? STRATEGY_LABELS[prefix] ?? prefix,
            accountId: acc.id,
            isAggregate: false,
            indented: multipleOwners,
          });
        }
      }
    } else {
      // ── Fallback: snapshot not yet loaded, build from accountCodes ────────
      const codes = (user?.accountCodes ?? []).filter((c) => isStrategyPrefix(c.slice(0, 3).toUpperCase()));

      // "All Strategies" aggregate for single investor with multiple strategies
      if (!isHeadOfFamily && codes.length > 1) {
        result.push({
          key: 'owner:self',
          label: 'All Strategies',
          accountId: codes[0],
          accountIds: codes,
          isAggregate: true,
        });
      }

      const seen = new Set<string>();
      for (const code of codes) {
        const prefix = code.slice(0, 3).toUpperCase();
        if (!seen.has(prefix)) {
          seen.add(prefix);
          result.push({
            key: prefix,
            label: STRATEGY_LABELS[prefix] ?? prefix,
            accountId: code,
            isAggregate: false,
          });
        }
      }
    }

    return result;
  }, [user?.accountCodes, isHeadOfFamily, groupId, multipleOwners, ownerNodes]);

  // Determine which option is active.
  // Owner/combined scope is now detected by matching selectedAccountId against
  // the option's accountId (the ownerId stored in pms_master_sheet).
  const activeKey = useMemo(() => {
    if (!selectedAccountId) return options.find((o) => !o.isHeader)?.key ?? '';
    if (selectedAccountId === groupId) return 'family';
    // Owner aggregate: ownerId stored as selectedAccountId directly
    const ownerMatch = options.find(
      (o) => o.key.startsWith('owner:') && o.accountId === selectedAccountId
    );
    if (ownerMatch) return ownerMatch.key;
    // Direct match (individual strategy account)
    const direct = options.find(
      (o) => !o.isHeader && !o.isAggregate && o.accountId === selectedAccountId
    );
    if (direct) return direct.key;
    return options.find((o) => !o.isHeader)?.key ?? '';
  }, [selectedAccountId, groupId, options]);

  // Short label for the pill button
  const btnLabel = useMemo(() => {
    const active = options.find((o) => o.key === activeKey);
    if (!active) return 'All';
    if (active.key === 'family') return 'Family';
    if (active.key.startsWith('owner:')) {
      if (multipleOwners) {
        // Extract first name from "All Strategies (First Last)"
        const match = active.label.match(/\((.+?)\)/);
        return match ? match[1].split(' ')[0] : 'All';
      }
      return 'All';
    }
    const prefix = active.accountId.slice(0, 3).toUpperCase();
    return isStrategyPrefix(prefix) ? prefix : active.label.slice(0, 4);
  }, [activeKey, options, multipleOwners]);

  const handleSelect = (opt: Option) => {
    if (opt.accountIds) {
      setScopeOwner(opt.accountId, opt.accountIds);
    } else {
      setSelectedAccount(opt.accountId);
    }
    setModalVisible(false);
  };

  // Don't render the pill if there's only one selectable option (or none)
  const selectableCount = options.filter((o) => !o.isHeader).length;
  if (selectableCount <= 1) return null;

  return (
    <>
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[
          styles.modalContainer,
          // Android: modal is full-screen, add status bar height so content
          // doesn't render behind the system status bar
          Platform.OS === 'android' && {
            paddingTop: (RNStatusBar.currentHeight ?? 24) + 8,
          },
        ]}>
          {/* Handle — only on iOS where pageSheet is draggable */}
          {Platform.OS === 'ios' && <View style={styles.handle} />}
          <Text style={styles.modalTitle}>Select Scope</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
            {options.map((opt) => {
              if (opt.isHeader) {
                return (
                  <View key={opt.key} style={styles.sectionHeader}>
                    <View style={styles.sectionHeaderLine} />
                    <Text style={styles.sectionHeaderText}>{opt.label}</Text>
                    <View style={styles.sectionHeaderLine} />
                  </View>
                );
              }
              const isActive = activeKey === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.option,
                    opt.indented && styles.optionIndented,
                    isActive && styles.optionActive,
                  ]}
                  onPress={() => handleSelect(opt)}
                >
                  <View style={styles.optionRow}>
                    {opt.isAggregate && (
                      <Ionicons
                        name={
                          opt.key === 'family'
                            ? 'people'
                            : opt.key.startsWith('owner:')
                            ? 'layers-outline'
                            : 'layers'
                        }
                        size={16}
                        color={isActive ? Colors.primaryDark : Colors.textSecondary}
                        style={styles.optionIcon}
                      />
                    )}
                    {opt.indented && (
                      <View style={styles.indentDot} />
                    )}
                    <Text
                      style={[
                        styles.optionText,
                        opt.isAggregate && styles.optionTextAggregate,
                        isActive && styles.optionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </View>
                  {isActive && (
                    <Ionicons name="checkmark" size={18} color={Colors.primaryDark} />
                  )}
                </TouchableOpacity>
              );
            })}
            <View style={styles.modalBottomPad} />
          </ScrollView>
        </View>
      </Modal>

      <TouchableOpacity style={styles.btn} onPress={() => setModalVisible(true)}>
        <Text style={styles.btnText} numberOfLines={1}>{btnLabel}</Text>
        <Ionicons name="chevron-down" size={12} color={Colors.primaryDark} />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    borderRadius: 8,
    // Fixed height matches the logout icon button (34px) so both controls
    // in the portfolio header sit at the same visual baseline
    height: 34,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: 90,
  },
  btnText: {
    // Explicit styles — avoids the Typography.Caption lineHeight: 13 + flex: 1
    // combination that can make text measure 0-height in a fixed-height row container
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.primaryDark,
    flexShrink: 1,    // shrinks if label is long but doesn't force-fill height
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...Typography.H2,
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  modalScroll: {
    flex: 1,
  },
  modalBottomPad: {
    height: 40,
  },

  // Section header (non-selectable divider)
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  sectionHeaderText: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Option rows
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionIndented: {
    paddingLeft: 28,
  },
  optionActive: {
    backgroundColor: Colors.background,
    borderColor: Colors.primaryDark,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  optionIcon: { flexShrink: 0 },
  indentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textSecondary,
    flexShrink: 0,
  },
  optionText: {
    ...Typography.Body,
    color: Colors.textPrimary,
  },
  optionTextAggregate: {
    fontFamily: 'Inter_600SemiBold',
  },
  optionTextActive: {
    color: Colors.primaryDark,
    fontFamily: 'Inter_600SemiBold',
  },
  closedPill: {
    backgroundColor: Colors.negative + '20',
    borderWidth: 1,
    borderColor: Colors.negative + '60',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  closedPillText: {
    ...Typography.Caption,
    color: Colors.negative,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
});
