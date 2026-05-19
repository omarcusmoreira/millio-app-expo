import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Sheet } from './Sheet';
import { Money } from '../primitives';
import { useHouseholdStore } from '../../store/household';
import type { Silo } from '../../domain/entities';
import { font, radius, spacing } from '../tokens';
import type { Colors } from '../tokens';
import { useColors } from '../theme';

const schema = z.object({
  newValue: z.string().regex(/^\d+([,\.]\d{0,2})?$/, 'required'),
});

type FormValues = z.infer<typeof schema>;

interface UpdateValueSheetProps {
  silo: Silo | null;
  open: boolean;
  onClose: () => void;
}

export function UpdateValueSheet({ silo, open, onClose }: UpdateValueSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const updateValue = useHouseholdStore((s) => s.updateSiloValue);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newValue: '' },
  });

  useEffect(() => {
    if (open && silo) {
      reset({ newValue: silo.value.toFixed(2).replace('.', ',') });
    }
  }, [open, silo, reset]);

  const rawValue = watch('newValue');
  const parsed = parseFloat(rawValue.replace(',', '.'));
  const delta = silo && !isNaN(parsed) ? parsed - silo.value : 0;

  const onSubmit = (values: FormValues) => {
    if (!silo) return;
    const newValue = parseFloat(values.newValue.replace(',', '.'));
    updateValue(silo.id, newValue);
    onClose();
  };

  const deltaColor = delta > 0 ? colors.semantic.olive : delta < 0 ? colors.brand.terracotta : colors.ink[3];
  const deltaSign = delta > 0 ? '+' : '';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={silo?.name ?? ''}
      footer={
        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.submitLabel}>{t('silos.update.save')}</Text>
        </Pressable>
      }
    >
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{t('silos.update.newValue')}</Text>
        <Controller
          control={control}
          name="newValue"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[styles.input, errors.newValue && styles.inputError]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
              autoFocus
            />
          )}
        />
      </View>

      {/* Delta indicator */}
      {delta !== 0 && !isNaN(parsed) ? (
        <View style={styles.deltaRow}>
          <Text style={[styles.deltaText, { color: deltaColor }]}>
            {t('silos.update.deltaVs', {
              sign: deltaSign,
              value: Math.abs(delta).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }),
            })}
          </Text>
        </View>
      ) : null}

      {/* Explainer */}
      <View style={styles.explainerBox}>
        <Text style={styles.explainerText}>{t('silos.update.explainer')}</Text>
      </View>
    </Sheet>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
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
  deltaRow: {
    paddingVertical: spacing[3],
  },
  deltaText: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    textTransform: 'uppercase',
    letterSpacing: font.letterSpacing.eyebrow,
  },
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
