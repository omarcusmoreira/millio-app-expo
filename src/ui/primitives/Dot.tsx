import React from 'react';
import { View } from 'react-native';
import type { ColorToken, Colors } from '../tokens';
import { useColors } from '../theme';

function makeColorTokenMap(colors: Colors): Record<ColorToken, string> {
  return {
    terracotta: colors.brand.terracotta,
    olive: colors.semantic.olive,
    grey: colors.semantic.warmGrey,
  };
}

interface DotProps {
  kind: ColorToken | string;
  size?: number;
  ring?: boolean;
}

export function Dot({ kind, size = 8, ring = false }: DotProps) {
  const colors = useColors();
  const COLOR_TOKEN_MAP = makeColorTokenMap(colors);
  const resolved =
    kind in COLOR_TOKEN_MAP
      ? COLOR_TOKEN_MAP[kind as ColorToken]
      : kind;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: ring ? 'transparent' : resolved,
        borderWidth: ring ? 1.5 : 0,
        borderColor: ring ? resolved : undefined,
      }}
    />
  );
}
