import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, font, radius, spacing } from '../../src/ui/tokens';
import { OnboardingNav } from '../../src/ui/primitives/OnboardingNav';
import { useAuthStore } from '../../src/store/auth';
import { useHouseholdStore } from '../../src/store/household';
import { buildFreshHousehold } from '../../src/domain/factory';

export default function SetupHouseholdNameScreen() {
  const { t } = useTranslation();
  const { name: memberName } = useAuthStore();
  const setHousehold = useHouseholdStore((s) => s.setHousehold);

  const defaultName = t('onboarding.larName.placeholder', {
    lastname: memberName || t('onboarding.larName.defaultLastname'),
  });
  const [householdName, setHouseholdNameValue] = useState('');

  const handleContinue = (nameToUse: string) => {
    const h = buildFreshHousehold(memberName || 'Usuário');
    setHousehold({ ...h, name: nameToUse });
    router.push('/(onboarding)/setup-household-invite' as never);
  };

  const handleDefault = () => handleContinue(defaultName);

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
          <Text style={styles.headline}>{t('onboarding.larName.title')}</Text>
          <Text style={styles.sub}>{t('onboarding.larName.sub')}</Text>
        </View>

        <TextInput
          style={styles.input}
          value={householdName}
          onChangeText={setHouseholdNameValue}
          placeholder={defaultName}
          placeholderTextColor={colors.ink[4]}
          autoFocus
        />

        <View style={styles.bottom}>
          <Pressable onPress={handleDefault} style={styles.skipLink}>
            <Text style={styles.skipText}>{t('onboarding.larName.skip')}</Text>
          </Pressable>

          <Pressable
            style={[styles.btn, !householdName.trim() && styles.btnDisabled]}
            onPress={() => handleContinue(householdName.trim())}
            disabled={!householdName.trim()}
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
  },
  input: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.emphasis,
    paddingVertical: spacing[5],
  },
  bottom: { gap: spacing[5] },
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
  btnDisabled: {
    opacity: 0.4,
  },
  btnLabel: {
    fontFamily: font.family.sans,
    fontWeight: font.weight.medium,
    fontSize: font.size.body,
    color: colors.background.surface,
  },
});
