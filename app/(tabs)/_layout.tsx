import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, font, spacing } from '../../src/ui/tokens';
import {
  HomeIcon,
  BillsIcon,
  SilosIcon,
  LarIcon,
  AddIcon,
} from '../../src/ui/primitives/TabIcon';
import { AppHeader } from '../../src/ui/primitives/AppHeader';

function AddTabButton({ onPress }: { onPress?: () => void }) {
  return (
    <View style={styles.addBtnWrapper}>
      <Pressable
        style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <AddIcon color={colors.background.surface} size={22} />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <AppHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background.surface,
            borderTopColor: colors.border.default,
            borderTopWidth: 1,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom + spacing[2],
            paddingTop: spacing[3],
          },
          tabBarActiveTintColor: colors.ink[1],
          tabBarInactiveTintColor: colors.ink[4],
          tabBarLabelStyle: {
            fontFamily: font.family.sans,
            fontSize: 10,
            marginTop: 2,
          },
          tabBarShowLabel: true,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t('home.tabLabel'),
            tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="bills"
          options={{
            title: t('bills.tabLabel'),
            tabBarIcon: ({ color, size }) => <BillsIcon color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: '',
            tabBarLabel: () => null,
            tabBarButton: (props) => {
              if (!props.onPress) return <AddTabButton />;
              const handler = () => { (props.onPress as () => void)(); };
              return <AddTabButton onPress={handler} />;
            },
          }}
        />
        <Tabs.Screen
          name="silos"
          options={{
            title: t('silos.tabLabel'),
            tabBarIcon: ({ color, size }) => <SilosIcon color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="household"
          options={{
            title: t('lar.tabLabel'),
            tabBarIcon: ({ color, size }) => <LarIcon color={color} size={size} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  addBtnWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.brand.terracotta,
  },
  addBtnPressed: {
    opacity: 0.85,
  },
});
