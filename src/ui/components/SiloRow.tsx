import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Silo } from '../../domain/entities';
import { Money } from '../primitives';
import { colors, font, spacing } from '../tokens';

interface SiloRowProps {
  silo: Silo;
  today: string;
  onPress: () => void;
}

export function SiloRow({ silo, today, onPress }: SiloRowProps) {
  const { t } = useTranslation();
  const agoLabel = getAgoLabel(silo.updatedAt, today, t);

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <View style={styles.topLine}>
          <Text style={styles.name} numberOfLines={1}>
            {silo.name}
          </Text>
          <Money value={silo.value} variant="inline" color={colors.ink[1]} />
        </View>

        <View style={styles.metaLine}>
          <Text style={styles.metaText}>
            {silo.kind.toUpperCase()}
          </Text>
          {silo.note ? (
            <>
              <Text style={styles.metaSep}>·</Text>
              <Text style={styles.metaText} numberOfLines={1}>
                {silo.note}
              </Text>
            </>
          ) : null}
          {silo.goalAmount != null && (
            <>
              <Text style={styles.metaSep}>·</Text>
              <Text style={styles.metaText}>
                {t('common.goal')} <Money value={silo.goalAmount} variant="inline" color={colors.ink[3]} />
              </Text>
            </>
          )}
          <Text style={[styles.metaText, styles.agoText]}>{agoLabel}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>
    </Pressable>
  );
}

function getAgoLabel(
  updatedAt: string,
  today: string,
  t: ReturnType<typeof useTranslation>['t'],
): string {
  const d1 = new Date(updatedAt + 'T00:00:00Z');
  const d2 = new Date(today + 'T00:00:00Z');
  const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 7) return t('silos.ago.days', { n: diffDays });
  if (diffDays < 30) return t('silos.ago.weeks', { n: Math.round(diffDays / 7) });
  if (diffDays < 365) return t('silos.ago.months', { n: Math.round(diffDays / 30) });
  return t('silos.ago.years', { n: Math.round(diffDays / 365) });
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[7],
    backgroundColor: colors.background.surface,
  },
  rowPressed: {
    backgroundColor: colors.background.surfaceSoft,
  },
  content: {
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
  metaSep: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
  },
  agoText: {
    marginLeft: 'auto',
  },
  chevron: {
    fontFamily: font.family.sans,
    fontSize: 16,
    color: colors.ink[4],
  },
});
