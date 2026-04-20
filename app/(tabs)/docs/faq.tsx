import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, cardShadow } from '@/constants/Typography';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  // TOP-UPS
  {
    category: 'Top-Ups',
    q: 'How do I add more funds?',
    a: 'Via the app\'s Invest screen. Once your transfer is received, funds are executed on T+1 business day.',
  },
  {
    category: 'Top-Ups',
    q: 'Can I set up a SIP?',
    a: 'Yes, you can set up a Systematic Investment Plan (SIP) to invest fixed amounts at regular intervals. Use the Invest → SIP tab in the app.',
  },
  {
    category: 'Top-Ups',
    q: 'Can I set up an STP?',
    a: 'Yes. You can park funds in Qode Liquid Fund and set up a Systematic Transfer Plan (STP) to periodically transfer into your core strategies over time.',
  },
  {
    category: 'Top-Ups',
    q: 'Are there any top-up limits?',
    a: 'Top-ups must be in multiples of ₹1 lakh. Your total portfolio value must remain above the ₹50 lakh SEBI minimum at all times.',
  },
  // WITHDRAWALS
  {
    category: 'Withdrawals',
    q: 'How do I withdraw from my portfolio?',
    a: 'Submit a withdrawal request via the app\'s Invest → Withdrawal tab. Funds are typically credited to your bank account within T+10 business days.',
  },
  {
    category: 'Withdrawals',
    q: 'Is there a lock-in period?',
    a: 'No lock-in period as per SEBI PMS guidelines. However, partial withdrawals must maintain the minimum portfolio balance. Full exits are processed without penalty.',
  },
  // FEES
  {
    category: 'Fees',
    q: 'How are fees charged?',
    a: 'Qode charges quarterly management fees and annual performance fees above the High Watermark (HWM). Performance fees are only levied when your portfolio reaches a new NAV high.',
  },
  {
    category: 'Fees',
    q: 'Do fees include GST?',
    a: 'Yes, all fees (management and performance) are subject to GST as applicable under prevailing tax laws.',
  },
  // TAXES
  {
    category: 'Taxes',
    q: 'Will Qode deduct capital gains tax?',
    a: 'No. Investors are responsible for paying their own capital gains tax. Qode provides annual tax packs with detailed realized/unrealized gains statements to help you file accurately.',
  },
  {
    category: 'Taxes',
    q: 'Is TDS applicable on referral rewards?',
    a: 'Yes, TDS is applicable on referral rewards as per law. TDS is not applicable on investment returns from the PMS.',
  },
  {
    category: 'Taxes',
    q: 'Does Qode do tax loss harvesting?',
    a: 'No. Qode focuses on evidence-based long-term investing. We do not engage in tactical tax loss harvesting as it conflicts with our investment philosophy.',
  },
  {
    category: 'Taxes',
    q: 'Do I get tax statements?',
    a: 'Yes, annual tax packs are provided covering realized and unrealized gains, dividend credits, and all relevant transaction documents required for your ITR filing.',
  },
  // MINIMUMS & CUSTOMIZATION
  {
    category: 'Minimums & Customization',
    q: 'What is the minimum investment?',
    a: '₹50 lakhs as mandated by SEBI for all Portfolio Management Services. This is a regulatory requirement and not a Qode-specific policy.',
  },
  {
    category: 'Minimums & Customization',
    q: 'Can I customize my portfolio?',
    a: 'No. All clients hold the same model portfolio within each strategy. This ensures equal treatment, fairness, and operational efficiency across the investor base.',
  },
  // PORTAL ACCESS
  {
    category: 'Portal Access',
    q: 'How do I log into WealthSpectrum?',
    a: 'Use your registered email address at the WealthSpectrum portal. Contact the IR team if you haven\'t received your login credentials.',
  },
  {
    category: 'Portal Access',
    q: 'I forgot my WealthSpectrum password. What do I do?',
    a: 'Use the "Forgot Password" option on the WealthSpectrum login page, or reach out to the IR team at investor.relations@qodeinvest.com for assistance.',
  },
  // RISK & OPERATIONS
  {
    category: 'Risk & Operations',
    q: 'Can my portfolio lose value?',
    a: 'Yes. All equity investments carry market risk. Qode manages risk through diversification, disciplined rebalancing, and a systematic hedging policy — but capital loss is possible.',
  },
  {
    category: 'Risk & Operations',
    q: 'How does Qode manage risk during extreme market conditions?',
    a: 'Qode follows a defined hedging policy, drawdown protocols, liquidity management rules, and concentration discipline to limit downside in extreme conditions.',
  },
  {
    category: 'Risk & Operations',
    q: 'Who holds custody of my investments?',
    a: 'Your investments are held in your own demat account via SEBI-registered custodians. Qode manages the portfolio through a Power of Attorney (POA) only.',
  },
  {
    category: 'Risk & Operations',
    q: 'What happens during system downtime?',
    a: 'Qode maintains Business Continuity Plans (BCP) and Disaster Recovery (DR) protocols to ensure operations continue without interruption.',
  },
  {
    category: 'Risk & Operations',
    q: 'Can I switch between strategies?',
    a: 'Yes, strategy switches are permitted during the monthly rebalance window. Requests are subject to Qode\'s reallocation guidelines and must be raised via the app or IR team.',
  },
];

const GLOSSARY = [
  {
    term: 'XIRR',
    def: 'Extended Internal Rate of Return — accounts for timing and size of multiple cash flows to compute true annualised return.',
  },
  {
    term: 'HWM (High Watermark)',
    def: 'The highest NAV your portfolio has ever reached. Performance fees are only charged when the portfolio exceeds this level.',
  },
  {
    term: 'Benchmark',
    def: 'A reference index (e.g. Nifty 50) used to measure and compare portfolio performance over time.',
  },
  {
    term: 'Drawdown',
    def: 'Peak-to-trough percentage decline in a portfolio\'s value from its recent high point.',
  },
  {
    term: 'STP (Systematic Transfer Plan)',
    def: 'A phased investment approach: park funds in a liquid fund and periodically transfer into your core equity strategies.',
  },
  {
    term: 'Custodian',
    def: 'A SEBI-registered entity responsible for safeguarding client funds and securities in their demat account.',
  },
  {
    term: 'Protective Put',
    def: 'An options contract used by Qode to limit downside risk on the portfolio while preserving upside participation.',
  },
  {
    term: 'Rebalancing',
    def: 'Monthly process of realigning each client\'s portfolio back to the strategy\'s model portfolio weights.',
  },
  {
    term: 'SEBI',
    def: 'Securities and Exchange Board of India — the regulatory authority governing all investment products including PMS.',
  },
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  const contentHeight = useSharedValue(0);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  const animStyle = useAnimatedStyle(() => ({
    height: withTiming(isOpen ? measuredHeight : 0, { duration: 200 }),
    overflow: 'hidden',
  }));

  return (
    <View style={faqStyles.item}>
      <TouchableOpacity style={faqStyles.question} onPress={onToggle} activeOpacity={0.75}>
        <Text style={faqStyles.qText}>{item.q}</Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={Colors.textSecondary}
          style={faqStyles.chevron}
        />
      </TouchableOpacity>
      <Animated.View style={animStyle}>
        <View
          onLayout={(e) => setMeasuredHeight(e.nativeEvent.layout.height + 16)}
          style={faqStyles.answer}
        >
          <Text style={faqStyles.aText}>{item.a}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const faqStyles = StyleSheet.create({
  item: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  question: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 10,
  },
  qText: {
    ...Typography.BodySmall,
    color: Colors.textPrimary,
    fontFamily: 'Inter_500Medium',
    flex: 1,
    lineHeight: 19,
  },
  chevron: { marginTop: 2 },
  answer: {
    paddingBottom: 14,
  },
  aText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

export default function FAQScreen() {
  const [search, setSearch] = useState('');
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(FAQ_DATA.map((f) => f.category)))];

  const filtered = FAQ_DATA.filter((f) => {
    const matchCat = activeCategory === 'All' || f.category === activeCategory;
    const matchSearch =
      !search.trim() ||
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>FAQs & Glossary</Text>
          <Text style={styles.subtitle}>Quick answers to common questions</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search FAQs..."
            placeholderTextColor={Colors.textSecondary}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, activeCategory === cat && styles.catPillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catPillText, activeCategory === cat && styles.catPillActiveText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.content}>
          {/* FAQs */}
          <View style={styles.faqCard}>
            {filtered.length === 0 ? (
              <Text style={styles.emptyText}>No results found for "{search}"</Text>
            ) : (
              filtered.map((item, i) => (
                <FAQAccordion
                  key={i}
                  item={item}
                  isOpen={openIdx === i}
                  onToggle={() => setOpenIdx(openIdx === i ? null : i)}
                />
              ))
            )}
          </View>

          {/* Glossary */}
          <Text style={styles.glossaryTitle}>Glossary</Text>
          <View style={styles.glossaryCard}>
            {GLOSSARY.map((g, i) => (
              <View key={i} style={[styles.glossaryRow, i === GLOSSARY.length - 1 && styles.lastRow]}>
                <Text style={styles.glossaryTerm}>{g.term}</Text>
                <Text style={styles.glossaryDef}>{g.def}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  title: { ...Typography.H1, color: Colors.textPrimary },
  subtitle: { ...Typography.BodySmall, color: Colors.textSecondary, marginTop: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    ...Typography.Body,
    color: Colors.textPrimary,
  },
  categoryScroll: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catPillActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  catPillText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    fontFamily: 'Inter_500Medium',
  },
  catPillActiveText: { color: Colors.white },
  content: { padding: 16, gap: 16 },
  faqCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    ...cardShadow,
  },
  emptyText: {
    ...Typography.BodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 24,
  },
  glossaryTitle: { ...Typography.H3, color: Colors.textPrimary },
  glossaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 32,
    ...cardShadow,
  },
  glossaryRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 3,
  },
  lastRow: { borderBottomWidth: 0 },
  glossaryTerm: {
    ...Typography.BodySmall,
    color: Colors.primaryDark,
    fontFamily: 'Inter_700Bold',
  },
  glossaryDef: {
    ...Typography.Caption,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
