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
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import { INTEREST_CATEGORIES } from "../../mocks/interestHelpers";

type Visibility = "public" | "private" | "followers";

type Props = NativeStackScreenProps<ClonesStackParamList, "CloneEdit">;

const interestCategories = INTEREST_CATEGORIES.map((c) => ({
  id: c.id,
  title: c.label,
  subtitle: c.subtitle,
  interests: c.interests,
}));

const personalityTypes = [
  { id: "extrovert", label: "외향적인" },
  { id: "introvert", label: "내향적인" },
  { id: "logical", label: "논리적인" },
  { id: "emotional", label: "감정적인" },
  { id: "free", label: "자유로운" },
  { id: "organized", label: "체계적인" },
  { id: "passionate", label: "열정적인" },
  { id: "calm", label: "평온한" },
];

const ageRanges = ["10대", "20대", "30대", "40대", "50대", "60대 이상"];

const mbtiTypes = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
  "모름",
];

const interestToCategoryId = new Map<string, string>();
for (const cat of INTEREST_CATEGORIES) {
  for (const i of cat.interests) {
    interestToCategoryId.set(i.label, cat.id);
  }
}

export default function CloneEditScreen({ route, navigation }: Props) {
  const { cloneId } = route.params;
  const clone = useCloneStore((s) => s.getCloneById(cloneId));

  const [primaryCategory, setPrimaryCategory] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const [name, setName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("남성");
  const [personalities, setPersonalities] = useState<string[]>([]);
  const [mbti, setMbti] = useState("");
  const [description, setDescription] = useState("");

  const [showMenu, setShowMenu] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [visibilityModal, setVisibilityModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    if (clone) {
      const firstInterest = clone.interests[0];
      const catId = firstInterest ? interestToCategoryId.get(firstInterest) ?? "" : "";
      setPrimaryCategory(catId);
      setName(clone.displayName);
      setDescription(clone.description);
      setVisibility(clone.visibility);
    }
  }, [clone]);

  if (!clone) {
    return (
      <View style={s.notFound}>
        <Text style={s.notFoundText}>페르소나를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const currentCategory = interestCategories.find((c) => c.id === primaryCategory);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const togglePersonality = (id: string) => {
    setPersonalities((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const addCustomInterest = () => {
    if (customInput.trim()) {
      setCustomInterests((prev) => [...prev, customInput.trim()]);
      setCustomInput("");
      setShowCustomInput(false);
    }
  };

  const handleSave = () => {

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
        {}
        <View style={s.section}>
          <Text style={s.sectionTitle}>관심사를 선택해주세요</Text>
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
              {}
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

              {}
              <View style={s.interestGrid}>
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
              </View>

              {}
              <Text style={s.customTitle}>그 외 관심사</Text>
              <View style={s.customTags}>
                {customInterests.map((tag, i) => (
                  <View key={i} style={s.customTag}>
                    <Text style={s.customTagText}>{tag}</Text>
                  </View>
                ))}
              </View>

              {showCustomInput ? (
                <View style={s.customInputRow}>
                  <TextInput
                    style={s.customTextInput}
                    value={customInput}
                    onChangeText={setCustomInput}
                    placeholder="관심사를 입력하세요"
                    placeholderTextColor={COLORS.placeholder}
                    onSubmitEditing={addCustomInterest}
                    autoFocus
                  />
                  <TouchableOpacity style={s.addBtn} onPress={addCustomInterest}>
                    <Text style={s.addBtnText}>추가</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={s.addCustomBtn}
                  onPress={() => setShowCustomInput(true)}
                >
                  <Feather name="plus" size={18} color={COLORS.zinc600} />
                  <Text style={s.addCustomText}>관심사 추가하기</Text>
                </TouchableOpacity>
              )}
            </>
          ) : null}
        </View>

        {}
        <View style={s.divider} />

        {}
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
          <Text style={s.fieldLabel}>나이</Text>
          <View style={s.chipRow}>
            {ageRanges.map((age) => (
              <TouchableOpacity
                key={age}
                style={[s.chip, ageRange === age && s.chipSelected]}
                onPress={() => setAgeRange(age)}
              >
                <Text style={[s.chipText, ageRange === age && s.chipTextSelected]}>
                  {age}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          <Text style={s.fieldLabel}>성별</Text>
          <View style={s.genderRow}>
            {["남성", "여성"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[s.genderBtn, gender === g && s.genderSelected]}
                onPress={() => setGender(g)}
              >
                <Text style={[s.genderText, gender === g && s.genderTextSelected]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          <Text style={s.fieldLabel}>성격 유형 선택</Text>
          <Text style={s.fieldHint}>
            이 페르소나에 어울리는 성격 키워드를 모두 골라주세요.
          </Text>
          <View style={s.chipRow}>
            {personalityTypes.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[s.chip, personalities.includes(p.id) && s.chipSelected]}
                onPress={() => togglePersonality(p.id)}
              >
                <Text
                  style={[
                    s.chipText,
                    personalities.includes(p.id) && s.chipTextSelected,
                  ]}
                >
                  # {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          <Text style={s.fieldLabel}>MBTI</Text>
          <Text style={s.fieldHint}>
            페르소나의 MBTI 유형을 선택해주세요.
          </Text>
          <View style={s.mbtiGrid}>
            {mbtiTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[s.mbtiItem, mbti === type && s.mbtiSelected]}
                onPress={() => setMbti(type)}
              >
                <Text style={[s.mbtiText, mbti === type && s.mbtiTextSelected]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          <TextField
            label="페르소나 설명"
            value={description}
            onChangeText={setDescription}
            placeholder="이 페르소나의 정체성을 알 수 있게 설명해주세요..."
            multiline
            containerStyle={{ marginTop: 16 }}
          />
        </View>
      </View>

      {}
      <View style={s.bottomBar}>
        <Button
          title="저장하기"
          variant="primary"
          onPress={handleSave}
          disabled={!name || !ageRange}
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
});
