import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/ui/theme';
import { font, radius, spacing } from '../../src/ui/tokens';
import type { Colors } from '../../src/ui/tokens';
import { useAuthStore } from '../../src/store/auth';
import { OnboardingNav } from '../../src/ui/primitives/OnboardingNav';

export default function AuthMethodScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const { intent, setAuthMethod } = useAuthStore();
  const isSignup = intent === 'create';

  const goToIdentity = (method: 'apple' | 'google') => {
    setAuthMethod(method);
    router.push('/(onboarding)/identity');
  };
  const goToEmail = () => {
    setAuthMethod('email');
    router.push('/(auth)/email');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingNav onBack={() => router.back()} />

      <View style={styles.container}>
        <View style={styles.top}>
          <Text style={styles.headline}>
            {isSignup ? t('auth.method.titleSignup') : t('auth.method.titleSignin')}
          </Text>
          <Text style={styles.sub}>
            {isSignup ? t('auth.method.subSignup') : t('auth.method.subSignin')}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.btnOutlined,
              pressed && styles.btnOutlinedPressed,
            ]}
            onPress={() => goToIdentity('apple')}
          >
            <Text style={styles.btnIconText}></Text>
            <Text style={styles.btnLabelOutlined}>{t('auth.method.appleBtn')}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.btnOutlined,
              pressed && styles.btnOutlinedPressed,
            ]}
            onPress={() => goToIdentity('google')}
          >
            <Text style={styles.btnIconGoogle}>G</Text>
            <Text style={styles.btnLabelOutlined}>{t('auth.method.googleBtn')}</Text>
          </Pressable>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>{t('auth.method.or')}</Text>
            <View style={styles.orLine} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.btnOutlined,
              pressed && styles.btnOutlinedPressed,
            ]}
            onPress={goToEmail}
          >
            <Text style={styles.btnLabelOutlined}>{t('auth.method.emailBtn')}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
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
  actions: { gap: spacing[4] },
  btnOutlined: {
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.emphasis,
    borderRadius: radius.medium,
    paddingVertical: spacing[7],
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
  },
  btnOutlinedPressed: {
    backgroundColor: colors.background.surfaceSoft,
  },
  btnLabelOutlined: {
    fontFamily: font.family.sans,
    fontWeight: font.weight.medium,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  btnIconText: {
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  btnIconGoogle: {
    fontFamily: font.family.sans,
    fontWeight: font.weight.medium,
    fontSize: font.size.body,
    color: colors.brand.terracotta,
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginVertical: spacing[2],
  },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border.divider },
  orText: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
  },
});
