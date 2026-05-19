import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/ui/theme';
import { font, radius, spacing } from '../../src/ui/tokens';
import type { Colors } from '../../src/ui/tokens';

export default function AuthMagicScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const confirmed = code.length === 6;

  function handleConfirm() {
    if (!confirmed) return;
    router.replace('/(onboarding)/identity');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.container}>
          <View style={styles.top}>
            <Text style={styles.headline}>{t('auth.magic.title')}</Text>
            <Text style={styles.sub}>{t('auth.magic.subWithEmail', { email: email ?? '' })}</Text>
          </View>
          <View style={styles.body}>
            <TextInput
              style={styles.codeInput}
              placeholder={t('auth.magic.placeholder')}
              placeholderTextColor={colors.ink[4]}
              value={code}
              onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              autoComplete="one-time-code"
              autoFocus
            />
            <Pressable
              style={[styles.btn, !confirmed && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={!confirmed}
            >
              <Text style={styles.btnLabel}>{t('auth.magic.verify')}</Text>
            </Pressable>
            <Pressable style={styles.resendBtn}>
              <Text style={styles.resendLabel}>{t('auth.magic.resend')}</Text>
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
  container: { flex: 1, paddingHorizontal: spacing[8], paddingTop: spacing[8], paddingBottom: spacing[6], justifyContent: 'space-between' },
  top: { gap: spacing[5] },
  headline: { fontFamily: font.family.serif, fontSize: font.size.heroSmall, fontWeight: font.weight.regular, color: colors.ink[1], lineHeight: font.size.heroSmall * font.lineHeight.snug },
  sub: { fontFamily: font.family.sans, fontSize: font.size.body, color: colors.ink[3] },
  body: { gap: spacing[4] },
  codeInput: { backgroundColor: colors.background.surface, borderWidth: 1, borderColor: colors.border.default, borderRadius: radius.medium, paddingVertical: spacing[7], fontFamily: font.family.mono, fontSize: font.size.h1, color: colors.ink[1], letterSpacing: 8 },
  btn: { backgroundColor: colors.brand.terracotta, borderRadius: radius.medium, paddingVertical: spacing[7], alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnLabel: { fontFamily: font.family.sans, fontWeight: font.weight.medium, fontSize: font.size.body, color: colors.background.surface },
  resendBtn: { alignItems: 'center', paddingVertical: spacing[5] },
  resendLabel: { fontFamily: font.family.sans, fontSize: font.size.small, color: colors.ink[3] },
});
