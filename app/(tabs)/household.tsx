import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useHouseholdStore } from '../../src/store/household';
import { MemberAvatar, Money } from '../../src/ui/primitives';
import { SwipeableBillItem } from '../../src/ui/components/SwipeableBillItem';
import { SwipeableIncomeItem } from '../../src/ui/components/SwipeableIncomeItem';
import { NewBillSheet } from '../../src/ui/components/NewBillSheet';
import { NewIncomeSheet } from '../../src/ui/components/NewIncomeSheet';
import { ConfirmModal } from '../../src/ui/components/ConfirmModal';
import { useColors } from '../../src/ui/theme';
import { font, radius, spacing } from '../../src/ui/tokens';
import type { Colors } from '../../src/ui/tokens';
import type { Bill, Member, Transaction } from '../../src/domain/entities';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

// ─── Member tab content ───────────────────────────────────────────────────────

interface MemberPanelProps {
  member: Member;
}

function MemberPanel({ member }: MemberPanelProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  const household       = useHouseholdStore((s) => s.household);
  const today           = useHouseholdStore((s) => s.today);
  const addCashAccount  = useHouseholdStore((s) => s.addCashAccount);
  const removeCashAccount = useHouseholdStore((s) => s.removeCashAccount);
  const updateCashAccount = useHouseholdStore((s) => s.updateCashAccount);
  const updateBill      = useHouseholdStore((s) => s.updateBill);
  const deleteBill      = useHouseholdStore((s) => s.deleteBill);
  const deleteTransaction = useHouseholdStore((s) => s.deleteTransaction);

  const categories = household?.categories ?? [];
  const accounts   = (household?.cashAccounts ?? []).filter((a) => a.ownerId === member.id);

  const incomeTransactions = (household?.transactions ?? [])
    .filter((t) => t.kind === 'income' && t.byMemberId === member.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const [todayYear, todayMonth] = today.split('-').map(Number) as [number, number];
  const assignedBills = (household?.bills ?? []).filter((b) => {
    if (b.assigneeId !== member.id) return false;
    const [y, m] = b.due.split('-').map(Number) as [number, number];
    return y === todayYear && m === todayMonth;
  });

  const monthlyTotal = incomeTransactions
    .filter((t) => {
      const [y, m] = t.date.split('-').map(Number) as [number, number];
      return y === todayYear && m === todayMonth;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const [incomeSheetOpen,   setIncomeSheetOpen]   = useState(false);
  const [editingIncomeTx,   setEditingIncomeTx]   = useState<Transaction | null>(null);
  const [deletingIncomeTx,  setDeletingIncomeTx]  = useState<Transaction | null>(null);
  const [editBill,          setEditBill]          = useState<Bill | null>(null);
  const [deletingBill,      setDeletingBill]      = useState<Bill | null>(null);
  const [addingAccount,     setAddingAccount]     = useState(false);
  const [accountName,       setAccountName]       = useState('');
  const [editingAccount,    setEditingAccount]    = useState<{ id: string; name: string } | null>(null);
  const [pendingAccDelete,  setPendingAccDelete]  = useState<{ id: string; name: string } | null>(null);

  function handleSaveAccount() {
    if (!editingAccount) return;
    const name = editingAccount.name.trim();
    if (!name) return;
    updateCashAccount(editingAccount.id, name);
    setEditingAccount(null);
  }

  function handleAddAccount() {
    const trimmed = accountName.trim();
    if (!trimmed) return;
    addCashAccount({ name: trimmed, ownerId: member.id });
    setAccountName(''); setAddingAccount(false);
  }

  return (
    <>
      <NewIncomeSheet
        open={incomeSheetOpen}
        defaultMemberId={member.id}
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
        onConfirm={() => { if (deletingBill) deleteBill(deletingBill.id); setDeletingBill(null); }}
        onCancel={() => setDeletingBill(null)}
      />
      <ConfirmModal
        visible={deletingIncomeTx !== null}
        title={t('common.delete') + ' "' + (deletingIncomeTx?.name ?? '') + '"?'}
        message={t('common.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => { if (deletingIncomeTx) deleteTransaction(deletingIncomeTx.id); setDeletingIncomeTx(null); }}
        onCancel={() => setDeletingIncomeTx(null)}
      />
      <ConfirmModal
        visible={pendingAccDelete !== null}
        title={t('common.delete') + ' "' + (pendingAccDelete?.name ?? '') + '"?'}
        message={t('common.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => { if (pendingAccDelete) removeCashAccount(pendingAccDelete.id); setPendingAccDelete(null); }}
        onCancel={() => setPendingAccDelete(null)}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.panelContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Member kpi */}
          <View style={styles.memberKpi}>
            <Money value={monthlyTotal} variant="kpi" color={colors.ink[1]} />
            <Text style={styles.kpiLabel}>{t('member.monthlyIncome').toLowerCase()}</Text>
          </View>

          {/* Income */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEyebrow}>{t('member.recurringIncome').toUpperCase()}</Text>
              <Pressable hitSlop={8} onPress={() => { setEditingIncomeTx(null); setIncomeSheetOpen(true); }}>
                <Plus size={16} color={colors.ink[3]} strokeWidth={2} />
              </Pressable>
            </View>
            <View style={styles.card}>
              {incomeTransactions.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>{t('member.emptyIncomes', { name: member.name })}</Text>
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

          {/* Bills */}
          <View style={styles.section}>
            <Text style={styles.sectionEyebrowPad}>{t('member.billsAssigned').toUpperCase()}</Text>
            <View style={styles.card}>
              {assignedBills.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>{t('member.emptyBills', { name: member.name })}</Text>
                </View>
              ) : (
                assignedBills.map((bill, idx) => (
                  <View key={bill.id}>
                    {idx > 0 && <View style={styles.billSep} />}
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

          {/* Accounts */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionEyebrow}>{t('lar.setupItems.accounts').toUpperCase()}</Text>
              {!addingAccount && (
                <Pressable hitSlop={8} onPress={() => setAddingAccount(true)}>
                  <Plus size={16} color={colors.ink[3]} strokeWidth={2} />
                </Pressable>
              )}
            </View>
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
                        <Pressable style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.6 }]} onPress={() => setEditingAccount(null)}>
                          <Text style={styles.cancelLabel}>{t('common.cancel')}</Text>
                        </Pressable>
                        <Pressable style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.8 }]} onPress={handleSaveAccount}>
                          <Text style={styles.confirmLabel}>{t('common.save')}</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      style={({ pressed }) => [styles.accountRow, pressed && styles.rowPressed]}
                      onPress={() => setEditingAccount({ id: account.id, name: account.name })}
                    >
                      <View style={styles.accountInfo}>
                        <Text style={styles.accountName}>{account.name}</Text>
                      </View>
                      <View style={styles.rowActions}>
                        <Pencil size={14} color={colors.ink[4]} strokeWidth={2} />
                        <Pressable
                          style={({ pressed }) => [styles.trashBtn, pressed && { opacity: 0.5 }]}
                          onPress={() => setPendingAccDelete({ id: account.id, name: account.name })}
                          hitSlop={8}
                        >
                          <Trash2 size={14} color={colors.ink[4]} strokeWidth={2} />
                        </Pressable>
                      </View>
                    </Pressable>
                  )}
                </View>
              ))}
              {addingAccount && (
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
                      <Pressable style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.6 }]} onPress={() => { setAddingAccount(false); setAccountName(''); }}>
                        <Text style={styles.cancelLabel}>{t('common.cancel')}</Text>
                      </Pressable>
                      <Pressable style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.8 }]} onPress={handleAddAccount}>
                        <Text style={styles.confirmLabel}>{t('common.add')}</Text>
                      </Pressable>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HouseholdScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const styles = makeStyles(colors);

  const household       = useHouseholdStore((s) => s.household);
  const members         = household?.members ?? [];

  const [activeId,     setActiveId]     = useState<string>(() => members[0]?.id ?? '');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const triggerRef = useRef<View>(null);
  const [dropdownY, setDropdownY] = useState(0);
  const [dropdownX, setDropdownX] = useState(0);
  const [dropdownW, setDropdownW] = useState(0);

  const activeMember = members.find((m) => m.id === activeId) ?? members[0];
  const showSelect   = members.length > 1;

  function openDropdown() {
    triggerRef.current?.measure((_fx, _fy, w, h, px, py) => {
      setDropdownX(px);
      setDropdownY(py + h + 4);
      setDropdownW(w);
      setDropdownOpen(true);
    });
  }

  function selectMember(id: string) {
    setActiveId(id);
    setDropdownOpen(false);
  }

  return (
    <View style={styles.safe}>
      {/* ── Page header ── */}
      <View style={styles.pageHeader}>
        <Text style={styles.eyebrow}>{t('lar.eyebrow').toUpperCase()}</Text>
        <View style={styles.nameRow}>
          <Text style={styles.householdName}>{household?.name ?? ''}</Text>
          {showSelect && (
            <Pressable
              ref={triggerRef}
              style={({ pressed }) => [styles.memberSelect, pressed && { opacity: 0.7 }]}
              onPress={openDropdown}
            >
              {activeMember && <MemberAvatar member={activeMember} size="sm" />}
              <Text style={styles.memberSelectLabel} numberOfLines={1}>
                {activeMember?.name ?? ''}
              </Text>
              <ChevronDown size={14} color={colors.ink[3]} strokeWidth={2} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Dropdown ── */}
      <Modal
        visible={dropdownOpen}
        transparent
        animationType="none"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <Pressable style={styles.dropdownBackdrop} onPress={() => setDropdownOpen(false)}>
          <View style={[styles.dropdownMenu, { top: dropdownY, left: dropdownX, minWidth: dropdownW }]}>
            {members.map((m, idx) => (
              <View key={m.id}>
                {idx > 0 && <View style={styles.dropdownDivider} />}
                <Pressable
                  style={({ pressed }) => [styles.dropdownItem, pressed && { backgroundColor: colors.background.surfaceSoft }]}
                  onPress={() => selectMember(m.id)}
                >
                  <MemberAvatar member={m} size="sm" />
                  <Text style={[styles.dropdownItemLabel, m.id === activeId && styles.dropdownItemLabelActive]}>
                    {m.name}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ── Active member content ── */}
      {activeMember && <MemberPanel key={activeMember.id} member={activeMember} />}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: Colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  pageHeader: {
    paddingHorizontal: spacing[7],
    paddingTop: spacing[6],
    paddingBottom: spacing[5],
    gap: spacing[2],
  },
  eyebrow: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    letterSpacing: font.letterSpacing.eyebrow,
    color: colors.ink[4],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  householdName: {
    fontFamily: font.family.sans,
    fontSize: font.size.h1,
    fontWeight: font.weight.medium,
    color: colors.ink[1],
    letterSpacing: font.letterSpacing.h1,
    flex: 1,
  },
  memberSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.pill,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    backgroundColor: colors.background.surface,
  },
  memberSelectLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[2],
    fontWeight: font.weight.medium,
    maxWidth: 120,
  },
  // Dropdown
  dropdownBackdrop: {
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    backgroundColor: colors.background.surface,
    borderRadius: radius.large,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  dropdownItemLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[2],
  },
  dropdownItemLabelActive: {
    color: colors.brand.terracotta,
    fontWeight: font.weight.medium,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: colors.border.divider,
  },
  // Panel content
  panelContent: {
    paddingBottom: spacing[10],
    gap: spacing[8],
  },
  memberKpi: {
    alignItems: 'center',
    paddingTop: spacing[4],
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
  section: { gap: spacing[3] },
  sectionTitleRow: {
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
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    letterSpacing: font.letterSpacing.eyebrow,
    color: colors.ink[3],
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
  billSep: {
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
  rowPressed: { opacity: 0.6 },
  incomeInfo: { flex: 1, gap: spacing[2] },
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
  incomeDate: {
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
  accountInfo: { flex: 1, gap: spacing[1] },
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
  trashBtn: { padding: spacing[1] },
  // Forms
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
  cancelBtn: { paddingHorizontal: spacing[4], paddingVertical: spacing[2] },
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
  emptyRow: { paddingHorizontal: spacing[5], paddingVertical: spacing[5] },
  emptyText: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
    lineHeight: font.size.small * 1.5,
  },
});
