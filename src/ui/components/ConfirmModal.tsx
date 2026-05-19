import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { animation, colors, font, radius, spacing } from '../tokens';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0.4,
          duration: animation.duration.smooth,
          easing: Easing.bezier(...animation.easing.standard),
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: animation.duration.smooth,
          easing: Easing.bezier(...animation.easing.decel),
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: animation.duration.quick,
          easing: Easing.bezier(...animation.easing.standard),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: animation.duration.quick,
          easing: Easing.bezier(...animation.easing.standard),
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 0.92,
          duration: animation.duration.quick,
          easing: Easing.bezier(...animation.easing.standard),
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 0,
          duration: animation.duration.quick,
          easing: Easing.bezier(...animation.easing.standard),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropOpacity, cardScale, cardOpacity]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      </Animated.View>

      {/* Card */}
      <View style={styles.centeredContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: cardScale }], opacity: cardOpacity },
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          {message !== undefined && message !== '' && (
            <Text style={styles.message}>{message}</Text>
          )}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
              onPress={onCancel}
              accessibilityRole="button"
            >
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.confirmBtn, pressed && styles.confirmBtnPressed]}
              onPress={onConfirm}
              accessibilityRole="button"
            >
              <Text style={styles.confirmBtnLabel}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
  },
  card: {
    width: '100%',
    backgroundColor: colors.background.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing[7],
    paddingTop: spacing[7],
    paddingBottom: spacing[5],
    gap: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    fontWeight: font.weight.medium,
    color: colors.ink[1],
    textAlign: 'center',
  },
  message: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
    textAlign: 'center',
    lineHeight: font.size.small * 1.5,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border.emphasis,
    alignItems: 'center',
  },
  cancelBtnPressed: {
    opacity: 0.6,
  },
  cancelLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[2],
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: spacing[4],
    borderRadius: radius.medium,
    backgroundColor: colors.brand.terracotta,
    alignItems: 'center',
  },
  confirmBtnPressed: {
    backgroundColor: colors.brand.terracottaPressed,
  },
  confirmBtnLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    fontWeight: font.weight.medium,
    color: colors.background.surface,
  },
});
