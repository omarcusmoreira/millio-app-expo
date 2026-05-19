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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Pencil, Trash2, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../src/store/auth';
import { useHouseholdStore } from '../src/store/household';
import { Avatar, CategoryChip } from '../src/ui/primitives';
import { ConfirmModal } from '../src/ui/components/ConfirmModal';
import { colors, font, radius, spacing } from '../src/ui/tokens';
import type { ColorToken } from '../src/ui/tokens';

// ─── Constants ────────────────────────────────────────────────────────────────

const CAT_COLORS = [
  '#C4714A', '#5C7C9A', '#7A5D9F', '#4A7A6B',
  '#9F6244', '#B85C82', '#8B6F47', '#4A6FA8',
];

const MEMBER_COLORS: { token: ColorToken; hex: string }[] = [
  { token: 'terracotta', hex: '#C26B4D' },
  { token: 'olive',      hex: '#6F7A4F' },
  { token: 'grey',       hex: '#998C7A' },
];

const AVATAR_COLORS = [
  '#FFB3BA', '#FFD4B3', '#FFF3B3', '#D4F0B3',
  '#B3F0D4', '#B3E8F5', '#B3C9F5', '#C9B3F5',
  '#F5B3E8', '#F5B3C9', '#F5C9B3', '#E8F5B3',
  '#B3F5C9', '#B3D4F5', '#D4B3F5', '#F5D4B3',
];

// ─── Small shared components ──────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionHeader}>{label.toUpperCase()}</Text>;
}

function EmptyRow({ text }: { text: string }) {
  return (
    <View style={styles.emptyRow}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

interface InlineFormProps {
  nameValue: string;
  onNameChange: (v: string) => void;
  namePlaceholder: string;
  keyboardType?: 'default' | 'email-address';
  color?: string;
  onColorChange?: (c: string) => void;
  memberColor?: ColorToken;
  onMemberColorChange?: (c: ColorToken) => void;
  saveLabel: string;
  onSave: () => void;
  onCancel: () => void;
  cancelLabel: string;
  autoFocus?: boolean;
}

function InlineForm({
  nameValue, onNameChange, namePlaceholder, keyboardType = 'default',
  color, onColorChange,
  memberColor, onMemberColorChange,
  saveLabel, onSave, onCancel, cancelLabel, autoFocus = true,
}: InlineFormProps) {
  return (
    <View style={styles.addForm}>
      <TextInput
        style={styles.addInput}
        placeholder={namePlaceholder}
        placeholderTextColor={colors.ink[4]}
        value={nameValue}
        onChangeText={onNameChange}
        autoFocus={autoFocus}
        returnKeyType="done"
        onSubmitEditing={onSave}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        keyboardType={keyboardType}
      />
      {color !== undefined && onColorChange !== undefined && (
        <View style={styles.colorPicker}>
          {CAT_COLORS.map((c) => (
            <Pressable
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
              onPress={() => onColorChange(c)}
            />
          ))}
        </View>
      )}
      {memberColor !== undefined && onMemberColorChange !== undefined && (
        <View style={styles.colorPicker}>
          {MEMBER_COLORS.map(({ token, hex }) => (
            <Pressable
              key={token}
              style={[styles.colorDot, { backgroundColor: hex }, memberColor === token && styles.colorDotSelected]}
              onPress={() => onMemberColorChange(token)}
            />
          ))}
        </View>
      )}
      <View style={styles.formActions}>
        <Pressable
          style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.6 }]}
          onPress={onCancel}
        >
          <Text style={styles.cancelLabel}>{cancelLabel}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.8 }]}
          onPress={onSave}
        >
          <Text style={styles.confirmLabel}>{saveLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  // ── Auth / profile ──
  const authName        = useAuthStore((s) => s.name);
  const authEmail       = useAuthStore((s) => s.email);
  const authBirthdate   = useAuthStore((s) => s.birthdate);
  const currentMemberId = useAuthStore((s) => s.currentMemberId);
  const avatarColor     = useAuthStore((s) => s.avatarColor);
  const setAuthName     = useAuthStore((s) => s.setName);
  const setAuthEmail    = useAuthStore((s) => s.setEmail);
  const setBirthdate    = useAuthStore((s) => s.setBirthdate);
  const setAvatarColor  = useAuthStore((s) => s.setAvatarColor);

  const [pickingAvatarColor, setPickingAvatarColor] = useState(false);

  type ProfileField = 'name' | 'email' | 'birthdate';
  const [editingProfileField, setEditingProfileField] = useState<ProfileField | null>(null);
  const [profileDraft, setProfileDraft] = useState('');

  function startEditProfile(field: ProfileField) {
    setProfileDraft(field === 'name' ? authName : field === 'email' ? authEmail : authBirthdate);
    setEditingProfileField(field);
  }

  function saveProfile() {
    const v = profileDraft.trim();
    if (editingProfileField === 'name' && v) setAuthName(v);
    else if (editingProfileField === 'email' && v) setAuthEmail(v);
    else if (editingProfileField === 'birthdate') setBirthdate(v);
    setEditingProfileField(null);
  }

  // ── Household ──
  const household           = useHouseholdStore((s) => s.household);
  const updateHouseholdName = useHouseholdStore((s) => s.updateHouseholdName);
  const removeMember = useHouseholdStore((s) => s.removeMember);

  const [editingHouseholdName, setEditingHouseholdName] = useState(false);
  const [householdNameDraft,   setHouseholdNameDraft]   = useState('');

  function startEditHouseholdName() {
    setHouseholdNameDraft(household?.name ?? '');
    setEditingHouseholdName(true);
  }

  function saveHouseholdName() {
    const v = householdNameDraft.trim();
    if (v) updateHouseholdName(v);
    setEditingHouseholdName(false);
  }


  // ── Categories ──
  const addCategory    = useHouseholdStore((s) => s.addCategory);
  const removeCategory = useHouseholdStore((s) => s.removeCategory);
  const updateCategory = useHouseholdStore((s) => s.updateCategory);
  const addLabel       = useHouseholdStore((s) => s.addLabel);
  const removeLabel    = useHouseholdStore((s) => s.removeLabel);
  const updateLabel    = useHouseholdStore((s) => s.updateLabel);

  const isOwner       = household?.ownerId === currentMemberId;
  const categories    = household?.categories ?? [];
  const labels        = household?.labels ?? [];
  const members       = (household?.members ?? []).filter((m) => m.id !== currentMemberId);

  const [addingCat,   setAddingCat]   = useState(false);
  const [newCatName,  setNewCatName]  = useState('');
  const [newCatColor, setNewCatColor] = useState(CAT_COLORS[0]!);

  const [addingLabel,  setAddingLabel]  = useState(false);
  const [newLabelName, setNewLabelName] = useState('');

  const [editingCat,   setEditingCat]   = useState<{ id: string; name: string; color: string } | null>(null);
  const [editingLabel, setEditingLabel] = useState<{ id: string; name: string } | null>(null);

  type PendingDelete =
    | { kind: 'category'; id: string; name: string }
    | { kind: 'label';    id: string; name: string }
    | { kind: 'member';   id: string; name: string };
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  function handleAddCategory() {
    const name = newCatName.trim();
    if (!name) return;
    addCategory(name, newCatColor);
    setNewCatName(''); setNewCatColor(CAT_COLORS[0]!); setAddingCat(false);
  }

  function handleSaveCategory() {
    if (!editingCat) return;
    const name = editingCat.name.trim();
    if (!name) return;
    updateCategory(editingCat.id, name, editingCat.color);
    setEditingCat(null);
  }

  function handleAddLabel() {
    const name = newLabelName.trim();
    if (!name) return;
    addLabel(name);
    setNewLabelName(''); setAddingLabel(false);
  }

  function handleSaveLabel() {
    if (!editingLabel) return;
    const name = editingLabel.name.trim();
    if (!name) return;
    updateLabel(editingLabel.id, name);
    setEditingLabel(null);
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.kind === 'category') removeCategory(pendingDelete.id);
    else if (pendingDelete.kind === 'label') removeLabel(pendingDelete.id);
    else if (pendingDelete.kind === 'member') removeMember(pendingDelete.id);
    setPendingDelete(null);
  }

  const profileInitial = authName.trim()[0]?.toUpperCase() ?? '?';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ConfirmModal
        visible={pendingDelete !== null}
        title={`${t('common.delete')} "${pendingDelete?.name ?? ''}"`}
        message={t('common.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Page header ── */}
          <View style={styles.pageHeader}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
              onPress={() => router.back()}
              accessibilityRole="button"
            >
              <ChevronLeft size={20} color={colors.ink[2]} strokeWidth={2} />
            </Pressable>
            <Text style={styles.pageTitle}>{t('settings.title')}</Text>
          </View>

          {/* ── Profile ── */}
          <View style={styles.section}>
            <SectionHeader label={t('settings.profile.heading')} />
            <View style={styles.card}>
              {/* Avatar + name header */}
              <View style={styles.profileHeader}>
                <Pressable
                  onPress={() => setPickingAvatarColor((v) => !v)}
                  style={({ pressed }) => [pressed && { opacity: 0.75 }]}
                  accessibilityRole="button"
                >
                  <Avatar
                    initial={profileInitial}
                    color="terracotta"
                    size="lg"
                    bgHex={avatarColor}
                  />
                </Pressable>
                <Text style={styles.profileName}>{authName || '—'}</Text>
              </View>
              {pickingAvatarColor && (
                <View style={styles.avatarColorPicker}>
                  {AVATAR_COLORS.map((hex) => (
                    <Pressable
                      key={hex}
                      style={[
                        styles.avatarColorDot,
                        { backgroundColor: hex },
                        avatarColor === hex && styles.avatarColorDotSelected,
                      ]}
                      onPress={() => { setAvatarColor(hex); setPickingAvatarColor(false); }}
                    />
                  ))}
                </View>
              )}
              <View style={styles.separator} />

              {/* Name row */}
              {editingProfileField === 'name' ? (
                <InlineForm
                  nameValue={profileDraft}
                  onNameChange={setProfileDraft}
                  namePlaceholder={t('settings.profile.namePlaceholder')}
                  saveLabel={t('common.save')}
                  cancelLabel={t('common.cancel')}
                  onSave={saveProfile}
                  onCancel={() => setEditingProfileField(null)}
                />
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.profileRow, pressed && styles.rowPressed]}
                  onPress={() => startEditProfile('name')}
                >
                  <Text style={styles.profileRowLabel}>{t('settings.profile.name')}</Text>
                  <Text style={styles.profileRowValue} numberOfLines={1}>{authName || '—'}</Text>
                  <Pencil size={14} color={colors.ink[4]} strokeWidth={2} />
                </Pressable>
              )}

              <View style={styles.separator} />

              {/* Email row */}
              {editingProfileField === 'email' ? (
                <InlineForm
                  nameValue={profileDraft}
                  onNameChange={setProfileDraft}
                  namePlaceholder={t('settings.profile.email')}
                  keyboardType="email-address"
                  saveLabel={t('common.save')}
                  cancelLabel={t('common.cancel')}
                  onSave={saveProfile}
                  onCancel={() => setEditingProfileField(null)}
                />
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.profileRow, pressed && styles.rowPressed]}
                  onPress={() => startEditProfile('email')}
                >
                  <Text style={styles.profileRowLabel}>{t('settings.profile.email')}</Text>
                  <Text style={styles.profileRowValue} numberOfLines={1}>{authEmail || '—'}</Text>
                  <Pencil size={14} color={colors.ink[4]} strokeWidth={2} />
                </Pressable>
              )}

              <View style={styles.separator} />

              {/* Birthdate row */}
              {editingProfileField === 'birthdate' ? (
                <InlineForm
                  nameValue={profileDraft}
                  onNameChange={setProfileDraft}
                  namePlaceholder={t('settings.profile.birthdatePlaceholder')}
                  keyboardType="default"
                  saveLabel={t('common.save')}
                  cancelLabel={t('common.cancel')}
                  onSave={saveProfile}
                  onCancel={() => setEditingProfileField(null)}
                  autoFocus
                />
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.profileRow, pressed && styles.rowPressed]}
                  onPress={() => startEditProfile('birthdate')}
                >
                  <Text style={styles.profileRowLabel}>{t('settings.profile.birthdate')}</Text>
                  <Text style={styles.profileRowValue}>{authBirthdate || '—'}</Text>
                  <Pencil size={14} color={colors.ink[4]} strokeWidth={2} />
                </Pressable>
              )}
            </View>
          </View>

          {/* ── Household ── */}
          <View style={styles.section}>
            <SectionHeader label={t('settings.household.heading')} />
            <View style={styles.card}>
              {/* Household name */}
              {editingHouseholdName ? (
                <InlineForm
                  nameValue={householdNameDraft}
                  onNameChange={setHouseholdNameDraft}
                  namePlaceholder={t('settings.household.householdNamePlaceholder')}
                  saveLabel={t('common.save')}
                  cancelLabel={t('common.cancel')}
                  onSave={saveHouseholdName}
                  onCancel={() => setEditingHouseholdName(false)}
                />
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.profileRow, pressed && styles.rowPressed]}
                  onPress={startEditHouseholdName}
                >
                  <Text style={styles.profileRowLabel}>{t('settings.household.householdName')}</Text>
                  <Text style={styles.profileRowValue} numberOfLines={1}>{household?.name || '—'}</Text>
                  <Pencil size={14} color={colors.ink[4]} strokeWidth={2} />
                </Pressable>
              )}

              {/* Invite */}
              <View style={styles.separatorFull} />
              <Pressable
                style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
                onPress={() => router.push('/(onboarding)/setup-household-invite?from=settings' as never)}
              >
                <View style={styles.actionRowText}>
                  <Text style={styles.actionRowTitle}>{t('settings.household.invite')}</Text>
                  <Text style={styles.actionRowSub}>{t('settings.household.inviteSub')}</Text>
                </View>
                <ChevronRight size={16} color={colors.ink[4]} strokeWidth={2} />
              </Pressable>

              {/* Join */}
              <View style={styles.separatorFull} />
              <Pressable
                style={({ pressed }) => [styles.actionRow, pressed && styles.rowPressed]}
                onPress={() => router.push('/(onboarding)/setup-household-join?from=settings' as never)}
              >
                <View style={styles.actionRowText}>
                  <Text style={styles.actionRowTitle}>{t('settings.household.join')}</Text>
                  <Text style={styles.actionRowSub}>{t('settings.household.joinSub')}</Text>
                </View>
                <ChevronRight size={16} color={colors.ink[4]} strokeWidth={2} />
              </Pressable>

              {/* Members */}
              <View style={styles.separatorFull} />
              <Text style={styles.subSectionLabel}>{t('settings.household.members').toUpperCase()}</Text>

              {members.map((member, idx) => (
                <View key={member.id}>
                  {idx > 0 && <View style={styles.separatorFull} />}
                  <View style={styles.itemRow}>
                    <Avatar initial={member.initial} color={member.color} size="sm" />
                    <Text style={styles.itemName}>{member.name}</Text>
                    {isOwner && (
                      <Pressable
                        style={({ pressed }) => [styles.trashBtn, pressed && { opacity: 0.5 }]}
                        onPress={() => setPendingDelete({ kind: 'member', id: member.id, name: member.name })}
                        hitSlop={8}
                      >
                        <Trash2 size={14} color={colors.ink[4]} strokeWidth={2} />
                      </Pressable>
                    )}
                  </View>
                </View>
              ))}

            </View>
          </View>

          {/* ── Categories ── */}
          <View style={styles.section}>
            <SectionHeader label={t('lar.setupItems.categories')} />
            <View style={styles.card}>
              {categories.length === 0 && !addingCat && (
                <EmptyRow text={t('setup.categories.subtitle')} />
              )}

              {categories.map((cat, index) => (
                <View key={cat.id}>
                  {index > 0 && <View style={styles.separator} />}
                  {editingCat?.id === cat.id ? (
                    <InlineForm
                      nameValue={editingCat.name}
                      onNameChange={(v) => setEditingCat({ ...editingCat, name: v })}
                      namePlaceholder={t('setup.categories.namePlaceholder')}
                      color={editingCat.color}
                      onColorChange={(c) => setEditingCat({ ...editingCat, color: c })}
                      saveLabel={t('common.save')}
                      cancelLabel={t('common.cancel')}
                      onSave={handleSaveCategory}
                      onCancel={() => setEditingCat(null)}
                    />
                  ) : (
                    <Pressable
                      style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed]}
                      onPress={() => setEditingCat({ id: cat.id, name: cat.name, color: cat.color })}
                      accessibilityRole="button"
                    >
                      <CategoryChip name={cat.name} color={cat.color} />
                      <View style={styles.rowActions}>
                        <Pencil size={14} color={colors.ink[4]} strokeWidth={2} />
                        <Pressable
                          style={({ pressed }) => [styles.trashBtn, pressed && { opacity: 0.5 }]}
                          onPress={() => setPendingDelete({ kind: 'category', id: cat.id, name: cat.name })}
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

              {addingCat ? (
                <>
                  {categories.length > 0 && <View style={styles.separator} />}
                  <InlineForm
                    nameValue={newCatName}
                    onNameChange={setNewCatName}
                    namePlaceholder={t('setup.categories.namePlaceholder')}
                    color={newCatColor}
                    onColorChange={setNewCatColor}
                    saveLabel={t('common.add')}
                    cancelLabel={t('common.cancel')}
                    onSave={handleAddCategory}
                    onCancel={() => { setAddingCat(false); setNewCatName(''); }}
                  />
                </>
              ) : (
                <>
                  {categories.length > 0 && <View style={styles.separator} />}
                  <Pressable
                    style={({ pressed }) => [styles.addRow, pressed && { opacity: 0.6 }]}
                    onPress={() => { setEditingCat(null); setAddingCat(true); }}
                  >
                    <Plus size={14} color={colors.brand.terracotta} strokeWidth={2.5} />
                    <Text style={styles.addRowLabel}>{t('setup.categories.newBtn')}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* ── Labels ── */}
          <View style={styles.section}>
            <SectionHeader label={t('lar.setupItems.labels')} />
            <View style={styles.card}>
              {labels.length === 0 && !addingLabel && (
                <EmptyRow text={t('setup.labels.subtitle')} />
              )}

              {labels.map((label, index) => (
                <View key={label.id}>
                  {index > 0 && <View style={styles.separator} />}
                  {editingLabel?.id === label.id ? (
                    <InlineForm
                      nameValue={editingLabel.name}
                      onNameChange={(v) => setEditingLabel({ ...editingLabel, name: v })}
                      namePlaceholder={t('setup.labels.namePlaceholder')}
                      saveLabel={t('common.save')}
                      cancelLabel={t('common.cancel')}
                      onSave={handleSaveLabel}
                      onCancel={() => setEditingLabel(null)}
                    />
                  ) : (
                    <Pressable
                      style={({ pressed }) => [styles.itemRow, pressed && styles.rowPressed]}
                      onPress={() => setEditingLabel({ id: label.id, name: label.name })}
                      accessibilityRole="button"
                    >
                      <Text style={styles.itemName}>{label.name}</Text>
                      <View style={styles.rowActions}>
                        <Pencil size={14} color={colors.ink[4]} strokeWidth={2} />
                        <Pressable
                          style={({ pressed }) => [styles.trashBtn, pressed && { opacity: 0.5 }]}
                          onPress={() => setPendingDelete({ kind: 'label', id: label.id, name: label.name })}
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

              {addingLabel ? (
                <>
                  {labels.length > 0 && <View style={styles.separator} />}
                  <InlineForm
                    nameValue={newLabelName}
                    onNameChange={setNewLabelName}
                    namePlaceholder={t('setup.labels.namePlaceholder')}
                    saveLabel={t('common.add')}
                    cancelLabel={t('common.cancel')}
                    onSave={handleAddLabel}
                    onCancel={() => { setAddingLabel(false); setNewLabelName(''); }}
                  />
                </>
              ) : (
                <>
                  {labels.length > 0 && <View style={styles.separator} />}
                  <Pressable
                    style={({ pressed }) => [styles.addRow, pressed && { opacity: 0.6 }]}
                    onPress={() => { setEditingLabel(null); setAddingLabel(true); }}
                  >
                    <Plus size={14} color={colors.brand.terracotta} strokeWidth={2.5} />
                    <Text style={styles.addRowLabel}>{t('setup.labels.newBtn')}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background.page,
  },
  kav: { flex: 1 },
  screen: { flex: 1 },
  content: { paddingBottom: spacing[10] },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[7],
    gap: spacing[2],
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontFamily: font.family.sans,
    fontSize: font.size.h1,
    fontWeight: font.weight.medium,
    color: colors.ink[1],
    letterSpacing: font.letterSpacing.h1,
  },
  section: { marginBottom: spacing[8] },
  sectionHeader: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    letterSpacing: font.letterSpacing.eyebrow,
    color: colors.ink[3],
    paddingHorizontal: spacing[7],
    marginBottom: spacing[3],
  },
  subSectionLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.eyebrow,
    letterSpacing: font.letterSpacing.eyebrow,
    color: colors.ink[4],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
  },
  card: {
    marginHorizontal: spacing[7],
    backgroundColor: colors.background.surface,
    borderRadius: radius.large,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  // Profile
  profileHeader: {
    alignItems: 'center',
    paddingTop: spacing[7],
    paddingBottom: spacing[4],
    gap: spacing[3],
  },
  avatarColorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
    justifyContent: 'center',
  },
  avatarColorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarColorDotSelected: {
    borderWidth: 2.5,
    borderColor: colors.ink[1],
  },
  profileName: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    fontWeight: font.weight.medium,
    color: colors.ink[1],
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    gap: spacing[4],
  },
  profileRowLabel: {
    fontFamily: font.family.mono,
    fontSize: font.size.mono,
    color: colors.ink[3],
    letterSpacing: font.letterSpacing.eyebrow,
    textTransform: 'uppercase',
    width: 80,
  },
  profileRowValue: {
    flex: 1,
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  // Shared rows
  separator: {
    height: 1,
    backgroundColor: colors.border.divider,
    marginLeft: spacing[5],
  },
  separatorFull: {
    height: 1,
    backgroundColor: colors.border.divider,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    gap: spacing[4],
  },
  actionRowText: { flex: 1, gap: spacing[1] },
  actionRowTitle: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  actionRowSub: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    gap: spacing[4],
  },
  rowPressed: { opacity: 0.6 },
  itemName: {
    flex: 1,
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.ink[1],
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginLeft: 'auto',
  },
  trashBtn: { padding: spacing[1] },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
  },
  addRowLabel: {
    fontFamily: font.family.sans,
    fontSize: font.size.body,
    color: colors.brand.terracotta,
    fontWeight: font.weight.medium,
  },
  addForm: {
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
  colorPicker: {
    flexDirection: 'row',
    gap: spacing[3],
    flexWrap: 'wrap',
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorDotSelected: {
    borderWidth: 2.5,
    borderColor: colors.ink[1],
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
  emptyRow: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
  },
  emptyText: {
    fontFamily: font.family.sans,
    fontSize: font.size.small,
    color: colors.ink[3],
  },
});
