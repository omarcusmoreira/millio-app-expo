import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, font, radius, spacing } from '../../src/ui/tokens';
import { OnboardingNav } from '../../src/ui/primitives/OnboardingNav';

// Stage 12 — full invite flow (QR + code + link). Stub for now.
// "Convido depois" skips ahead to done.

export default function SetupHouseholdInviteScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingNav
        onBack={() => router.back()}
        step={4}
        totalSteps={4}
        stepLabel={t('onboarding.steps.lar')}
      />

      <View style={styles.container}>
        <View style={styles.top}>
          <Text style={styles.headline}>{t('onboarding.larInvite.title')}</Text>
          <Text style={styles.sub}>{t('onboarding.larInvite.sub')}</Text>
        </View>

        {/* QR placeholder */}
        <View style={styles.qrPlaceholder}>
          <View style={styles.qrDot} />
        </View>

        {/* Code row */}
        <View style={styles.codeRow}>
          <Text style={styles.codeLabel}>{t('onboarding.larInvite.codeLabel')}</Text>
          <Text style={styles.codeValue}>MILIO-742-CORN</Text>
          <Pressable style={styles.copyBtn}>
            <Text style={styles.copyLabel}>{t('onboarding.larInvite.copy')}</Text>
          </Pressable>
        </View>

        <View style={styles.bottom}>
          <Pressable
            style={styles.skipLink}
            onPress={() => router.replace('/(onboarding)/done')}
          >
            <Text style={styles.skipText}>{t('onboarding.larInvite.skip')}</Text>
          </Pressable>

          <Pressable
            style={styles.btn}
            onPress={() => router.replace('/(onboarding)/done')}
            accessibilityRole="button"
          >
            <Text style={styles.btnLabel}>{t('common.continue')}</Text>
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
    paddingBottom: spacing[6],
    gap: spacing[7],
  },
  top: { gap: spacing[4] },
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
  },
  qrPlaceholder: {
    alignSelf: 'center',
    width: 160,
    height: 160,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand.terracotta,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.large,
    padding: spacing[6],
  },
  codeLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  codeValue: {
    flex: 1,
    fontFamily: font.family.mono,
    fontSize: font.size.body,
    color: colors.ink[1],
    letterSpacing: 1,
  },
  copyBtn: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.emphasis,
    borderRadius: radius.small,
  },
  copyLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[2],
  },
  bottom: { gap: spacing[5], marginTop: 'auto' },
  skipLink: {
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  skipText: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
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
