import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ClonesStackParamList } from "../../navigation/types";
import SafeScrollView from "../../components/ui/SafeScrollView";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/common/PageHeader";
import { useCloneStore } from "../../stores/cloneStore";
import { useAuthStore } from "../../stores/authStore";
import { seedSource } from "../../api/source";
import { L1Section } from "./components/L1Section";
import { L2Section } from "./components/L2Section";
import { EditorTransferModal } from "./components/EditorTransferModal";
import type { L1Profile, DomainClone as Clone } from "../../types/domain";
import type { CloneCreationDraft, MemlowRelation } from "../../types/clone";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import { formatPersonaPrompt, l1ProfileToDraft, draftToL1Profile } from "../../lib/personaPrompt";
import PersonaSection from "../clone-creation/content/PersonaSection";
import { MEMLOW_RELATIONS } from "../../mocks/cloneTypeCatalog";
import { CATEGORIES, INTEREST_MAP, INTEREST_CATEGORIES } from "../../mocks/interestHelpers";
import InterestChip from "../../components/ui/InterestChip";

type Visibility = "public" | "private" | "followers";

type Props = NativeStackScreenProps<ClonesStackParamList, "CloneEdit">;

const interestLabelToCategoryId = new Map<string, string>();
for (const cat of INTEREST_CATEGORIES) {
  for (const i of cat.interests) {
    interestLabelToCategoryId.set(i.label, cat.id);
  }
}

export default function CloneEditScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { cloneId } = route.params;
  const clone = useCloneStore((s) => s.getCloneById(cloneId));
  const updateLocalClone = useCloneStore((s) => s.updateLocalClone);
  const viewerId = useAuthStore((s) => s.user?.id) ?? null;

  const [primaryCategory, setPrimaryCategory] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [draft, setDraft] = useState<CloneCreationDraft>({});
  const [l1, setL1] = useState<L1Profile>({ attrs: {}, notes: '' });
  const [transferOpen, setTransferOpen] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [visibilityModal, setVisibilityModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    if (clone) {
      setName(clone.displayName);
      setDescription(clone.description);
      setVisibility(clone.visibility);
      if (clone.l1Profile) setL1(clone.l1Profile);

      setDraft({
        ...l1ProfileToDraft(clone.l1Profile),
        relation: (clone as Clone & { relation?: MemlowRelation }).relation,
        cloneType: clone.cloneType,
      });

      if (clone.cloneType !== 'memlow') {
        const firstInterest = clone.interests[0];
        const catId = firstInterest ? interestLabelToCategoryId.get(firstInterest) ?? "" : "";
        setPrimaryCategory(catId);
        setInterests(clone.interests);
      }
    }
  }, [clone]);

  if (!clone) {
    return (
      <View style={s.notFound}>
        <Text style={s.notFoundText}>{t("edit.notFound")}</Text>
      </View>
    );
  }

  const isOwner = viewerId != null && clone.ownerId === viewerId;
  const isPrimaryEditor =
    viewerId != null && clone.primaryEditorUserId === viewerId;
  const isCoowner =
    viewerId != null &&
    seedSource
      .coowners()
      .some((co) => co.cloneId === clone.id && co.userId === viewerId && co.status === 'approved');
  const canEditL1 = isOwner || isPrimaryEditor;

  const coownerOptions = seedSource
    .coowners()
    .filter((co) => co.cloneId === clone.id && co.status === 'approved')
    .map((co) => {
      const u = seedSource.users().find((uu) => uu.id === co.userId);
      return u ? { userId: u.id, displayName: u.displayName } : null;
    })
    .filter((x): x is { userId: number; displayName: string } => x != null);

  const addCustomInterests = () => {

    const parts = customInput.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    setInterests((prev) => {
      const seen = new Set(prev);
      const next = [...prev];
      for (const p of parts) {
        if (!seen.has(p)) {
          next.push(p);
          seen.add(p);
        }
      }
      return next;
    });
    setCustomInput("");
    setShowCustomInput(false);
  };

  const toggleInterest = (label: string) => {
    setInterests((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label],
    );
  };

  const removeInterest = (label: string) => {
    setInterests((prev) => prev.filter((i) => i !== label));
  };

  const activeList = primaryCategory ? (INTEREST_MAP[primaryCategory] ?? []) : [];
  const customSelected = interests.filter((i) => !activeList.includes(i));

  const handleSave = () => {
    if (!clone) return;
    const l1Payload = draftToL1Profile(draft) ?? { attrs: {}, notes: '' };
    updateLocalClone(clone.id, {
      displayName: name,
      description,
      visibility,
      l1Profile: l1Payload,
      ...(clone.cloneType !== 'memlow' ? { interests } : {}),
      ...(draft.relation ? ({ relation: draft.relation } as Partial<Clone>) : {}),
    } as Partial<Clone>);
    setL1(l1Payload);
    navigation.goBack();
  };

  const confirmVisibility = (v: Visibility) => {
    setVisibility(v);
    setVisibilityModal(false);
  };

  const confirmDelete = () => {

    setDeleteModal(false);
    navigation.getParent()?.goBack();
  };

  const getVisibilityLabel = (v: Visibility) => {
    switch (v) {
      case "public": return t("edit.visibilityPublic");
      case "private": return t("edit.visibilityPrivate");
      case "followers": return t("edit.visibilityFollowers");
    }
  };

  const getVisibilityIcon = (v: Visibility): keyof typeof Feather.glyphMap => {
    switch (v) {
      case "public": return "eye";
      case "private": return "eye-off";
      case "followers": return "user-check";
    }
  };

  return (
    <SafeScrollView
      backgroundColor={COLORS.white}
      autoAdjustKeyboardPadding
      additionalBottomPadding={80}
      showBottomBackground={false}
    >
      <PageHeader
        title={t("edit.title")}
        subtitle={clone.displayName}
        showBackButton
        onBackPress={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={{ padding: 4 }}
            onPress={() => setShowMenu(!showMenu)}
          >
            <Feather name="more-vertical" size={22} color={COLORS.zinc700} />
          </TouchableOpacity>
        }
      />

      {}
      {showMenu && (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowMenu(false)}
          />
          <View style={s.dropdown}>
            {}
            {clone.cloneType !== 'memlow' && (
              <TouchableOpacity
                style={s.dropdownItem}
                onPress={() => {
                  setShowMenu(false);
                  setVisibilityModal(true);
                }}
              >
                <Feather name={getVisibilityIcon(visibility)} size={16} color={COLORS.zinc700} />
                <Text style={s.dropdownText}>
                  {t("dashboard.menuVisibility")} ({getVisibilityLabel(visibility)})
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={s.dropdownItem}
              onPress={() => {
                setShowMenu(false);
                setDeleteModal(true);
              }}
            >
              <Feather name="trash-2" size={16} color={COLORS.error} />
              <Text style={[s.dropdownText, { color: COLORS.error }]}>{t("dashboard.menuDelete")}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={s.content}>
        {
}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t("edit.basicSection")}</Text>

          {}
          <TextField
            label={t("edit.nameLabel")}
            value={name}
            onChangeText={setName}
            placeholder={t("edit.namePlaceholder")}
          />

          {}
          <TextField
            label={t("edit.descLabel")}
            value={description}
            onChangeText={setDescription}
            placeholder={t("edit.descPlaceholder")}
            multiline
            containerStyle={{ marginTop: 16 }}
          />

          {}
          {clone.cloneType === 'memlow' && (
            <>
              <Text style={s.fieldLabel}>{t("create.basicInfo.relationLabel")}</Text>
              <View style={s.chipRow}>
                {MEMLOW_RELATIONS.map((r) => {
                  const active = draft.relation === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[s.chip, active && s.chipSelected]}
                      onPress={() => setDraft((d) => ({ ...d, relation: r.id }))}
                    >
                      <Text style={[s.chipText, active && s.chipTextSelected]}>
                        {t(r.label)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {
}
          {clone.cloneType !== 'memlow' && (
            <>
              <Text style={s.simpleLabel}>{t("create.basicInfo.categoryLabel")}</Text>
              <View style={s.simpleCatRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[s.simpleCat, primaryCategory === c.id && s.simpleCatActive]}
                    onPress={() => {

                      const prevActiveList = primaryCategory ? (INTEREST_MAP[primaryCategory] ?? []) : [];
                      setPrimaryCategory(c.id);
                      setInterests((prev) => prev.filter((label) => !prevActiveList.includes(label)));
                    }}
                  >
                    <Text>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {activeList.length > 0 && (
                <>
                  <Text style={s.simpleLabel}>{t("create.basicInfo.interestsLabel")}</Text>
                  <View style={s.simpleChips}>
                    {activeList.map((i) => (
                      <InterestChip
                        key={i}
                        label={i}
                        selected={interests.includes(i)}
                        onPress={() => toggleInterest(i)}
                      />
                    ))}
                    {customSelected.map((label) => (
                      <TouchableOpacity
                        key={label}
                        style={s.simpleCustomTag}
                        onPress={() => removeInterest(label)}
                      >
                        <Text style={s.simpleCustomTagText}>{label} ✕</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={s.simpleEtcChip}
                      onPress={() => setShowCustomInput((v) => !v)}
                    >
                      <Text style={s.simpleEtcChipText}>{t("create.basicInfo.addEtc")}</Text>
                    </TouchableOpacity>
                  </View>

                  {showCustomInput && (
                    <View style={s.simpleCustomInputRow}>
                      <TextInput
                        style={s.simpleCustomTextInput}
                        value={customInput}
                        onChangeText={setCustomInput}
                        placeholder={t("create.basicInfo.customPlaceholder")}
                        placeholderTextColor={COLORS.placeholder}
                        onSubmitEditing={addCustomInterests}
                        returnKeyType="done"
                        autoFocus
                      />
                      <TouchableOpacity style={s.simpleAddBtn} onPress={addCustomInterests}>
                        <Text style={s.simpleAddBtnText}>{t("create.basicInfo.addBtn")}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </>
          )}

          {}
          <View style={s.beforeBox}>
            <Text style={s.beforeLabel}>{t("edit.beforeLabel")}</Text>
            <Text style={s.beforeBody}>
              {formatPersonaPrompt({
                name: clone.displayName,
                description: clone.description,
                interests: clone.interests,
                l1: clone.l1Profile,
              }, t)}
            </Text>
          </View>

          {}
          <PersonaSection
            draft={draft}
            onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          />
        </View>

        {
}
        <View style={s.devBanner}>
          <Text style={s.devBannerText}>{t("edit.devBannerTitle")}</Text>
          <Text style={s.devBannerSub}>{t("edit.devBannerSub")}</Text>
        </View>

        <View style={s.section}>
          <L1Section value={l1} editable={canEditL1} onChange={setL1} />
          <L2Section memoryCount={0} lastUpdatedAt={null} />
          {isPrimaryEditor && (
            <TouchableOpacity
              accessibilityLabel="transfer-open"
              onPress={() => setTransferOpen(true)}
              style={{ padding: 12, borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 8, marginTop: 12 }}
            >
              <Text>{t("edit.transferEditor")}</Text>
            </TouchableOpacity>
          )}
          {isCoowner && !isPrimaryEditor && (
            <TouchableOpacity
              accessibilityLabel="request-editor"
              onPress={() => {}}
              style={{ padding: 12, borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 8, marginTop: 12 }}
            >
              <Text>{t("edit.requestEditor")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {}
      <View style={s.bottomBar}>
        <Button
          title={t("edit.save")}
          variant="primary"
          onPress={handleSave}
          disabled={!name}
          style={s.saveBtn}
        />
      </View>

      {}
      <Modal visible={visibilityModal} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setVisibilityModal(false)}>
          <Pressable style={s.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>{t("edit.visibilityChooseTitle")}</Text>
            <Text style={s.modalDesc}>{t("edit.visibilityChooseDesc")}</Text>
            <View style={s.visibilityOptions}>
              {}
              {(["public", "private"] as Visibility[]).map((v) => {
                const selected = visibility === v;
                return (
                  <TouchableOpacity
                    key={v}
                    style={[s.visibilityOption, selected && s.visibilityOptionSelected]}
                    onPress={() => confirmVisibility(v)}
                  >
                    <Feather
                      name={getVisibilityIcon(v)}
                      size={16}
                      color={selected ? COLORS.white : COLORS.zinc700}
                    />
                    <Text
                      style={[
                        s.visibilityOptionText,
                        selected && { color: COLORS.white },
                      ]}
                    >
                      {getVisibilityLabel(v)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Button
              title={t("common.cancel")}
              variant="ghost"
              onPress={() => setVisibilityModal(false)}
              style={{ marginTop: 12, width: "100%" }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={deleteModal} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={() => setDeleteModal(false)}>
          <Pressable style={s.modalBox} onPress={(e) => e.stopPropagation()}>
            <Text style={s.modalTitle}>{t("edit.deleteTitle")}</Text>
            <Text style={s.modalDesc}>{t("edit.deleteDesc")}</Text>
            <View style={s.modalBtns}>
              <Button
                title={t("common.cancel")}
                variant="ghost"
                onPress={() => setDeleteModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={t("common.delete")}
                variant="danger"
                onPress={confirmDelete}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <EditorTransferModal
        visible={transferOpen}
        coowners={coownerOptions}
        onClose={() => setTransferOpen(false)}
        onSubmit={() => setTransferOpen(false)}
      />

    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 80,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: COLORS.zinc900, marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: COLORS.zinc500, marginBottom: 20 },

  categoryList: { gap: 12 },
  categoryItem: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.zinc200,
    backgroundColor: COLORS.white,
  },
  categoryTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900, marginBottom: 4 },
  categorySub: { fontSize: 12, color: COLORS.zinc500 },

  selectedCatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  selectedCatLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  selectedCatTitle: { fontSize: 16, fontWeight: "700", color: COLORS.violet600 },
  primaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.violet600,
    borderRadius: RADIUS.full,
  },
  primaryBadgeText: { fontSize: 11, fontWeight: "500", color: COLORS.white },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    borderRadius: 8,
  },
  changeBtnText: { fontSize: 12, fontWeight: "500", color: COLORS.zinc600 },

  interestGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  interestItem: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.zinc200,
    backgroundColor: COLORS.white,
  },
  interestSelected: {
    borderColor: COLORS.violet600,
    backgroundColor: COLORS.violet100,
  },
  interestIcon: { fontSize: 24, marginBottom: 8 },
  interestLabel: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  checkCircle: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.violet600,
    alignItems: "center",
    justifyContent: "center",
  },

  customTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900, marginTop: 24, marginBottom: 12 },
  customTags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  customTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.violet100,
    borderWidth: 2,
    borderColor: COLORS.violet600,
    borderRadius: RADIUS.full,
  },
  etcChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
    borderStyle: 'dashed',
    backgroundColor: COLORS.white,
  },
  etcChipText: { fontSize: 13, color: COLORS.zinc600 },

  simpleLabel: { fontSize: 13, fontWeight: '600', color: COLORS.zinc700, marginTop: 12 },
  simpleCatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  simpleCat: { padding: 10, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.zinc200 },
  simpleCatActive: { backgroundColor: COLORS.violet100, borderColor: COLORS.violet600 },
  simpleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  simpleCustomInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  simpleCustomTextInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.zinc200, borderRadius: RADIUS.sm,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.zinc900,
  },
  simpleAddBtn: {
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.violet600, borderRadius: RADIUS.sm,
  },
  simpleAddBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  simpleCustomTag: {
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.violet100,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.violet600,
  },
  simpleCustomTagText: { fontSize: 13, color: COLORS.violet600 },
  simpleEtcChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.zinc300, borderStyle: 'dashed',
    backgroundColor: COLORS.white,
  },
  simpleEtcChipText: { fontSize: 13, color: COLORS.zinc600 },
  customTagText: { fontSize: 14, fontWeight: "500", color: COLORS.violet600 },
  customInputRow: { flexDirection: "row", gap: 8 },
  customTextInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.lg,
    fontSize: 14,
    color: COLORS.zinc900,
  },
  addBtn: {
    paddingHorizontal: 20,
    height: 48,
    backgroundColor: COLORS.violet600,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.white },
  addCustomBtn: {
    padding: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.zinc300,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addCustomText: { fontSize: 14, fontWeight: "500", color: COLORS.zinc600 },

  divider: { height: 1, backgroundColor: COLORS.zinc200, marginVertical: 24 },

  fieldLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.zinc900,
    marginTop: 20,
    marginBottom: 8,
  },
  fieldHint: { fontSize: 12, color: COLORS.zinc500, marginBottom: 10 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.zinc100,
  },
  chipSelected: { backgroundColor: COLORS.zinc900 },
  chipText: { fontSize: 13, fontWeight: "500", color: COLORS.zinc600 },
  chipTextSelected: { color: COLORS.white },

  genderRow: { flexDirection: "row", gap: 12 },
  genderBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc50,
    alignItems: "center",
    justifyContent: "center",
  },
  genderSelected: { backgroundColor: COLORS.zinc900 },
  genderText: { fontSize: 14, fontWeight: "500", color: COLORS.zinc600 },
  genderTextSelected: { color: COLORS.white },

  mbtiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mbtiItem: {
    width: "22%",
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc50,
    alignItems: "center",
    justifyContent: "center",
  },
  mbtiSelected: { backgroundColor: COLORS.zinc900 },
  mbtiText: { fontSize: 13, fontWeight: "500", color: COLORS.zinc600 },
  mbtiTextSelected: { color: COLORS.white },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.zinc200,
  },
  saveBtn: {
    borderRadius: RADIUS.full,
    width: "100%",
  },

  dropdown: {
    position: "absolute",
    right: 16,
    top: 100,
    zIndex: 50,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    paddingVertical: 4,
    minWidth: 200,
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: { fontSize: 14, color: COLORS.zinc700 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.zinc900,
    textAlign: "center",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: COLORS.zinc600,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  modalBtns: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  visibilityOptions: { gap: 8, width: "100%" },
  visibilityOption: {
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.zinc100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  visibilityOptionSelected: {
    backgroundColor: COLORS.zinc900,
  },
  visibilityOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.zinc700,
  },

  notFound: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: { fontSize: 14, color: COLORS.zinc500 },
  beforeBox: {
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    backgroundColor: COLORS.zinc100,
    borderRadius: RADIUS.sm,
  },
  beforeLabel: { fontSize: 11, fontWeight: '700', color: COLORS.zinc500, marginBottom: 4 },
  beforeBody: { fontSize: 13, lineHeight: 18, color: COLORS.zinc700 },
  devBanner: {
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: RADIUS.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    marginVertical: 16,
  },
  devBannerText: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  devBannerSub: { fontSize: 12, color: '#92400e', marginTop: 2 },
});
