import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { avatarSize } from '../tokens';
import type { ColorToken } from '../tokens';
import { useColors } from '../theme';

interface AvatarProps {
  initial: string;
  color: ColorToken;
  size?: 'sm' | 'md' | 'lg';
  bgHex?: string | undefined;
}

const SIZE_MAP = {
  sm: avatarSize.sm,
  md: avatarSize.md,
  lg: avatarSize.lg,
} as const;

export function Avatar({ initial, color, size = 'md', bgHex }: AvatarProps) {
  const colors = useColors();
  const dim = SIZE_MAP[size];
  const palette = colors.avatar[color];
  const bg = bgHex ?? palette.bg;
  const fg = bgHex ? colors.ink[1] : palette.fg;
  const fontSize = dim * 0.45;

  return (
    <View
      style={[
        styles.base,
        { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.initial, { fontSize, color: fg }]}>
        {initial.slice(0, 1).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: 'Inter',
    fontWeight: '500',
    includeFontPadding: false,
  },
});
