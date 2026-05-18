import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useHouseholdStore } from '../../store/household';
import {
  effectiveAllowance as computeEffectiveAllowance,
  weeklySpent as computeWeeklySpent,
} from '../../domain/selectors';
import { colors, font, radius, spacing } from '../tokens';
import { NewExpenseSheet } from './NewExpenseSheet';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `R$ ${Math.round(value)}`;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AllowanceCard() {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const household = useHouseholdStore((s) => s.household);
  const today = useHouseholdStore((s) => s.today);

  const effective = household ? computeEffectiveAllowance(household, today) : 0;
  const spent = household ? computeWeeklySpent(household) : 0;
  const remaining = Math.max(0, effective - spent);

  const progress = effective > 0 ? Math.min(1, spent / effective) : 0;
  const isOver = spent > effective;
  const barColor = isOver ? colors.brand.terracottaPressed : colors.brand.terracotta;

  const weekDots = t('allowance.weekDots', { returnObjects: true }) as string[];
  const todayDotIndex = (new Date(today + 'T12:00:00').getDay() + 6) % 7;

  return (
    <>
      <View style={styles.card}>
        {/* Eyebrow + weekday dots */}
        <View style={styles.topRow}>
          <Text style={styles.eyebrow}>{t('allowance.thisWeek')}</Text>
          <View style={styles.weekDots}>
            {weekDots.map((dot, i) => (
              <Text key={i} style={[styles.weekDot, i === todayDotIndex && styles.weekDotActive]}>
                {dot}
              </Text>
            ))}
          </View>
        </View>

        {/* Effective allowance */}
        <Text style={styles.allowanceAmount}>{formatBRL(effective)}</Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(progress * 100)}%`, backgroundColor: barColor },
            ]}
          />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Text style={[styles.statText, isOver && styles.statTextOver]}>
            {formatBRL(spent)}{' '}
            <Text style={styles.statLabel}>{t('allowance.sheet.spentThisWeek').toLowerCase()}</Text>
          </Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.statText}>
            {formatBRL(remaining)}{' '}
            <Text style={styles.statLabel}>{t('allowance.remaining').toLowerCase()}</Text>
          </Text>

          {/* Register button */}
          <Pressable
            style={({ pressed }) => [styles.registerBtn, pressed && styles.registerBtnPressed]}
            onPress={() => setSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={t('allowance.logSpend')}
          >
            <Text style={styles.registerLabel}>+ {t('allowance.logSpend')}</Text>
          </Pressable>
        </View>
      </View>

      <NewExpenseSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.surface,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: spacing[7],
    paddingVertical: spacing[7],
    gap: spacing[4],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[3],
    textTransform: 'uppercase',
    letterSpacing: font.letterSpacing.eyebrow,
  },
  weekDots: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  weekDot: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
  },
  weekDotActive: {
    color: colors.brand.terracotta,
    fontWeight: font.weight.medium,
  },
  allowanceAmount: {
    fontFamily: font.family.serif,
    fontSize: font.size.h1,
    fontWeight: font.weight.regular,
    color: colors.ink[1],
    letterSpacing: font.letterSpacing.h1,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border.divider,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  statText: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[2],
  },
  statTextOver: {
    color: colors.brand.terracotta,
  },
  statLabel: {
    color: colors.ink[4],
  },
  statDot: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[4],
  },
  registerBtn: {
    marginLeft: 'auto',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.emphasis,
    backgroundColor: colors.background.surface,
  },
  registerBtnPressed: {
    opacity: 0.6,
  },
  registerLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    fontWeight: font.weight.medium,
    color: colors.ink[1],
  },
});
