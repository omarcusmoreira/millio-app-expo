import React from 'react';
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
import { Avatar } from '../primitives';
import { colors, font, radius, spacing } from '../tokens';

const schema = z.object({
  amount: z.string().refine((v) => parseFloat(v.replace(',', '.')) > 0, 'required'),
  name: z.string().min(1),
  accountId: z.string().min(1),
  memberId: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewExpenseSheet({ open, onClose }: Props) {
  const { t } = useTranslation();
  const household = useHouseholdStore((s) => s.household);
  const today = useHouseholdStore((s) => s.today);
  const addTransaction = useHouseholdStore((s) => s.addTransaction);

  const members = household?.members ?? [];
  const accounts = household?.cashAccounts ?? [];

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: '',
      name: '',
      accountId: accounts[0]?.id ?? '',
      memberId: members[0]?.id ?? '',
    },
  });

  const onSubmit = (values: FormValues) => {
    addTransaction({
      kind: 'expense',
      name: values.name.trim(),
      amount: parseFloat(values.amount.replace(',', '.')),
      date: today,
      byMemberId: values.memberId,
      accountId: values.accountId,
      siloId: null,
      billId: null,
      categoryIds: [],
    });
    reset();
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('addSheet.kinds.expense.title')}
      footer={
        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.submitLabel}>{t('addSheet.expense.submit')}</Text>
        </Pressable>
      }
    >
      {/* Amount */}
      <Field label={t('addSheet.expense.amount')} error={errors.amount?.message}>
        <Controller
          control={control}
          name="amount"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[styles.input, errors.amount && styles.inputError]}
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

      {/* Name */}
      <Field label={t('addSheet.expense.name')} error={errors.name?.message}>
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
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

      {/* Paid from account */}
      {accounts.length > 0 && (
        <Field label={t('addSheet.expense.paidFrom')}>
          <Controller
            control={control}
            name="accountId"
            render={({ field: { value, onChange } }) => (
              <View style={styles.chipWrap}>
                {accounts.map((acc) => {
                  const selected = value === acc.id;
                  return (
                    <Pressable
                      key={acc.id}
                      style={[styles.selectChip, selected && styles.selectChipActive]}
                      onPress={() => onChange(acc.id)}
                    >
                      <Text style={[styles.selectChipLabel, selected && styles.selectChipLabelActive]}>
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

      {/* Who paid */}
      {members.length > 1 && (
        <Field label={t('addSheet.expense.whoPaid')}>
          <Controller
            control={control}
            name="memberId"
            render={({ field: { value, onChange } }) => (
              <View style={styles.chipWrap}>
                {members.map((m) => {
                  const selected = value === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      style={[styles.assigneeChip, selected && styles.selectChipActive]}
                      onPress={() => onChange(m.id)}
                    >
                      <Avatar initial={m.initial} color={m.color} size="sm" />
                      <Text style={[styles.selectChipLabel, selected && styles.selectChipLabelActive]}>
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

function Field({ label, error, children }: { label: string; error?: string | undefined; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing[3] },
  fieldLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[3],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  fieldError: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.brand.terracotta,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.large,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
    backgroundColor: colors.background.surface,
  },
  inputError: { borderColor: colors.brand.terracotta },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  selectChip: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
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
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  submitBtn: {
    backgroundColor: colors.brand.terracotta,
    borderRadius: radius.large,
    paddingVertical: spacing[5],
    alignItems: 'center',
  },
  submitBtnPressed: { opacity: 0.85 },
  submitLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    fontWeight: font.weight.medium,
    color: colors.background.surface,
  },
});
