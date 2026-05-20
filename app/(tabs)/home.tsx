import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Bill } from '../../src/domain/entities';
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
  pendingBills,
  totalPending,
} from '../../src/domain/selectors';
import { AllowanceCard } from '../../src/ui/components/AllowanceCard';
import { SwipeableBillItem } from '../../src/ui/components/SwipeableBillItem';
import { NewBillSheet } from '../../src/ui/components/NewBillSheet';
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
  const updateBill = useHouseholdStore((s) => s.updateBill);
  const deleteBill = useHouseholdStore((s) => s.deleteBill);
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);

  const freeValue = household ? computeFreeToSpend(household, today) : 0;
  const overdrawn = household
    ? totalPending(household) > cashOnHand(household, today)
    : false;

  // Next paycheck info
  const paycheckInfo = household ? nextPaycheck(household, today) : null;
  const daysUntil = paycheckInfo
    ? Math.max(0, daysBetween(today, paycheckInfo.date))
    : null;
  const paycheckMember = paycheckInfo
    ? household?.members.find((m) => m.id === paycheckInfo.income.memberId)
    : null;

  // Chips data
  const pending = household ? totalPending(household) : 0;
  const pendingList = household ? pendingBills(household) : [];
  const pendingCount = pendingList.length;
  const silosTotal = household
    ? household.silos.reduce((s, silo) => s + silo.value, 0)
    : 0;
  const silosCount = household ? household.silos.length : 0;

  const categories = household?.categories ?? [];

  // Recent expenses — kind 'expense', sorted newest first, capped at 5
  const recentExpenses = (household?.transactions ?? [])
    .filter((t) => t.kind === 'expense')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // Upcoming bills — show first 4 unpaid
  const upcomingBills = pendingList.slice(0, 4);
  const paidBills = household
    ? household.bills.filter((b) => b.paidAt != null)
    : [];
  const paidCount = paidBills.length;
  const remainingCount = pendingCount;

  return (
    <View style={styles.safe}>
      <NewBillSheet
        open={editBill !== null}
        bill={editBill ?? undefined}
        onClose={() => setEditBill(null)}
      />
      <ConfirmModal
        visible={deletingBill !== null}
        title={t('addSheet.newBill.deleteBill')}
        message={t('common.deleteConfirm')}
        confirmLabel={t('addSheet.newBill.deleteBill')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          if (deletingBill) deleteBill(deletingBill.id);
          setDeletingBill(null);
        }}
        onCancel={() => setDeletingBill(null)}
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
            <Text style={styles.chipValue}>{formatBRL(pending)}</Text>
            <Text style={styles.chipSub}>{t('home.billsCount', { count: pendingCount })}</Text>
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

        {/* ── Recent expenses ── */}
        {recentExpenses.length > 0 && (
          <View style={styles.expensesSection}>
            <Text style={styles.sectionTitle}>{t('home.recentExpenses')}</Text>
            <View style={styles.expensesList}>
              {recentExpenses.map((tx, i) => {
                const member = household?.members.find((m) => m.id === tx.byMemberId);
                return (
                  <React.Fragment key={tx.id}>
                    {i > 0 && <View style={styles.rowDivider} />}
                    <View style={styles.expenseRow}>
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseName}>{tx.name}</Text>
                        <Text style={styles.expenseDate}>{tx.date}</Text>
                      </View>
                      <View style={styles.expenseRight}>
                        <Money value={-tx.amount} variant="inline" color={colors.ink[1]} />
                        {member && <MemberAvatar member={member} size="sm" />}
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Upcoming bills ── */}
        {upcomingBills.length > 0 && (
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
            {upcomingBills.map((bill, i) => {
              const assignee = household?.members.find((m) => m.id === bill.assigneeId);
              return (
                <React.Fragment key={bill.id}>
                  {i > 0 && <View style={styles.rowDivider} />}
                  <SwipeableBillItem
                    bill={bill}
                    categories={categories}
                    today={today}
                    assignee={assignee}
                    onEdit={() => setEditBill(bill)}
                    onPay={() => bill.paidAt
                      ? updateBill(bill.id, { paidAt: null, paidAmount: null, paidFromAccountId: null })
                      : updateBill(bill.id, { paidAt: today, paidAmount: bill.amount ?? bill.estimate ?? 0, paidFromAccountId: null })
                    }
                    onDelete={() => setDeletingBill(bill)}
                  />
                </React.Fragment>
              );
            })}
            {pendingCount > 4 && (
              <Pressable onPress={() => router.push('/(tabs)/bills')}>
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

  // Expenses
  expensesSection: {
    paddingHorizontal: spacing[7],
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontFamily: font.family.sans,
    fontWeight: font.weight.medium,
    fontSize: font.size.hSection,
    color: colors.ink[1],
    marginBottom: spacing[4],
  },
  expensesList: {
    backgroundColor: colors.background.surface,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
    gap: spacing[4],
  },
  expenseInfo: { flex: 1, gap: spacing[1] },
  expenseName: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  expenseDate: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
  },
  expenseRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
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
