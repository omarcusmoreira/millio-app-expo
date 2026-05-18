import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useHouseholdStore } from '../../src/store/household';
import type { Member } from '../../src/domain/entities';
import { Avatar, CategoryChip, Dot } from '../../src/ui/primitives';
import { colors, font, spacing } from '../../src/ui/tokens';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <Text style={styles.sectionHeader}>{label.toUpperCase()}</Text>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <View style={styles.emptyRow}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HouseholdScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const household = useHouseholdStore((s) => s.household);

  const members = household?.members ?? [];
  const categories = household?.categories ?? [];
  const labels = household?.labels ?? [];
  const cashAccounts = household?.cashAccounts ?? [];
  const bills = household?.bills ?? [];

  function memberById(id: string): Member | undefined {
    return household?.members.find((m) => m.id === id);
  }

  return (
    <View style={styles.safe}>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Page header ── */}
      <View style={styles.pageHeader}>
        <Text style={styles.eyebrow}>{t('lar.eyebrow').toUpperCase()}</Text>
        <Text style={styles.householdName}>{household?.name ?? ''}</Text>
      </View>

      {/* ── 1. Members ── */}
      <View style={styles.section}>
        <SectionHeader label={t('lar.members')} />
        <View style={styles.card}>
          {members.length === 0 ? (
            <EmptyRow text={t('common.loading')} />
          ) : (
            members.map((member, index) => {
              const memberPendingBills = bills.filter(
                (b) => b.assigneeId === member.id && !b.paidAt,
              );
              const pendingCount = memberPendingBills.length;
              const pendingTotal = memberPendingBills.reduce(
                (sum, b) => sum + (b.amount ?? b.estimate ?? 0),
                0,
              );
              const hasPending = pendingCount > 0;

              const pendingLabel = hasPending
                ? t(pendingCount === 1 ? 'member.pendingOne' : 'member.pendingMany', {
                    count: pendingCount,
                  }) + ` · R$ ${formatBRL(pendingTotal)}`
                : t('member.settled');

              return (
                <View key={member.id}>
                  {index > 0 && <View style={styles.separator} />}
                  <Pressable
                    style={({ pressed }) => [styles.memberRow, pressed && styles.memberRowPressed]}
                    onPress={() => router.push(`/member/${member.id}`)}
                    accessibilityRole="button"
                  >
                    <Avatar
                      initial={member.initial}
                      color={member.color}
                      size="md"
                    />
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <View style={styles.pendingRow}>
                        <Dot
                          kind={hasPending ? 'terracotta' : 'olive'}
                          size={6}
                        />
                        <Text
                          style={[
                            styles.pendingLabel,
                            hasPending
                              ? styles.pendingLabelAlert
                              : styles.pendingLabelOk,
                          ]}
                        >
                          {pendingLabel}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color={colors.ink[4]} strokeWidth={2} />
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      </View>

      {/* ── 2. Categories ── */}
      <View style={styles.section}>
        <SectionHeader label={t('lar.setupItems.categories')} />
        <View style={styles.card}>
          {categories.length === 0 ? (
            <>
              <EmptyRow text={t('setup.categories.subtitle')} />
              <View style={styles.separator} />
              <Pressable
                style={styles.addRow}
                onPress={() =>
                  Alert.alert(t('setup.categories.newTitle'), t('setup.categories.subtitle'))
                }
                accessibilityRole="button"
              >
                <Text style={styles.addLabel}>
                  {'+ ' + t('setup.categories.newBtn')}
                </Text>
              </Pressable>
            </>
          ) : (
            categories.map((category, index) => (
              <View key={category.id}>
                {index > 0 && <View style={styles.separator} />}
                <View style={styles.itemRow}>
                  <CategoryChip name={category.name} color={category.color} />
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* ── 3. Labels ── */}
      <View style={styles.section}>
        <SectionHeader label={t('lar.setupItems.labels')} />
        <View style={styles.card}>
          {labels.length === 0 ? (
            <EmptyRow text={t('setup.labels.subtitle')} />
          ) : (
            labels.map((label, index) => (
              <View key={label.id}>
                {index > 0 && <View style={styles.separator} />}
                <View style={styles.itemRow}>
                  <Text style={styles.itemName}>{label.name}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* ── 4. Bank accounts ── */}
      <View style={styles.section}>
        <SectionHeader label={t('lar.setupItems.accounts')} />
        <View style={styles.card}>
          {cashAccounts.length === 0 ? (
            <EmptyRow text={t('setup.accounts.subtitle')} />
          ) : (
            cashAccounts.map((account, index) => {
              const owner = memberById(account.ownerId);
              return (
                <View key={account.id}>
                  {index > 0 && <View style={styles.separator} />}
                  <View style={styles.accountRow}>
                    <View style={styles.accountInfo}>
                      <Text style={styles.itemName}>{account.name}</Text>
                      {account.last4 !== '' && (
                        <Text style={styles.accountLast4}>
                          {'···· ' + account.last4}
                        </Text>
                      )}
                    </View>
                    {owner !== undefined && (
                      <Avatar
                        initial={owner.initial}
                        color={owner.color}
                        size="sm"
                      />
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  screen: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing[10],
  },
  pageHeader: {
    paddingHorizontal: spacing[7],
    paddingTop: spacing[6],
    paddingBottom: spacing[7],
    gap: spacing[2],
  },
  eyebrow: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    letterSpacing: font.letterSpacing.eyebrow,
    color: colors.ink[4],
  },
  householdName: {
    fontFamily: font.family.sans,
    fontSize: font.size.h1,
    fontWeight: font.weight.medium,
    color: colors.ink[1],
    letterSpacing: font.letterSpacing.h1,
  },
  section: {
    marginBottom: spacing[8],
  },
  sectionHeader: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    letterSpacing: font.letterSpacing.eyebrow,
    color: colors.ink[3],
    paddingHorizontal: spacing[7],
    marginBottom: spacing[3],
  },
  card: {
    marginHorizontal: spacing[7],
    backgroundColor: colors.background.surface,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.divider,
    marginLeft: spacing[7],
  },
  // Member row
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    gap: spacing[4],
  },
  memberRowPressed: {
    opacity: 0.6,
  },
  memberInfo: {
    flex: 1,
    gap: spacing[2],
  },
  memberName: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    fontWeight: font.weight.medium,
    color: colors.ink[1],
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  pendingLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
  },
  pendingLabelAlert: {
    color: colors.brand.terracotta,
  },
  pendingLabelOk: {
    color: colors.semantic.olive,
  },
  // Generic item row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    gap: spacing[4],
  },
  itemName: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  // Account row
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
  },
  accountInfo: {
    flex: 1,
    gap: spacing[1],
  },
  accountLast4: {
    fontFamily: font.family.mono,
    fontSize: font.size.small,
    color: colors.ink[3],
  },
  // Empty / add rows
  emptyRow: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
  },
  emptyText: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
  },
  addRow: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
  },
  addLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.brand.terracotta,
    fontWeight: font.weight.medium,
  },
});
