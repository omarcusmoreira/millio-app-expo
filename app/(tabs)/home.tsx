import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Expense } from '../../src/domain/entities';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/ui/theme';
import { font, radius, spacing } from '../../src/ui/tokens';
import type { Colors } from '../../src/ui/tokens';
import { MemberAvatar, Money } from '../../src/ui/primitives';
import { useHouseholdStore } from '../../src/store/household';
import {
  cashOnHand,
  daysBetween,
  freeToSpend as computeFreeToSpend,
  nextPaycheck,
  totalPendingThisMonth,
  upcomingOccurrences,
} from '../../src/domain/selectors';
import { AllowanceCard } from '../../src/ui/components/AllowanceCard';
import { SwipeableExpenseItem } from '../../src/ui/components/SwipeableExpenseItem';
import { NewExpenseSheet } from '../../src/ui/components/NewExpenseSheet';
import { ConfirmModal } from '../../src/ui/components/ConfirmModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `R$ ${Math.round(value)}`;
  }
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const household = useHouseholdStore((s) => s.household);
  const today = useHouseholdStore((s) => s.today);
  const updateExpense = useHouseholdStore((s) => s.updateExpense);
  const deleteExpense = useHouseholdStore((s) => s.deleteExpense);
  const markExpensePaid = useHouseholdStore((s) => s.markExpensePaid);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const freeValue = household ? computeFreeToSpend(household, today) : 0;
  const pendingThisMonth = household ? totalPendingThisMonth(household, today) : 0;
  const cash = household ? cashOnHand(household, today) : 0;
  const overdrawn = pendingThisMonth > cash;

  // Next paycheck info
  const paycheckInfo = household ? nextPaycheck(household, today) : null;
  const daysUntil = paycheckInfo
    ? Math.max(0, daysBetween(today, paycheckInfo.date))
    : null;
  const paycheckMember = paycheckInfo
    ? household?.members.find((m) => m.id === paycheckInfo.memberId)
    : null;

  // Chips data
  const silosTotal = household
    ? household.silos.reduce((s, silo) => s + silo.value, 0)
    : 0;
  const silosCount = household ? household.silos.length : 0;

  const categories = household?.categories ?? [];

  // Upcoming occurrences — pending recurring expenses projected into individual date rows
  const recurringRows = household ? upcomingOccurrences(household, today, 8) : [];

  // One-time expenses from the current month (already paid, show as recent)
  const [todayYear, todayMonth] = today.split('-').map(Number) as [number, number];
  const monthPrefix = `${todayYear}-${String(todayMonth).padStart(2, '0')}`;
  const oneTimeRows: Array<{ expense: Expense; date: string }> = household
    ? household.expenses
        .filter((e) => e.recurring === 'one-time' && e.date.startsWith(monthPrefix))
        .map((e) => ({ expense: e, date: e.date }))
    : [];

  const allRows = [...recurringRows, ...oneTimeRows].sort((a, b) => a.date.localeCompare(b.date));
  const upcomingExpenses = allRows.slice(0, 4);
  const paidExpenses = household
    ? household.expenses.filter((e) => e.paidAt != null)
    : [];
  const paidCount = paidExpenses.length;
  const remainingCount = allRows.length;

  return (
    <View style={styles.safe}>
      <NewExpenseSheet
        open={editExpense !== null}
        expense={editExpense ?? undefined}
        onClose={() => setEditExpense(null)}
      />
      <ConfirmModal
        visible={deletingExpense !== null}
        title={t('bills.deleteExpense')}
        message={t('common.deleteConfirm')}
        confirmLabel={t('bills.deleteExpense')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          if (deletingExpense) deleteExpense(deletingExpense.id);
          setDeletingExpense(null);
        }}
        onCancel={() => setDeletingExpense(null)}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{t('home.freeToSpend')}</Text>
          <Money
            value={freeValue}
            variant="hero"
            color={overdrawn ? colors.brand.terracottaPressed : colors.brand.terracotta}
          />
          {paycheckInfo && daysUntil !== null && paycheckMember && (
            <View style={styles.paycheckRow}>
              <Text style={styles.paycheckText}>
                {t('home.paycheckIn', { days: daysUntil })}
              </Text>
              <MemberAvatar member={paycheckMember} size="sm" />
            </View>
          )}
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.chipEyebrow}>{t('home.pendingThisMonth')}</Text>
            <Text style={styles.chipValue}>{formatBRL(pendingThisMonth)}</Text>
            <Text style={styles.chipSub}>{t('home.billsCount', { count: allRows.length })}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.chipEyebrow}>{t('home.inSilos')}</Text>
            <Text style={styles.chipValue}>{formatBRL(silosTotal)}</Text>
            <Text style={styles.chipSub}>{t('home.silosCount', { count: silosCount })}</Text>
          </View>
        </View>

        {/* ── Allowance card ── */}
        <View style={styles.cardSection}>
          <AllowanceCard />
        </View>

        {/* ── Upcoming recurring expenses ── */}
        {upcomingExpenses.length > 0 && (
          <View style={styles.upcomingSection}>
            <View style={styles.upcomingHeader}>
              <Text style={styles.upcomingTitle}>{t('home.comingUp')}</Text>
              <Text style={styles.upcomingMeta}>
                {t('home.paidCount', {
                  paid: paidCount,
                  remaining: remainingCount,
                })}
              </Text>
            </View>
            {upcomingExpenses.map(({ expense, date }, i) => {
              const assignee = household?.members.find((m) => m.id === expense.assigneeId);
              const displayExpense = expense.date === date
                ? expense
                : { ...expense, date, paidAt: null, paidAmount: null };
              return (
                <React.Fragment key={`${expense.id}_${date}`}>
                  {i > 0 && <View style={styles.rowDivider} />}
                  <SwipeableExpenseItem
                    expense={displayExpense}
                    categories={categories}
                    today={today}
                    assignee={assignee}
                    onEdit={() => setEditExpense(expense)}
                    onPay={expense.recurring !== 'one-time' ? () =>
                      expense.paidAt
                        ? updateExpense(expense.id, { paidAt: null, paidAmount: null })
                        : markExpensePaid(expense.id)
                      : undefined}
                    onDelete={() => setDeletingExpense(expense)}
                  />
                </React.Fragment>
              );
            })}
            {remainingCount > 4 && (
              <Pressable onPress={() => router.push('/(tabs)/expenses')}>
                <Text style={styles.seeAll}>{t('home.seeAll')}</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: Colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  scroll: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingBottom: spacing[10],
  },

  // Hero
  hero: {
    paddingHorizontal: spacing[8],
    paddingTop: spacing[5],
    paddingBottom: spacing[6],
    gap: spacing[2],
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[3],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  paycheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  paycheckText: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[3],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[5],
    marginBottom: spacing[4],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border.default,
  },
  statCol: {
    flex: 1,
    gap: spacing[1],
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.default,
    marginHorizontal: spacing[6],
    alignSelf: 'stretch',
  },
  chipEyebrow: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[3],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  chipValue: {
    fontFamily: font.family.serif,
    fontSize: font.size.hSection,
    fontWeight: font.weight.regular,
    color: colors.ink[1],
  },
  chipSub: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },

  // Allowance card
  cardSection: {
    paddingHorizontal: spacing[7],
    marginBottom: spacing[6],
  },

  // Upcoming
  upcomingSection: {},
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
    paddingHorizontal: spacing[7],
  },
  upcomingTitle: {
    fontFamily: font.family.sans,
    fontWeight: font.weight.medium,
    fontSize: font.size.hSection,
    color: colors.ink[1],
  },
  upcomingMeta: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.border.default,
  },
  seeAll: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.brand.terracotta,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[7],
  },
});
