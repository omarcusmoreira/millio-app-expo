import React, { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useColors } from '../../src/ui/theme';
import type { Colors } from '../../src/ui/tokens';
import { AddSheet } from '../../src/ui/components/AddSheet';

export default function AddScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const [open, setOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setOpen(true);
    }, [])
  );

  function handleClose() {
    setOpen(false);
    router.back();
  }

  return (
    <View style={styles.bg}>
      <AddSheet open={open} onClose={handleClose} />
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
});
