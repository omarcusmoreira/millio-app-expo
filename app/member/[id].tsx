import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';
import { useHouseholdStore } from '../../src/store/household';
import { Avatar, Money } from '../../src/ui/primitives';
import { BillItem } from '../../src/ui/components/BillItem';
import { colors, font, radius, spacing } from '../../src/ui/tokens';
import type { IncomeSchedule } from '../../src/domain/entities';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scheduleLabel(
  schedule: IncomeSchedule,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  if (schedule.kind === 'monthly') {
    return t('member.scheduleMonthly', { day: schedule.days[0] });
  }
  if (schedule.kind === 'split') {
    return t('member.scheduleSplit', { d1: schedule.days[0], d2: schedule.days[1] });
  }
  return t('member.scheduleBiweekly');
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const household = useHouseholdStore((s) => s.household);
  const today = useHouseholdStore((s) => s.today);

  const member = household?.members.find((m) => m.id === id);
  const categories = household?.categories ?? [];

  const incomes = (household?.incomes ?? []).filter((i) => i.memberId === id);

  const [todayYear, todayMonth] = today.split('-').map(Number) as [number, number];
  const assignedBills = (household?.bills ?? []).filter((b) => {
    if (b.assigneeId !== id) return false;
    const [y, m] = b.due.split('-').map(Number) as [number, number];
    return y === todayYear && m === todayMonth;
  });

  const monthlyTotal = incomes.reduce((sum, i) => sum + i.amount, 0);

  if (!member) return null;

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      {/* Back button */}
      <Pressable
        style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        onPress={() => router.back()}
        accessibilityRole="button"
      >
        <ChevronLeft size={20} color={colors.ink[2]} strokeWidth={2} />
        <Text style={styles.backLabel}>{t('lar.members')}</Text>
      </Pressable>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[10] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Avatar initial={member.initial} color={member.color} size="lg" />
          <Text style={styles.name}>{member.name}</Text>
          <View style={styles.kpiRow}>
            <Money value={monthlyTotal} variant="kpi" color={colors.ink[1]} />
            <Text style={styles.kpiLabel}>{t('member.monthlyIncome').toLowerCase()}</Text>
          </View>
        </View>

        {/* ── Recurring incomes ── */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>{t('member.recurringIncome').toUpperCase()}</Text>
          <View style={styles.card}>
            {incomes.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>
                  {t('member.emptyIncomes', { name: member.name })}
                </Text>
              </View>
            ) : (
              incomes.map((income, idx) => (
                <View key={income.id}>
                  {idx > 0 && <View style={styles.separator} />}
                  <View style={styles.incomeRow}>
                    <View style={styles.incomeInfo}>
                      <Text style={styles.incomeName}>{income.name}</Text>
                      <Text style={styles.incomeSchedule}>
                        {scheduleLabel(income.schedule, t)}
                      </Text>
                    </View>
                    <Money value={income.amount} variant="inline" color={colors.ink[1]} />
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* ── Assigned bills (this month) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>{t('member.billsAssigned').toUpperCase()}</Text>
          <View style={styles.card}>
            {assignedBills.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>
                  {t('member.emptyBills', { name: member.name })}
                </Text>
              </View>
            ) : (
              assignedBills.map((bill, idx) => (
                <View key={bill.id}>
                  {idx > 0 && <View style={styles.billSeparator} />}
                  <BillItem bill={bill} categories={categories} today={today} />
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  backBtnPressed: {
    opacity: 0.6,
  },
  backLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[2],
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing[8],
  },
  // Header
  header: {
    alignItems: 'center',
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
    gap: spacing[4],
  },
  name: {
    fontFamily: font.family.sans,
    fontSize: font.size.h1,
    fontWeight: font.weight.medium,
    color: colors.ink[1],
    letterSpacing: font.letterSpacing.h1,
  },
  kpiRow: {
    alignItems: 'center',
    gap: spacing[2],
  },
  kpiLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  // Sections
  section: {
    gap: spacing[3],
  },
  sectionEyebrow: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    letterSpacing: font.letterSpacing.eyebrow,
    color: colors.ink[3],
    paddingHorizontal: spacing[7],
  },
  card: {
    marginHorizontal: spacing[7],
    backgroundColor: colors.background.surface,
    borderRadius: radius.large,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.divider,
    marginLeft: spacing[7],
  },
  billSeparator: {
    height: 1,
    backgroundColor: colors.border.divider,
  },
  // Income row
  incomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    gap: spacing[4],
  },
  incomeInfo: {
    flex: 1,
    gap: spacing[2],
  },
  incomeName: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  incomeSchedule: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  // Empty state
  emptyRow: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
  },
  emptyText: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
    lineHeight: font.size.small * 1.5,
  },
});
