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

  const pct = silo.goalAmount != null && silo.goalAmount > 0
    ? Math.min(100, Math.round((silo.value / silo.goalAmount) * 100))
    : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
    >
      {/* Row 1: name + value */}
      <View style={styles.topLine}>
        <Text style={styles.name} numberOfLines={1}>{silo.name}</Text>
        <Money value={silo.value} variant="inline" color={colors.ink[1]} />
      </View>

      {/* Row 2: kind + ago */}
      <View style={styles.metaLine}>
        <Text style={styles.kindTag}>{silo.kind.toUpperCase()}</Text>
        <Text style={styles.agoLabel}>{agoLabel}</Text>
      </View>

      {/* Row 3: note (optional) */}
      {silo.note ? (
        <Text style={styles.note} numberOfLines={1}>{silo.note}</Text>
      ) : null}

      {/* Row 4: goal progress (optional) */}
      {silo.goalAmount != null && pct !== null && (
        <View style={styles.goalSection}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <View style={styles.goalCaption}>
            <Text style={styles.goalPct}>{pct}%</Text>
            <Money value={silo.goalAmount} variant="monoLine" color={colors.ink[4]} />
          </View>
        </View>
      )}
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
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[7],
    backgroundColor: colors.background.surface,
    gap: spacing[1],
  },
  rowPressed: {
    backgroundColor: colors.background.surfaceSoft,
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
    justifyContent: 'space-between',
  },
  kindTag: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[3],
    textTransform: 'uppercase',
    letterSpacing: font.letterSpacing.eyebrow,
  },
  agoLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
    textTransform: 'uppercase',
    letterSpacing: font.letterSpacing.eyebrow,
  },
  note: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
  },
  goalSection: {
    marginTop: spacing[2],
    gap: spacing[1],
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border.emphasis,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.semantic.olive,
  },
  goalCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalPct: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.semantic.olive,
    textTransform: 'uppercase',
    letterSpacing: font.letterSpacing.eyebrow,
  },
});
