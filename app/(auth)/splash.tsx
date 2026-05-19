import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../src/ui/theme';
import { font, radius, spacing } from '../../src/ui/tokens';
import type { Colors } from '../../src/ui/tokens';
import { Brand } from '../../src/ui/primitives';
import { useAuthStore } from '../../src/store/auth';

export default function SplashScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const setIntent = useAuthStore((s) => s.setIntent);

  function handleCreate() {
    setIntent('create');
    router.push('/(auth)/method');
  }

  function handleSignin() {
    setIntent('signin');
    router.push('/(auth)/method');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Hero — centered in available space */}
      <View style={styles.hero}>
        <Brand size={22} />
        <View style={{ height: spacing[9] }} />
        <Text style={styles.headline}>{t('splash.headline1')}</Text>
        <Text style={[styles.headline, styles.headlineTerracotta]}>
          {t('splash.headline2')}
        </Text>
      </View>

      {/* Actions — pinned to bottom */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={handleCreate}
          accessibilityRole="button"
        >
          <Text style={styles.btnLabel}>{t('splash.primary')}</Text>
        </Pressable>

        <Pressable style={styles.secondary} onPress={handleSignin}>
          <Text style={styles.secondaryLabel}>{t('splash.secondary')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  headline: {
    fontFamily: font.family.serif,
    fontSize: font.size.h1,
    fontWeight: font.weight.regular,
    color: colors.ink[1],
    lineHeight: font.size.h1 * font.lineHeight.snug,
    textAlign: 'center',
  },
  headlineTerracotta: {
    color: colors.brand.terracotta,
  },
  actions: {
    paddingHorizontal: spacing[8],
    paddingBottom: spacing[6],
    gap: spacing[2],
  },
  btn: {
    backgroundColor: colors.brand.terracotta,
    borderRadius: radius.medium,
    paddingVertical: spacing[7],
    alignItems: 'center',
  },
  btnPressed: { opacity: 0.85 },
  btnLabel: {
    fontFamily: font.family.sans,
    fontWeight: font.weight.medium,
    fontSize: font.size.body,
    color: colors.background.surface,
  },
  secondary: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  secondaryLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
  },
});
