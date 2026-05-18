import React, { useState } from 'react';
import {
  Pressable,
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
import { Avatar } from '../primitives';
import { colors, spacing } from '../tokens';
import { DueDatePicker, Field, shared } from './sheetShared';

function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1 + months, d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const schema = z
  .object({
    source: z.string().min(1),
    variable: z.boolean(),
    amount: z.string(),
    dueDate: z.string().min(1),
    repeatsMonthly: z.boolean(),
    installments: z.string().nullable(),
    memberId: z.string().min(1),
    accountId: z.string().min(1),
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

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewIncomeSheet({ open, onClose }: Props) {
  const { t } = useTranslation();
  const household = useHouseholdStore((s) => s.household);
  const today = useHouseholdStore((s) => s.today);
  const addTransaction = useHouseholdStore((s) => s.addTransaction);

  const members  = household?.members ?? [];
  const accounts = household?.cashAccounts ?? [];

  const [showInstallments, setShowInstallments] = useState(false);

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
      source: '',
      variable: false,
      amount: '',
      dueDate: today,
      repeatsMonthly: true,
      installments: null,
      memberId: members[0]?.id ?? '',
      accountId: accounts[0]?.id ?? '',
    },
  });

  const isVariable     = watch('variable');
  const repeatsMonthly = watch('repeatsMonthly');

  const onSubmit = (values: FormValues) => {
    const amountRaw = parseFloat(values.amount.replace(',', '.'));
    addTransaction({
      kind: 'income',
      name: values.source.trim(),
      amount: isNaN(amountRaw) ? 0 : amountRaw,
      date: values.dueDate,
      byMemberId: values.memberId,
      accountId: values.accountId,
      siloId: null,
      billId: null,
      categoryIds: [],
    });
    reset();
    setShowInstallments(false);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('addSheet.kinds.income.title')}
      footer={
        <Pressable
          style={({ pressed }) => [shared.submitBtn, pressed && shared.submitBtnPressed]}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={shared.submitLabel}>{t('addSheet.income.submit')}</Text>
        </Pressable>
      }
    >
      {/* Source */}
      <Field label={t('addSheet.income.source')} error={errors.source?.message}>
        <Controller
          control={control}
          name="source"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[shared.input, errors.source && shared.inputError]}
              placeholder={t('addSheet.income.sourcePlaceholder')}
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

      {/* Amount */}
      <Field
        label={t('addSheet.income.amount')}
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

      {/* Date */}
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
                if (!v) { setShowInstallments(false); setValue('installments', null); }
              }}
              trackColor={{ false: colors.border.emphasis, true: colors.brand.terracotta }}
              thumbColor={colors.background.surface}
            />
          )}
        />
      </View>

      {/* Installments */}
      {repeatsMonthly && (
        <>
          <View style={shared.toggleRow}>
            <Text style={shared.toggleLabel}>{t('addSheet.newBill.endsAtToggle')}</Text>
            <Switch
              value={showInstallments}
              onValueChange={(v) => {
                setShowInstallments(v);
                if (!v) setValue('installments', null);
              }}
              trackColor={{ false: colors.border.emphasis, true: colors.brand.terracotta }}
              thumbColor={colors.background.surface}
            />
          </View>
          {showInstallments && (
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

      {/* Who received */}
      {members.length > 1 && (
        <Field label={t('addSheet.income.whoReceived')}>
          <Controller
            control={control}
            name="memberId"
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

      {/* Deposited to */}
      {accounts.length > 0 && (
        <Field label={t('addSheet.income.depositedTo')}>
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
                        {acc.name}{acc.last4 ? ` ···· ${acc.last4}` : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </Field>
      )}

      <View style={{ height: spacing[2] }} />
    </Sheet>
  );
}
