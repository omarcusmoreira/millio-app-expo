import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Sheet } from './Sheet';
import { useHouseholdStore } from '../../store/household';
import type { Silo } from '../../domain/entities';
import { font, radius, spacing } from '../tokens';
import type { Colors } from '../tokens';
import { useColors } from '../theme';

const schema = z.object({
  amount: z.string().regex(/^\d+([,\.]\d{0,2})?$/, 'required'),
  accountId: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

interface TransferSheetProps {
  silo: Silo | null;
  open: boolean;
  onClose: () => void;
}

export function TransferSheet({ silo, open, onClose }: TransferSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const household = useHouseholdStore((s) => s.household);
  const transferTo = useHouseholdStore((s) => s.transferToSilo);
  const transferFrom = useHouseholdStore((s) => s.transferFromSilo);
  const [direction, setDirection] = useState<'to-silo' | 'from-silo'>('to-silo');

  const accounts = household?.cashAccounts ?? [];
  const defaultAccount = accounts[0]?.id ?? '';

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '', accountId: defaultAccount },
  });

  useEffect(() => {
    if (!open) {
      reset({ amount: '', accountId: defaultAccount });
      setDirection('to-silo');
    }
  }, [open, reset, defaultAccount]);

  const rawAmount = watch('amount');
  const parsed = parseFloat(rawAmount.replace(',', '.'));
  const formatted = !isNaN(parsed)
    ? parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : '';

  const explainer =
    silo && formatted
      ? direction === 'to-silo'
        ? t('addSheet.transfer.explainerToSilo', { value: formatted, name: silo.name })
        : t('addSheet.transfer.explainerFromSilo', { value: formatted, name: silo.name })
      : null;

  const onSubmit = (values: FormValues) => {
    if (!silo) return;
    const amount = parseFloat(values.amount.replace(',', '.'));
    if (direction === 'to-silo') {
      transferTo(silo.id, amount, values.accountId);
    } else {
      transferFrom(silo.id, amount, values.accountId);
    }
    reset();
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('silos.detail.transfer')}
      footer={
        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.submitLabel}>{t('addSheet.transfer.submit')}</Text>
        </Pressable>
      }
    >
      {/* Direction toggle */}
      <View style={styles.dirRow}>
        <Pressable
          style={[styles.dirChip, direction === 'to-silo' && styles.dirChipActive]}
          onPress={() => setDirection('to-silo')}
        >
          <Text style={[styles.dirLabel, direction === 'to-silo' && styles.dirLabelActive]}>
            {t('addSheet.transfer.fromCash')} → {silo?.name ?? t('addSheet.transfer.toSilo')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.dirChip, direction === 'from-silo' && styles.dirChipActive]}
          onPress={() => setDirection('from-silo')}
        >
          <Text style={[styles.dirLabel, direction === 'from-silo' && styles.dirLabelActive]}>
            {silo?.name ?? t('addSheet.transfer.silo')} → {t('addSheet.transfer.fromCash')}
          </Text>
        </Pressable>
      </View>

      {/* Amount */}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{t('addSheet.transfer.amount')}</Text>
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
            />
          )}
        />
      </View>

      {/* Account picker */}
      {accounts.length > 1 && (
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{t('addSheet.transfer.cashAccount')}</Text>
          <Controller
            control={control}
            name="accountId"
            render={({ field: { value, onChange } }) => (
              <View style={styles.chipWrap}>
                {accounts.map((a) => (
                  <Pressable
                    key={a.id}
                    style={[styles.chip, value === a.id && styles.chipActive]}
                    onPress={() => onChange(a.id)}
                  >
                    <Text style={[styles.chipLabel, value === a.id && styles.chipLabelActive]}>
                      {a.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />
        </View>
      )}

      {/* Explainer */}
      {explainer && (
        <View style={styles.explainerBox}>
          <Text style={styles.explainerText}>{explainer}</Text>
        </View>
      )}
    </Sheet>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  dirRow: { flexDirection: 'column', gap: spacing[2] },
  dirChip: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  dirChipActive: { backgroundColor: colors.ink[1], borderColor: colors.ink[1] },
  dirLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[2],
  },
  dirLabelActive: { color: colors.background.surface },
  field: { gap: spacing[2] },
  fieldLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[3],
    textTransform: 'uppercase',
    letterSpacing: font.letterSpacing.eyebrow,
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
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  chipActive: { backgroundColor: colors.ink[1], borderColor: colors.ink[1] },
  chipLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[2],
    fontWeight: font.weight.medium,
  },
  chipLabelActive: { color: colors.background.surface },
  explainerBox: {
    backgroundColor: colors.background.surfaceSoft,
    borderRadius: radius.medium,
    padding: spacing[5],
  },
  explainerText: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
    lineHeight: 18,
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
