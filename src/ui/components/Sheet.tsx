import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { animation, font, radius, spacing } from '../tokens';
import type { Colors } from '../tokens';
import { useColors } from '../theme';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  dismissible?: boolean;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  dismissible = true,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = makeStyles(colors);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: animation.duration.smooth,
          easing: Easing.bezier(...animation.easing.decel),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.4,
          duration: animation.duration.smooth,
          easing: Easing.bezier(...animation.easing.standard),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: animation.duration.quick,
          easing: Easing.bezier(...animation.easing.standard),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: animation.duration.quick,
          easing: Easing.bezier(...animation.easing.standard),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open, translateY, backdropOpacity]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismissible ? onClose : undefined}
      accessibilityViewIsModal
    >
      {/* Backdrop — sits behind everything, absorbs taps outside the panel */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismissible ? onClose : undefined}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
      </Animated.View>

      <Animated.View
        style={[styles.panelWrapper, { transform: [{ translateY }] }]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={styles.panel}
          accessibilityRole="none"
          aria-modal
        >
          {/* Grabber */}
          <View style={styles.grabberRow}>
            <View style={styles.grabber} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={8}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={[
              styles.bodyContent,
              { paddingBottom: footer ? spacing[6] : insets.bottom + spacing[6] },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets
          >
            {children}
          </ScrollView>

          {/* Footer */}
          {footer && (
            <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
              {footer}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  panelWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  panel: {
    backgroundColor: colors.background.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: SCREEN_HEIGHT * 0.92,
    overflow: 'hidden',
  },
  grabberRow: {
    alignItems: 'center',
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.emphasis,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[7],
    paddingVertical: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.divider,
  },
  title: {
    flex: 1,
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    fontWeight: font.weight.medium,
    color: colors.ink[1],
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: spacing[7],
    padding: spacing[2],
  },
  closeBtnPressed: {
    opacity: 0.5,
  },
  closeIcon: {
    fontFamily: font.family.sans,
    fontSize: 16,
    color: colors.ink[3],
  },
  body: {
    flexShrink: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing[7],
    paddingTop: spacing[6],
    gap: spacing[5],
  },
  footer: {
    paddingHorizontal: spacing[7],
    paddingTop: spacing[5],
    borderTopWidth: 1,
    borderTopColor: colors.border.divider,
  },
});
