import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Sheet } from './Sheet';
import { useHouseholdStore } from '../../store/household';
import type { Income } from '../../domain/entities';
import { font, spacing } from '../tokens';
import { useColors } from '../theme';
import { Field, useShared } from './sheetShared';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1),
  amount: z.string().min(1),
  scheduleKind: z.enum(['monthly', 'split', 'biweekly']),
  day1: z.string().min(1),
  day2: z.string(),
}).superRefine((data, ctx) => {
  const n = parseFloat(data.amount.replace(',', '.'));
  if (isNaN(n) || n <= 0) {
    ctx.addIssue({ code: 'custom', path: ['amount'], message: 'required' });
  }
  const d1 = parseInt(data.day1, 10);
  if (isNaN(d1) || d1 < 1 || d1 > 28) {
    ctx.addIssue({ code: 'custom', path: ['day1'], message: 'invalid' });
  }
  if (data.scheduleKind === 'split') {
    const d2 = parseInt(data.day2, 10);
    if (isNaN(d2) || d2 < 1 || d2 > 28) {
      ctx.addIssue({ code: 'custom', path: ['day2'], message: 'invalid' });
    }
  }
});

type FormValues = z.infer<typeof schema>;

// ─── Component ────────────────────────────────────────────────────────────────

interface IncomeSheetProps {
  open: boolean;
  onClose: () => void;
  memberId: string;
  income?: Income | undefined;
}

export function IncomeSheet({ open, onClose, memberId, income }: IncomeSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const shared = useShared();
  const addIncome = useHouseholdStore((s) => s.addIncome);
  const updateIncome = useHouseholdStore((s) => s.updateIncome);

  const isEditing = !!income;

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      amount: '',
      scheduleKind: 'monthly',
      day1: '5',
      day2: '',
    },
  });

  const scheduleKind = watch('scheduleKind');

  useEffect(() => {
    if (open && income) {
      reset({
        name: income.name,
        amount: String(income.amount),
        scheduleKind: income.schedule.kind,
        day1: String(income.schedule.days[0]),
        day2: income.schedule.kind === 'split' ? String(income.schedule.days[1]) : '',
      });
    } else if (!open) {
      reset({ name: '', amount: '', scheduleKind: 'monthly', day1: '5', day2: '' });
    }
  }, [open, income, reset]);

  const onSubmit = (values: FormValues) => {
    const amount = parseFloat(values.amount.replace(',', '.'));
    const day1 = parseInt(values.day1, 10) as 1 extends number ? number : never;
    const day2 = parseInt(values.day2, 10);

    const schedule = values.scheduleKind === 'split'
      ? { kind: 'split' as const, days: [day1, day2] as [number, number] }
      : values.scheduleKind === 'biweekly'
        ? { kind: 'biweekly' as const, days: [day1] as [number] }
        : { kind: 'monthly' as const, days: [day1] as [number] };

    if (isEditing && income) {
      updateIncome(income.id, { name: values.name.trim(), amount, schedule });
    } else {
      addIncome({ memberId, name: values.name.trim(), amount, schedule });
    }
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEditing ? t('addSheet.income.editTitle') : t('addSheet.income.newTitle')}
      footer={
        <Pressable
          style={({ pressed }) => [shared.submitBtn, pressed && shared.submitBtnPressed]}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={shared.submitLabel}>
            {isEditing ? t('addSheet.income.save') : t('addSheet.income.submit')}
          </Text>
        </Pressable>
      }
    >
        {/* Name */}
        <Field label={t('addSheet.income.name')} error={errors.name?.message}>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={[shared.input, errors.name && shared.inputError]}
                placeholder={t('addSheet.income.namePlaceholder')}
                placeholderTextColor={colors.ink[4]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
                returnKeyType="next"
              />
            )}
          />
        </Field>

        {/* Amount */}
        <Field label={t('addSheet.income.amount')} error={errors.amount?.message}>
          <Controller
            control={control}
            name="amount"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={[shared.input, errors.amount && shared.inputError]}
                placeholder="0,00"
                placeholderTextColor={colors.ink[4]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            )}
          />
        </Field>

        {/* Schedule kind */}
        <Field label={t('addSheet.income.schedule')}>
          <Controller
            control={control}
            name="scheduleKind"
            render={({ field: { value, onChange } }) => (
              <View style={shared.chipWrap}>
                {(['monthly', 'split', 'biweekly'] as const).map((kind) => (
                  <Pressable
                    key={kind}
                    style={[shared.selectChip, value === kind && shared.selectChipActive]}
                    onPress={() => onChange(kind)}
                  >
                    <Text style={[shared.selectChipLabel, value === kind && shared.selectChipLabelActive]}>
                      {t(`addSheet.income.${kind}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />
        </Field>

        {/* Day inputs */}
        <View style={styles.dayRow}>
          <View style={styles.dayField}>
            <Field
              label={scheduleKind === 'split' ? t('addSheet.income.day', { n: 1 }) : t('addSheet.income.day', { n: '' }).trim()}
              error={errors.day1?.message}
            >
              <Controller
                control={control}
                name="day1"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[shared.input, errors.day1 && shared.inputError]}
                    placeholder="5"
                    placeholderTextColor={colors.ink[4]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={2}
                    returnKeyType={scheduleKind === 'split' ? 'next' : 'done'}
                  />
                )}
              />
            </Field>
          </View>
          {scheduleKind === 'split' && (
            <View style={styles.dayField}>
              <Field label={t('addSheet.income.day', { n: 2 })} error={errors.day2?.message}>
                <Controller
                  control={control}
                  name="day2"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      style={[shared.input, errors.day2 && shared.inputError]}
                      placeholder="20"
                      placeholderTextColor={colors.ink[4]}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="number-pad"
                      maxLength={2}
                      returnKeyType="done"
                    />
                  )}
                />
              </Field>
            </View>
          )}
        </View>
      </Sheet>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  dayRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  dayField: {
    flex: 1,
  },
});
