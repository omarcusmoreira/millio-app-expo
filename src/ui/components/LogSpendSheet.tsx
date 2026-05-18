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
import { colors, font, radius, spacing } from '../tokens';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  label: z.string().min(1, 'required'),
  amount: z
    .string()
    .min(1, 'required')
    .refine((v) => {
      const n = parseFloat(v.replace(',', '.'));
      return !isNaN(n) && n > 0;
    }, 'amountZero'),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface LogSpendSheetProps {
  open: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LogSpendSheet({ open, onClose }: LogSpendSheetProps) {
  const { t } = useTranslation();
  const logAllowanceSpend = useHouseholdStore((s) => s.logAllowanceSpend);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: '',
      amount: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    const amount = parseFloat(values.amount.replace(',', '.'));
    logAllowanceSpend(values.label.trim(), amount);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={t('allowance.sheet.title')}
      footer={
        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.submitLabel}>{t('allowance.sheet.logSpendBtn')}</Text>
        </Pressable>
      }
    >
      {/* Label */}
      <Field label={t('allowance.sheet.whatWasItFor')} error={errors.label?.message}>
        <Controller
          control={control}
          name="label"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[styles.input, errors.label && styles.inputError]}
              placeholder={t('allowance.sheet.placeholder')}
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

      {/* Amount */}
      <Field label={t('allowance.sheet.amountSpent')} error={errors.amount?.message}>
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
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />
      </Field>
    </Sheet>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  field: {
    gap: spacing[2],
  },
  fieldLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[3],
    textTransform: 'uppercase',
    letterSpacing: font.letterSpacing.eyebrow,
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
  inputError: {
    borderColor: colors.brand.terracotta,
  },
  submitBtn: {
    backgroundColor: colors.brand.terracotta,
    borderRadius: radius.medium,
    paddingVertical: spacing[5],
    alignItems: 'center',
  },
  submitBtnPressed: {
    opacity: 0.8,
  },
  submitLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    fontWeight: font.weight.medium,
    color: colors.background.surface,
  },
});
