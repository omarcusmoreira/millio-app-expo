import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Check, RotateCcw, Trash2 } from 'lucide-react-native';
import type { Bill, Category, Member } from '../../domain/entities';
import { BillItem } from './BillItem';
import { colors } from '../tokens';

// Snap-to-reveal threshold — button becomes visible at this point
const REVEAL = 80;
// Past this distance (or with high velocity) → action fires immediately
const TRIGGER = 200;

interface SwipeableBillItemProps {
  bill: Bill;
  categories: Category[];
  today: string;
  assignee?: Member | undefined;
  onEdit?: () => void;
  onPay?: () => void;
  onDelete?: () => void;
}

export function SwipeableBillItem({
  bill,
  categories,
  today,
  assignee,
  onEdit,
  onPay,
  onDelete,
}: SwipeableBillItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const openSide = useRef<'pay' | 'delete' | null>(null);
  const baseX = useRef(0);

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

  const firePay = () => {
    close();
    onPay?.();
  };

  const fireDelete = () => {
    close();
    onDelete?.();
  };

  // Background color interpolation: action slot intensifies past REVEAL
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
        // Allow dragging past REVEAL all the way to TRIGGER
        translateX.setValue(Math.max(-TRIGGER, Math.min(TRIGGER, baseX.current + dx)));
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        const val = baseX.current + dx;

        if (val <= -TRIGGER || vx < -1.2) {
          // Full left swipe or fast flick → fire delete immediately
          fireDelete();
        } else if (val >= TRIGGER || vx > 1.2) {
          // Full right swipe or fast flick → fire pay immediately
          firePay();
        } else if (val < -REVEAL / 2) {
          openDelete();
        } else if (val > REVEAL / 2) {
          openPay();
        } else {
          close();
        }
      },
      onPanResponderTerminate: () => close(),
    })
  ).current;

  const handleRowPress = () => {
    if (openSide.current !== null) {
      close();
    } else {
      onEdit?.();
    }
  };

  return (
    <View style={styles.container}>
      {/* Pay action — revealed on right swipe */}
      {onPay && (
        <Animated.View style={[styles.action, styles.payAction, { backgroundColor: payBg }]}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.payActionBtn, pressed && styles.actionBtnPressed]}
            onPress={firePay}
          >
            {bill.paidAt
              ? <RotateCcw size={20} color={colors.background.surface} strokeWidth={2} />
              : <Check size={22} color={colors.background.surface} strokeWidth={2.5} />
            }
          </Pressable>
        </Animated.View>
      )}

      {/* Delete action — revealed on left swipe */}
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

      {/* Content row */}
      <Animated.View
        style={[styles.content, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <BillItem
          bill={bill}
          categories={categories}
          today={today}
          assignee={assignee}
          onPress={handleRowPress}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  content: {
    backgroundColor: colors.background.surface,
  },
  action: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: TRIGGER,
  },
  payAction: {
    left: 0,
  },
  deleteAction: {
    right: 0,
  },
  actionBtn: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: REVEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payActionBtn: {
    left: 0,
  },
  deleteActionBtn: {
    right: 0,
  },
  actionBtnPressed: {
    opacity: 0.7,
  },
});
