import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Check, RotateCcw, Trash2 } from 'lucide-react-native';
import type { Category, Expense, Member } from '../../domain/entities';
import { ExpenseItem } from './ExpenseItem';
import type { Colors } from '../tokens';
import { useColors } from '../theme';

const REVEAL = 80;
const TRIGGER = 200;

interface SwipeableExpenseItemProps {
  expense: Expense;
  categories: Category[];
  today: string;
  assignee?: Member | undefined;
  onEdit?: () => void;
  onPay?: (() => void) | undefined;
  onDelete?: () => void;
}

export function SwipeableExpenseItem({
  expense,
  categories,
  today,
  assignee,
  onEdit,
  onPay,
  onDelete,
}: SwipeableExpenseItemProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const translateX = useRef(new Animated.Value(0)).current;
  const openSide = useRef<'pay' | 'delete' | null>(null);
  const baseX = useRef(0);

  // One-time expenses are always paid — no pay action
  const canPay = onPay && expense.recurring !== 'one-time';

  const snap = (toValue: number, side: 'pay' | 'delete' | null) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
    openSide.current = side;
  };

  const close = () => snap(0, null);
  const openPay = () => snap(REVEAL, 'pay');
  const openDelete = () => snap(-REVEAL, 'delete');

  const firePay = () => { close(); onPay?.(); };
  const fireDelete = () => { close(); onDelete?.(); };

  const payBg = translateX.interpolate({
    inputRange: [0, REVEAL, TRIGGER],
    outputRange: [colors.semantic.olive, colors.semantic.olive, colors.semantic.olive],
    extrapolate: 'clamp',
  });
  const deleteBg = translateX.interpolate({
    inputRange: [-TRIGGER, -REVEAL, 0],
    outputRange: [colors.brand.terracottaPressed, colors.brand.terracotta, colors.brand.terracotta],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6,
      onPanResponderGrant: () => {
        baseX.current =
          openSide.current === 'pay' ? REVEAL :
          openSide.current === 'delete' ? -REVEAL : 0;
      },
      onPanResponderMove: (_, { dx }) => {
        translateX.setValue(Math.max(-TRIGGER, Math.min(TRIGGER, baseX.current + dx)));
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        const val = baseX.current + dx;
        if (val <= -TRIGGER || vx < -1.2) {
          fireDelete();
        } else if (canPay && (val >= TRIGGER || vx > 1.2)) {
          firePay();
        } else if (val < -REVEAL / 2) {
          openDelete();
        } else if (canPay && val > REVEAL / 2) {
          openPay();
        } else {
          close();
        }
      },
      onPanResponderTerminate: () => close(),
    })
  ).current;

  const handleRowPress = () => {
    if (openSide.current !== null) close();
    else onEdit?.();
  };

  return (
    <View style={styles.container}>
      {canPay && (
        <Animated.View style={[styles.action, styles.payAction, { backgroundColor: payBg }]}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.payActionBtn, pressed && styles.actionBtnPressed]}
            onPress={firePay}
          >
            {expense.paidAt
              ? <RotateCcw size={20} color={colors.background.surface} strokeWidth={2} />
              : <Check size={22} color={colors.background.surface} strokeWidth={2.5} />
            }
          </Pressable>
        </Animated.View>
      )}

      {onDelete && (
        <Animated.View style={[styles.action, styles.deleteAction, { backgroundColor: deleteBg }]}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.deleteActionBtn, pressed && styles.actionBtnPressed]}
            onPress={fireDelete}
          >
            <Trash2 size={20} color={colors.background.surface} strokeWidth={2} />
          </Pressable>
        </Animated.View>
      )}

      <Animated.View
        style={[styles.content, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <ExpenseItem
          expense={expense}
          categories={categories}
          today={today}
          assignee={assignee}
          onPress={handleRowPress}
        />
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { overflow: 'hidden' },
  content: { backgroundColor: colors.background.surface },
  action: { position: 'absolute', top: 0, bottom: 0, width: TRIGGER },
  payAction: { left: 0 },
  deleteAction: { right: 0 },
  actionBtn: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: REVEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payActionBtn: { left: 0 },
  deleteActionBtn: { right: 0 },
  actionBtnPressed: { opacity: 0.7 },
});
