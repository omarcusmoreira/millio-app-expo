import React, { useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import type { Silo } from '../../domain/entities';
import { SiloRow } from './SiloRow';
import type { Colors } from '../tokens';
import { useColors } from '../theme';

const REVEAL = 80;
const TRIGGER = 200;

interface SwipeableSiloRowProps {
  silo: Silo;
  today: string;
  onEdit?: () => void;
  onContribute?: () => void;
  onDelete?: () => void;
}

export function SwipeableSiloRow({
  silo,
  today,
  onEdit,
  onContribute,
  onDelete,
}: SwipeableSiloRowProps) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const translateX = useRef(new Animated.Value(0)).current;
  const openSide = useRef<'contribute' | 'delete' | null>(null);
  const baseX = useRef(0);

  const snap = (toValue: number, side: 'contribute' | 'delete' | null) => {
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start();
    openSide.current = side;
  };

  const close = () => snap(0, null);
  const openContribute = () => snap(REVEAL, 'contribute');
  const openDelete = () => snap(-REVEAL, 'delete');

  const fireContribute = () => {
    close();
    onContribute?.();
  };

  const fireDelete = () => {
    close();
    onDelete?.();
  };

  const contributeBg = translateX.interpolate({
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
          openSide.current === 'contribute' ? REVEAL :
          openSide.current === 'delete' ? -REVEAL : 0;
      },
      onPanResponderMove: (_, { dx }) => {
        translateX.setValue(Math.max(-TRIGGER, Math.min(TRIGGER, baseX.current + dx)));
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        const val = baseX.current + dx;

        if (val <= -TRIGGER || vx < -1.2) {
          fireDelete();
        } else if (val >= TRIGGER || vx > 1.2) {
          fireContribute();
        } else if (val < -REVEAL / 2) {
          openDelete();
        } else if (val > REVEAL / 2) {
          openContribute();
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
      {/* Contribute action — revealed on right swipe */}
      {onContribute && (
        <Animated.View style={[styles.action, styles.contributeAction, { backgroundColor: contributeBg }]}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.contributeActionBtn, pressed && styles.actionBtnPressed]}
            onPress={fireContribute}
          >
            <Plus size={22} color={colors.background.surface} strokeWidth={2.5} />
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
        <SiloRow
          silo={silo}
          today={today}
          onPress={handleRowPress}
        />
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
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
  contributeAction: {
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
  contributeActionBtn: {
    left: 0,
  },
  deleteActionBtn: {
    right: 0,
  },
  actionBtnPressed: {
    opacity: 0.7,
  },
});
