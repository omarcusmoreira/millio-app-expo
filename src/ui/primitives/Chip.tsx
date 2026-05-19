import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { font, radius, spacing } from '../tokens';
import type { Colors } from '../tokens';
import { useColors } from '../theme';

interface ChipProps {
  children: string;
  variant: 'outline' | 'soft' | 'terracotta';
  size?: 'sm' | 'md';
}

function makeVariantStyles(colors: Colors) {
  return {
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border.default,
      },
      text: { color: colors.ink[2] },
    },
    soft: {
      container: {
        backgroundColor: colors.brand.terracottaSoft,
      },
      text: { color: colors.brand.terracotta },
    },
    terracotta: {
      container: {
        backgroundColor: colors.brand.terracottaSoft,
      },
      text: { color: colors.brand.terracotta },
    },
  };
}

export function Chip({ children, variant, size = 'md' }: ChipProps) {
  const colors = useColors();
  const px = size === 'sm' ? spacing[3] : spacing[5];
  const py = size === 'sm' ? spacing[1] : spacing[2];
  const fontSize = size === 'sm' ? font.size.small : font.size.body;

  const variantStyles = makeVariantStyles(colors);
  const variantStyle = variantStyles[variant];

  return (
    <View style={[styles.base, variantStyle.container, { paddingHorizontal: px, paddingVertical: py }]}>
      <Text style={[styles.text, variantStyle.text, { fontSize }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: font.family.sans,
    fontWeight: font.weight.medium,
    includeFontPadding: false,
  },
});
