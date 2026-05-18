import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, font } from '../tokens';

type MoneyVariant = 'hero' | 'hero-small' | 'kpi' | 'inline' | 'monoLine';

interface MoneyProps {
  value: number;
  variant: MoneyVariant;
  color?: string;
  cents?: boolean;
  showSign?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
}

function formatMoney(value: number, locale: string, showCents: boolean): string {
  try {
    const currency = locale === 'pt-BR' ? 'BRL' : 'USD';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0,
    }).format(Math.abs(value));
  } catch {
    return String(Math.abs(value));
  }
}

export function Money({
  value,
  variant,
  color,
  cents,
  showSign = false,
  italic = false,
  strikethrough = false,
}: MoneyProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const showCents = cents ?? (variant === 'inline' || variant === 'monoLine');
  const formatted = formatMoney(value, locale, showCents);
  const sign = showSign && value > 0 ? '+' : value < 0 ? '−' : '';
  const display = sign + formatted;

  const variantStyle = VARIANT_STYLES[variant];
  const resolvedColor = color ?? variantStyle.color;

  return (
    <Text
      style={[
        variantStyle.text,
        { color: resolvedColor },
        italic && styles.italic,
        strikethrough && styles.strikethrough,
      ]}
      numberOfLines={1}
    >
      {display}
    </Text>
  );
}

const VARIANT_STYLES = {
  hero: {
    color: colors.brand.terracotta,
    text: {
      fontFamily: font.family.serif,
      fontSize: font.size.hero,
      fontWeight: font.weight.regular,
      lineHeight: font.size.hero * font.lineHeight.tight,
      letterSpacing: font.letterSpacing.hero,
      fontVariantNumeric: 'tabular-nums' as const,
    },
  },
  'hero-small': {
    color: colors.ink[1],
    text: {
      fontFamily: font.family.serif,
      fontSize: font.size.heroSmall,
      fontWeight: font.weight.regular,
      lineHeight: font.size.heroSmall * font.lineHeight.tight,
      letterSpacing: font.letterSpacing.hero,
      fontVariantNumeric: 'tabular-nums' as const,
    },
  },
  kpi: {
    color: colors.ink[1],
    text: {
      fontFamily: font.family.serif,
      fontSize: font.size.h1,
      fontWeight: font.weight.regular,
      lineHeight: font.size.h1 * font.lineHeight.snug,
      fontVariantNumeric: 'tabular-nums' as const,
    },
  },
  inline: {
    color: 'currentColor' as unknown as string,
    text: {
      fontFamily: font.family.sans,
      fontSize: font.size.body,
      fontWeight: font.weight.regular,
      lineHeight: font.size.body * font.lineHeight.normal,
      fontVariantNumeric: 'tabular-nums' as const,
    },
  },
  monoLine: {
    color: colors.ink[3],
    text: {
      fontFamily: font.family.mono,
      fontSize: font.size.eyebrow,
      fontWeight: font.weight.regular,
      lineHeight: font.size.eyebrow * font.lineHeight.normal,
      letterSpacing: font.letterSpacing.eyebrow,
      textTransform: 'uppercase' as const,
      fontVariantNumeric: 'tabular-nums' as const,
    },
  },
};

const styles = StyleSheet.create({
  italic: {
    fontStyle: 'italic',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
});
