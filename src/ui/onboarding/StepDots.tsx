import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../tokens';

interface StepDotsProps {
  total: number;
  current: number; // 1-indexed
}

export function StepDots({ total, current }: StepDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => {
        const isActive = i + 1 === current;
        return (
          <View
            key={i}
            style={isActive ? styles.activePill : styles.inactiveDot}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  activePill: {
    width: 18,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.brand.terracotta,
  },
  inactiveDot: {
    width: 5,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.border.emphasis,
  },
});
