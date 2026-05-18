import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
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
import { Avatar, Dot } from '../primitives';
import { colors, font, radius, spacing } from '../tokens';
import { DueDatePicker, Field, shared } from './sheetShared';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
  .object({
    name: z.string().min(1),
    variable: z.boolean(),
    amount: z.string(),
    dueDate: z.string().min(1),
    repeatsMonthly: z.boolean(),
    installments: z.string().nullable(),
    assigneeId: z.string().min(1),
    categoryIds: z.array(z.string()).default([]),
    labelIds: z.array(z.string()).default([]),
  })
  .superRefine((data, ctx) => {
    if (!data.variable) {
      const n = parseFloat(data.amount.replace(',', '.'));
      if (isNaN(n) || n <= 0) {
        ctx.addIssue({ code: 'custom', path: ['amount'], message: 'required' });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1 + months, d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface NewBillSheetProps {
  open: boolean;
  onClose: () => void;
}

export function NewBillSheet({ open, onClose }: NewBillSheetProps) {
  const { t } = useTranslation();
  const household = useHouseholdStore((s) => s.household);
  const today = useHouseholdStore((s) => s.today);
  const addBill = useHouseholdStore((s) => s.addBill);

  const members = household?.members ?? [];
  const categories = household?.categories ?? [];
  const labels = household?.labels ?? [];
  const defaultAssignee = members[0]?.id ?? '';

  const [showEndDate, setShowEndDate] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      variable: false,
      amount: '',
      dueDate: today,
      repeatsMonthly: true,
      installments: null,
      assigneeId: defaultAssignee,
      categoryIds: [],
      labelIds: [],
    },
  });

  const isVariable = watch('variable');
  const repeatsMonthly = watch('repeatsMonthly');
  const dueDate = watch('dueDate');

  const onSubmit = (values: FormValues) => {
    const amountRaw = parseFloat(values.amount.replace(',', '.'));
    const amount = values.variable ? null : amountRaw;
    const estimate = values.variable ? (values.amount ? amountRaw : null) : null;

    addBill({
      name: values.name.trim(),
      variable: values.variable,
      amount: amount !== null && !isNaN(amount) ? amount : null,
      estimate: estimate !== null && !isNaN(estimate) ? estimate : null,
      due: values.dueDate,
      recurring: values.repeatsMonthly ? 'monthly' : 'one-time',
      endsAt: values.repeatsMonthly && values.installments
        ? addMonths(values.dueDate, parseInt(values.installments, 10) - 1)
        : null,
      assigneeId: values.assigneeId,
      categoryIds: values.categoryIds,
      labelIds: values.labelIds,
    });

    reset();
    setShowEndDate(false);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('addSheet.kinds.bill.title')}
      footer={
        <Pressable
          style={({ pressed }) => [shared.submitBtn, pressed && shared.submitBtnPressed]}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={shared.submitLabel}>{t('addSheet.newBill.submit')}</Text>
        </Pressable>
      }
    >
      {/* Name */}
      <Field label={t('addSheet.newBill.name')} error={errors.name?.message}>
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[shared.input, errors.name && shared.inputError]}
              placeholder={t('addSheet.newBill.namePlaceholder')}
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

      {/* Variable toggle */}
      <View style={shared.toggleRow}>
        <Text style={shared.toggleLabel}>{t('addSheet.newBill.variableLabel')}</Text>
        <Controller
          control={control}
          name="variable"
          render={({ field: { value, onChange } }) => (
            <Switch
              value={value}
              onValueChange={onChange}
              trackColor={{ false: colors.border.emphasis, true: colors.brand.terracotta }}
              thumbColor={colors.background.surface}
            />
          )}
        />
      </View>

      {/* Amount / Estimate */}
      <Field
        label={t('addSheet.newBill.amount')}
        hint={isVariable ? t('addSheet.newBill.estimatePlaceholder') : undefined}
        error={errors.amount?.message}
      >
        <Controller
          control={control}
          name="amount"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[shared.input, errors.amount && shared.inputError]}
              placeholder={isVariable ? t('addSheet.newBill.estimatePlaceholder') : '0,00'}
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

      {/* Due date */}
      <Field label={t('addSheet.newBill.dueDate')}>
        <Controller
          control={control}
          name="dueDate"
          render={({ field: { value, onChange } }) => (
            <DueDatePicker value={value} onChange={onChange} />
          )}
        />
      </Field>

      {/* Repeats monthly */}
      <View style={shared.toggleRow}>
        <Text style={shared.toggleLabel}>{t('addSheet.newBill.repeatsMonthly')}</Text>
        <Controller
          control={control}
          name="repeatsMonthly"
          render={({ field: { value, onChange } }) => (
            <Switch
              value={value}
              onValueChange={(v) => {
                onChange(v);
                if (!v) { setShowEndDate(false); setValue('installments', null); }
              }}
              trackColor={{ false: colors.border.emphasis, true: colors.brand.terracotta }}
              thumbColor={colors.background.surface}
            />
          )}
        />
      </View>

      {/* Installments (only when repeating) */}
      {repeatsMonthly && (
        <>
          <View style={shared.toggleRow}>
            <Text style={shared.toggleLabel}>{t('addSheet.newBill.endsAtToggle')}</Text>
            <Switch
              value={showEndDate}
              onValueChange={(v) => {
                setShowEndDate(v);
                if (!v) setValue('installments', null);
              }}
              trackColor={{ false: colors.border.emphasis, true: colors.brand.terracotta }}
              thumbColor={colors.background.surface}
            />
          </View>
          {showEndDate && (
            <Field label={t('addSheet.newBill.installments')}>
              <Controller
                control={control}
                name="installments"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={shared.input}
                    placeholder={t('addSheet.newBill.installmentsPlaceholder')}
                    placeholderTextColor={colors.ink[4]}
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={3}
                    returnKeyType="done"
                  />
                )}
              />
            </Field>
          )}
        </>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <Field label={t('lar.setupItems.categories')}>
          <Controller
            control={control}
            name="categoryIds"
            render={({ field: { value, onChange } }) => (
              <View style={shared.chipWrap}>
                {categories.map((cat) => {
                  const selected = value.includes(cat.id);
                  return (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.catChip,
                        { backgroundColor: cat.color + (selected ? '33' : '1A') },
                        selected && { borderColor: cat.color, borderWidth: 1 },
                      ]}
                      onPress={() => onChange(selected ? [] : [cat.id])}
                    >
                      <Dot kind={cat.color} size={6} />
                      <Text style={[styles.catChipLabel, selected && styles.catChipLabelSelected]}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </Field>
      )}

      {/* Labels */}
      {labels.length > 0 && (
        <Field label={t('lar.setupItems.labels')}>
          <Controller
            control={control}
            name="labelIds"
            render={({ field: { value, onChange } }) => (
              <View style={shared.chipWrap}>
                {labels.map((label) => {
                  const selected = value.includes(label.id);
                  return (
                    <Pressable
                      key={label.id}
                      style={[shared.selectChip, selected && shared.selectChipActive]}
                      onPress={() => onChange(selected ? [] : [label.id])}
                    >
                      <Text style={[shared.selectChipLabel, selected && shared.selectChipLabelActive]}>
                        {label.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </Field>
      )}

      {/* Assignee — only shown when multiple members */}
      {members.length > 1 && (
        <Field label={t('addSheet.newBill.assignee')} error={errors.assigneeId?.message}>
          <Controller
            control={control}
            name="assigneeId"
            render={({ field: { value, onChange } }) => (
              <View style={shared.chipWrap}>
                {members.map((m) => {
                  const selected = value === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      style={[shared.assigneeChip, selected && shared.selectChipActive]}
                      onPress={() => onChange(m.id)}
                    >
                      <Avatar initial={m.initial} color={m.color} size="sm" />
                      <Text style={[shared.selectChipLabel, selected && shared.selectChipLabelActive]}>
                        {m.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </Field>
      )}
    </Sheet>
  );
}

// ─── Bill-specific styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderRadius: radius.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catChipLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.label,
    color: colors.ink[3],
  },
  catChipLabelSelected: {
    color: colors.ink[1],
    fontWeight: font.weight.medium,
  },
});
