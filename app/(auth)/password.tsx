import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, font, radius, spacing } from '../../src/ui/tokens';

export default function AuthPasswordScreen() {
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [password, setPassword] = useState('');

  const canContinue = password.length > 0;

  function handleContinue() {
    if (!canContinue) return;
    router.replace('/(onboarding)/identity');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>
          <View style={styles.top}>
            <Text style={styles.headline}>{t('auth.password.title')}</Text>
            {email ? (
              <Text style={styles.sub}>
                {t('auth.password.forLabel')}{' '}
                <Text style={styles.subEmail}>{email}</Text>
              </Text>
            ) : null}
          </View>

          <View style={styles.body}>
            <TextInput
              style={styles.input}
              placeholder={t('auth.password.placeholder')}
              placeholderTextColor={colors.ink[4]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password-new"
            />

            <View style={styles.minimumRow}>
              <Text style={styles.minimumLabel}>{t('auth.password.minimum')}</Text>
              <Text style={styles.minimumValue}>8</Text>
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.page },
  kav: { flex: 1 },
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
  },
  subEmail: {
    color: colors.ink[2],
    fontWeight: font.weight.medium,
  },
  body: { gap: spacing[4] },
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
  minimumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[2],
  },
  minimumLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
  },
  minimumValue: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[4],
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
