import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useHouseholdStore } from '../../src/store/household';
import { SwipeableSiloRow } from '../../src/ui/components/SwipeableSiloRow';
import { UpdateValueSheet } from '../../src/ui/components/UpdateValueSheet';
import { TransferSheet } from '../../src/ui/components/TransferSheet';
import { NewSiloSheet } from '../../src/ui/components/NewSiloSheet';
import { ConfirmModal } from '../../src/ui/components/ConfirmModal';
import { Money } from '../../src/ui/primitives';
import { font, spacing } from '../../src/ui/tokens';
import type { Colors } from '../../src/ui/tokens';
import { useColors } from '../../src/ui/theme';
import type { Silo } from '../../src/domain/entities';

type ActiveSheet = 'update' | 'transfer' | 'edit' | null;

export default function SilosScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);
  const household = useHouseholdStore((s) => s.household);
  const today = useHouseholdStore((s) => s.today);
  const deleteSilo = useHouseholdStore((s) => s.deleteSilo);

  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [selectedSilo, setSelectedSilo] = useState<Silo | null>(null);
  const [deletingSilo, setDeletingSilo] = useState<Silo | null>(null);

  const silos = household?.silos ?? [];
  const totalStored = silos.reduce((s, silo) => s + silo.value, 0);

  const openUpdate = (silo: Silo) => {
    setSelectedSilo(silo);
    setActiveSheet('update');
  };

  const closeSheet = () => {
    setActiveSheet(null);
    setSelectedSilo(null);
  };

  return (
    <View style={styles.safe}>
      <UpdateValueSheet silo={selectedSilo} open={activeSheet === 'update'} onClose={closeSheet} />
      <TransferSheet silo={selectedSilo} open={activeSheet === 'transfer'} onClose={closeSheet} />
      <NewSiloSheet
        open={activeSheet === 'edit'}
        silo={selectedSilo ?? undefined}
        onClose={closeSheet}
      />
      <ConfirmModal
        visible={deletingSilo !== null}
        title={t('silos.confirmDelete.title')}
        message={t('silos.confirmDelete.message')}
        confirmLabel={t('common.delete')}
        onConfirm={() => {
          if (deletingSilo) deleteSilo(deletingSilo.id);
          setDeletingSilo(null);
        }}
        onCancel={() => setDeletingSilo(null)}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('silos.title')}</Text>
          <Text style={styles.notSpendable}>{t('silos.notSpendable')}</Text>
        </View>
        <View style={styles.kpiBlock}>
          <Text style={styles.kpiEyebrow}>{t('silos.totalStored').toUpperCase()}</Text>
          <Money value={totalStored} variant="kpi" />
          {silos.length > 0 && (
            <Text style={styles.summary}>
              {t('silos.summary', { count: silos.length })}
            </Text>
          )}
        </View>
      </View>

      {/* List */}
      {silos.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('silos.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={silos}
          keyExtractor={(s) => s.id}
          renderItem={({ item: silo }) => (
            <SwipeableSiloRow
              silo={silo}
              today={today}
              onContribute={() => openUpdate(silo)}
              onEdit={() => {
                setSelectedSilo(silo);
                setActiveSheet('edit');
              }}
              onDelete={() => setDeletingSilo(silo)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const makeStyles = (colors: Colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  header: {
    paddingHorizontal: spacing[7],
    paddingTop: spacing[6],
    paddingBottom: spacing[5],
    gap: spacing[5],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: font.family.sans,
    fontSize: font.size.h1,
    fontWeight: font.weight.medium,
    color: colors.ink[1],
    letterSpacing: font.letterSpacing.h1,
  },
  notSpendable: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[3],
    letterSpacing: font.letterSpacing.eyebrow,
    textAlign: 'right',
    marginTop: 4,
  },
  kpiBlock: {
    gap: spacing[2],
  },
  kpiEyebrow: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[3],
    letterSpacing: font.letterSpacing.eyebrow,
  },
  summary: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
    textTransform: 'uppercase',
    letterSpacing: font.letterSpacing.eyebrow,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.divider,
    marginLeft: spacing[7],
  },
  listContent: {
    paddingBottom: spacing[10],
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[3],
  },
});
