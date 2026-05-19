import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Bill, Category, Member } from '../../domain/entities';
import { billStatus } from '../../domain/selectors';
import { Dot, MemberAvatar, Money, StatusBox } from '../primitives';
import { colors, font, spacing } from '../tokens';

interface BillRowProps {
  bill: Bill;
  assignee: Member;
  primaryCategory?: Category | null;
  today: string;
  showAssignee?: boolean;
  onPress?: () => void;
}

export function BillRow({
  bill,
  assignee,
  primaryCategory,
  today,
  showAssignee = true,
  onPress,
}: BillRowProps) {
  const { t } = useTranslation();
  const status = billStatus(bill, today);
  const isPaid = status === 'paid';
  const isOverdue = status === 'overdue';

  const dueLabel = getDueLabel(bill.due, today, t);

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Status box */}
      <StatusBox status={status} />

      {/* Main content */}
      <View style={styles.content}>
        <View style={styles.topLine}>
          <Text
            style={[styles.name, isPaid && styles.namePaid]}
            numberOfLines={1}
          >
            {bill.name}
          </Text>
          <Money
            value={bill.amount ?? bill.estimate ?? 0}
            variant="inline"
            color={isPaid ? colors.ink[4] : colors.ink[1]}
            italic={bill.variable}
            strikethrough={isPaid}
          />
        </View>

        <View style={styles.metaLine}>
          {primaryCategory && (
            <>
              <Dot kind={primaryCategory.color} size={6} />
              <Text style={styles.metaText} numberOfLines={1}>
                {primaryCategory.name}
              </Text>
              <Text style={styles.metaSep}>·</Text>
            </>
          )}
          {bill.variable && !isPaid && (
            <Text style={styles.estTag}>{t('bills.estimate')} · </Text>
          )}
          <Text
            style={[
              styles.metaText,
              isOverdue && styles.metaOverdue,
              isPaid && styles.metaPaid,
            ]}
          >
            {dueLabel}
          </Text>

          {showAssignee && (
            <View style={styles.avatarWrap}>
              <MemberAvatar member={assignee} size="sm" />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function getDueLabel(
  due: string,
  today: string,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  if (due === today) return t('bills.due.today');
  const diff = daysBetween(today, due);
  if (diff === 1) return t('bills.due.tomorrow');
  if (diff === -1) return t('bills.due.yesterday');
  if (diff > 1) return t('bills.due.inDays', { n: diff });
  return t('bills.due.lateDays', { n: Math.abs(diff) });
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z');
  const db = new Date(b + 'T00:00:00Z');
  return Math.round((db.getTime() - da.getTime()) / (1000 * 60 * 60 * 24));
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[5],
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[7],
    backgroundColor: colors.background.surface,
  },
  rowPressed: {
    backgroundColor: colors.background.surfaceSoft,
  },
  content: {
    flex: 1,
    gap: spacing[1],
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  name: {
    flex: 1,
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  namePaid: {
    color: colors.ink[4],
    textDecorationLine: 'line-through',
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  metaText: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[3],
    textTransform: 'uppercase',
    letterSpacing: font.letterSpacing.eyebrow,
  },
  metaOverdue: {
    color: colors.brand.terracotta,
  },
  metaPaid: {
    color: colors.ink[4],
  },
  metaSep: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
  },
  estTag: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
    textTransform: 'uppercase',
    letterSpacing: font.letterSpacing.eyebrow,
  },
  avatarWrap: {
    marginLeft: 'auto',
  },
});
