import React, { useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Fraunces_400Regular } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import * as SplashScreen from 'expo-splash-screen';
import '../src/i18n';
import { ThemeProvider, useColors } from '../src/ui/theme';
import { useHouseholdStore } from '../src/store/household';

SplashScreen.preventAutoHideAsync().catch(() => {});

const todayISO = () => new Date().toISOString().slice(0, 10);

function AppShell() {
  const colors = useColors();
  const setToday = useHouseholdStore((s) => s.setToday);
  const [ready, setReady] = useState(false);
  const appState = useRef(AppState.currentState);

  const [fontsLoaded, fontError] = useFonts({
    Fraunces: Fraunces_400Regular,
    Inter: Inter_400Regular,
    InterMedium: Inter_500Medium,
    JetBrainsMono: JetBrainsMono_400Regular,
  });

  // Refresh today whenever the app comes back to the foreground
  useEffect(() => {
    setToday(todayISO());
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current !== 'active' && next === 'active') {
        setToday(todayISO());
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [setToday]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
      setReady(true);
      return;
    }
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
      setReady(true);
    }, 3000);
    return () => clearTimeout(t);
  }, [fontsLoaded, fontError]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: colors.background.page }} />;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="member/[id]" />
      </Stack>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
