import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, spacing } from '../tokens';
import { Brand } from './Brand';
import { StepDots } from '../onboarding/StepDots';

interface OnboardingNavProps {
  onBack: () => void;
  step?: number;
  totalSteps?: number;
  stepLabel?: string;
}

const SIDE_WIDTH = 28;

export function OnboardingNav({
  onBack,
  step,
  totalSteps,
  stepLabel,
}: OnboardingNavProps) {
  const hasSteps =
    step !== undefined && totalSteps !== undefined;

  return (
    <View style={styles.row}>
      <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
        <Text style={styles.backChevron}>‹</Text>
      </Pressable>

      <View style={styles.center}>
        {hasSteps ? (
          <>
            <StepDots total={totalSteps!} current={step!} />
            <View style={{ width: 8 }} />
            <Text style={styles.stepLabel}>
              {step}/{totalSteps}
              {stepLabel ? ` · ${stepLabel}` : ''}
            </Text>
          </>
        ) : (
          <Brand size={16} />
        )}
      </View>

      {/* Balancing spacer — same width as back button */}
      <View style={styles.right} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[5],
  },
  back: {
    width: SIDE_WIDTH,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backChevron: {
    fontSize: 20,
    color: colors.ink[2],
    paddingRight: spacing[5],
    lineHeight: 24,
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  right: {
    width: SIDE_WIDTH,
  },
});
