import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Dot } from './Dot';
import { colors, font, radius, spacing } from '../tokens';

interface CategoryChipProps {
  name: string;
  color: string;
}

export function CategoryChip({ name, color }: CategoryChipProps) {
  return (
    <View style={[styles.chip, { backgroundColor: color + '1A' }]}>
      <Dot kind={color} size={6} />
      <Text style={styles.label}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderRadius: radius.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: 2,
  },
  label: {
    fontFamily: font.family.sans,
    fontSize: font.size.label,
    color: colors.ink[2],
  },
});
