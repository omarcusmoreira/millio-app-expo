import React, { useEffect, useState } from 'react';
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
import type { Bill } from '../../domain/entities';
import { Dot, MemberAvatar } from '../primitives';
import { font, radius, spacing } from '../tokens';
import type { Colors } from '../tokens';
import { useColors } from '../theme';
import { DueDatePicker, Field, useShared } from './sheetShared';

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
    categoryIds: z.array(z.string()),
    labelIds: z.array(z.string()),
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
  bill?: Bill | undefined;
}

export function NewBillSheet({ open, onClose, bill }: NewBillSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const shared = useShared();
  const household = useHouseholdStore((s) => s.household);
  const today = useHouseholdStore((s) => s.today);
  const addBill = useHouseholdStore((s) => s.addBill);
  const updateBill = useHouseholdStore((s) => s.updateBill);

  const isEditing = !!bill;

  const members = household?.members ?? [];
  const categories = household?.categories ?? [];
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

  useEffect(() => {
    if (open && bill) {
      const hasInstallments = !!bill.endsAt;
      setShowEndDate(hasInstallments);
      reset({
        name: bill.name,
        variable: bill.variable,
        amount: bill.variable
          ? (bill.estimate != null ? String(bill.estimate) : '')
          : (bill.amount != null ? String(bill.amount) : ''),
        dueDate: bill.due,
        repeatsMonthly: bill.recurring === 'monthly',
        installments: hasInstallments && bill.endsAt
          ? String(
              (new Date(bill.endsAt).getFullYear() - new Date(bill.due).getFullYear()) * 12 +
              (new Date(bill.endsAt).getMonth() - new Date(bill.due).getMonth()) + 1
            )
          : null,
        assigneeId: bill.assigneeId,
        categoryIds: bill.categoryIds,
        labelIds: bill.labelIds,
      });
    } else if (!open) {
      reset({
        name: '',
        variable: false,
        amount: '',
        dueDate: today,
        repeatsMonthly: true,
        installments: null,
        assigneeId: defaultAssignee,
        categoryIds: [],
        labelIds: [],
      });
      setShowEndDate(false);
    }
  }, [open, bill]);

  const onSubmit = (values: FormValues) => {
    const amountRaw = parseFloat(values.amount.replace(',', '.'));
    const amount = values.variable ? null : amountRaw;
    const estimate = values.variable ? (values.amount ? amountRaw : null) : null;

    const draft = {
      name: values.name.trim(),
      variable: values.variable,
      amount: amount !== null && !isNaN(amount) ? amount : null,
      estimate: estimate !== null && !isNaN(estimate) ? estimate : null,
      due: values.dueDate,
      recurring: values.repeatsMonthly ? ('monthly' as const) : ('one-time' as const),
      endsAt: values.repeatsMonthly && values.installments
        ? addMonths(values.dueDate, parseInt(values.installments, 10) - 1)
        : null,
      assigneeId: values.assigneeId,
      categoryIds: values.categoryIds,
      labelIds: values.labelIds,
    };

    if (isEditing && bill) {
      updateBill(bill.id, draft);
    } else {
      addBill(draft);
    }

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
          <Text style={shared.submitLabel}>
            {isEditing ? t('addSheet.newBill.save') : t('addSheet.newBill.submit')}
          </Text>
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
                      <MemberAvatar member={m} size="sm" />
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

const makeStyles = (colors: Colors) => StyleSheet.create({
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
