import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useHouseholdStore } from '../../src/store/household';
import { billStatus } from '../../src/domain/selectors';
import { SwipeableBillItem } from '../../src/ui/components/SwipeableBillItem';
import { NewBillSheet } from '../../src/ui/components/NewBillSheet';
import { ConfirmModal } from '../../src/ui/components/ConfirmModal';
import { Money } from '../../src/ui/primitives';
import { useColors } from '../../src/ui/theme';
import { font, radius, spacing } from '../../src/ui/tokens';
import type { Colors } from '../../src/ui/tokens';
import type { Bill } from '../../src/domain/entities';

type Filter = 'all' | 'upcoming' | 'paid';

function monthNavLabel(year: number, month: number, locale: string): string {
  const date = new Date(year, month - 1, 1);
  const abbr = new Intl.DateTimeFormat(locale, { month: 'short' })
    .format(date)
    .toUpperCase()
    .replace(/\.$/, '');
  const yr = String(year).slice(2);
  return locale === 'pt-BR' ? `${abbr}. DE ${yr}` : `${abbr} '${yr}`;
}

export default function BillsScreen() {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const household = useHouseholdStore((s) => s.household);
  const today = useHouseholdStore((s) => s.today);
  const updateBill = useHouseholdStore((s) => s.updateBill);
  const deleteBill = useHouseholdStore((s) => s.deleteBill);
  const [filter, setFilter] = useState<Filter>('all');
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);

  const [todayYear, todayMonth] = today.split('-').map(Number) as [number, number];
  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth);

  const allBills = household?.bills ?? [];
  const monthPrefix = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
  const monthBills = allBills.filter((b) => b.due.startsWith(monthPrefix));

  const filtered = monthBills.filter((b) => {
    const status = billStatus(b, today);
    if (filter === 'upcoming') return status !== 'paid';
    if (filter === 'paid') return status === 'paid';
    return true;
  });

  const totalPending = monthBills
    .filter((b) => !b.paidAt)
    .reduce((s, b) => s + (b.amount ?? b.estimate ?? 0), 0);

  const totalPaid = monthBills
    .filter((b) => b.paidAt != null)
    .reduce((s, b) => s + (b.paidAmount ?? b.amount ?? 0), 0);

  const memberById = (id: string) =>
    household?.members.find((m) => m.id === id);

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
    else setViewMonth((m) => m + 1);
  };

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: t('bills.filter.all') },
    { key: 'upcoming', label: t('bills.filter.upcoming') },
    { key: 'paid', label: t('bills.filter.paid') },
  ];

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('bills.title')}</Text>
          <View style={styles.monthNav}>
            <Pressable onPress={prevMonth} hitSlop={8}>
              <ChevronLeft size={16} color={colors.ink[3]} />
            </Pressable>
            <Text style={styles.monthLabel}>
              {monthNavLabel(viewYear, viewMonth, i18n.language)}
            </Text>
            <Pressable onPress={nextMonth} hitSlop={8}>
              <ChevronRight size={16} color={colors.ink[3]} />
            </Pressable>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statEyebrow}>{t('bills.summary.pending').toUpperCase()}</Text>
            <Money value={totalPending} variant="kpi" />
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statEyebrow}>{t('bills.summary.paid').toUpperCase()}</Text>
            <Money
              value={totalPaid}
              variant="kpi"
              color={totalPaid > 0 ? colors.semantic.olive : colors.ink[4]}
            />
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterSegment}>
        {FILTERS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.filterItem, filter === key && styles.filterItemActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[styles.filterLabel, filter === key && styles.filterLabelActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('bills.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(b) => b.id}
          renderItem={({ item: bill }) => {
            const assignee = memberById(bill.assigneeId);
            return (
              <SwipeableBillItem
                bill={bill}
                categories={household?.categories ?? []}
                today={today}
                assignee={assignee}
                onEdit={() => setEditBill(bill)}
                onPay={() => bill.paidAt
                  ? updateBill(bill.id, { paidAt: null, paidAmount: null, paidFromAccountId: null })
                  : updateBill(bill.id, { paidAt: today, paidAmount: bill.amount ?? bill.estimate ?? 0, paidFromAccountId: null })
                }
                onDelete={() => setDeletingBill(bill)}
              />
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  header: {
    paddingHorizontal: spacing[7],
    paddingTop: spacing[6],
    paddingBottom: spacing[5],
    gap: spacing[5],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: font.family.sans,
    fontSize: font.size.h1,
    fontWeight: font.weight.medium,
    color: colors.ink[1],
    letterSpacing: font.letterSpacing.h1,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  monthLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[2],
    letterSpacing: font.letterSpacing.eyebrow,
    minWidth: 80,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
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
  statEyebrow: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[3],
    letterSpacing: font.letterSpacing.eyebrow,
  },
  filterSegment: {
    flexDirection: 'row',
    marginHorizontal: spacing[7],
    marginTop: spacing[4],
    marginBottom: spacing[4],
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surfaceSoft,
    padding: 2,
  },
  filterItem: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterItemActive: {
    backgroundColor: colors.background.surface,
  },
  filterLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
    fontWeight: font.weight.medium,
  },
  filterLabelActive: {
    color: colors.ink[1],
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.divider,
    marginLeft: spacing[7] + 10 + spacing[5],
  },
  listContent: {
    paddingBottom: spacing[10],
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[3],
  },
});
