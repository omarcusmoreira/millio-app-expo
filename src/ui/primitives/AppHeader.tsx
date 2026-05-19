import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, spacing } from '../tokens';
import { Brand } from './Brand';

export function AppHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.row, { paddingTop: insets.top + spacing[3] }]}>
      <Brand size={18} />
      <View style={styles.icons}>
        <Pressable style={styles.iconBtn} onPress={() => router.push('/settings')}>
          <Settings color={colors.ink[2]} size={20} strokeWidth={1.5} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[8],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
    backgroundColor: colors.background.page,
  },
  icons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
