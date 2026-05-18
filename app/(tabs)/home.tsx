import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, font, spacing } from '../../src/ui/tokens';
import { Avatar, Money } from '../../src/ui/primitives';
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
import { BillItem } from '../../src/ui/components/BillItem';

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

function formatDateShort(isoDate: string): string {
  try {
    const [, month, day] = isoDate.split('-').map(Number);
    const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
                    'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    return `${day} DE ${MONTHS[month - 1]}`;
  } catch {
    return isoDate;
  }
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { t } = useTranslation();
  const household = useHouseholdStore((s) => s.household);
  const today = useHouseholdStore((s) => s.today);

  const freeValue = household ? computeFreeToSpend(household, today) : 0;
  const overdrawn = household
    ? totalPending(household) > cashOnHand(household)
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

  // Upcoming bills — show first 4 unpaid
  const upcomingBills = pendingList.slice(0, 4);
  const paidBills = household
    ? household.bills.filter((b) => b.paidAt != null)
    : [];
  const paidCount = paidBills.length;
  const remainingCount = pendingCount;

  return (
    <View style={styles.safe}>
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
          {paycheckInfo && daysUntil !== null && (
            <View style={styles.paycheckRow}>
              <Text style={styles.paycheckText}>
                {t('home.nextIn', {
                  days: daysUntil,
                  date: formatDateShort(paycheckInfo.date),
                })}
              </Text>
              {paycheckMember && (
                <>
                  <Text style={styles.paycheckDot}> · </Text>
                  <Avatar
                    initial={paycheckMember.initial}
                    color={paycheckMember.color}
                    size="sm"
                  />
                  <Text style={styles.paycheckText}>
                    {' '}{t('home.paycheckOf', { name: paycheckMember.name })}
                  </Text>
                </>
              )}
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
                  <BillItem
                    bill={bill}
                    categories={categories}
                    today={today}
                    assignee={assignee}
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

const styles = StyleSheet.create({
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
    flexWrap: 'wrap',
    marginTop: spacing[2],
  },
  paycheckText: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[3],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  paycheckDot: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
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
