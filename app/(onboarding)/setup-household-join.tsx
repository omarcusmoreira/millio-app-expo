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
import { OnboardingNav } from '../../src/ui/primitives/OnboardingNav';

// Stage 12 — real lookup wired to backend. For now: MILIO-742-CORN is the demo code.

const DEMO_CODE = 'MILIO-742-CORN';
const DEMO_HOUSEHOLD = { name: 'Lar dos Carvalho', members: 4 };

type State = 'idle' | 'found' | 'not-found';

export default function SetupHouseholdJoinScreen() {
  const { t } = useTranslation();
  const [code, setCode]   = useState('');
  const [state, setState] = useState<State>('idle');

  function handleLookup() {
    const normalized = code.trim().toUpperCase();
    if (normalized === DEMO_CODE) {
      setState('found');
    } else {
      setState('not-found');
    }
  }

  function handleCodeChange(v: string) {
    setCode(v);
    if (state !== 'idle') setState('idle');
  }

  const canSubmit = code.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <OnboardingNav
        onBack={() => router.back()}
        step={4}
        totalSteps={4}
        stepLabel={t('onboarding.steps.lar')}
      />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.top}>
            <Text style={styles.headline}>{t('onboarding.larJoin.title')}</Text>
            <Text style={styles.sub}>{t('onboarding.larJoin.sub')}</Text>
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={[
                styles.input,
                state === 'not-found' && styles.inputError,
                state === 'found'     && styles.inputSuccess,
              ]}
              value={code}
              onChangeText={handleCodeChange}
              placeholder={t('onboarding.larJoin.placeholder')}
              placeholderTextColor={colors.ink[4]}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleLookup}
            />
            {state === 'not-found' && (
              <Text style={styles.errorText}>{t('onboarding.larJoin.notFound')}</Text>
            )}
            {state === 'found' && (
              <View style={styles.foundCard}>
                <View style={styles.foundInfo}>
                  <Text style={styles.foundName}>{DEMO_HOUSEHOLD.name}</Text>
                  <Text style={styles.foundMeta}>
                    {t('onboarding.larJoin.members', { count: DEMO_HOUSEHOLD.members })}
                  </Text>
                </View>
              </View>
            )}
            <Text style={styles.hint}>{t('onboarding.larJoin.tryHint')}</Text>
          </View>

          <View style={styles.bottom}>
            {state === 'found' ? (
              <Pressable
                style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
                onPress={() => router.replace('/(onboarding)/done')}
                accessibilityRole="button"
              >
                <Text style={styles.btnLabel}>
                  {t('onboarding.larJoin.found', { name: DEMO_HOUSEHOLD.name })}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [styles.btn, !canSubmit && styles.btnDisabled, pressed && canSubmit && { opacity: 0.85 }]}
                onPress={handleLookup}
                disabled={!canSubmit}
                accessibilityRole="button"
              >
                <Text style={styles.btnLabel}>{t('common.continue')}</Text>
              </Pressable>
            )}
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
  inputGroup: { gap: spacing[4] },
  input: {
    fontFamily: font.family.mono,
    fontSize: font.size.body,
    color: colors.ink[1],
    letterSpacing: 1.5,
    borderWidth: 1,
    borderColor: colors.border.emphasis,
    borderRadius: radius.medium,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[5],
    backgroundColor: colors.background.surface,
  },
  inputError:   { borderColor: colors.brand.terracotta },
  inputSuccess: { borderColor: colors.semantic.olive },
  errorText: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.brand.terracotta,
  },
  foundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.large,
    padding: spacing[6],
  },
  foundInfo: { flex: 1, gap: spacing[1] },
  foundName: {
    fontFamily: font.family.sans,
    fontWeight: font.weight.medium,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  foundMeta: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
  },
  hint: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  bottom: { marginTop: 'auto' },
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
});
