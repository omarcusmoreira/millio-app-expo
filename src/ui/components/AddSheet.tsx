import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Archive, ShoppingCart, TrendingUp } from 'lucide-react-native';
import { Sheet } from './Sheet';
import { NewExpenseSheet } from './NewExpenseSheet';
import { NewIncomeSheet } from './NewIncomeSheet';
import { NewSiloSheet } from './NewSiloSheet';
import { font, radius, spacing } from '../tokens';
import type { Colors } from '../tokens';
import { useColors } from '../theme';

type ActionKind = 'expense' | 'income' | 'silo' | null;

interface AddSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AddSheet({ open, onClose }: AddSheetProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
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
            icon={<ShoppingCart size={18} color={colors.brand.terracotta} strokeWidth={1.8} />}
            title={t('addSheet.kinds.expense.title')}
            sub={t('addSheet.kinds.expense.sub')}
            onPress={() => setAction('expense')}
          />
          <KindCard
            icon={<TrendingUp size={18} color={colors.brand.terracotta} strokeWidth={1.8} />}
            title={t('addSheet.kinds.income.title')}
            sub={t('addSheet.kinds.income.sub')}
            onPress={() => setAction('income')}
          />
          <KindCard
            icon={<Archive size={18} color={colors.brand.terracotta} strokeWidth={1.8} />}
            title={t('addSheet.kinds.asset.title')}
            sub={t('addSheet.kinds.asset.sub')}
            onPress={() => setAction('silo')}
          />
        </View>
      </Sheet>

      <NewExpenseSheet open={action === 'expense'} onClose={handleClose} />
      <NewIncomeSheet  open={action === 'income'}  onClose={handleClose} />
      <NewSiloSheet    open={action === 'silo'}     onClose={handleClose} />
    </>
  );
}

function KindCard({ icon, title, sub, onPress }: { icon: React.ReactNode; title: string; sub: string; onPress: () => void }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardRow}>
        <View style={styles.iconCircle}>{icon}</View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSub}>{sub}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand.terracottaSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    gap: spacing[1],
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
