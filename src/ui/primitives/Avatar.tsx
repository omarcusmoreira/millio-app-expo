import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { avatarSize, colors } from '../tokens';
import type { ColorToken } from '../tokens';

interface AvatarProps {
  initial: string;
  color: ColorToken;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: avatarSize.sm,
  md: avatarSize.md,
  lg: avatarSize.lg,
} as const;

export function Avatar({ initial, color, size = 'md' }: AvatarProps) {
  const dim = SIZE_MAP[size];
  const palette = colors.avatar[color];
  const fontSize = dim * 0.45;

  return (
    <View
      style={[
        styles.base,
        { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: palette.bg },
      ]}
    >
      <Text style={[styles.initial, { fontSize, color: palette.fg }]}>
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
