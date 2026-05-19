// Shared primitives used by NewBillSheet and NewIncomeSheet.
import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, font, radius, spacing } from '../tokens';

// ─── Field wrapper ────────────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <View style={shared.field}>
      <Text style={shared.fieldLabel}>{label}</Text>
      {children}
      {hint && !error && <Text style={shared.fieldHint}>{hint}</Text>}
      {error && <Text style={shared.fieldError}>{error}</Text>}
    </View>
  );
}

// ─── Inline date picker ───────────────────────────────────────────────────────

export function DueDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const parts = value.split('-').map(Number);
  const selYear  = parts[0] ?? new Date().getFullYear();
  const selMonth = parts[1] ?? new Date().getMonth() + 1;
  const selDay   = parts[2] ?? new Date().getDate();

  const [viewYear, setViewYear]   = useState(selYear);
  const [viewMonth, setViewMonth] = useState(selMonth);

  const scrollRef   = useRef<ScrollView>(null);
  const viewportW   = useRef(0);

  const CHIP_W = 34;
  const GAP    = spacing[2]; // 4

  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
    else setViewMonth((m) => m + 1);
  };

  const selectDay = (d: number) =>
    onChange(`${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
    .format(new Date(viewYear, viewMonth - 1, 1))
    .toUpperCase();

  const activeDay = selYear === viewYear && selMonth === viewMonth ? selDay : -1;
  const centerDay = activeDay > 0 ? activeDay : Math.ceil(daysInMonth / 2);

  const scrollToDay = (day: number) => {
    if (!scrollRef.current || viewportW.current === 0) return;
    const chipCenter = (day - 1) * (CHIP_W + GAP) + CHIP_W / 2;
    const offset = Math.max(0, chipCenter - viewportW.current / 2);
    scrollRef.current.scrollTo({ x: offset, animated: false });
  };

  useEffect(() => {
    const id = setTimeout(() => scrollToDay(centerDay), 50);
    return () => clearTimeout(id);
  }, [viewYear, viewMonth, centerDay]);

  return (
    <View style={dp.container}>
      <View style={dp.header}>
        <Pressable onPress={prevMonth} hitSlop={8}>
          <ChevronLeft size={16} color={colors.ink[2]} />
        </Pressable>
        <Text style={dp.monthLabel}>{monthLabel}</Text>
        <Pressable onPress={nextMonth} hitSlop={8}>
          <ChevronRight size={16} color={colors.ink[2]} />
        </Pressable>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={dp.dayRow}
        onLayout={(e) => {
          viewportW.current = e.nativeEvent.layout.width;
          scrollToDay(centerDay);
        }}
      >
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
          const isActive = d === activeDay;
          return (
            <Pressable
              key={d}
              onPress={() => selectDay(d)}
              style={[dp.dayChip, isActive && dp.dayChipActive]}
            >
              <Text style={[dp.dayLabel, isActive && dp.dayLabelActive]}>{d}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

export const shared = StyleSheet.create({
  field: { gap: spacing[2] },
  fieldLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[3],
    textTransform: 'uppercase',
    letterSpacing: font.letterSpacing.eyebrow,
  },
  fieldHint: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[4],
  },
  fieldError: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.brand.terracotta,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border.emphasis,
    borderRadius: radius.medium,
    paddingHorizontal: spacing[5],
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
    backgroundColor: colors.background.surface,
  },
  inputError: { borderColor: colors.brand.terracotta },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  toggleLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
    flex: 1,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  selectChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectChipActive: { borderColor: colors.ink[1] },
  selectChipLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
    fontWeight: font.weight.medium,
  },
  selectChipLabelActive: { color: colors.ink[1] },
  assigneeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  submitBtn: {
    backgroundColor: colors.brand.terracotta,
    borderRadius: radius.medium,
    paddingVertical: spacing[5],
    alignItems: 'center',
  },
  submitBtnPressed: { opacity: 0.8 },
  submitLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    fontWeight: font.weight.medium,
    color: colors.background.surface,
  },
});

const dp = StyleSheet.create({
  container: { gap: spacing[3] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
  },
  monthLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[2],
    letterSpacing: font.letterSpacing.eyebrow,
  },
  dayRow: { gap: spacing[2], paddingVertical: spacing[1] },
  dayChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surfaceSoft,
  },
  dayChipActive: { backgroundColor: colors.brand.terracotta },
  dayLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[2],
    fontWeight: font.weight.medium,
  },
  dayLabelActive: { color: colors.background.surface },
});
