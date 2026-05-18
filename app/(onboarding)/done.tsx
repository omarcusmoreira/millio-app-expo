import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, font, radius, spacing } from '../../src/ui/tokens';
import { useAuthStore } from '../../src/store/auth';

export default function OnboardingDoneScreen() {
  const { t } = useTranslation();
  const { name, householdChoice } = useAuthStore();
  const isJoined = householdChoice === 'join';
  const headline = t('onboarding.done.title', { firstName: name || 'Você' });
  const subtitle = isJoined
    ? t('onboarding.done.subJoined')
    : t('onboarding.done.subStandard');

  function handleStart() {
    router.replace('/(tabs)/home');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.top}>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.sub}>{subtitle}</Text>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>{t('onboarding.done.previewLabel')}</Text>
          <View style={styles.previewBody}>
            <Text style={styles.previewWeek}>{t('onboarding.done.previewWeek')}</Text>
            <View style={styles.previewAmountRow}>
              <View style={styles.previewAmountBlock} />
            </View>
            <Text style={styles.previewSpent}>{t('onboarding.done.previewSpent')}</Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.footnote}>{t('onboarding.done.footnote')}</Text>
          <Text style={styles.subline}>{t('onboarding.done.subline')}</Text>
          <Pressable
            style={styles.btn}
            onPress={handleStart}
            accessibilityRole="button"
          >
            <Text style={styles.btnLabel}>{t('onboarding.done.primary')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.page },
  container: {
    flex: 1,
    paddingHorizontal: spacing[8],
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
    justifyContent: 'space-between',
  },
  top: { gap: spacing[5] },
  headline: {
    fontFamily: font.family.serif,
    fontSize: font.size.heroSmall,
    fontWeight: font.weight.regular,
    color: colors.ink[1],
    lineHeight: font.size.heroSmall * font.lineHeight.snug,
  },
  sub: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[3],
    lineHeight: font.size.body * font.lineHeight.relaxed,
  },
  previewCard: {
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.xl,
    padding: spacing[7],
    gap: spacing[5],
  },
  previewLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  previewBody: { gap: spacing[4] },
  previewWeek: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
  },
  previewAmountRow: {
    height: 40,
    justifyContent: 'center',
  },
  previewAmountBlock: {
    height: 32,
    width: '55%',
    borderRadius: radius.small,
    backgroundColor: colors.background.surfaceSoft,
  },
  previewSpent: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
  },
  bottom: { gap: spacing[5] },
  footnote: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
    lineHeight: font.size.small * font.lineHeight.relaxed,
    textAlign: 'center',
  },
  subline: {
    fontFamily: font.family.serif,
    fontSize: font.size.hSection,
    fontWeight: font.weight.regular,
    color: colors.ink[2],
    textAlign: 'center',
  },
  btn: {
    backgroundColor: colors.brand.terracotta,
    borderRadius: radius.medium,
    paddingVertical: spacing[7],
    alignItems: 'center',
  },
  btnLabel: {
    fontFamily: font.family.sans,
    fontWeight: font.weight.medium,
    fontSize: font.size.body,
    color: colors.background.surface,
  },
});
