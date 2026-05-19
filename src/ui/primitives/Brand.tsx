import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { font } from '../tokens';
import type { Colors } from '../tokens';
import { useColors } from '../theme';

interface BrandProps {
  size?: number;
}

export function Brand({ size = 22 }: BrandProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <Text style={[styles.wordmark, { fontSize: size, letterSpacing: -0.015 * size }]}>
      milio
      <Text style={{ color: colors.brand.terracotta }}>.</Text>
    </Text>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  wordmark: {
    fontFamily: font.family.serif,
    fontWeight: font.weight.regular,
    color: colors.ink[1],
    includeFontPadding: false,
  },
});
