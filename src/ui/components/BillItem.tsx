import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Bill, Category, Member } from '../../domain/entities';
import { billStatus } from '../../domain/selectors';
import { CategoryChip, MemberAvatar, Money } from '../primitives';
import { font, spacing } from '../tokens';
import type { Colors } from '../tokens';
import { useColors } from '../theme';

interface BillItemProps {
  bill: Bill;
  categories: Category[];
  today: string;
  assignee?: Member | undefined;
  onPress?: () => void;
}

export function BillItem({ bill, categories, today, assignee, onPress }: BillItemProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const status = billStatus(bill, today);
  const isPaid = status === 'paid';
  const isOverdue = status === 'overdue';
  const primaryCategory = categories.find((c) => c.id === bill.categoryIds[0]);
  const amount = bill.amount ?? bill.estimate ?? 0;
  const dueLabel = getDueLabel(bill.due, today, t);

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && !!onPress && styles.rowPressed]}
      onPress={onPress}
      disabled={!onPress}
    >
      {/* Avatar on the left */}
      <View style={styles.avatarWrap}>
        {assignee ? (
          <MemberAvatar member={assignee} size="sm" />
        ) : (
          <View style={[styles.avatarPlaceholder, isOverdue && styles.avatarPlaceholderOverdue]} />
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.name, isPaid && styles.namePaid]} numberOfLines={1}>
          {bill.name}
        </Text>
        <View style={styles.meta}>
          {primaryCategory && (
            <>
              <CategoryChip name={primaryCategory.name} color={primaryCategory.color} />
              <Text style={styles.metaSep}>·</Text>
            </>
          )}
          <Text
            style={[
              styles.due,
              isOverdue && styles.dueOverdue,
              isPaid && styles.duePaid,
            ]}
          >
            {dueLabel}
          </Text>
        </View>
      </View>

      {/* Amount */}
      <Money
        value={amount}
        variant="inline"
        color={isPaid ? colors.ink[4] : colors.ink[1]}
        strikethrough={isPaid}
      />
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

const AVATAR_SM = 24;

const makeStyles = (colors: Colors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[7],
    gap: spacing[4],
  },
  rowPressed: {
    opacity: 0.7,
  },
  avatarWrap: {
    width: AVATAR_SM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: AVATAR_SM,
    height: AVATAR_SM,
    borderRadius: AVATAR_SM / 2,
    borderWidth: 1,
    borderColor: colors.ink[4],
  },
  avatarPlaceholderOverdue: {
    borderColor: colors.brand.terracotta,
  },
  info: {
    flex: 1,
    gap: spacing[3],
  },
  name: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  namePaid: {
    color: colors.ink[4],
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  metaSep: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
  },
  due: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  dueOverdue: {
    color: colors.brand.terracotta,
  },
  duePaid: {
    color: colors.ink[4],
  },
});
