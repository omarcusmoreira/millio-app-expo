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
import type { Expense, RecurrenceKind } from '../../domain/entities';
import { Dot, MemberAvatar } from '../primitives';
import { font, radius, spacing } from '../tokens';
import type { Colors } from '../tokens';
import { useColors } from '../theme';
import { DueDatePicker, Field, useShared } from './sheetShared';

// ─── Schema ───────────────────────────────────────────────────────────────────

const RECURRENCE_KINDS: RecurrenceKind[] = ['monthly', 'biweekly', 'weekly', 'bi-monthly', 'yearly'];

const schema = z
  .object({
    name: z.string().min(1),
    amount: z.string(),
    date: z.string().min(1),
    accountId: z.string(),
    assigneeId: z.string().min(1),
    categoryIds: z.array(z.string()),
    isRecurring: z.boolean(),
    variable: z.boolean(),
    recurrenceKind: z.enum(['monthly', 'biweekly', 'weekly', 'bi-monthly', 'yearly']),
    hasEndDate: z.boolean(),
    installments: z.string().nullable(),
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

interface NewExpenseSheetProps {
  open: boolean;
  onClose: () => void;
  expense?: Expense | undefined;
}

export function NewExpenseSheet({ open, onClose, expense }: NewExpenseSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const shared = useShared();
  const household = useHouseholdStore((s) => s.household);
  const today = useHouseholdStore((s) => s.today);
  const addExpense = useHouseholdStore((s) => s.addExpense);
  const updateExpense = useHouseholdStore((s) => s.updateExpense);

  const isEditing = !!expense;
  const members = household?.members ?? [];
  const accounts = household?.cashAccounts ?? [];
  const categories = household?.categories ?? [];
  const defaultAssignee = members[0]?.id ?? '';
  const defaultAccount = accounts[0]?.id ?? '';

  const [showEndDate, setShowEndDate] = useState(false);

  const { control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      amount: '',
      date: today,
      accountId: defaultAccount,
      assigneeId: defaultAssignee,
      categoryIds: [],
      isRecurring: false,
      variable: false,
      recurrenceKind: 'monthly',
      hasEndDate: false,
      installments: null,
    },
  });

  const isRecurring = watch('isRecurring');
  const isVariable = watch('variable');
  const recurrenceKind = watch('recurrenceKind');

  useEffect(() => {
    if (open && expense) {
      const isRec = expense.recurring !== 'one-time';
      const hasInst = !!expense.endsAt;
      setShowEndDate(hasInst);
      reset({
        name: expense.name,
        amount: expense.variable
          ? (expense.estimate != null ? String(expense.estimate) : '')
          : (expense.amount != null ? String(expense.amount) : ''),
        date: expense.date,
        accountId: expense.accountId ?? defaultAccount,
        assigneeId: expense.assigneeId,
        categoryIds: expense.categoryIds,
        isRecurring: isRec,
        variable: expense.variable,
        recurrenceKind: isRec ? (expense.recurring as 'monthly' | 'bi-monthly' | 'weekly' | 'biweekly' | 'yearly') : 'monthly',
        hasEndDate: hasInst,
        installments: hasInst && expense.endsAt
          ? String(
              (new Date(expense.endsAt).getFullYear() - new Date(expense.date).getFullYear()) * 12 +
              (new Date(expense.endsAt).getMonth() - new Date(expense.date).getMonth()) + 1
            )
          : null,
      });
    } else if (!open) {
      reset({
        name: '',
        amount: '',
        date: today,
        accountId: defaultAccount,
        assigneeId: defaultAssignee,
        categoryIds: [],
        isRecurring: false,
        variable: false,
        recurrenceKind: 'monthly',
        hasEndDate: false,
        installments: null,
      });
      setShowEndDate(false);
    }
  }, [open, expense]);

  const onSubmit = (values: FormValues) => {
    const amountRaw = parseFloat(values.amount.replace(',', '.'));
    const amount = values.variable ? null : (isNaN(amountRaw) ? null : amountRaw);
    const estimate = values.variable ? (values.amount ? amountRaw : null) : null;

    if (isEditing && expense) {
      updateExpense(expense.id, {
        name: values.name.trim(),
        amount: amount !== null ? amount : null,
        estimate: estimate !== null && !isNaN(estimate) ? estimate : null,
        variable: values.variable,
        date: values.date,
        recurring: values.isRecurring ? values.recurrenceKind : 'one-time',
        endsAt: values.isRecurring && values.hasEndDate && values.installments
          ? addMonths(values.date, parseInt(values.installments, 10) - 1)
          : null,
        assigneeId: values.assigneeId,
        accountId: values.accountId || null,
        categoryIds: values.categoryIds,
        paidAt: values.isRecurring ? expense.paidAt : values.date,
        paidAmount: values.isRecurring ? expense.paidAmount : (amount ?? estimate),
      });
    } else {
      const recurring: RecurrenceKind = values.isRecurring ? values.recurrenceKind : 'one-time';
      addExpense({
        name: values.name.trim(),
        amount: amount !== null ? amount : null,
        estimate: estimate !== null && !isNaN(estimate) ? estimate : null,
        variable: values.variable,
        date: values.date,
        recurring,
        endsAt: values.isRecurring && values.hasEndDate && values.installments
          ? addMonths(values.date, parseInt(values.installments, 10) - 1)
          : null,
        assigneeId: values.assigneeId,
        accountId: values.accountId || null,
        categoryIds: values.categoryIds,
        labelIds: [],
        paidAt: recurring === 'one-time' ? values.date : null,
        paidAmount: recurring === 'one-time' ? (amount ?? estimate) : null,
      });
    }

    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEditing ? t('addSheet.expense.editTitle') : t('addSheet.kinds.expense.title')}
      footer={
        <Pressable
          style={({ pressed }) => [shared.submitBtn, pressed && shared.submitBtnPressed]}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={shared.submitLabel}>
            {isEditing ? t('addSheet.expense.save') : t('addSheet.expense.submit')}
          </Text>
        </Pressable>
      }
    >
      {/* Name */}
      <Field label={t('addSheet.expense.name')} error={errors.name?.message}>
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[shared.input, errors.name && shared.inputError]}
              placeholder={t('addSheet.expense.namePlaceholder')}
              placeholderTextColor={colors.ink[4]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="sentences"
              returnKeyType="next"
            />
          )}
        />
      </Field>

      {/* Amount — label changes when variable */}
      {!isVariable && (
        <Field label={t('addSheet.expense.amount')} error={errors.amount?.message}>
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
      )}

      {/* Date (one-time) / Due date (recurring) */}
      <Field label={isRecurring ? t('addSheet.expense.dueDate') : t('addSheet.expense.date')}>
        <Controller
          control={control}
          name="date"
          render={({ field: { value, onChange } }) => (
            <DueDatePicker value={value} onChange={onChange} />
          )}
        />
      </Field>

      {/* Paid from account */}
      {accounts.length > 1 && (
        <Field label={t('addSheet.expense.paidFrom')}>
          <Controller
            control={control}
            name="accountId"
            render={({ field: { value, onChange } }) => (
              <View style={shared.chipWrap}>
                {accounts.map((acc) => {
                  const selected = value === acc.id;
                  return (
                    <Pressable
                      key={acc.id}
                      style={[shared.selectChip, selected && shared.selectChipActive]}
                      onPress={() => onChange(acc.id)}
                    >
                      <Text style={[shared.selectChipLabel, selected && shared.selectChipLabelActive]}>
                        {acc.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </Field>
      )}

      {/* Who paid (multi-member only) */}
      {members.length > 1 && (
        <Field label={t('addSheet.expense.whoPaid')}>
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
                      onPress={() => onChange(selected ? value.filter((id) => id !== cat.id) : [...value, cat.id])}
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

      {/* Recurring toggle */}
      <View style={shared.toggleRow}>
        <Text style={shared.toggleLabel}>{t('addSheet.expense.isRecurring')}</Text>
        <Controller
          control={control}
          name="isRecurring"
          render={({ field: { value, onChange } }) => (
            <Switch
              value={value}
              onValueChange={(v) => {
                onChange(v);
                if (!v) { setShowEndDate(false); setValue('hasEndDate', false); setValue('installments', null); }
              }}
              trackColor={{ false: colors.border.emphasis, true: colors.brand.terracotta }}
              thumbColor={colors.background.surface}
            />
          )}
        />
      </View>

      {/* Recurring-only fields */}
      {isRecurring && (
        <>
          {/* Recurrence kind chips */}
          <Field label={t('addSheet.expense.recurrenceKind')}>
            <Controller
              control={control}
              name="recurrenceKind"
              render={({ field: { value, onChange } }) => (
                <View style={shared.chipWrap}>
                  {RECURRENCE_KINDS.map((kind) => {
                    const selected = value === kind;
                    return (
                      <Pressable
                        key={kind}
                        style={[shared.selectChip, selected && shared.selectChipActive]}
                        onPress={() => onChange(kind)}
                      >
                        <Text style={[shared.selectChipLabel, selected && shared.selectChipLabelActive]}>
                          {t(`addSheet.expense.recurrence.${kind.replace('-', '')}`)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            />
          </Field>

          {/* Variable toggle */}
          <View style={shared.toggleRow}>
            <Text style={shared.toggleLabel}>{t('addSheet.expense.variableLabel')}</Text>
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

          {/* Estimate field when variable */}
          {isVariable && (
            <Field label={t('addSheet.expense.amount')} hint={t('addSheet.expense.estimatePlaceholder')} error={errors.amount?.message}>
              <Controller
                control={control}
                name="amount"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={[shared.input, errors.amount && shared.inputError]}
                    placeholder={t('addSheet.expense.estimatePlaceholder')}
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
          )}

          {/* Has end date toggle */}
          <View style={shared.toggleRow}>
            <Text style={shared.toggleLabel}>{t('addSheet.expense.endsAtToggle')}</Text>
            <Controller
              control={control}
              name="hasEndDate"
              render={({ field: { value, onChange } }) => (
                <Switch
                  value={value}
                  onValueChange={(v) => {
                    onChange(v);
                    setShowEndDate(v);
                    if (!v) setValue('installments', null);
                  }}
                  trackColor={{ false: colors.border.emphasis, true: colors.brand.terracotta }}
                  thumbColor={colors.background.surface}
                />
              )}
            />
          </View>

          {showEndDate && (
            <Field label={t('addSheet.expense.installments')}>
              <Controller
                control={control}
                name="installments"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    style={shared.input}
                    placeholder={t('addSheet.expense.installmentsPlaceholder')}
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
    </Sheet>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
