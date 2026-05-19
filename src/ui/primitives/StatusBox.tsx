import React from 'react';
import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import { statusBox } from '../tokens';
import type { Colors } from '../tokens';
import { useColors } from '../theme';

interface StatusBoxProps {
  status: 'paid' | 'upcoming' | 'overdue';
  size?: number;
}

export function StatusBox({ status, size = statusBox.size }: StatusBoxProps) {
  const colors = useColors();
  const STATUS_STYLES = makeStatusStyles(colors);
  const style = STATUS_STYLES[status];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: statusBox.radius,
        backgroundColor: style.bg,
        borderWidth: style.borderWidth,
        borderColor: style.borderColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {status === 'paid' && (
        <Check size={Math.round(size * 0.7)} color={colors.background.surface} strokeWidth={2.5} />
      )}
    </View>
  );
}

function makeStatusStyles(colors: Colors) {
  return {
    paid: {
      bg: colors.semantic.olive,
      borderWidth: 0 as number,
      borderColor: undefined as string | undefined,
    },
    upcoming: {
      bg: 'transparent',
      borderWidth: 1 as number,
      borderColor: colors.ink[4],
    },
    overdue: {
      bg: 'transparent',
      borderWidth: 1 as number,
      borderColor: colors.brand.terracotta,
    },
  };
}
