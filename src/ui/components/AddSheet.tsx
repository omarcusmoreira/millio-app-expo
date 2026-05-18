import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Sheet } from './Sheet';
import { NewExpenseSheet } from './NewExpenseSheet';
import { NewIncomeSheet } from './NewIncomeSheet';
import { NewBillSheet } from './NewBillSheet';
import { NewSiloSheet } from './NewSiloSheet';
import { colors, font, radius, spacing } from '../tokens';

type ActionKind = 'expense' | 'income' | 'bill' | 'silo' | null;

interface AddSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddSheet({ open, onClose }: AddSheetProps) {
  const { t } = useTranslation();
  const [action, setAction] = useState<ActionKind>(null);

  function handleClose() {
    setAction(null);
    onClose();
  }

  return (
    <>
      <Sheet open={open && action === null} onClose={handleClose} title={t('addSheet.title')}>
        <View style={styles.grid}>
          <KindCard
            title={t('addSheet.kinds.expense.title')}
            sub={t('addSheet.kinds.expense.sub')}
            onPress={() => setAction('expense')}
          />
          <KindCard
            title={t('addSheet.kinds.bill.title')}
            sub={t('addSheet.kinds.bill.sub')}
            onPress={() => setAction('bill')}
          />
          <KindCard
            title={t('addSheet.kinds.income.title')}
            sub={t('addSheet.kinds.income.sub')}
            onPress={() => setAction('income')}
          />
          <KindCard
            title={t('addSheet.kinds.asset.title')}
            sub={t('addSheet.kinds.asset.sub')}
            onPress={() => setAction('silo')}
          />
        </View>
      </Sheet>

      <NewExpenseSheet open={action === 'expense'} onClose={handleClose} />
      <NewIncomeSheet  open={action === 'income'}  onClose={handleClose} />
      <NewBillSheet    open={action === 'bill'}     onClose={handleClose} />
      <NewSiloSheet    open={action === 'silo'}     onClose={handleClose} />
    </>
  );
}

function KindCard({ title, sub, onPress }: { title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSub}>{sub}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing[3],
    paddingBottom: spacing[4],
  },
  card: {
    backgroundColor: colors.background.surfaceSoft,
    borderRadius: radius.large,
    padding: spacing[6],
    gap: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cardPressed: {
    backgroundColor: colors.background.keyboardChip,
  },
  cardTitle: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    fontWeight: font.weight.medium,
    color: colors.ink[1],
  },
  cardSub: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
    lineHeight: font.size.small * 1.4,
  },
});
