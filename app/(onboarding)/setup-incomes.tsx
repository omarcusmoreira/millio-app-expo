import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, font, radius, spacing } from '../../src/ui/tokens';
import { OnboardingNav } from '../../src/ui/primitives/OnboardingNav';
import { useAuthStore } from '../../src/store/auth';

const MOCK_INCOMES = [
  { title: 'Salário', sub: 'TODO DIA 1', amount: 'R$ 6.800/mês' },
  { title: 'Freela', sub: 'TODO DIA 20', amount: 'R$ 800/mês' },
];

export default function SetupIncomesScreen() {
  const { t } = useTranslation();
  const authName = useAuthStore((s) => s.name);
  const displayName = authName || 'Marcos';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingNav
        onBack={() => router.back()}
        step={2}
        totalSteps={4}
        stepLabel={t('onboarding.steps.incomes')}
      />

      <View style={styles.container}>
        <View style={styles.top}>
          <Text style={styles.headline}>{t('onboarding.incomes.title')}</Text>
          <Text style={styles.sub}>{t('onboarding.incomes.sub')}</Text>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>
            {t('onboarding.incomes.preview', { name: displayName }).toUpperCase()}
          </Text>
          <View style={styles.previewRows}>
            {MOCK_INCOMES.map((inc, i) => (
              <View key={i} style={styles.incomeRow}>
                <View style={styles.incomeAvatar}>
                  <Text style={styles.incomeAvatarText}>
                    {displayName[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.incomeInfo}>
                  <Text style={styles.incomeTitle}>{inc.title}</Text>
                  <Text style={styles.incomeSub}>{inc.sub}</Text>
                </View>
                <Text style={styles.incomeAmount}>{inc.amount}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.footer}>{t('onboarding.incomes.footer')}</Text>
          <Pressable
            style={styles.btn}
            onPress={() => router.push('/(onboarding)/setup-silos')}
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
    gap: spacing[4],
  },
  previewLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  previewRows: { gap: spacing[4] },
  incomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  incomeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeAvatarText: {
    fontFamily: font.family.sans,
    fontWeight: font.weight.medium,
    fontSize: 12,
    color: '#FBF8F3',
  },
  incomeInfo: { flex: 1, gap: 2 },
  incomeTitle: {
    fontFamily: font.family.sans,
    fontWeight: font.weight.medium,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  incomeSub: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  incomeAmount: {
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
