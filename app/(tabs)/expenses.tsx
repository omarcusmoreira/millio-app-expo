import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useHouseholdStore } from '../../src/store/household';
import { expenseStatus, expenseOccurrencesInMonth } from '../../src/domain/selectors';
import { SwipeableExpenseItem } from '../../src/ui/components/SwipeableExpenseItem';
import { NewExpenseSheet } from '../../src/ui/components/NewExpenseSheet';
import { ConfirmModal } from '../../src/ui/components/ConfirmModal';
import { Money } from '../../src/ui/primitives';
import { useColors } from '../../src/ui/theme';
import { font, radius, spacing } from '../../src/ui/tokens';
import type { Colors } from '../../src/ui/tokens';
import type { Expense } from '../../src/domain/entities';

// ─── Types ────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'upcoming' | 'paid';
type SortOrder = 'asc' | 'desc';

type ExpenseRow = {
  key: string;
  display: Expense;   // projected date for display
  source: Expense;    // original for actions
};

// ─── Projection helpers ───────────────────────────────────────────────────────

function buildExpenseRows(expenses: Expense[], viewYear: number, viewMonth: number): ExpenseRow[] {
  const monthPrefix = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
  const nextYear = viewMonth === 12 ? viewYear + 1 : viewYear;
  const nextMonthNum = viewMonth === 12 ? 1 : viewMonth + 1;
  const nextMonthStart = `${nextYear}-${String(nextMonthNum).padStart(2, '0')}-01`;
  const monthStart = `${monthPrefix}-01`;
  const rows: ExpenseRow[] = [];

  for (const expense of expenses) {
    if (expense.date >= nextMonthStart && expense.recurring === 'one-time') continue;
    if (expense.endsAt && expense.endsAt < monthStart) continue;

    if (expense.recurring === 'one-time') {
      if (expense.date.startsWith(monthPrefix)) {
        rows.push({ key: expense.id, display: expense, source: expense });
      }
      continue;
    }

    const occurrences = expenseOccurrencesInMonth(expense, viewYear, viewMonth);
    for (const date of occurrences) {
      if (expense.endsAt && date > expense.endsAt) continue;
      const isOriginal = expense.date === date;
      rows.push({
        key: isOriginal ? expense.id : `${expense.id}_${date}`,
        display: isOriginal
          ? expense
          : { ...expense, date, paidAt: null, paidAmount: null },
        source: expense,
      });
    }
  }

  return rows;
}

// ─── Misc helpers ─────────────────────────────────────────────────────────────

function monthNavLabel(year: number, month: number, locale: string): string {
  const date = new Date(year, month - 1, 1);
  const abbr = new Intl.DateTimeFormat(locale, { month: 'short' })
    .format(date)
    .toUpperCase()
    .replace(/\.$/, '');
  const yr = String(year).slice(2);
  return locale === 'pt-BR' ? `${abbr}. DE ${yr}` : `${abbr} '${yr}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExpensesScreen() {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const household = useHouseholdStore((s) => s.household);
  const today = useHouseholdStore((s) => s.today);
  const updateExpense = useHouseholdStore((s) => s.updateExpense);
  const deleteExpense = useHouseholdStore((s) => s.deleteExpense);
  const markExpensePaid = useHouseholdStore((s) => s.markExpensePaid);

  const [filter, setFilter] = useState<Filter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const [todayYear, todayMonth] = today.split('-').map(Number) as [number, number];
  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth);

  const allExpenses = household?.expenses ?? [];

  const maxNavPrefix = useMemo(() => {
    let max = `${todayYear}-12`;
    for (const e of allExpenses) {
      if (e.endsAt) {
        const prefix = e.endsAt.slice(0, 7);
        if (prefix > max) max = prefix;
      }
    }
    return max;
  }, [allExpenses, todayYear]);

  const canGoNext = (() => {
    const nextY = viewMonth === 12 ? viewYear + 1 : viewYear;
    const nextM = viewMonth === 12 ? 1 : viewMonth + 1;
    return `${nextY}-${String(nextM).padStart(2, '0')}` <= maxNavPrefix;
  })();

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
    else setViewMonth((m) => m + 1);
  };

  const monthRows = buildExpenseRows(allExpenses, viewYear, viewMonth);

  const totalPending = monthRows
    .filter((r) => !r.display.paidAt)
    .reduce((s, r) => s + (r.display.amount ?? r.display.estimate ?? 0), 0);
  const totalPaid = monthRows
    .filter((r) => r.display.paidAt != null)
    .reduce((s, r) => s + (r.display.paidAmount ?? r.display.amount ?? 0), 0);

  const sorted = [...monthRows]
    .filter((r) => {
      const status = expenseStatus(r.display, today);
      if (filter === 'upcoming') return status !== 'paid';
      if (filter === 'paid') return status === 'paid';
      return true;
    })
    .sort((a, b) => {
      const cmp = a.display.date.localeCompare(b.display.date);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const memberById = (id: string) => household?.members.find((m) => m.id === id);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: t('bills.filter.all') },
    { key: 'upcoming', label: t('bills.filter.upcoming') },
    { key: 'paid', label: t('bills.filter.paid') },
  ];

  const filterBar = (
    <View style={styles.filterRow}>
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
      <Pressable
        style={styles.sortBtn}
        onPress={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
        hitSlop={8}
      >
        <ArrowUpDown
          size={16}
          color={sortOrder === 'desc' ? colors.brand.terracotta : colors.ink[3]}
        />
      </Pressable>
    </View>
  );

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
            <Pressable onPress={nextMonth} hitSlop={8} disabled={!canGoNext}>
              <ChevronRight size={16} color={canGoNext ? colors.ink[3] : colors.border.default} />
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

      {/* List */}
      <FlatList
        data={sorted}
        keyExtractor={(r) => r.key}
        ListHeaderComponent={filterBar}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('bills.empty')}</Text>
          </View>
        }
        renderItem={({ item: row }) => {
          const assignee = memberById(row.display.assigneeId);
          return (
            <SwipeableExpenseItem
              expense={row.display}
              categories={household?.categories ?? []}
              today={today}
              assignee={assignee}
              onEdit={() => setEditExpense(row.source)}
              onPay={row.source.recurring !== 'one-time' ? () =>
                row.source.paidAt
                  ? updateExpense(row.source.id, { paidAt: null, paidAmount: null })
                  : markExpensePaid(row.source.id)
                : undefined}
              onDelete={() => setDeletingExpense(row.source)}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[7],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[3],
  },
  filterSegment: {
    flex: 1,
    flexDirection: 'row',
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
  sortBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surfaceSoft,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.divider,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing[10],
  },
  empty: {
    paddingVertical: spacing[10],
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[3],
  },
});
