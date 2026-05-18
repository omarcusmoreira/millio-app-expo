import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, font, radius, spacing } from '../../src/ui/tokens';
import { Avatar } from '../../src/ui/primitives';
import { useHouseholdStore } from '../../src/store/household';
import { buildFreshHousehold } from '../../src/domain/factory';
import { OnboardingNav } from '../../src/ui/primitives/OnboardingNav';

export default function OnboardingIdentityScreen() {
  const { t } = useTranslation();
  const setHousehold = useHouseholdStore((s) => s.setHousehold);
  const [name, setName] = useState('');

  const canContinue = name.trim().length > 0;
  const initial = name.trim()[0]?.toUpperCase() ?? '?';

  function handleContinue() {
    if (!canContinue) return;
    setHousehold(buildFreshHousehold(name.trim()));
    router.push('/(onboarding)/setup-bills');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingNav onBack={() => router.back()} />
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.top}>
            <Text style={styles.headline}>{t('auth.identity.title')}</Text>
            <Text style={styles.sub}>{t('auth.identity.sub')}</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.avatarRow}>
              <Avatar
                initial={canContinue ? initial : '?'}
                color="terracotta"
                size="lg"
              />
            </View>

            <Text style={styles.inputLabel}>
              {t('auth.identity.label').toUpperCase()}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('auth.identity.placeholder')}
              placeholderTextColor={colors.ink[4]}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="given-name"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>

          <Pressable
            style={[styles.btn, !canContinue && styles.btnDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
            accessibilityRole="button"
          >
            <Text style={styles.btnLabel}>{t('common.continue')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  kav: { flex: 1 },
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
  },
  body: { gap: spacing[5] },
  avatarRow: {
    alignItems: 'center',
    paddingVertical: spacing[5],
  },
  inputLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.medium,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[7],
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
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
