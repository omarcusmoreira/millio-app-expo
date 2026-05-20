import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { font, radius, spacing } from '../../src/ui/tokens';
import type { Colors } from '../../src/ui/tokens';
import { useColors } from '../../src/ui/theme';
import { OnboardingNav } from '../../src/ui/primitives/OnboardingNav';
import { useAuthStore } from '../../src/store/auth';

export default function SetupHouseholdScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const setHouseholdChoice = useAuthStore((s) => s.setHouseholdChoice);

  const handleSolo = () => {
    setHouseholdChoice('solo');
    router.push('/(onboarding)/done');
  };

  const choices = [
    {
      title: t('onboarding.lar.createTitle'),
      sub: t('onboarding.lar.createSub'),
      onPress: () => {
        setHouseholdChoice('create');
        router.push('/(onboarding)/setup-household-name' as never);
      },
    },
    {
      title: t('onboarding.lar.joinTitle'),
      sub: t('onboarding.lar.joinSub'),
      onPress: () => {
        setHouseholdChoice('join');
        router.push('/(onboarding)/setup-household-join' as never);
      },
    },
    {
      title: t('onboarding.lar.soloTitle'),
      sub: t('onboarding.lar.soloSub'),
      onPress: handleSolo,
    },
  ];

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
          <Text style={styles.headline}>{t('onboarding.lar.title')}</Text>
          <Text style={styles.sub}>{t('onboarding.lar.sub')}</Text>
        </View>

        <View style={styles.choices}>
          {choices.map((choice, i) => (
            <Pressable
              key={i}
              style={({ pressed }) => [
                styles.choiceCard,
                pressed && styles.choiceCardPressed,
              ]}
              onPress={choice.onPress}
              accessibilityRole="button"
            >
              <View style={styles.choiceContent}>
                <Text style={styles.choiceTitle}>{choice.title}</Text>
                <Text style={styles.choiceSub}>{choice.sub}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        {/* Spacer so content sits in upper portion */}
        <View style={{ flex: 1 }} />
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.page },
  container: {
    flex: 1,
    paddingHorizontal: spacing[8],
    paddingBottom: spacing[6],
    gap: spacing[8],
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
  choices: { gap: spacing[4] },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.xl,
    padding: spacing[7],
    gap: spacing[4],
  },
  choiceCardPressed: {
    backgroundColor: colors.background.surfaceSoft,
  },
  choiceContent: { flex: 1, gap: spacing[1] },
  choiceTitle: {
    fontFamily: font.family.sans,
    fontWeight: font.weight.medium,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  choiceSub: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
    lineHeight: font.size.small * font.lineHeight.relaxed,
  },
  chevron: {
    fontSize: 20,
    color: colors.ink[3],
    lineHeight: 24,
  },
});
