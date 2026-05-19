import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Sheet } from './Sheet';
import { useHouseholdStore } from '../../store/household';
import type { Silo, SiloKind } from '../../domain/entities';
import { colors, font, radius, spacing } from '../tokens';
import { shared } from './sheetShared';

const schema = z.object({
  name: z.string().min(1),
  value: z.string(),
  goalAmount: z.string(),
  kind: z.enum(['property', 'savings', 'equity', 'vehicle', 'other'] as const),
  note: z.string(),
  labelIds: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

const KINDS: SiloKind[] = ['savings', 'property', 'equity', 'vehicle', 'other'];

interface NewSiloSheetProps {
  open: boolean;
  onClose: () => void;
  silo?: Silo | undefined;
}

export function NewSiloSheet({ open, onClose, silo }: NewSiloSheetProps) {
  const { t } = useTranslation();
  const addSilo    = useHouseholdStore((s) => s.addSilo);
  const updateSilo = useHouseholdStore((s) => s.updateSilo);
  const household  = useHouseholdStore((s) => s.household);

  const labels    = household?.labels ?? [];
  const isEditing = !!silo;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', value: '', goalAmount: '', kind: 'savings', note: '', labelIds: [] },
  });

  useEffect(() => {
    if (open && silo) {
      reset({
        name: silo.name,
        value: String(silo.value),
        goalAmount: silo.goalAmount != null ? String(silo.goalAmount) : '',
        kind: silo.kind,
        note: silo.note,
        labelIds: silo.labelIds,
      });
    } else if (!open) {
      reset({ name: '', value: '', goalAmount: '', kind: 'savings', note: '', labelIds: [] });
    }
  }, [open, silo]);

  const onSubmit = (values: FormValues) => {
    const value = values.value ? parseFloat(values.value.replace(',', '.')) : 0;
    const goalAmount = values.goalAmount ? parseFloat(values.goalAmount.replace(',', '.')) : null;

    const draft = {
      name: values.name.trim(),
      value: isNaN(value) ? 0 : value,
      goalAmount: goalAmount !== null && !isNaN(goalAmount) ? goalAmount : null,
      kind: values.kind,
      note: values.note.trim(),
      labelIds: values.labelIds,
    };

    if (isEditing && silo) {
      updateSilo(silo.id, draft);
    } else {
      addSilo(draft);
    }
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEditing ? t('silos.detail.title', { name: silo?.name ?? '' }) : t('silos.newSilo')}
      footer={
        <Pressable
          style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={styles.submitLabel}>
            {isEditing ? t('addSheet.silo.save') : t('silos.newSilo')}
          </Text>
        </Pressable>
      }
    >
      <Field label={t('addSheet.newBill.name')} error={errors.name?.message}>
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Reserva de emergência, apartamento…"
              placeholderTextColor={colors.ink[4]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
            />
          )}
        />
      </Field>

      <Field label={t('silos.update.newValue')}>
        <Controller
          control={control}
          name="value"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={styles.input}
              placeholder="0,00"
              placeholderTextColor={colors.ink[4]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
            />
          )}
        />
      </Field>

      <Field label={t('common.goal')}>
        <Controller
          control={control}
          name="goalAmount"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={styles.input}
              placeholder="Opcional"
              placeholderTextColor={colors.ink[4]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
            />
          )}
        />
      </Field>

      <Field label={t('silos.detail.type')}>
        <Controller
          control={control}
          name="kind"
          render={({ field: { value, onChange } }) => (
            <View style={styles.chipWrap}>
              {KINDS.map((k) => (
                <Pressable
                  key={k}
                  style={[styles.chip, value === k && styles.chipActive]}
                  onPress={() => onChange(k)}
                >
                  <Text style={[styles.chipLabel, value === k && styles.chipLabelActive]}>
                    {k}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        />
      </Field>

      <Field label={t('silos.detail.note')}>
        <Controller
          control={control}
          name="note"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={styles.input}
              placeholder="Opcional"
              placeholderTextColor={colors.ink[4]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
      </Field>

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
                      onPress={() =>
                        onChange(selected ? value.filter((id) => id !== label.id) : [...value, label.id])
                      }
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
    </Sheet>
  );
}

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

const styles = StyleSheet.create({
  field: { gap: spacing[2] },
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
