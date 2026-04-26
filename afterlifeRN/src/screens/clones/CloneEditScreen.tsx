import v_a3453e, { v_5ab095, v_c4deb2 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_79c4f2,
  v_aa7413,
  v_09d0e5,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2d88fc } from "../../navigation/types";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_e775af from "../../components/ui/TextField";
import v_1a40c4 from "../../components/ui/Button";
import v_258c1c from "../../components/common/PageHeader";
import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_694b7f } from "../../api/source";
import { v_f48a74 } from "./components/L1Section";
import { v_193b22 } from "./components/L2Section";
import { v_9b783f } from "./components/EditorTransferModal";
import type { v_eceede, v_4b85a1 as v_affcc0 } from "../../types/domain";
import type { v_c2a674, v_a097b2 } from "../../types/clone";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import { v_d6d0ff, v_f689cd, v_556c5b } from "../../lib/personaPrompt";
import v_78abf7 from "../clone-creation/content/PersonaSection";
import { v_0a40d6 } from "../../mocks/cloneTypeCatalog";
import { v_6e79a1, v_a3360a, v_6732dc } from "../../mocks/interestHelpers";
import v_84e2fc from "../../components/ui/InterestChip";

type Visibility = "public" | "private" | "followers";

type Props = v_432191<v_2d88fc, "CloneEdit">;

const v_dfcccd = new Map<string, string>();
for (const v_9bf432 of v_6732dc) {
  for (const v_ebec57 of v_9bf432.interests) {
    v_dfcccd.set(v_ebec57.label, v_9bf432.id);
  }
}

export default function v_541fbd({ route: v_c7daf6, navigation: v_c65f5d }: Props) {
  const { cloneId: v_6e0fd3 } = v_c7daf6.params;
  const v_eb25ce = v_194498((v_fd5f43) => v_fd5f43.getCloneById(v_6e0fd3));
  const v_941cd7 = v_194498((v_fd5f43) => v_fd5f43.updateLocalClone);
  const v_013af2 = v_1ed7d9((v_fd5f43) => v_fd5f43.user?.id) ?? null;

  const [v_5ba743, v_5cc801] = v_5ab095("");
  const [v_774c91, v_8cb9cf] = v_5ab095<string[]>([]);
  const [v_2b1044, v_160b34] = v_5ab095(false);
  const [v_0f1d77, v_e887ea] = v_5ab095("");

  const [v_1833e7, v_318f24] = v_5ab095("");
  const [v_6856a9, v_b7e174] = v_5ab095("");

  const [v_f04727, v_a07441] = v_5ab095<v_c2a674>({});
  const [v_020b4b, v_15918a] = v_5ab095<v_eceede>({ attrs: {}, notes: '' });
  const [v_0b1d04, v_dcba89] = v_5ab095(false);

  const [v_e58f3d, v_40c384] = v_5ab095(false);
  const [v_818579, v_2cf16e] = v_5ab095<Visibility>("public");
  const [v_7462ec, v_2dbd8f] = v_5ab095(false);
  const [v_c9d3fa, v_f32c49] = v_5ab095(false);

  v_c4deb2(() => {
    if (v_eb25ce) {
      v_318f24(v_eb25ce.displayName);
      v_b7e174(v_eb25ce.description);
      v_2cf16e(v_eb25ce.visibility);
      if (v_eb25ce.l1Profile) v_15918a(v_eb25ce.l1Profile);

      v_a07441({
        ...v_f689cd(v_eb25ce.l1Profile),
        relation: (v_eb25ce as v_affcc0 & { relation?: v_a097b2 }).relation,
        cloneType: v_eb25ce.cloneType,
      });

      if (v_eb25ce.cloneType !== 'memlow') {
        const v_6560b3 = v_eb25ce.interests[0];
        const v_757575 = v_6560b3 ? v_dfcccd.get(v_6560b3) ?? "" : "";
        v_5cc801(v_757575);
        v_8cb9cf(v_eb25ce.interests);
      }
    }
  }, [v_eb25ce]);

  if (!v_eb25ce) {
    return (
      <View style={v_fd5f43.notFound}>
        <Text style={v_fd5f43.notFoundText}>페르소나를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const v_2aec08 = v_013af2 != null && v_eb25ce.ownerId === v_013af2;
  const v_9c4eec =
    v_013af2 != null && v_eb25ce.primaryEditorUserId === v_013af2;
  const v_552f41 =
    v_013af2 != null &&
    v_694b7f
      .coowners()
      .some((v_c4a45b) => v_c4a45b.cloneId === v_eb25ce.id && v_c4a45b.userId === v_013af2 && v_c4a45b.status === 'approved');
  const v_8e93b4 = v_2aec08 || v_9c4eec;

  const v_a7d523 = v_694b7f
    .coowners()
    .filter((v_c4a45b) => v_c4a45b.cloneId === v_eb25ce.id && v_c4a45b.status === 'approved')
    .map((v_c4a45b) => {
      const v_ceb55a = v_694b7f.users().find((v_105fd4) => v_105fd4.id === v_c4a45b.userId);
      return v_ceb55a ? { userId: v_ceb55a.id, displayName: v_ceb55a.displayName } : null;
    })
    .filter((v_62c214): v_62c214 is { userId: number; displayName: string } => v_62c214 != null);

  const v_8fa105 = () => {

    const v_468545 = v_0f1d77.split(',').map((v_fd5f43) => v_fd5f43.trim()).filter(Boolean);
    if (v_468545.length === 0) return;
    v_8cb9cf((v_ba2215) => {
      const v_110a8b = new Set(v_ba2215);
      const v_a448ad = [...v_ba2215];
      for (const v_e2a85c of v_468545) {
        if (!v_110a8b.has(v_e2a85c)) {
          v_a448ad.push(v_e2a85c);
          v_110a8b.add(v_e2a85c);
        }
      }
      return v_a448ad;
    });
    v_e887ea("");
    v_160b34(false);
  };

  const v_d82a00 = (v_2869c1) => {
    v_8cb9cf((v_ba2215) =>
      v_ba2215.includes(v_2869c1) ? v_ba2215.filter((v_ebec57) => v_ebec57 !== v_2869c1) : [...v_ba2215, v_2869c1],
    );
  };

  const v_78c56b = (v_2869c1) => {
    v_8cb9cf((v_ba2215) => v_ba2215.filter((v_ebec57) => v_ebec57 !== v_2869c1));
  };

  const v_02812c = v_5ba743 ? (v_a3360a[v_5ba743] ?? []) : [];
  const v_32b47e = v_774c91.filter((v_ebec57) => !v_02812c.includes(v_ebec57));

  const v_1b8283 = () => {
    if (!v_eb25ce) return;
    const v_67628a = v_556c5b(v_f04727) ?? { attrs: {}, notes: '' };
    v_941cd7(v_eb25ce.id, {
      displayName: v_1833e7,
      description: v_6856a9,
      visibility: v_818579,
      l1Profile: v_67628a,
      ...(v_eb25ce.cloneType !== 'memlow' ? { interests: v_774c91 } : {}),
      ...(v_f04727.relation ? ({ relation: v_f04727.relation } as Partial<v_affcc0>) : {}),
    } as Partial<v_affcc0>);
    v_15918a(v_67628a);
    v_c65f5d.goBack();
  };

  const v_c9f992 = (v_81e2ef) => {
    v_2cf16e(v_81e2ef);
    v_2dbd8f(false);
  };

  const v_6ff8af = () => {

    v_f32c49(false);
    v_c65f5d.getParent()?.goBack();
  };

  const v_82830c = (v_81e2ef) => {
    switch (v_81e2ef) {
      case "public": return "공개";
      case "private": return "비공개";
      case "followers": return "지인공개";
    }
  };

  const v_a6deb1 = (v_81e2ef): keyof typeof v_dec439.glyphMap => {
    switch (v_81e2ef) {
      case "public": return "eye";
      case "private": return "eye-off";
      case "followers": return "user-check";
    }
  };

  return (
    <SafeScrollView
      backgroundColor={v_1bfbd0.white}
      autoAdjustKeyboardPadding
      additionalBottomPadding={80}
      showBottomBackground={false}
    >
      <PageHeader
        title="페르소나 수정"
        subtitle={v_eb25ce.displayName}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
        rightAction={
          <TouchableOpacity
            style={{ padding: 4 }}
            onPress={() => v_40c384(!v_e58f3d)}
          >
            <Feather name="more-vertical" size={22} color={v_1bfbd0.zinc700} />
          </TouchableOpacity>
        }
      />

      {}
      {v_e58f3d && (
        <>
          <Pressable
            style={v_472849.absoluteFill}
            onPress={() => v_40c384(false)}
          />
          <View style={v_fd5f43.dropdown}>
            <TouchableOpacity
              style={v_fd5f43.dropdownItem}
              onPress={() => {
                v_40c384(false);
                v_2dbd8f(true);
              }}
            >
              <Feather name={v_a6deb1(v_818579)} size={16} color={v_1bfbd0.zinc700} />
              <Text style={v_fd5f43.dropdownText}>
                공개설정 ({v_82830c(v_818579)})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={v_fd5f43.dropdownItem}
              onPress={() => {
                v_40c384(false);
                v_f32c49(true);
              }}
            >
              <Feather name="trash-2" size={16} color={v_1bfbd0.error} />
              <Text style={[v_fd5f43.dropdownText, { color: v_1bfbd0.error }]}>삭제</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={v_fd5f43.content}>
        {
}
        <View style={v_fd5f43.section}>
          <Text style={v_fd5f43.sectionTitle}>기본 정보</Text>

          {}
          <TextField
            label="이름"
            value={v_1833e7}
            onChangeText={v_318f24}
            placeholder="이름을 입력해주세요"
          />

          {}
          <TextField
            label="한 줄 소개"
            value={v_6856a9}
            onChangeText={v_b7e174}
            placeholder="이 페르소나의 한 줄 소개를 입력해주세요..."
            multiline
            containerStyle={{ marginTop: 16 }}
          />

          {}
          {v_eb25ce.cloneType === 'memlow' && (
            <>
              <Text style={v_fd5f43.fieldLabel}>고인과의 관계</Text>
              <View style={v_fd5f43.chipRow}>
                {v_0a40d6.map((v_cb35cb) => {
                  const v_f8b770 = v_f04727.relation === v_cb35cb.id;
                  return (
                    <TouchableOpacity
                      key={v_cb35cb.id}
                      style={[v_fd5f43.chip, v_f8b770 && v_fd5f43.chipSelected]}
                      onPress={() => v_a07441((v_d5dda0) => ({ ...v_d5dda0, relation: v_cb35cb.id }))}
                    >
                      <Text style={[v_fd5f43.chipText, v_f8b770 && v_fd5f43.chipTextSelected]}>
                        {v_cb35cb.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {
}
          {v_eb25ce.cloneType !== 'memlow' && (
            <>
              <Text style={v_fd5f43.simpleLabel}>카테고리</Text>
              <View style={v_fd5f43.simpleCatRow}>
                {v_6e79a1.map((v_3f4e2e) => (
                  <TouchableOpacity
                    key={v_3f4e2e.id}
                    style={[v_fd5f43.simpleCat, v_5ba743 === v_3f4e2e.id && v_fd5f43.simpleCatActive]}
                    onPress={() => {
                      v_5cc801(v_3f4e2e.id);
                      v_8cb9cf([]);
                    }}
                  >
                    <Text>{v_3f4e2e.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {v_02812c.length > 0 && (
                <>
                  <Text style={v_fd5f43.simpleLabel}>관심사</Text>
                  <View style={v_fd5f43.simpleChips}>
                    {v_02812c.map((v_ebec57) => (
                      <InterestChip
                        key={v_ebec57}
                        label={v_ebec57}
                        selected={v_774c91.includes(v_ebec57)}
                        onPress={() => v_d82a00(v_ebec57)}
                      />
                    ))}
                    {v_32b47e.map((v_2869c1) => (
                      <TouchableOpacity
                        key={v_2869c1}
                        style={v_fd5f43.simpleCustomTag}
                        onPress={() => v_78c56b(v_2869c1)}
                      >
                        <Text style={v_fd5f43.simpleCustomTagText}>{v_2869c1} ✕</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={v_fd5f43.simpleEtcChip}
                      onPress={() => v_160b34((v_81e2ef) => !v_81e2ef)}
                    >
                      <Text style={v_fd5f43.simpleEtcChipText}>+ 기타</Text>
                    </TouchableOpacity>
                  </View>

                  {v_2b1044 && (
                    <View style={v_fd5f43.simpleCustomInputRow}>
                      <TextInput
                        style={v_fd5f43.simpleCustomTextInput}
                        value={v_0f1d77}
                        onChangeText={v_e887ea}
                        placeholder="콤마(,) 로 여러 개 가능 — 예: 책, 영화, 여행"
                        placeholderTextColor={v_1bfbd0.placeholder}
                        onSubmitEditing={v_8fa105}
                        returnKeyType="done"
                        autoFocus
                      />
                      <TouchableOpacity style={v_fd5f43.simpleAddBtn} onPress={v_8fa105}>
                        <Text style={v_fd5f43.simpleAddBtnText}>추가</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </>
          )}

          {}
          <View style={v_fd5f43.beforeBox}>
            <Text style={v_fd5f43.beforeLabel}>변경 전 (영구 데이터)</Text>
            <Text style={v_fd5f43.beforeBody}>
              {v_d6d0ff({
                name: v_eb25ce.displayName,
                description: v_eb25ce.description,
                interests: v_eb25ce.interests,
                l1: v_eb25ce.l1Profile,
              })}
            </Text>
          </View>

          {}
          <PersonaSection
            draft={v_f04727}
            onChange={(v_17dc8a) => v_a07441((v_d5dda0) => ({ ...v_d5dda0, ...v_17dc8a }))}
          />
        </View>

        {
}
        <View style={v_fd5f43.devBanner}>
          <Text style={v_fd5f43.devBannerText}>🛠 개발용 — 프로덕션 미사용</Text>
          <Text style={v_fd5f43.devBannerSub}>
            아래 L1/L2 섹션은 메모리 시스템 직접 편집용. 위 chip 이 실제 사용자 입력 채널입니다.
          </Text>
        </View>

        <View style={v_fd5f43.section}>
          <L1Section value={v_020b4b} editable={v_8e93b4} onChange={v_15918a} />
          <L2Section memoryCount={0} lastUpdatedAt={null} />
          {v_9c4eec && (
            <TouchableOpacity
              accessibilityLabel="transfer-open"
              onPress={() => v_dcba89(true)}
              style={{ padding: 12, borderWidth: 1, borderColor: '#d4d4d8', borderRadius: 8, marginTop: 12 }}
            >
              <Text>편집 권한 이전</Text>
            </TouchableOpacity>
          )}
          {v_552f41 && !v_9c4eec && (
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
      <View style={v_fd5f43.bottomBar}>
        <Button
          title="저장하기"
          variant="primary"
          onPress={v_1b8283}
          disabled={!v_1833e7}
          style={v_fd5f43.saveBtn}
        />
      </View>

      {}
      <Modal visible={v_7462ec} transparent animationType="fade">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_2dbd8f(false)}>
          <Pressable style={v_fd5f43.modalBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_fd5f43.modalTitle}>공개 설정</Text>
            <Text style={v_fd5f43.modalDesc}>페르소나의 공개 범위를 선택하세요</Text>
            <View style={v_fd5f43.visibilityOptions}>
              {(["public", "private", "followers"] as Visibility[]).map((v_81e2ef) => {
                const v_587413 = v_818579 === v_81e2ef;
                return (
                  <TouchableOpacity
                    key={v_81e2ef}
                    style={[v_fd5f43.visibilityOption, v_587413 && v_fd5f43.visibilityOptionSelected]}
                    onPress={() => v_c9f992(v_81e2ef)}
                  >
                    <Feather
                      name={v_a6deb1(v_81e2ef)}
                      size={16}
                      color={v_587413 ? v_1bfbd0.white : v_1bfbd0.zinc700}
                    />
                    <Text
                      style={[
                        v_fd5f43.visibilityOptionText,
                        v_587413 && { color: v_1bfbd0.white },
                      ]}
                    >
                      {v_82830c(v_81e2ef)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Button
              title="취소"
              variant="ghost"
              onPress={() => v_2dbd8f(false)}
              style={{ marginTop: 12, width: "100%" }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={v_c9d3fa} transparent animationType="fade">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_f32c49(false)}>
          <Pressable style={v_fd5f43.modalBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_fd5f43.modalTitle}>페르소나 삭제</Text>
            <Text style={v_fd5f43.modalDesc}>
              정말 이 페르소나를 삭제하시겠습니까?{"\n"}삭제된 페르소나는 복구할 수 없습니다.
            </Text>
            <View style={v_fd5f43.modalBtns}>
              <Button
                title="취소"
                variant="ghost"
                onPress={() => v_f32c49(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="삭제"
                variant="danger"
                onPress={v_6ff8af}
                style={{ flex: 1 }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <EditorTransferModal
        visible={v_0b1d04}
        coowners={v_a7d523}
        onClose={() => v_dcba89(false)}
        onSubmit={() => v_dcba89(false)}
      />

    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 80,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: v_1bfbd0.zinc500, marginBottom: 20 },

  categoryList: { gap: 12 },
  categoryItem: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.white,
  },
  categoryTitle: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 4 },
  categorySub: { fontSize: 12, color: v_1bfbd0.zinc500 },

  selectedCatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  selectedCatLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  selectedCatTitle: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.violet600 },
  primaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: v_1bfbd0.violet600,
    borderRadius: v_8b0c90.full,
  },
  primaryBadgeText: { fontSize: 11, fontWeight: "500", color: v_1bfbd0.white },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    borderRadius: 8,
  },
  changeBtnText: { fontSize: 12, fontWeight: "500", color: v_1bfbd0.zinc600 },

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
    borderColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.white,
  },
  interestSelected: {
    borderColor: v_1bfbd0.violet600,
    backgroundColor: v_1bfbd0.violet100,
  },
  interestIcon: { fontSize: 24, marginBottom: 8 },
  interestLabel: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  checkCircle: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: v_1bfbd0.violet600,
    alignItems: "center",
    justifyContent: "center",
  },

  customTitle: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900, marginTop: 24, marginBottom: 12 },
  customTags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  customTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: v_1bfbd0.violet100,
    borderWidth: 2,
    borderColor: v_1bfbd0.violet600,
    borderRadius: v_8b0c90.full,
  },
  etcChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: v_8b0c90.full,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    borderStyle: 'dashed',
    backgroundColor: v_1bfbd0.white,
  },
  etcChipText: { fontSize: 13, color: v_1bfbd0.zinc600 },

  simpleLabel: { fontSize: 13, fontWeight: '600', color: v_1bfbd0.zinc700, marginTop: 12 },
  simpleCatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  simpleCat: { padding: 10, borderRadius: v_8b0c90.sm, borderWidth: 1, borderColor: v_1bfbd0.zinc200 },
  simpleCatActive: { backgroundColor: v_1bfbd0.violet100, borderColor: v_1bfbd0.violet600 },
  simpleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  simpleCustomInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  simpleCustomTextInput: {
    flex: 1, borderWidth: 1, borderColor: v_1bfbd0.zinc200, borderRadius: v_8b0c90.sm,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: v_1bfbd0.zinc900,
  },
  simpleAddBtn: {
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: v_1bfbd0.violet600, borderRadius: v_8b0c90.sm,
  },
  simpleAddBtnText: { color: v_1bfbd0.white, fontSize: 14, fontWeight: '600' },
  simpleCustomTag: {
    paddingHorizontal: 12, paddingVertical: 6, backgroundColor: v_1bfbd0.violet100,
    borderRadius: v_8b0c90.full, borderWidth: 1, borderColor: v_1bfbd0.violet600,
  },
  simpleCustomTagText: { fontSize: 13, color: v_1bfbd0.violet600 },
  simpleEtcChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: v_8b0c90.full,
    borderWidth: 1, borderColor: v_1bfbd0.zinc300, borderStyle: 'dashed',
    backgroundColor: v_1bfbd0.white,
  },
  simpleEtcChipText: { fontSize: 13, color: v_1bfbd0.zinc600 },
  customTagText: { fontSize: 14, fontWeight: "500", color: v_1bfbd0.violet600 },
  customInputRow: { flexDirection: "row", gap: 8 },
  customTextInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.lg,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
  },
  addBtn: {
    paddingHorizontal: 20,
    height: 48,
    backgroundColor: v_1bfbd0.violet600,
    borderRadius: v_8b0c90.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.white },
  addCustomBtn: {
    padding: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: v_1bfbd0.zinc300,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addCustomText: { fontSize: 14, fontWeight: "500", color: v_1bfbd0.zinc600 },

  divider: { height: 1, backgroundColor: v_1bfbd0.zinc200, marginVertical: 24 },

  fieldLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: v_1bfbd0.zinc900,
    marginTop: 20,
    marginBottom: 8,
  },
  fieldHint: { fontSize: 12, color: v_1bfbd0.zinc500, marginBottom: 10 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: v_8b0c90.full,
    backgroundColor: v_1bfbd0.zinc100,
  },
  chipSelected: { backgroundColor: v_1bfbd0.zinc900 },
  chipText: { fontSize: 13, fontWeight: "500", color: v_1bfbd0.zinc600 },
  chipTextSelected: { color: v_1bfbd0.white },

  genderRow: { flexDirection: "row", gap: 12 },
  genderBtn: {
    flex: 1,
    height: 48,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc50,
    alignItems: "center",
    justifyContent: "center",
  },
  genderSelected: { backgroundColor: v_1bfbd0.zinc900 },
  genderText: { fontSize: 14, fontWeight: "500", color: v_1bfbd0.zinc600 },
  genderTextSelected: { color: v_1bfbd0.white },

  mbtiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mbtiItem: {
    width: "22%",
    height: 48,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc50,
    alignItems: "center",
    justifyContent: "center",
  },
  mbtiSelected: { backgroundColor: v_1bfbd0.zinc900 },
  mbtiText: { fontSize: 13, fontWeight: "500", color: v_1bfbd0.zinc600 },
  mbtiTextSelected: { color: v_1bfbd0.white },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: v_1bfbd0.white,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc200,
  },
  saveBtn: {
    borderRadius: v_8b0c90.full,
    width: "100%",
  },

  dropdown: {
    position: "absolute",
    right: 16,
    top: 100,
    zIndex: 50,
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    paddingVertical: 4,
    minWidth: 200,
    elevation: 8,
    shadowColor: v_1bfbd0.black,
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
  dropdownText: { fontSize: 14, color: v_1bfbd0.zinc700 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
    textAlign: "center",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
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
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  visibilityOptionSelected: {
    backgroundColor: v_1bfbd0.zinc900,
  },
  visibilityOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: v_1bfbd0.zinc700,
  },

  notFound: {
    flex: 1,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundText: { fontSize: 14, color: v_1bfbd0.zinc500 },
  beforeBox: {
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    backgroundColor: v_1bfbd0.zinc100,
    borderRadius: v_8b0c90.sm,
  },
  beforeLabel: { fontSize: 11, fontWeight: '700', color: v_1bfbd0.zinc500, marginBottom: 4 },
  beforeBody: { fontSize: 13, lineHeight: 18, color: v_1bfbd0.zinc700 },
  devBanner: {
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: v_8b0c90.sm,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    marginVertical: 16,
  },
  devBannerText: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  devBannerSub: { fontSize: 12, color: '#92400e', marginTop: 2 },
});
