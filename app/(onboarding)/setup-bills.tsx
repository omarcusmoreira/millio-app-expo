import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, font, radius, spacing } from '../../src/ui/tokens';
import { OnboardingNav } from '../../src/ui/primitives/OnboardingNav';

const MOCK_BILLS = [
  { title: 'Aluguel', sub: 'CASA · PAGO DIA 1', amount: 'R$ 2.850', paid: true },
  { title: 'Internet', sub: 'CASA · PAGO DIA 4', amount: 'R$ 89', paid: true },
  { title: 'Luz', sub: 'SERVIÇOS · EM 3 DIAS', amount: '~ R$ 145', paid: false },
  { title: 'Academia', sub: 'EM 12 DIAS', amount: 'R$ 38', paid: false },
];

export default function SetupBillsScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingNav
        onBack={() => router.back()}
        step={1}
        totalSteps={3}
        stepLabel={t('onboarding.steps.bills')}
      />

      <View style={styles.container}>
        <View style={styles.top}>
          <Text style={styles.headline}>{t('onboarding.bills.title')}</Text>
          <Text style={styles.sub}>{t('onboarding.bills.sub')}</Text>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewLabel}>
            {t('onboarding.bills.preview').toUpperCase()}
          </Text>
          <View style={styles.previewRows}>
            {MOCK_BILLS.map((bill, i) => (
              <View key={i} style={styles.billRow}>
                <View
                  style={[
                    styles.checkbox,
                    bill.paid && styles.checkboxPaid,
                  ]}
                >
                  {bill.paid && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <View style={styles.billInfo}>
                  <Text style={styles.billTitle}>{bill.title}</Text>
                  <Text style={styles.billSub}>{bill.sub}</Text>
                </View>
                <Text style={[styles.billAmount, bill.paid && styles.billAmountPaid]}>
                  {bill.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.footer}>{t('onboarding.bills.footer')}</Text>
          <Pressable
            style={styles.btn}
            onPress={() => router.push('/(onboarding)/setup-incomes')}
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
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.border.emphasis,
    backgroundColor: colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxPaid: {
    backgroundColor: colors.brand.terracottaSoft,
    borderColor: colors.brand.terracottaSoft,
  },
  checkmark: {
    fontSize: 10,
    color: colors.brand.terracotta,
    lineHeight: 14,
  },
  billInfo: { flex: 1, gap: 2 },
  billTitle: {
    fontFamily: font.family.sans,
    fontWeight: font.weight.medium,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  billSub: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  billAmount: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  billAmountPaid: {
    color: colors.ink[3],
    textDecorationLine: 'line-through',
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
