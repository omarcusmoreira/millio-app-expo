import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, font } from '../tokens';

interface BrandProps {
  size?: number;
}

export function Brand({ size = 22 }: BrandProps) {
  return (
    <Text style={[styles.wordmark, { fontSize: size, letterSpacing: -0.015 * size }]}>
      milio
      <Text style={{ color: colors.brand.terracotta }}>.</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    fontFamily: font.family.serif,
    fontWeight: font.weight.regular,
    color: colors.ink[1],
    includeFontPadding: false,
  },
});
