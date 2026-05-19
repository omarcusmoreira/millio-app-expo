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
import { useColors } from '../../src/ui/theme';
import { font, radius, spacing } from '../../src/ui/tokens';
import type { Colors } from '../../src/ui/tokens';

type Mode = 'magic' | 'password';

function isValidEmail(email: string): boolean {
  return email.includes('@');
}

export default function AuthEmailScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<Mode>('magic');

  const valid = isValidEmail(email);

  function handleContinue() {
    if (!valid) return;
    if (mode === 'magic') {
      router.push({ pathname: '/(auth)/magic', params: { email } });
    } else {
      router.push({ pathname: '/(auth)/password', params: { email } });
    }
  }

  const subtitle =
    mode === 'magic' ? t('auth.email.subMagic') : t('auth.email.subPassword');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.top}>
            <Text style={styles.headline}>{t('auth.email.title')}</Text>
            <Text style={styles.sub}>{subtitle}</Text>
          </View>

          <View style={styles.body}>
            <TextInput
              style={styles.input}
              placeholder={t('auth.email.placeholder')}
              placeholderTextColor={colors.ink[4]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />

            <Pressable
              style={[styles.btn, !valid && styles.btnDisabled]}
              onPress={handleContinue}
              disabled={!valid}
              accessibilityRole="button"
            >
              <Text style={styles.btnLabel}>{t('common.continue')}</Text>
            </Pressable>

            <Pressable
              style={styles.toggleBtn}
              onPress={() => setMode((m) => (m === 'magic' ? 'password' : 'magic'))}
            >
              <Text style={styles.toggleLabel}>
                {mode === 'magic' ? t('auth.email.usePassword') : t('auth.email.sendCode')}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
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
  sub: { fontFamily: font.family.sans, fontSize: font.size.body, color: colors.ink[3] },
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
  btn: {
    backgroundColor: colors.brand.terracotta,
    borderRadius: radius.medium,
    paddingVertical: spacing[7],
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnLabel: {
    fontFamily: font.family.sans,
    fontWeight: font.weight.medium,
    fontSize: font.size.body,
    color: colors.background.surface,
  },
  toggleBtn: { alignItems: 'center', paddingVertical: spacing[5] },
  toggleLabel: { fontFamily: font.family.sans, fontSize: font.size.small, color: colors.ink[3] },
});
