import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useHouseholdStore } from '../../src/store/household';
import { MemberAvatar, Money } from '../../src/ui/primitives';
import { SwipeableBillItem } from '../../src/ui/components/SwipeableBillItem';
import { SwipeableIncomeItem } from '../../src/ui/components/SwipeableIncomeItem';
import { NewBillSheet } from '../../src/ui/components/NewBillSheet';
import { NewIncomeSheet } from '../../src/ui/components/NewIncomeSheet';
import { ConfirmModal } from '../../src/ui/components/ConfirmModal';
import { font, radius, spacing } from '../../src/ui/tokens';
import type { Colors } from '../../src/ui/tokens';
import { useColors } from '../../src/ui/theme';
import type { Bill, Transaction } from '../../src/domain/entities';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const household = useHouseholdStore((s) => s.household);
  const today = useHouseholdStore((s) => s.today);
  const addCashAccount    = useHouseholdStore((s) => s.addCashAccount);
  const removeCashAccount = useHouseholdStore((s) => s.removeCashAccount);
  const updateCashAccount = useHouseholdStore((s) => s.updateCashAccount);
  const updateBill        = useHouseholdStore((s) => s.updateBill);
  const deleteBill        = useHouseholdStore((s) => s.deleteBill);
  const deleteTransaction = useHouseholdStore((s) => s.deleteTransaction);

  const member = household?.members.find((m) => m.id === id);
  const categories = household?.categories ?? [];

  const incomeTransactions = (household?.transactions ?? [])
    .filter((t) => t.kind === 'income' && t.byMemberId === id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const accounts = (household?.cashAccounts ?? []).filter((a) => a.ownerId === id);

  const [todayYear, todayMonth] = today.split('-').map(Number) as [number, number];
  const assignedBills = (household?.bills ?? []).filter((b) => {
    if (b.assigneeId !== id) return false;
    const [y, m] = b.due.split('-').map(Number) as [number, number];
    return y === todayYear && m === todayMonth;
  });

  const monthlyTotal = incomeTransactions
    .filter((t) => {
      const [y, m] = t.date.split('-').map(Number) as [number, number];
      return y === todayYear && m === todayMonth;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Account add form state
  const [addingAccount, setAddingAccount] = useState(false);
  const [accountName, setAccountName] = useState('');

  // Edit form state
  const [editingAccount, setEditingAccount] = useState<{ id: string; name: string } | null>(null);

  // Delete confirmation state
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  // Income sheet state
  const [incomeSheetOpen,  setIncomeSheetOpen]  = useState(false);
  const [editingIncomeTx,  setEditingIncomeTx]  = useState<Transaction | null>(null);
  const [deletingIncomeTx, setDeletingIncomeTx] = useState<Transaction | null>(null);

  // Bill edit/delete state
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);

  function handleSaveAccount() {
    if (!editingAccount) return;
    const name = editingAccount.name.trim();
    if (!name) return;
    updateCashAccount(editingAccount.id, name);
    setEditingAccount(null);
  }

  function handleAddAccount() {
    const trimmed = accountName.trim();
    if (!trimmed || !id) return;
    addCashAccount({ name: trimmed, ownerId: id });
    setAccountName('');
    setAddingAccount(false);
  }

  if (!member) return null;

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <NewIncomeSheet
        open={incomeSheetOpen}
        defaultMemberId={id ?? ''}
        editTransaction={editingIncomeTx ?? undefined}
        onClose={() => { setIncomeSheetOpen(false); setEditingIncomeTx(null); }}
      />
      <NewBillSheet
        open={editBill !== null}
        bill={editBill ?? undefined}
        onClose={() => setEditBill(null)}
      />
      <ConfirmModal
        visible={deletingBill !== null}
        title={t('addSheet.newBill.deleteBill')}
        message={t('common.deleteConfirm')}
        confirmLabel={t('addSheet.newBill.deleteBill')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          if (deletingBill) deleteBill(deletingBill.id);
          setDeletingBill(null);
        }}
        onCancel={() => setDeletingBill(null)}
      />
      <ConfirmModal
        visible={pendingDelete !== null}
        title={t('common.delete') + ' "' + (pendingDelete?.name ?? '') + '"?'}
        message={t('common.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          if (pendingDelete) removeCashAccount(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
      <ConfirmModal
        visible={deletingIncomeTx !== null}
        title={t('common.delete') + ' "' + (deletingIncomeTx?.name ?? '') + '"?'}
        message={t('common.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          if (deletingIncomeTx) deleteTransaction(deletingIncomeTx.id);
          setDeletingIncomeTx(null);
        }}
        onCancel={() => setDeletingIncomeTx(null)}
      />
      {/* Back button */}
      <Pressable
        style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
        onPress={() => router.back()}
        accessibilityRole="button"
      >
        <ChevronLeft size={20} color={colors.ink[2]} strokeWidth={2} />
        <Text style={styles.backLabel}>{t('lar.members')}</Text>
      </Pressable>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing[10] }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <MemberAvatar member={member} size="lg" />
          <Text style={styles.name}>{member.name}</Text>
          <View style={styles.kpiRow}>
            <Money value={monthlyTotal} variant="kpi" color={colors.ink[1]} />
            <Text style={styles.kpiLabel}>{t('member.monthlyIncome').toLowerCase()}</Text>
          </View>
        </View>

        {/* ── Income history ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>{t('member.recurringIncome').toUpperCase()}</Text>
            <Pressable
              hitSlop={8}
              onPress={() => setIncomeSheetOpen(true)}
            >
              <Plus size={16} color={colors.ink[3]} strokeWidth={2} />
            </Pressable>
          </View>
          <View style={styles.card}>
            {incomeTransactions.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>
                  {t('member.emptyIncomes', { name: member.name })}
                </Text>
              </View>
            ) : (
              incomeTransactions.map((tx, idx) => (
                <View key={tx.id}>
                  {idx > 0 && <View style={styles.separator} />}
                  <SwipeableIncomeItem
                    transaction={tx}
                    accounts={household?.cashAccounts ?? []}
                    categories={categories}
                    onEdit={() => { setEditingIncomeTx(tx); setIncomeSheetOpen(true); }}
                    onDelete={() => setDeletingIncomeTx(tx)}
                  />
                </View>
              ))
            )}
          </View>
        </View>

        {/* ── Assigned bills (this month) ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionEyebrow, styles.sectionEyebrowPad]}>{t('member.billsAssigned').toUpperCase()}</Text>
          <View style={styles.card}>
            {assignedBills.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>
                  {t('member.emptyBills', { name: member.name })}
                </Text>
              </View>
            ) : (
              assignedBills.map((bill, idx) => (
                <View key={bill.id}>
                  {idx > 0 && <View style={styles.billSeparator} />}
                  <SwipeableBillItem
                    bill={bill}
                    categories={categories}
                    today={today}
                    assignee={member}
                    onEdit={() => setEditBill(bill)}
                    onPay={() => bill.paidAt
                      ? updateBill(bill.id, { paidAt: null, paidAmount: null, paidFromAccountId: null })
                      : updateBill(bill.id, { paidAt: today, paidAmount: bill.amount ?? bill.estimate ?? 0, paidFromAccountId: null })
                    }
                    onDelete={() => setDeletingBill(bill)}
                  />
                </View>
              ))
            )}
          </View>
        </View>

        {/* ── Cash accounts ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionEyebrow, styles.sectionEyebrowPad]}>{t('lar.setupItems.accounts').toUpperCase()}</Text>
          <View style={styles.card}>
            {accounts.map((account, idx) => (
              <View key={account.id}>
                {idx > 0 && <View style={styles.separator} />}
                {editingAccount?.id === account.id ? (
                  <View style={styles.editForm}>
                    <TextInput
                      style={styles.addInput}
                      placeholder={t('setup.accounts.namePlaceholder')}
                      placeholderTextColor={colors.ink[4]}
                      value={editingAccount.name}
                      onChangeText={(v) => setEditingAccount({ ...editingAccount, name: v })}
                      autoFocus
                      returnKeyType="done"
                      autoCapitalize="words"
                      onSubmitEditing={handleSaveAccount}
                    />
                    <View style={styles.formActions}>
                      <Pressable
                        style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.6 }]}
                        onPress={() => setEditingAccount(null)}
                      >
                        <Text style={styles.cancelLabel}>{t('common.cancel')}</Text>
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.8 }]}
                        onPress={handleSaveAccount}
                      >
                        <Text style={styles.confirmLabel}>{t('common.save')}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [styles.accountRow, pressed && styles.rowPressed]}
                    onPress={() => setEditingAccount({ id: account.id, name: account.name })}
                    accessibilityRole="button"
                  >
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{account.name}</Text>
                    </View>
                    <View style={styles.rowActions}>
                      <Pencil size={14} color={colors.ink[4]} strokeWidth={2} />
                      <Pressable
                        style={({ pressed }) => [styles.trashBtn, pressed && { opacity: 0.5 }]}
                        onPress={() => setPendingDelete({ id: account.id, name: account.name })}
                        accessibilityRole="button"
                        hitSlop={8}
                      >
                        <Trash2 size={14} color={colors.ink[4]} strokeWidth={2} />
                      </Pressable>
                    </View>
                  </Pressable>
                )}
              </View>
            ))}

            {addingAccount ? (
              <>
                {accounts.length > 0 && <View style={styles.separator} />}
                <View style={styles.editForm}>
                  <TextInput
                    style={styles.addInput}
                    placeholder={t('setup.accounts.namePlaceholder')}
                    placeholderTextColor={colors.ink[4]}
                    value={accountName}
                    onChangeText={setAccountName}
                    autoFocus
                    returnKeyType="done"
                    autoCapitalize="words"
                    onSubmitEditing={handleAddAccount}
                  />
                  <View style={styles.formActions}>
                    <Pressable
                      style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.6 }]}
                      onPress={() => { setAddingAccount(false); setAccountName(''); }}
                    >
                      <Text style={styles.cancelLabel}>{t('common.cancel')}</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.8 }]}
                      onPress={handleAddAccount}
                    >
                      <Text style={styles.confirmLabel}>{t('common.add')}</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : (
              <>
                {accounts.length > 0 && <View style={styles.separator} />}
                <Pressable
                  style={({ pressed }) => [styles.addRow, pressed && { opacity: 0.6 }]}
                  onPress={() => setAddingAccount(true)}
                  accessibilityRole="button"
                >
                  <Plus size={14} color={colors.brand.terracotta} strokeWidth={2.5} />
                  <Text style={styles.addLabel}>{t('setup.accounts.newBtn')}</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: Colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  backBtnPressed: {
    opacity: 0.6,
  },
  backLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[2],
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing[8],
  },
  // Header
  header: {
    alignItems: 'center',
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
    gap: spacing[4],
  },
  name: {
    fontFamily: font.family.sans,
    fontSize: font.size.h1,
    fontWeight: font.weight.medium,
    color: colors.ink[1],
    letterSpacing: font.letterSpacing.h1,
  },
  kpiRow: {
    alignItems: 'center',
    gap: spacing[2],
  },
  kpiLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  // Sections
  section: {
    gap: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[7],
  },
  sectionEyebrow: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    letterSpacing: font.letterSpacing.eyebrow,
    color: colors.ink[3],
  },
  sectionEyebrowPad: {
    paddingHorizontal: spacing[7],
  },
  card: {
    marginHorizontal: spacing[7],
    backgroundColor: colors.background.surface,
    borderRadius: radius.large,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.divider,
    marginLeft: spacing[5],
  },
  billSeparator: {
    height: 1,
    backgroundColor: colors.border.divider,
  },
  // Income row
  incomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    gap: spacing[4],
  },
  incomeInfo: {
    flex: 1,
    gap: spacing[2],
  },
  incomeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  incomeName: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  incomeSchedule: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[4],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
  },
  // Account row
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    gap: spacing[4],
  },
  rowPressed: {
    opacity: 0.6,
  },
  accountInfo: {
    flex: 1,
    gap: spacing[1],
  },
  accountName: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  accountLast4: {
    fontFamily: font.family.mono,
    fontSize: font.size.small,
    color: colors.ink[3],
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  trashBtn: {
    padding: spacing[1],
  },
  // Edit / add forms
  editForm: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    gap: spacing[4],
    backgroundColor: colors.background.surfaceSoft,
  },
  addInput: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
    borderWidth: 1,
    borderColor: colors.border.emphasis,
    borderRadius: radius.medium,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.background.surface,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[3],
  },
  cancelBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  cancelLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
  },
  confirmBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.brand.terracotta,
    borderRadius: radius.pill,
  },
  confirmLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    fontWeight: font.weight.medium,
    color: colors.background.surface,
  },
  // Add row
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
  },
  addLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.brand.terracotta,
    fontWeight: font.weight.medium,
  },
  // Empty state
  emptyRow: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
  },
  emptyText: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
    lineHeight: font.size.small * 1.5,
  },
});
