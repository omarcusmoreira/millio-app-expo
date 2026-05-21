import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Check, RotateCcw, Trash2 } from 'lucide-react-native';
import { CategoryChip, Money } from '../primitives';
import { font, spacing } from '../tokens';
import type { Colors } from '../tokens';
import { useColors } from '../theme';
import type { CashAccount, Category, Transaction } from '../../domain/entities';

const REVEAL  = 72;
const TRIGGER = 180;

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

interface Props {
  transaction: Transaction;
  accounts?: CashAccount[];
  categories?: Category[];
  onEdit: () => void;
  onDelete: () => void;
  onMarkReceived?: (() => void) | undefined;
}

export function SwipeableIncomeItem({ transaction, accounts = [], categories = [], onEdit, onDelete, onMarkReceived }: Props) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const translateX = useRef(new Animated.Value(0)).current;
  const openSide   = useRef<'receive' | 'delete' | null>(null);
  const baseX      = useRef(0);

  const isPending = transaction.receivedAt === null;

  const snap = (toValue: number, side: 'receive' | 'delete' | null) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
    openSide.current = side;
  };

  const close      = () => snap(0, null);
  const openRecv   = () => snap(REVEAL, 'receive');
  const openDel    = () => snap(-REVEAL, 'delete');
  const fireRecv   = () => { close(); onMarkReceived?.(); };
  const fireDel    = () => { close(); onDelete(); };

  const receiveBg = translateX.interpolate({
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
          openSide.current === 'receive' ?  REVEAL :
          openSide.current === 'delete'  ? -REVEAL : 0;
      },
      onPanResponderMove: (_, { dx }) => {
        const maxLeft = onMarkReceived ? TRIGGER : 0;
        translateX.setValue(Math.max(-TRIGGER, Math.min(maxLeft, baseX.current + dx)));
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        const val = baseX.current + dx;
        if      (onMarkReceived && (val >= TRIGGER || vx > 1.2)) fireRecv();
        else if (val <= -TRIGGER || vx < -1.2) fireDel();
        else if (onMarkReceived && val > REVEAL / 2)  openRecv();
        else if (val < -REVEAL / 2)  openDel();
        else close();
      },
      onPanResponderTerminate: () => close(),
    })
  ).current;

  const handlePress = () => {
    if (openSide.current !== null) close();
    else onEdit();
  };

  const account = transaction.accountId
    ? accounts.find((a) => a.id === transaction.accountId)
    : null;

  const txCategories = transaction.categoryIds
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is Category => c !== undefined);

  return (
    <View style={styles.container}>
      {/* Receive — right swipe */}
      {onMarkReceived && (
        <Animated.View style={[styles.action, styles.receiveAction, { backgroundColor: receiveBg }]}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.receiveActionBtn, pressed && styles.actionBtnPressed]}
            onPress={fireRecv}
          >
            {isPending
              ? <Check size={20} color={colors.background.surface} strokeWidth={2.5} />
              : <RotateCcw size={20} color={colors.background.surface} strokeWidth={2} />
            }
          </Pressable>
        </Animated.View>
      )}

      {/* Delete — left swipe */}
      <Animated.View style={[styles.action, styles.deleteAction, { backgroundColor: deleteBg }]}>
        <Pressable
          style={({ pressed }) => [styles.actionBtn, styles.deleteActionBtn, pressed && styles.actionBtnPressed]}
          onPress={fireDel}
        >
          <Trash2 size={20} color={colors.background.surface} strokeWidth={2} />
        </Pressable>
      </Animated.View>

      {/* Content */}
      <Animated.View
        style={[styles.content, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={handlePress}
        >
          <View style={styles.info}>
            <Text style={[styles.name, !isPending && styles.nameReceived]} numberOfLines={1}>
              {transaction.name}
            </Text>
            <View style={styles.meta}>
              <Text style={styles.metaText}>{formatDate(transaction.date)}</Text>
              {!isPending && (
                <>
                  <Text style={styles.metaSep}>·</Text>
                  <Text style={[styles.metaText, styles.receivedBadge]}>✓</Text>
                </>
              )}
              {txCategories.map((cat) => (
                <React.Fragment key={cat.id}>
                  <Text style={styles.metaSep}>·</Text>
                  <CategoryChip name={cat.name} color={cat.color} />
                </React.Fragment>
              ))}
            </View>
          </View>
          <View style={styles.right}>
            <Money
              value={transaction.amount}
              variant="inline"
              color={isPending ? colors.ink[3] : colors.ink[1]}
            />
            {account && (
              <Text style={styles.accountMeta} numberOfLines={1}>{account.name}</Text>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  container: { overflow: 'hidden' },
  content:   { backgroundColor: colors.background.surface },
  action: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: TRIGGER,
  },
  receiveAction: { left: 0 },
  deleteAction:  { right: 0 },
  actionBtn: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: REVEAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiveActionBtn: { left: 0 },
  deleteActionBtn:  { right: 0 },
  actionBtnPressed: { opacity: 0.7 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    gap: spacing[4],
  },
  rowPressed: { opacity: 0.6 },
  info: { flex: 1, gap: spacing[2] },
  name: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  nameReceived: {
    color: colors.ink[3],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  metaText: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  receivedBadge: {
    color: colors.semantic.olive,
  },
  metaSep: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
  },
  right: {
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  accountMeta: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
    maxWidth: 120,
  },
});
