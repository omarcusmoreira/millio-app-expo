import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, font, radius, spacing } from '../../src/ui/tokens';
import { OnboardingNav } from '../../src/ui/primitives/OnboardingNav';

const MOCK_SILOS = [
  { title: 'Reserva de emergência', sub: 'POUPANÇA · HÁ 7D', amount: 'R$ 18.400' },
  { title: 'Casa nova', sub: 'META R$ 50.000', amount: 'R$ 8.200' },
  { title: 'Viagem em julho', sub: 'META R$ 6.000', amount: 'R$ 2.400' },
];

export default function SetupSilosScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingNav
        onBack={() => router.back()}
        step={3}
        totalSteps={4}
        stepLabel={t('onboarding.steps.silos')}
      />

      <View style={styles.container}>
        <View style={styles.top}>
          <Text style={styles.headline}>{t('onboarding.silos.title')}</Text>
          <Text style={styles.sub}>{t('onboarding.silos.sub')}</Text>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>
            {t('onboarding.silos.preview').toUpperCase()}
          </Text>
          <View style={styles.siloRows}>
            {MOCK_SILOS.map((silo, i) => (
              <View key={i} style={styles.siloRow}>
                <View style={styles.siloInfo}>
                  <Text style={styles.siloTitle}>{silo.title}</Text>
                  <Text style={styles.siloSub}>{silo.sub}</Text>
                </View>
                <Text style={styles.siloAmount}>{silo.amount}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.footer}>{t('onboarding.silos.footer')}</Text>
          <Pressable
            style={styles.btn}
            onPress={() => router.push('/(onboarding)/setup-household')}
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
    justifyContent: 'space-between',
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
  siloRows: { gap: spacing[4] },
  siloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  siloInfo: { flex: 1, gap: 2 },
  siloTitle: {
    fontFamily: font.family.sans,
    fontWeight: font.weight.medium,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  siloSub: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  siloAmount: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  bottom: { gap: spacing[6] },
  footer: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
    lineHeight: font.size.small * font.lineHeight.relaxed,
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
