import React from 'react';
import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, statusBox } from '../tokens';

interface StatusBoxProps {
  status: 'paid' | 'upcoming' | 'overdue';
  size?: number;
}

export function StatusBox({ status, size = statusBox.size }: StatusBoxProps) {
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

const STATUS_STYLES = {
  paid: {
    bg: colors.semantic.olive,
    borderWidth: 0,
    borderColor: undefined as string | undefined,
  },
  upcoming: {
    bg: 'transparent',
    borderWidth: 1,
    borderColor: colors.ink[4],
  },
  overdue: {
    bg: 'transparent',
    borderWidth: 1,
    borderColor: colors.brand.terracotta,
  },
} as const;
