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
import { INTEREST_CATEGORIES } from "../../mocks/interestHelpers";

type Visibility = "public" | "private" | "followers";

type Props = NativeStackScreenProps<ClonesStackParamList, "CloneEdit">;

const interestCategories = INTEREST_CATEGORIES.map((c) => ({
  id: c.id,
  title: c.label,
  subtitle: c.subtitle,
  interests: c.interests,
}));
const interestToCategoryId = new Map<string, string>();
for (const cat of INTEREST_CATEGORIES) {
  for (const i of cat.interests) {
    interestToCategoryId.set(i.label, cat.id);
  }
}

export default function CloneEditScreen({ route, navigation }: Props) {
  const { cloneId } = route.params;
  const clone = useCloneStore((s) => s.getCloneById(cloneId));
  const updateLocalClone = useCloneStore((s) => s.updateLocalClone);
  const viewerId = useAuthStore((s) => s.user?.id) ?? null;

  const [primaryCategory, setPrimaryCategory] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterests, setCustomInterests] = useState<string[]>([]);
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
        const catId = firstInterest ? interestToCategoryId.get(firstInterest) ?? "" : "";
        setPrimaryCategory(catId);

        if (catId) {
          const cat = interestCategories.find((c) => c.id === catId);
          const ids = (cat?.interests ?? [])
            .filter((i) => clone.interests.includes(i.label))
            .map((i) => i.id);
          setSelectedInterests(ids);
        }
      }
    }
  }, [clone]);

  if (!clone) {
    return (
      <View style={s.notFound}>
        <Text style={s.notFoundText}>페르소나를 찾을 수 없습니다.</Text>
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

  const addCustomInterest = () => {

    const parts = customInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setCustomInterests((prev) => {
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

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const currentCategory = interestCategories.find((c) => c.id === primaryCategory);

  const handleSave = () => {
    if (!clone) return;
    const l1Payload = draftToL1Profile(draft) ?? { attrs: {}, notes: '' };
    updateLocalClone(clone.id, {
      displayName: name,
      description,
      visibility,
      l1Profile: l1Payload,
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
      case "public": return "공개";
      case "private": return "비공개";
      case "followers": return "지인공개";
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
        title="페르소나 수정"
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
            <TouchableOpacity
              style={s.dropdownItem}
              onPress={() => {
                setShowMenu(false);
                setVisibilityModal(true);
              }}
            >
              <Feather name={getVisibilityIcon(visibility)} size={16} color={COLORS.zinc700} />
              <Text style={s.dropdownText}>
                공개설정 ({getVisibilityLabel(visibility)})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.dropdownItem}
              onPress={() => {
                setShowMenu(false);
                setDeleteModal(true);
              }}
            >
              <Feather name="trash-2" size={16} color={COLORS.error} />
              <Text style={[s.dropdownText, { color: COLORS.error }]}>삭제</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={s.content}>
        {
}
        <View style={s.section}>
          <Text style={s.sectionTitle}>기본 정보</Text>

          {}
          <TextField
            label="이름"
            value={name}
            onChangeText={setName}
            placeholder="이름을 입력해주세요"
          />

          {}
          <PersonaSection
            draft={draft}
            onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          />

          {}
          <View style={s.beforeBox}>
            <Text style={s.beforeLabel}>변경 전 (영구 데이터)</Text>
            <Text style={s.beforeBody}>
              {formatPersonaPrompt({
                name: clone.displayName,
                description: clone.description,
                interests: clone.interests,
                l1: clone.l1Profile,
              })}
            </Text>
          </View>

          {}
          {clone.cloneType === 'memlow' && (
            <>
              <Text style={s.fieldLabel}>고인과의 관계</Text>
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
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {}
          <TextField
            label="한 줄 소개"
            value={description}
            onChangeText={setDescription}
            placeholder="이 페르소나의 한 줄 소개를 입력해주세요..."
            multiline
            containerStyle={{ marginTop: 16 }}
          />

          {
}
          {clone.cloneType !== 'memlow' && (
            <View style={{ marginTop: 16 }}>
              <Text style={s.sectionTitle}>관심사</Text>
              <Text style={s.sectionDesc}>
                먼저 주 카테고리를 선택한 후, 관심사를 골라주세요.
              </Text>

              {!primaryCategory ? (
                <View style={s.categoryList}>
                  {interestCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={s.categoryItem}
                      onPress={() => setPrimaryCategory(cat.id)}
                    >
                      <Text style={s.categoryTitle}>{cat.title}</Text>
                      <Text style={s.categorySub}>{cat.subtitle}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : currentCategory ? (
                <>
                  <View style={s.selectedCatHeader}>
                    <View style={s.selectedCatLeft}>
                      <Text style={s.selectedCatTitle}>{currentCategory.title}</Text>
                      <View style={s.primaryBadge}>
                        <Text style={s.primaryBadgeText}>주 카테고리</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={s.changeBtn}
                      onPress={() => {
                        setPrimaryCategory("");
                        setSelectedInterests([]);
                        setCustomInterests([]);
                      }}
                    >
                      <Text style={s.changeBtnText}>변경</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={s.interestGrid}>
                    {}
                    {currentCategory.interests.map((interest) => {
                      const selected = selectedInterests.includes(interest.id);
                      return (
                        <TouchableOpacity
                          key={interest.id}
                          style={[s.interestItem, selected && s.interestSelected]}
                          onPress={() => toggleInterest(interest.id)}
                        >
                          <Text style={s.interestIcon}>{interest.icon}</Text>
                          <Text style={s.interestLabel}>{interest.label}</Text>
                          {selected && (
                            <View style={s.checkCircle}>
                              <Feather name="check" size={14} color={COLORS.white} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                    {}
                    {customInterests.map((label) => (
                      <TouchableOpacity
                        key={label}
                        style={s.customTag}
                        onPress={() =>
                          setCustomInterests((prev) => prev.filter((i) => i !== label))
                        }
                      >
                        <Text style={s.customTagText}>{label} ✕</Text>
                      </TouchableOpacity>
                    ))}
                    {}
                    <TouchableOpacity
                      style={s.etcChip}
                      onPress={() => setShowCustomInput((v) => !v)}
                    >
                      <Text style={s.etcChipText}>+ 기타</Text>
                    </TouchableOpacity>
                  </View>

                  {showCustomInput && (
                    <View style={s.customInputRow}>
                      <TextInput
                        style={s.customTextInput}
                        value={customInput}
                        onChangeText={setCustomInput}
                        placeholder="콤마(,) 로 여러 개 가능 — 예: 책, 영화, 여행"
                        placeholderTextColor={COLORS.placeholder}
                        onSubmitEditing={addCustomInterest}
                        autoFocus
                      />
                      <TouchableOpacity style={s.addBtn} onPress={addCustomInterest}>
                        <Text style={s.addBtnText}>추가</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : null}
            </View>
          )}
        </View>

        {
}
        <View style={s.devBanner}>
          <Text style={s.devBannerText}>🛠 개발용 — 프로덕션 미사용</Text>
          <Text style={s.devBannerSub}>
            아래 L1/L2 섹션은 메모리 시스템 직접 편집용. 위 chip 이 실제 사용자 입력 채널입니다.
          </Text>
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
              <Text>편집 권한 이전</Text>
            </TouchableOpacity>
          )}
          {isCoowner && !isPrimaryEditor && (
            <TouchableOpacity
              accessibilityLabel="request-editor"
              onPress={() => {}}
              style={{ padding: 12, borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 8, marginTop: 12 }}
            >
              <Text>편집 권한 요청</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {}
      <View style={s.bottomBar}>
        <Button
          title="저장하기"
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
            <Text style={s.modalTitle}>공개 설정</Text>
            <Text style={s.modalDesc}>페르소나의 공개 범위를 선택하세요</Text>
            <View style={s.visibilityOptions}>
              {(["public", "private", "followers"] as Visibility[]).map((v) => {
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
              title="취소"
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
            <Text style={s.modalTitle}>페르소나 삭제</Text>
            <Text style={s.modalDesc}>
              정말 이 페르소나를 삭제하시겠습니까?{"\n"}삭제된 페르소나는 복구할 수 없습니다.
            </Text>
            <View style={s.modalBtns}>
              <Button
                title="취소"
                variant="ghost"
                onPress={() => setDeleteModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="삭제"
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
