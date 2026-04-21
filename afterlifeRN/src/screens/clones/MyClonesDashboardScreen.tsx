import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_9cabcb,
  v_cf9c33,
  v_aa7413,
  v_09d0e5,
  v_122070,
  v_79c4f2,
} from "rcmrninabrnb";
import { v_dec439, v_25515d } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import v_556baf from "../../components/ui/SafeView";
import v_1a40c4 from "../../components/ui/Button";
import v_258c1c from "../../components/common/PageHeader";
import { v_194498 } from "../../stores/cloneStore";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import type { v_affcc0 } from "../../types/clone";
import type { v_2d88fc } from "../../navigation/types";
import type { v_8ad91b } from "../../navigation/types";

type ClonesNav = v_390fcc<v_2d88fc>;

type Visibility = "public" | "private" | "followers";

export default function v_def15b() {
  const v_c65f5d = v_ada615<ClonesNav>();
  const v_f4c991 = v_ada615<v_390fcc<v_8ad91b>>();
  const v_4cd149 = v_194498((v_fd5f43) => v_fd5f43.myClones);

  const [v_699459, v_2bf327] = v_5ab095<
    Record<string, { isActive: boolean; visibility: Visibility }>
  >(
    v_4cd149.reduce(
      (v_9f1d92, v_eb25ce, v_ebec57) => ({
        ...v_9f1d92,
        [v_eb25ce.id]: {
          isActive: v_ebec57 !== 1, 
          visibility: v_eb25ce.visibility,
        },
      }),
      {},
    ),
  );

  const [v_8769c2, v_fb07c9] = v_5ab095<Set<string>>(new Set());
  const [v_ce3af0, v_8d2d61] = v_5ab095<string | null>(null);
  const [v_36d186, v_2dac5f] = v_5ab095(false);
  const [v_b93ea5, v_35dce3] = v_5ab095("");
  const [v_aa2223, v_b21d0d] = v_5ab095<Set<string>>(new Set());
  const [v_8bb912, v_d5cd7b] = v_5ab095<{
    type: "likes" | "interactions" | "comments" | "followers";
    cloneName: string;
  } | null>(null);
  const [v_16ef58, v_3e0da5] = v_5ab095<{
    cloneId: string;
    currentState: boolean;
  } | null>(null);
  const [v_7462ec, v_2dbd8f] = v_5ab095<{
    cloneId: string;
    currentVisibility: Visibility;
  } | null>(null);
  const [v_c9d3fa, v_f32c49] = v_5ab095<string | null>(null);

  const v_fc7f92 = v_4cd149.filter((v_3f4e2e) => !v_8769c2.has(v_3f4e2e.id));

  const v_2ba0d1 = v_fc7f92.filter(
    (v_3f4e2e) => v_699459[v_3f4e2e.id]?.isActive ?? true,
  ).length;

  const v_bf58a4 = (v_6e0fd3) => {
    const v_7d13fd = v_699459[v_6e0fd3]?.isActive ?? true;
    v_3e0da5({ cloneId: v_6e0fd3, currentState: v_7d13fd });
  };

  const v_a5c1a8 = () => {
    if (!v_16ef58) return;
    v_2bf327((v_ba2215) => ({
      ...v_ba2215,
      [v_16ef58.cloneId]: {
        ...v_ba2215[v_16ef58.cloneId],
        isActive: !v_16ef58.currentState,
      },
    }));
    v_3e0da5(null);
  };

  const v_11e385 = (v_6e0fd3) => {
    const v_275ccd = v_699459[v_6e0fd3]?.visibility ?? "public";
    v_2dbd8f({ cloneId: v_6e0fd3, currentVisibility: v_275ccd });
    v_8d2d61(null);
  };

  const v_c9f992 = (v_81e2ef) => {
    if (!v_7462ec) return;
    v_2bf327((v_ba2215) => ({
      ...v_ba2215,
      [v_7462ec.cloneId]: {
        ...v_ba2215[v_7462ec.cloneId],
        visibility: v_81e2ef,
      },
    }));
    v_2dbd8f(null);
  };

  const v_57fac2 = (v_6e0fd3) => {
    v_f32c49(v_6e0fd3);
    v_8d2d61(null);
  };

  const v_6ff8af = () => {
    if (v_c9d3fa) {
      v_fb07c9((v_ba2215) => new Set(v_ba2215).add(v_c9d3fa));
      v_f32c49(null);
    }
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

  const v_b80d74 = ({ item: v_eb25ce }: { item: v_affcc0 }) => {
    const v_b6e533 = v_699459[v_eb25ce.id];
    const v_26dce6 = v_b6e533?.isActive ?? true;
    const v_818579 = v_b6e533?.visibility ?? v_eb25ce.visibility;

    return (
      <View style={v_fd5f43.card}>
        {}
        <View style={v_fd5f43.cardTopRow}>
          <TouchableOpacity
            style={v_fd5f43.activeToggle}
            onPress={() => v_bf58a4(v_eb25ce.id)}
          >
            <Feather
              name={v_26dce6 ? "check-circle" : "circle"}
              size={18}
              color={v_26dce6 ? v_1bfbd0.success : v_1bfbd0.zinc400}
            />
            <Text style={v_fd5f43.activeText}>
              {v_26dce6 ? "활동중" : "비활동중"}
            </Text>
          </TouchableOpacity>

          <View style={v_fd5f43.cardTopRight}>
            <View style={v_fd5f43.visibilityBadge}>
              <Feather name={v_a6deb1(v_818579)} size={14} color={v_1bfbd0.zinc500} />
              <Text style={v_fd5f43.visibilityText}>{v_82830c(v_818579)}</Text>
            </View>
            <TouchableOpacity
              style={v_fd5f43.moreBtn}
              onPress={() => v_8d2d61(v_eb25ce.id)}
            >
              <Feather name="more-vertical" size={18} color={v_1bfbd0.zinc400} />
            </TouchableOpacity>
          </View>
        </View>

        {}
        <View style={v_fd5f43.cloneHeader}>
          <View style={v_fd5f43.avatarWrap}>
            <Image source={{ uri: v_eb25ce.avatarUrl }} style={v_fd5f43.avatar} />
            {v_26dce6 && <View style={v_fd5f43.activeDot} />}
          </View>
          <View style={v_fd5f43.cloneInfo}>
            <Text style={v_fd5f43.cloneName}>{v_eb25ce.name}</Text>
            <Text style={v_fd5f43.cloneCategory}>{v_eb25ce.category}</Text>
          </View>
        </View>

        {}
        <Text style={v_fd5f43.description} numberOfLines={2}>
          {v_eb25ce.description}
        </Text>

        {}
        <View style={v_fd5f43.statsRow}>
          <TouchableOpacity
            style={v_fd5f43.stat}
            onPress={() => v_d5cd7b({ type: "likes", cloneName: v_eb25ce.name })}
          >
            <Feather name="heart" size={14} color={v_1bfbd0.zinc500} />
            <Text style={v_fd5f43.statText}>2.4k</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={v_fd5f43.stat}
            onPress={() => v_d5cd7b({ type: "interactions", cloneName: v_eb25ce.name })}
          >
            <Ionicons name="chatbubbles-outline" size={14} color={v_1bfbd0.zinc500} />
            <Text style={v_fd5f43.statText}>4.5k</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={v_fd5f43.stat}
            onPress={() => v_d5cd7b({ type: "comments", cloneName: v_eb25ce.name })}
          >
            <Feather name="message-circle" size={14} color={v_1bfbd0.zinc500} />
            <Text style={v_fd5f43.statText}>328</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={v_fd5f43.stat}
            onPress={() => v_d5cd7b({ type: "followers", cloneName: v_eb25ce.name })}
          >
            <Feather name="user" size={14} color={v_1bfbd0.zinc500} />
            <Text style={v_fd5f43.statText}>15.2k</Text>
          </TouchableOpacity>
        </View>

        {}
        {v_eb25ce.status === 'pending_assets' && (
          <View style={v_fd5f43.pendingBadge}>
            <Feather name="clock" size={12} color={v_1bfbd0.zinc600} />
            <Text style={v_fd5f43.pendingText}>생성대기중</Text>
            <TouchableOpacity onPress={() => v_c65f5d.navigate('CloneEdit', { cloneId: v_eb25ce.id })}>
              <Text style={v_fd5f43.pendingCta}>사진/음성 추가하기</Text>
            </TouchableOpacity>
          </View>
        )}

        {}
        <View style={v_fd5f43.tagsRow}>
          {v_eb25ce.interests.map((v_bd1444, v_ebec57) => (
            <View key={v_ebec57} style={v_fd5f43.tag}>
              <Text style={v_fd5f43.tagText}>#{v_bd1444}</Text>
            </View>
          ))}
        </View>

        {}
        <View style={v_fd5f43.actionsRow}>
          <TouchableOpacity
            style={v_fd5f43.actionBtn}
            onPress={() => v_f4c991.navigate("Chat", { cloneId: v_eb25ce.id })}
          >
            <Feather name="message-circle" size={16} color={v_1bfbd0.zinc700} />
            <Text style={v_fd5f43.actionText}>학습하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={v_fd5f43.actionBtn}
            onPress={() => v_f4c991.navigate("Call", { cloneId: v_eb25ce.id })}
          >
            <Feather name="video" size={16} color={v_1bfbd0.zinc700} />
            <Text style={v_fd5f43.actionText}>통화하기</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={v_fd5f43.actionBtn}
            onPress={() => {
              v_35dce3("");
              v_b21d0d(new Set());
              v_2dac5f(true);
            }}
          >
            <Feather name="user-plus" size={16} color={v_1bfbd0.zinc700} />
            <Text style={v_fd5f43.actionText}>초대</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title="My Persona"
        rightAction={
          <TouchableOpacity style={{ padding: 4 }}>
            <Feather name="bell" size={22} color={v_1bfbd0.zinc700} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={v_fc7f92}
        keyExtractor={(v_8c0b26) => v_8c0b26.id}
        renderItem={v_b80d74}
        contentContainerStyle={v_fd5f43.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {}
            <View style={v_fd5f43.dashTitle}>
              <Text style={v_fd5f43.dashTitleText}>페르소나 대시보드</Text>
              <Text style={v_fd5f43.dashSubText}>
                생성된 AI 페르소나의 성과를 활용을 관리합니다.
              </Text>
            </View>

            {}
            <View style={v_fd5f43.statsOverview}>
              <View style={v_fd5f43.statsCard}>
                <View style={v_fd5f43.statsCardHeader}>
                  <Ionicons name="chatbubbles-outline" size={14} color={v_1bfbd0.zinc500} />
                  <Text style={v_fd5f43.statsCardLabel}>총 상호작용</Text>
                </View>
                <Text style={v_fd5f43.statsCardValue}>12.8k</Text>
                <Text style={v_fd5f43.statsCardDelta}>+14% 지난주 대비</Text>
              </View>

              <View style={[v_fd5f43.statsCard, v_fd5f43.statsCardDark]}>
                <View style={v_fd5f43.statsCardHeader}>
                  <Feather name="user" size={14} color={v_1bfbd0.zinc400} />
                  <Text style={[v_fd5f43.statsCardLabel, { color: v_1bfbd0.zinc400 }]}>
                    페르소나 활동
                  </Text>
                </View>
                <View style={v_fd5f43.activityCount}>
                  <Text style={v_fd5f43.activityActive}>{v_2ba0d1}</Text>
                  <Text style={v_fd5f43.activityTotal}>/ {v_fc7f92.length}</Text>
                </View>
              </View>
            </View>
          </>
        }
        ListFooterComponent={
          <TouchableOpacity style={v_fd5f43.loadMore}>
            <Text style={v_fd5f43.loadMoreText}>더보기</Text>
          </TouchableOpacity>
        }
      />

      {}
      <Modal visible={!!v_ce3af0} transparent animationType="fade">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_8d2d61(null)}>
          <Pressable style={v_fd5f43.menuBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_fd5f43.menuTitle}>관리</Text>
            <TouchableOpacity
              style={v_fd5f43.menuItem}
              onPress={() => {
                const v_389afb = v_ce3af0!;
                v_8d2d61(null);
                v_c65f5d.navigate("CloneEdit", { cloneId: v_389afb });
              }}
            >
              <Feather name="edit-2" size={18} color={v_1bfbd0.zinc700} />
              <Text style={v_fd5f43.menuItemText}>수정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={v_fd5f43.menuItem}
              onPress={() => {
                const v_389afb = v_ce3af0!;
                v_11e385(v_389afb);
              }}
            >
              <Feather
                name={v_a6deb1(v_699459[v_ce3af0!]?.visibility ?? "public")}
                size={18}
                color={v_1bfbd0.zinc700}
              />
              <Text style={v_fd5f43.menuItemText}>공개설정</Text>
            </TouchableOpacity>
            <View style={v_fd5f43.menuDivider} />
            <TouchableOpacity
              style={v_fd5f43.menuItem}
              onPress={() => {
                const v_389afb = v_ce3af0!;
                v_57fac2(v_389afb);
              }}
            >
              <Feather name="trash-2" size={18} color={v_1bfbd0.error} />
              <Text style={[v_fd5f43.menuItemText, { color: v_1bfbd0.error }]}>삭제</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!v_16ef58} transparent animationType="fade">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_3e0da5(null)}>
          <Pressable style={v_fd5f43.modalBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_fd5f43.modalTitle}>
              {v_16ef58?.currentState ? "페르소나 비활성화" : "페르소나 활성화"}
            </Text>
            <Text style={v_fd5f43.modalDesc}>
              {v_16ef58?.currentState
                ? "페르소나를 비활성화하시겠습니까? 비활성화 시 다른 사용자에게 노출되지 않습니다."
                : "페르소나를 활성화하시겠습니까? 활성화 시 다른 사용자에게 노출됩니다."}
            </Text>
            <View style={v_fd5f43.modalBtns}>
              <Button
                title="취소"
                variant="ghost"
                onPress={() => v_3e0da5(null)}
                style={v_fd5f43.modalBtnHalf}
              />
              <Button
                title="확인"
                variant="primary"
                onPress={v_a5c1a8}
                style={v_fd5f43.modalBtnHalf}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!v_7462ec} transparent animationType="fade">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_2dbd8f(null)}>
          <Pressable style={v_fd5f43.modalBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_fd5f43.modalTitle}>공개 설정</Text>
            <Text style={v_fd5f43.modalDesc}>페르소나의 공개 범위를 선택하세요</Text>
            <View style={v_fd5f43.visibilityOptions}>
              {(["public", "private", "followers"] as Visibility[]).map((v_81e2ef) => {
                const v_587413 = v_7462ec?.currentVisibility === v_81e2ef;
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
              onPress={() => v_2dbd8f(null)}
              style={{ marginTop: 12, width: "100%" }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!v_c9d3fa} transparent animationType="fade">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_f32c49(null)}>
          <Pressable style={v_fd5f43.modalBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_fd5f43.modalTitle}>페르소나 삭제</Text>
            <Text style={v_fd5f43.modalDesc}>
              정말 이 페르소나를 삭제하시겠습니까?{"\n"}삭제된 페르소나는 복구할 수 없습니다.
            </Text>
            <View style={v_fd5f43.modalBtns}>
              <Button
                title="취소"
                variant="ghost"
                onPress={() => v_f32c49(null)}
                style={v_fd5f43.modalBtnHalf}
              />
              <Button
                title="삭제"
                variant="danger"
                onPress={v_6ff8af}
                style={v_fd5f43.modalBtnHalf}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={v_36d186} transparent animationType="slide">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_2dac5f(false)}>
          <View style={v_fd5f43.inviteSheet} onStartShouldSetResponder={() => true}>
            <View style={v_fd5f43.sheetHandle} />
            <View style={v_fd5f43.inviteHeader}>
              <Text style={v_fd5f43.inviteTitle}>페르소나 초대</Text>
              <TouchableOpacity onPress={() => v_2dac5f(false)}>
                <Feather name="x" size={20} color={v_1bfbd0.zinc500} />
              </TouchableOpacity>
            </View>

            {}
            <View style={v_fd5f43.inviteSearchWrap}>
              <Feather name="search" size={18} color={v_1bfbd0.zinc400} />
              <TextInput
                style={v_fd5f43.inviteSearchInput}
                value={v_b93ea5}
                onChangeText={v_35dce3}
                placeholder="이름 또는 계정으로 검색"
                placeholderTextColor={v_1bfbd0.placeholder}
                autoFocus
              />
              {v_b93ea5.length > 0 && (
                <TouchableOpacity onPress={() => v_35dce3("")}>
                  <Feather name="x-circle" size={16} color={v_1bfbd0.zinc400} />
                </TouchableOpacity>
              )}
            </View>

            {}
            <ScrollView style={v_fd5f43.inviteList} showsVerticalScrollIndicator={false}>
              {v_56fdc3
                .filter((v_ceb55a) =>
                  v_b93ea5.length === 0 ||
                  v_ceb55a.name.includes(v_b93ea5) ||
                  v_ceb55a.username.toLowerCase().includes(v_b93ea5.toLowerCase()),
                )
                .map((v_625c74) => {
                  const v_f966e3 = v_aa2223.has(v_625c74.id);
                  return (
                    <View key={v_625c74.id} style={v_fd5f43.inviteRow}>
                      <Image source={{ uri: v_625c74.avatar }} style={v_fd5f43.inviteAvatar} />
                      <View style={v_fd5f43.inviteInfo}>
                        <Text style={v_fd5f43.inviteName}>{v_625c74.name}</Text>
                        <Text style={v_fd5f43.inviteUsername}>{v_625c74.username}</Text>
                      </View>
                      <TouchableOpacity
                        style={[v_fd5f43.inviteBtn, v_f966e3 && v_fd5f43.inviteBtnSent]}
                        disabled={v_f966e3}
                        onPress={() =>
                          v_b21d0d((v_ba2215) => new Set(v_ba2215).add(v_625c74.id))
                        }
                      >
                        <Feather
                          name={v_f966e3 ? "check" : "send"}
                          size={14}
                          color={v_f966e3 ? v_1bfbd0.success : v_1bfbd0.white}
                        />
                        <Text style={[v_fd5f43.inviteBtnText, v_f966e3 && v_fd5f43.inviteBtnTextSent]}>
                          {v_f966e3 ? "전송됨" : "초대"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!v_8bb912} transparent animationType="slide">
        <Pressable style={v_fd5f43.modalOverlay} onPress={() => v_d5cd7b(null)}>
          <View style={v_fd5f43.statsSheet} onStartShouldSetResponder={() => true}>
            <View style={v_fd5f43.sheetHandle} />
            <Text style={v_fd5f43.statsSheetTitle}>
              {v_8bb912?.type === "likes" && "좋아요"}
              {v_8bb912?.type === "interactions" && "상호작용"}
              {v_8bb912?.type === "comments" && "댓글"}
              {v_8bb912?.type === "followers" && "팔로워"}
            </Text>
            <Text style={v_fd5f43.statsSheetSub}>
              {v_8bb912?.cloneName}
            </Text>

            <ScrollView style={v_fd5f43.statsScrollArea} showsVerticalScrollIndicator={false}>
              {}
              {v_8bb912?.type === "comments" && v_2fb1c1.map((v_3f4e2e) => (
                <View key={v_3f4e2e.id} style={v_fd5f43.commentRow}>
                  <View style={v_fd5f43.commentTop}>
                    <Image source={{ uri: v_3f4e2e.avatar }} style={v_fd5f43.commentAvatar} />
                    <Text style={v_fd5f43.commentName}>{v_3f4e2e.name}</Text>
                    <Text style={v_fd5f43.commentTime}>{v_3f4e2e.time}</Text>
                  </View>
                  <Text style={v_fd5f43.commentText}>{v_3f4e2e.text}</Text>
                </View>
              ))}

              {}
              {(v_8bb912?.type === "likes" || v_8bb912?.type === "followers") &&
                v_b62688.map((v_b4542a) => (
                  <View key={v_b4542a.id} style={v_fd5f43.accountRow}>
                    <Image source={{ uri: v_b4542a.avatar }} style={v_fd5f43.accountAvatar} />
                    <View style={v_fd5f43.accountInfo}>
                      <Text style={v_fd5f43.accountName}>{v_b4542a.name}</Text>
                      <Text style={v_fd5f43.accountSub}>{v_b4542a.detail}</Text>
                    </View>
                  </View>
                ))}

              {}
              {v_8bb912?.type === "interactions" &&
                v_2c1f99.map((v_b4542a) => (
                  <View key={v_b4542a.id} style={v_fd5f43.accountRow}>
                    <Image source={{ uri: v_b4542a.avatar }} style={v_fd5f43.accountAvatar} />
                    <View style={v_fd5f43.accountInfo}>
                      <Text style={v_fd5f43.accountName}>{v_b4542a.name}</Text>
                      <Text style={v_fd5f43.accountSub}>{v_b4542a.detail}</Text>
                    </View>
                  </View>
                ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeView>
  );
}

const v_b62688 = [
  { id: "u1", name: "김민수", avatar: "https://i.pravatar.cc/100?img=1", detail: "@minsu_k" },
  { id: "u2", name: "이서연", avatar: "https://i.pravatar.cc/100?img=5", detail: "@seoyeon_lee" },
  { id: "u3", name: "박지훈", avatar: "https://i.pravatar.cc/100?img=3", detail: "@jihun.park" },
  { id: "u4", name: "최유진", avatar: "https://i.pravatar.cc/100?img=9", detail: "@yujin_choi" },
  { id: "u5", name: "정하은", avatar: "https://i.pravatar.cc/100?img=10", detail: "@haeun_j" },
];

const v_2c1f99 = [
  { id: "i1", name: "김민수", avatar: "https://i.pravatar.cc/100?img=1", detail: "마지막 대화: 2시간 전" },
  { id: "i2", name: "이서연", avatar: "https://i.pravatar.cc/100?img=5", detail: "마지막 대화: 어제" },
  { id: "i3", name: "박지훈", avatar: "https://i.pravatar.cc/100?img=3", detail: "마지막 대화: 3일 전" },
  { id: "i4", name: "최유진", avatar: "https://i.pravatar.cc/100?img=9", detail: "마지막 대화: 1주 전" },
];

const v_2fb1c1 = [
  { id: "c1", name: "김민수", avatar: "https://i.pravatar.cc/100?img=1", text: "정말 도움이 많이 됐어요! 감사합니다.", time: "2시간 전" },
  { id: "c2", name: "이서연", avatar: "https://i.pravatar.cc/100?img=5", text: "이 페르소나 대화 퀄리티가 진짜 좋네요", time: "5시간 전" },
  { id: "c3", name: "박지훈", avatar: "https://i.pravatar.cc/100?img=3", text: "위로가 되는 말씀 감사해요 ㅠㅠ", time: "어제" },
  { id: "c4", name: "최유진", avatar: "https://i.pravatar.cc/100?img=9", text: "매일 대화하고 있어요 추천합니다!", time: "2일 전" },
  { id: "c5", name: "정하은", avatar: "https://i.pravatar.cc/100?img=10", text: "목소리도 자연스럽고 너무 좋아요", time: "3일 전" },
];

const v_56fdc3 = [
  { id: "inv1", name: "김태희", username: "@taehee_kim", avatar: "https://i.pravatar.cc/100?img=11" },
  { id: "inv2", name: "이준혁", username: "@junhyuk_lee", avatar: "https://i.pravatar.cc/100?img=12" },
  { id: "inv3", name: "박소연", username: "@soyeon_park", avatar: "https://i.pravatar.cc/100?img=13" },
  { id: "inv4", name: "최민재", username: "@minjae_choi", avatar: "https://i.pravatar.cc/100?img=14" },
  { id: "inv5", name: "정유나", username: "@yuna_jung", avatar: "https://i.pravatar.cc/100?img=15" },
  { id: "inv6", name: "한서준", username: "@seojun_han", avatar: "https://i.pravatar.cc/100?img=16" },
  { id: "inv7", name: "윤채원", username: "@chaewon_yoon", avatar: "https://i.pravatar.cc/100?img=17" },
  { id: "inv8", name: "김하늘", username: "@haneul_k", avatar: "https://i.pravatar.cc/100?img=18" },
];

const v_fd5f43 = v_472849.create({
  listContent: {
    paddingHorizontal: v_9b1a04.medium,
    paddingBottom: 24,
  },

  dashTitle: { marginTop: 16, marginBottom: 20 },
  dashTitleText: { fontSize: 20, fontWeight: "700", color: v_1bfbd0.zinc900 },
  dashSubText: { fontSize: 13, color: v_1bfbd0.zinc500, marginTop: 4 },

  statsOverview: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    backgroundColor: v_1bfbd0.zinc50,
    borderRadius: 24,
    padding: 20,
  },
  statsCardDark: {
    backgroundColor: v_1bfbd0.zinc900,
  },
  statsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  statsCardLabel: { fontSize: 11, color: v_1bfbd0.zinc500 },
  statsCardValue: { fontSize: 28, fontWeight: "700", color: v_1bfbd0.zinc900 },
  statsCardDelta: { fontSize: 11, color: v_1bfbd0.success, fontWeight: "500", marginTop: 4 },
  activityCount: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  activityActive: { fontSize: 44, fontWeight: "700", color: v_1bfbd0.white },
  activityTotal: { fontSize: 28, color: v_1bfbd0.zinc400 },

  card: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 24,
    padding: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    marginBottom: 16,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  activeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeText: { fontSize: 12, fontWeight: "500", color: v_1bfbd0.zinc600 },
  cardTopRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  visibilityBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  visibilityText: { fontSize: 13, color: v_1bfbd0.zinc500 },
  moreBtn: { padding: 4 },

  menuBox: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 20,
    padding: 8,
    width: "100%",
    maxWidth: 320,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
    textAlign: "center",
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: v_8b0c90.lg,
  },
  menuItemText: { fontSize: 15, color: v_1bfbd0.zinc700 },
  menuDivider: {
    height: 1,
    backgroundColor: v_1bfbd0.zinc200,
    marginHorizontal: 16,
    marginVertical: 4,
  },

  cloneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  activeDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: v_1bfbd0.success,
    borderWidth: 2,
    borderColor: v_1bfbd0.white,
  },
  cloneInfo: { flex: 1 },
  cloneName: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900 },
  cloneCategory: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },

  description: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
    lineHeight: 20,
    marginBottom: 14,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 14,
  },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 13, color: v_1bfbd0.zinc500 },

  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: v_1bfbd0.zinc100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  pendingText: { fontSize: 11, color: v_1bfbd0.zinc600 },
  pendingCta: { fontSize: 11, color: v_1bfbd0.violet600, marginLeft: 4, textDecorationLine: 'underline' },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: v_1bfbd0.zinc100,
    borderRadius: v_8b0c90.full,
  },
  tagText: { fontSize: 12, color: v_1bfbd0.zinc600 },

  actionsRow: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionText: { fontSize: 12, fontWeight: "500", color: v_1bfbd0.zinc700 },

  loadMore: {
    height: 48,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loadMoreText: { fontSize: 14, fontWeight: "500", color: v_1bfbd0.zinc900 },

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
  modalBtnHalf: { flex: 1 },

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

  statsSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 32,
    maxHeight: "60%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc300,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  statsSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    marginBottom: 4,
  },
  statsSheetSub: {
    fontSize: 13,
    color: v_1bfbd0.zinc500,
    marginBottom: 16,
  },
  statsScrollArea: {
    flex: 1,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: v_1bfbd0.zinc200,
  },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  accountSub: { fontSize: 13, color: v_1bfbd0.zinc500, marginTop: 2 },

  commentRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  commentTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: v_1bfbd0.zinc200,
  },
  commentName: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  commentTime: { fontSize: 12, color: v_1bfbd0.zinc400 },
  commentText: {
    fontSize: 14,
    color: v_1bfbd0.zinc700,
    lineHeight: 20,
    paddingLeft: 36,
  },

  inviteSheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 32,
    maxHeight: "70%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  inviteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  inviteTitle: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900 },
  inviteSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: v_1bfbd0.zinc100,
    borderRadius: v_8b0c90.full,
    paddingHorizontal: 16,
    height: 44,
    marginBottom: 16,
  },
  inviteSearchInput: {
    flex: 1,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
  },
  inviteList: { flex: 1 },
  inviteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  inviteAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: v_1bfbd0.zinc200,
  },
  inviteInfo: { flex: 1 },
  inviteName: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  inviteUsername: { fontSize: 13, color: v_1bfbd0.zinc500, marginTop: 2 },
  inviteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: v_8b0c90.full,
    backgroundColor: v_1bfbd0.zinc900,
  },
  inviteBtnSent: {
    backgroundColor: v_1bfbd0.zinc100,
  },
  inviteBtnText: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.white },
  inviteBtnTextSent: { color: v_1bfbd0.success },
});
