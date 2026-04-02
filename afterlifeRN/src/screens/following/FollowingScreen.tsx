import v_a3453e, { v_5ab095, v_df9f57, v_c4deb2, v_e662ae, v_de06a3 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_cf9c33,
  v_9cabcb,
  v_122070,
  v_aa7413,
  v_09d0e5,
  v_79c4f2,
  v_700696,
  v_a2349e,
  type v_bd64bf,
  type v_da479e,
} from "rcmrninabrnb";
import { v_dec439, v_25515d } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import v_556baf from "../../components/ui/SafeView";
import v_1a40c4 from "../../components/ui/Button";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import type { v_8ad91b } from "../../navigation/types";

type RootNav = v_390fcc<v_8ad91b>;
const { width: v_437248 } = v_700696.get("window");

const v_a48e44 = [
  {
    id: "f1",
    name: "경제전문가",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=1200&fit=crop",
    interests: ["경제", "주식", "부동산"],
    creatorAccount: "@economy_lover_99",
    intimacy: 68,
    interactions: 2340,
  },
  {
    id: "f2",
    name: "요가선생님",
    avatar: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=1200&fit=crop",
    interests: ["건강", "명상", "요가"],
    creatorAccount: "@wellness_kim",
    intimacy: 82,
    interactions: 1567,
  },
];

const v_09f9d7 = [
  { id: 1, personaId: "f1", content: "부동산 시장의 새로운 트렌드를 분석했습니다. 지금이 기회일 수 있습니다.", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=1200&fit=crop", likes: 2100 },
  { id: 2, personaId: "f2", content: "아침 명상으로 하루를 시작하세요. 5분의 고요함이 당신의 하루를 바꿉니다.", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=1200&fit=crop", likes: 1800 },
];

const v_5b3987 = {
  1: [
    { id: "c1", author: "@investor_kim", avatar: "https://i.pravatar.cc/100?img=1", content: "정말 유익한 분석입니다! 감사합니다.", time: "5분 전" },
    { id: "c2", author: "@market_lover", avatar: "https://i.pravatar.cc/100?img=5", content: "장기 투자 관점으로 접근하겠습니다.", time: "12분 전" },
    { id: "c3", author: "@finance_pro", avatar: "https://i.pravatar.cc/100?img=3", content: "좋은 인사이트네요", time: "20분 전" },
  ],
  2: [
    { id: "c4", author: "@healing_soul", avatar: "https://i.pravatar.cc/100?img=9", content: "위로가 됩니다. 감사해요", time: "3분 전" },
    { id: "c5", author: "@mindful_life", avatar: "https://i.pravatar.cc/100?img=10", content: "오늘도 힘내세요!", time: "15분 전" },
  ],
};

const v_0e7586 = [
  { personaId: "f2", lastCallTime: "어제", duration: "8분 21초" },
  { personaId: "f1", lastCallTime: "3일 전", duration: "15분 32초" },
];

const v_cae9dc = (v_f4e98d) => (v_f4e98d >= 1000 ? `${(v_f4e98d / 1000).toFixed(1)}k` : String(v_f4e98d));

export default function v_14b43e() {
  const v_f4c991 = v_ada615<RootNav>();

  const [v_69ddfb, v_09b78b] = v_5ab095("전체");
  const [v_c591dc, v_6f4b5a] = v_5ab095<Set<number>>(new Set());
  const [v_868955, v_12374c] = v_5ab095<Set<string>>(new Set());

  const [v_5c83d5, v_880166] = v_5ab095<number | null>(null);
  const [v_48e7fe, v_856f84] = v_5ab095("");
  const [v_7babe8, v_cdeef7] = v_5ab095<string | null>(null);
  const [v_15a54d, v_649cb3] = v_5ab095(false);
  const [v_a24949, v_0af5ed] = v_5ab095(false);
  const [v_af84de, v_22a5cb] = v_5ab095(false);
  const [v_2116d2, v_83f9d3] = v_5ab095("");
  const [v_8282fa, v_15c939] = v_5ab095<string | null>(null);

  const v_0bbee6 = v_e662ae(0);
  const v_b96ea6 = v_e662ae(new v_a2349e.Value(0)).current; 

  const v_023642 = v_de06a3((e: v_bd64bf<v_da479e>) => {
    const v_c1c8c6 = v_9e86fd.nativeEvent.contentOffset.y;
    const v_a41a1b = v_c1c8c6 - v_0bbee6.current;
    if (v_a41a1b > 8 && v_c1c8c6 > 50) {

      v_a2349e.timing(v_b96ea6, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else if (v_a41a1b < -8) {

      v_a2349e.timing(v_b96ea6, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
    v_0bbee6.current = v_c1c8c6;
  }, [v_b96ea6]);

  const v_e541d8 = v_b96ea6.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });

  v_c4deb2(() => {
    if (v_8282fa) {
      const v_8d41d7 = setTimeout(() => v_15c939(null), 2000);
      return () => clearTimeout(v_8d41d7);
    }
  }, [v_8282fa]);

  const v_8bc599 = v_df9f57(() => {
    const v_cf5673 = new Set<string>();
    v_a48e44.forEach((v_e2a85c) => v_e2a85c.interests.forEach((v_ebec57) => v_cf5673.add(v_ebec57)));
    return ["전체", ...Array.from(v_cf5673)];
  }, []);

  const v_b94d82 = v_df9f57(() => {
    let v_e4cf17 = v_09f9d7.filter((v_e2a85c) => !v_868955.has(v_e2a85c.personaId));
    if (v_69ddfb !== "전체") {
      const v_52e08b = v_a48e44.filter((v_e2a85c) => v_e2a85c.interests.includes(v_69ddfb)).map((v_e2a85c) => v_e2a85c.id);
      v_e4cf17 = v_e4cf17.filter((v_e2a85c) => v_52e08b.includes(v_e2a85c.personaId));
    }
    return v_e4cf17.map((v_4f438a) => {
      const v_5ed063 = v_a48e44.find((v_e2a85c) => v_e2a85c.id === v_4f438a.personaId)!;
      return { ...v_4f438a, persona: v_5ed063 };
    });
  }, [v_69ddfb, v_868955]);

  const v_94f30e = v_df9f57(() => {
    if (!v_2116d2.trim()) return v_a48e44;
    const v_ab6401 = v_2116d2.toLowerCase();
    return v_a48e44.filter((v_e2a85c) => v_e2a85c.name.toLowerCase().includes(v_ab6401) || v_e2a85c.creatorAccount.toLowerCase().includes(v_ab6401));
  }, [v_2116d2]);

  const v_a96ced = (v_389afb) => {
    v_6f4b5a((v_ba2215) => { const v_fd5f43 = new Set(v_ba2215); v_fd5f43.has(v_389afb) ? v_fd5f43.delete(v_389afb) : v_fd5f43.add(v_389afb); return v_fd5f43; });
  };

  const v_2d8ccb = () => {
    if (v_7babe8) {
      v_12374c((v_ba2215) => new Set(v_ba2215).add(v_7babe8));
      v_cdeef7(null);
    }
  };

  const v_3a63e7 = v_5c83d5 ? v_5b3987[v_5c83d5] || [] : [];

  const v_bdaeb6 = ({ item: v_8c0b26 }: { item: (typeof v_b94d82)[0] }) => (
    <View style={v_fd5f43.postWrap}>
      {}
      <View style={v_fd5f43.imageWrap}>
        <Image source={{ uri: v_8c0b26.image }} style={v_fd5f43.postImage} resizeMode="cover" />

        {}
        <View style={v_fd5f43.statsBadge}>
          <TouchableOpacity style={v_fd5f43.badgeBtn} onPress={() => v_649cb3(true)}>
            <Feather name="thermometer" size={12} color="#fb923c" />
            <Text style={v_fd5f43.badgeText}>{v_8c0b26.persona.intimacy}°C</Text>
          </TouchableOpacity>
          <View style={v_fd5f43.badgeDivider} />
          <TouchableOpacity style={v_fd5f43.badgeBtn} onPress={() => v_0af5ed(true)}>
            <Ionicons name="chatbubbles-outline" size={12} color="#60a5fa" />
            <Text style={v_fd5f43.badgeText}>{v_cae9dc(v_8c0b26.persona.interactions)}</Text>
          </TouchableOpacity>
        </View>

        {}
        <View style={v_fd5f43.overlayContent}>
          <Text style={v_fd5f43.personaName}>{v_8c0b26.persona.name}</Text>
          <Text style={v_fd5f43.creatorAccount}>{v_8c0b26.persona.creatorAccount}</Text>
          <View style={v_fd5f43.tagRow}>
            {v_8c0b26.persona.interests.map((v_bd1444, v_ebec57) => (
              <View key={v_ebec57} style={v_fd5f43.overlayTag}>
                <Text style={v_fd5f43.overlayTagText}>#{v_bd1444}</Text>
              </View>
            ))}
          </View>
          <Text style={v_fd5f43.postContent} numberOfLines={3}>{v_8c0b26.content}</Text>
          <View style={v_fd5f43.overlayBtns}>
            <Button
              title="통화하기"
              variant="secondary"
              size="md"
              leftIcon={<Feather name="video" size={14} color={v_1bfbd0.zinc900} />}
              onPress={() => v_f4c991.navigate("Call", { cloneId: v_8c0b26.personaId, name: v_8c0b26.persona.name, image: v_8c0b26.persona.avatar })}
              style={v_fd5f43.overlayBtn}
              textColor={v_1bfbd0.zinc900}
              backgroundColor={v_1bfbd0.white}
            />
            <Button
              title="팔로우 취소"
              variant="ghost"
              size="md"
              leftIcon={<Feather name="user-minus" size={14} color={v_1bfbd0.white} />}
              onPress={() => v_cdeef7(v_8c0b26.personaId)}
              style={{ ...v_fd5f43.overlayBtn, ...v_fd5f43.overlayBtnGhost }}
              textColor={v_1bfbd0.white}
              backgroundColor="rgba(255,255,255,0.2)"
            />
          </View>
        </View>
      </View>

      {}
      <View style={v_fd5f43.actionsRow}>
        <View style={v_fd5f43.actionsLeft}>
          <TouchableOpacity onPress={() => v_a96ced(v_8c0b26.id)}>
            <Ionicons name={v_c591dc.has(v_8c0b26.id) ? "heart" : "heart-outline"} size={24} color={v_c591dc.has(v_8c0b26.id) ? "#ef4444" : v_1bfbd0.zinc700} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => v_880166(v_8c0b26.id)}>
            <Feather name="message-circle" size={24} color={v_1bfbd0.zinc700} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Feather name="share-2" size={22} color={v_1bfbd0.zinc700} />
          </TouchableOpacity>
        </View>
        <View style={v_fd5f43.actionsRight}>
          <Text style={v_fd5f43.countText}>좋아요 {v_8c0b26.likes + (v_c591dc.has(v_8c0b26.id) ? 1 : 0)}개</Text>
          <Text style={v_fd5f43.countTextSub}>댓글 {(v_5b3987[v_8c0b26.id] || []).length}개</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title="Following"
        rightAction={
          <TouchableOpacity style={{ padding: 4 }}>
            <Feather name="bell" size={22} color={v_1bfbd0.zinc700} />
          </TouchableOpacity>
        }
      />

      {}
      <View style={v_fd5f43.tabWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={v_fd5f43.tabRow}>
          {v_8bc599.map((v_9bf432) => (
            <TouchableOpacity key={v_9bf432} style={[v_fd5f43.tab, v_69ddfb === v_9bf432 && v_fd5f43.tabActive]} onPress={() => v_09b78b(v_9bf432)}>
              <Text style={[v_fd5f43.tabText, v_69ddfb === v_9bf432 && v_fd5f43.tabTextActive]}>{v_9bf432}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {}
      <FlatList
        data={v_b94d82}
        keyExtractor={(v_8c0b26) => String(v_8c0b26.id)}
        renderItem={v_bdaeb6}
        contentContainerStyle={v_fd5f43.feed}
        showsVerticalScrollIndicator={false}
        onScroll={v_023642}
        scrollEventThrottle={16}
      />

      {}
      <Animated.View style={[v_fd5f43.floatingCallBtn, { transform: [{ translateY: v_e541d8 }] }]}>
        <TouchableOpacity
          style={v_fd5f43.floatingCallBtnInner}
          activeOpacity={0.8}
          onPress={() => { v_83f9d3(""); v_22a5cb(true); }}
        >
          <Feather name="phone" size={24} color={v_1bfbd0.white} />
        </TouchableOpacity>
      </Animated.View>

      {}
      <Modal visible={v_15a54d} transparent animationType="fade">
        <Pressable style={v_fd5f43.centerOverlay} onPress={() => v_649cb3(false)}>
          <Pressable style={v_fd5f43.infoBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <View style={v_fd5f43.infoHeader}>
              <View style={v_fd5f43.infoHeaderLeft}>
                <Feather name="thermometer" size={18} color="#fb923c" />
                <Text style={v_fd5f43.infoTitle}>친밀도 온도</Text>
              </View>
              <TouchableOpacity onPress={() => v_649cb3(false)}>
                <Feather name="x" size={20} color={v_1bfbd0.zinc400} />
              </TouchableOpacity>
            </View>
            <Text style={v_fd5f43.infoDesc}>
              친밀도 온도는 페르소나와의 관계 깊이를 나타냅니다. 대화를 나누고 상호작용할수록 온도가 올라가며, 더욱 자연스럽고 개인화된 대화가 가능해집니다.
            </Text>
            {[["0-30°C", "처음 만나는 단계"], ["31-60°C", "친숙해지는 단계"], ["61-90°C", "깊은 유대감 형성"], ["91-100°C", "최고의 친밀도"]].map(([v_4f2c9c, v_41b99d], v_ebec57) => (
              <View key={v_ebec57} style={v_fd5f43.levelRow}>
                <Text style={[v_fd5f43.levelRange, v_ebec57 === 3 && { color: "#f97316" }]}>{v_4f2c9c}</Text>
                <Text style={[v_fd5f43.levelDesc, v_ebec57 === 3 && { color: "#f97316" }]}>{v_41b99d}</Text>
              </View>
            ))}
            <Button title="확인" variant="primary" onPress={() => v_649cb3(false)} style={{ marginTop: 20, width: "100%", borderRadius: v_8b0c90.full }} />
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={v_a24949} transparent animationType="fade">
        <Pressable style={v_fd5f43.centerOverlay} onPress={() => v_0af5ed(false)}>
          <Pressable style={v_fd5f43.infoBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <View style={v_fd5f43.infoHeader}>
              <View style={v_fd5f43.infoHeaderLeft}>
                <Ionicons name="chatbubbles-outline" size={18} color="#60a5fa" />
                <Text style={v_fd5f43.infoTitle}>상호작용 횟수</Text>
              </View>
              <TouchableOpacity onPress={() => v_0af5ed(false)}>
                <Feather name="x" size={20} color={v_1bfbd0.zinc400} />
              </TouchableOpacity>
            </View>
            <Text style={v_fd5f43.infoDesc}>
              상호작용 횟수는 페르소나와 나눈 대화, 통화, 학습 활동의 총 횟수를 의미합니다.
            </Text>
            <View style={v_fd5f43.activityBox}>
              <Text style={v_fd5f43.activityBoxTitle}>포함되는 활동</Text>
              {["채팅 대화", "음성/영상 통화", "학습 세션", "피드 상호작용"].map((v_779914, v_ebec57) => (
                <Text key={v_ebec57} style={v_fd5f43.activityItem}>• {v_779914}</Text>
              ))}
            </View>
            <Button title="확인" variant="primary" onPress={() => v_0af5ed(false)} style={{ marginTop: 16, width: "100%", borderRadius: v_8b0c90.full }} />
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!v_5c83d5} transparent animationType="slide">
        <Pressable style={v_fd5f43.bottomOverlay} onPress={() => v_880166(null)}>
          <View style={v_fd5f43.commentSheet} onStartShouldSetResponder={() => true}>
            <View style={v_fd5f43.sheetHandle} />
            <View style={v_fd5f43.commentHeaderRow}>
              <Text style={v_fd5f43.commentTitle}>댓글 {v_3a63e7.length}개</Text>
              <TouchableOpacity onPress={() => v_880166(null)}>
                <Feather name="x" size={20} color={v_1bfbd0.zinc600} />
              </TouchableOpacity>
            </View>
            <ScrollView style={v_fd5f43.commentScroll} showsVerticalScrollIndicator={false}>
              {v_3a63e7.length > 0 ? v_3a63e7.map((v_3f4e2e) => (
                <View key={v_3f4e2e.id} style={v_fd5f43.commentRow}>
                  <Image source={{ uri: v_3f4e2e.avatar }} style={v_fd5f43.commentAvatar} />
                  <View style={v_fd5f43.commentInfo}>
                    <View style={v_fd5f43.commentMeta}>
                      <Text style={v_fd5f43.commentAuthor}>{v_3f4e2e.author}</Text>
                      <Text style={v_fd5f43.commentTime}>{v_3f4e2e.time}</Text>
                    </View>
                    <Text style={v_fd5f43.commentContent}>{v_3f4e2e.content}</Text>
                  </View>
                </View>
              )) : (
                <View style={v_fd5f43.emptyComment}>
                  <Feather name="message-circle" size={40} color={v_1bfbd0.zinc300} />
                  <Text style={v_fd5f43.emptyText}>아직 댓글이 없습니다</Text>
                  <Text style={v_fd5f43.emptySubText}>첫 번째 댓글을 작성해보세요!</Text>
                </View>
              )}
            </ScrollView>
            <View style={v_fd5f43.commentInputRow}>
              <TextInput
                style={v_fd5f43.commentInput}
                value={v_48e7fe}
                onChangeText={v_856f84}
                placeholder="댓글 달기..."
                placeholderTextColor={v_1bfbd0.placeholder}
              />
              <TouchableOpacity disabled={!v_48e7fe.trim()} onPress={() => v_856f84("")}>
                <Feather name="send" size={18} color={v_48e7fe.trim() ? v_1bfbd0.zinc900 : v_1bfbd0.zinc400} />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!v_7babe8} transparent animationType="fade">
        <Pressable style={v_fd5f43.centerOverlay} onPress={() => v_cdeef7(null)}>
          <Pressable style={v_fd5f43.confirmBox} onPress={(v_9e86fd) => v_9e86fd.stopPropagation()}>
            <Text style={v_fd5f43.confirmTitle}>팔로우 취소</Text>
            <Text style={v_fd5f43.confirmDesc}>
              정말 이 페르소나의 팔로우를 취소하시겠습니까?{"\n"}피드에서 해당 페르소나의 포스트가 더 이상 표시되지 않습니다.
            </Text>
            <View style={v_fd5f43.confirmBtns}>
              <Button title="취소" variant="ghost" onPress={() => v_cdeef7(null)} style={{ flex: 1 }} />
              <Button title="팔로우 취소" variant="danger" onPress={v_2d8ccb} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={v_af84de} transparent animationType="slide">
        <Pressable style={v_fd5f43.bottomOverlay} onPress={() => v_22a5cb(false)}>
          <View style={v_fd5f43.callSheet} onStartShouldSetResponder={() => true}>
            <View style={v_fd5f43.sheetHandle} />
            <View style={v_fd5f43.callSheetHeader}>
              <Text style={v_fd5f43.callSheetTitle}>통화하기</Text>
              <TouchableOpacity onPress={() => v_22a5cb(false)}>
                <Feather name="x" size={20} color={v_1bfbd0.zinc600} />
              </TouchableOpacity>
            </View>

            {}
            <View style={v_fd5f43.callSearchWrap}>
              <Feather name="search" size={18} color={v_1bfbd0.zinc400} />
              <TextInput
                style={v_fd5f43.callSearchInput}
                value={v_2116d2}
                onChangeText={v_83f9d3}
                placeholder="페르소나 검색..."
                placeholderTextColor={v_1bfbd0.placeholder}
              />
              {v_2116d2.length > 0 && (
                <TouchableOpacity onPress={() => v_83f9d3("")}>
                  <Feather name="x-circle" size={16} color={v_1bfbd0.zinc400} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={v_fd5f43.callScroll} showsVerticalScrollIndicator={false}>
              {}
              {!v_2116d2 && v_0e7586.length > 0 && (
                <View style={v_fd5f43.callSectionBordered}>
                  <Text style={v_fd5f43.callSectionTitle}>최근 통화</Text>
                  {v_0e7586.map((v_51c3d2) => {
                    const v_e2a85c = v_a48e44.find((v_474039) => v_474039.id === v_51c3d2.personaId);
                    if (!v_e2a85c) return null;
                    return (
                      <View key={v_51c3d2.personaId} style={v_fd5f43.callRow}>
                        <Image source={{ uri: v_e2a85c.avatar }} style={v_fd5f43.callAvatar} />
                        <View style={v_fd5f43.callInfo}>
                          <Text style={v_fd5f43.callName}>{v_e2a85c.name}</Text>
                          <Text style={v_fd5f43.callSub}>{v_e2a85c.creatorAccount}</Text>
                          <Text style={v_fd5f43.callMeta}>{v_51c3d2.lastCallTime} • {v_51c3d2.duration}</Text>
                        </View>
                        <TouchableOpacity
                          style={v_fd5f43.callBtn}
                          onPress={() => { v_22a5cb(false); v_f4c991.navigate("Call", { cloneId: v_51c3d2.personaId, name: v_e2a85c.name, image: v_e2a85c.avatar }); }}
                        >
                          <Feather name="video" size={14} color={v_1bfbd0.white} />
                          <Text style={v_fd5f43.callBtnText}>통화</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {}
              <View style={v_fd5f43.callSection}>
                <Text style={v_fd5f43.callSectionTitle}>{v_2116d2 ? "검색 결과" : "팔로잉 목록"}</Text>
                {v_94f30e.length > 0 ? v_94f30e.map((v_e2a85c) => (
                  <View key={v_e2a85c.id} style={v_fd5f43.callRow}>
                    <Image source={{ uri: v_e2a85c.avatar }} style={v_fd5f43.callAvatar} />
                    <View style={v_fd5f43.callInfo}>
                      <Text style={v_fd5f43.callName}>{v_e2a85c.name}</Text>
                      <Text style={v_fd5f43.callSub}>{v_e2a85c.creatorAccount}</Text>
                    </View>
                    <TouchableOpacity
                      style={v_fd5f43.callBtn}
                      onPress={() => { v_22a5cb(false); v_f4c991.navigate("Call", { cloneId: v_e2a85c.id, name: v_e2a85c.name, image: v_e2a85c.avatar }); }}
                    >
                      <Feather name="video" size={14} color={v_1bfbd0.white} />
                      <Text style={v_fd5f43.callBtnText}>통화</Text>
                    </TouchableOpacity>
                  </View>
                )) : null}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {}
      {v_8282fa && (
        <View style={v_fd5f43.toast}><Text style={v_fd5f43.toastText}>{v_8282fa}</Text></View>
      )}
    </SafeView>
  );
}

const v_fd5f43 = v_472849.create({

  tabWrap: { borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc200 },
  tabRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: v_8b0c90.full, backgroundColor: v_1bfbd0.zinc100 },
  tabActive: { backgroundColor: v_1bfbd0.zinc900 },
  tabText: { fontSize: 13, fontWeight: "500", color: v_1bfbd0.zinc600 },
  tabTextActive: { color: v_1bfbd0.white },

  feed: { padding: 16, gap: 16 },
  postWrap: { marginBottom: 8 },

  imageWrap: { borderRadius: 24, overflow: "hidden", backgroundColor: v_1bfbd0.zinc100 },
  postImage: { width: "100%", aspectRatio: 3 / 4 },
  overlayContent: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 24, paddingTop: 30, backgroundColor: "rgba(0,0,0,0.45)",
  },
  personaName: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.white },
  creatorAccount: { fontSize: 12, color: v_1bfbd0.white, marginBottom: 8, opacity: 0.8 },
  tagRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  overlayTag: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: v_8b0c90.full },
  overlayTagText: { fontSize: 11, color: v_1bfbd0.white },
  postContent: { fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 20, marginBottom: 16 },
  overlayBtns: { flexDirection: "row", gap: 10 },
  overlayBtn: { flex: 1, borderRadius: v_8b0c90.full },
  overlayBtnGhost: { borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },

  statsBadge: {
    position: "absolute", top: 16, right: 16, flexDirection: "row", alignItems: "center",
    gap: 4, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: v_8b0c90.full, zIndex: 10,
  },
  badgeBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  badgeText: { fontSize: 11, fontWeight: "600", color: v_1bfbd0.white },
  badgeDivider: { width: 1, height: 12, backgroundColor: "rgba(255,255,255,0.3)" },

  actionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4, paddingVertical: 12 },
  actionsLeft: { flexDirection: "row", gap: 16 },
  actionsRight: { alignItems: "flex-end" },
  countText: { fontSize: 12, fontWeight: "600", color: v_1bfbd0.zinc900 },
  countTextSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },

  floatingCallBtn: {
    position: "absolute", right: 24, bottom: 24,
    zIndex: 50,
  },
  floatingCallBtnInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: v_1bfbd0.zinc900, alignItems: "center", justifyContent: "center",
    elevation: 8, shadowColor: v_1bfbd0.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12,
  },

  centerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  bottomOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },

  infoBox: { backgroundColor: v_1bfbd0.white, borderRadius: 20, padding: 24, maxWidth: 360, width: "100%" },
  infoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  infoHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoTitle: { fontSize: 18, fontWeight: "600", color: v_1bfbd0.zinc900 },
  infoDesc: { fontSize: 14, color: v_1bfbd0.zinc600, lineHeight: 20, marginBottom: 16 },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  levelRange: { width: 80, fontSize: 14, fontWeight: "500", color: v_1bfbd0.zinc700 },
  levelDesc: { fontSize: 14, color: v_1bfbd0.zinc500 },
  activityBox: { backgroundColor: "#eff6ff", borderRadius: v_8b0c90.lg, padding: 16 },
  activityBoxTitle: { fontSize: 12, fontWeight: "500", color: "#2563eb", marginBottom: 8 },
  activityItem: { fontSize: 14, color: "#1e3a5f", marginBottom: 4 },

  confirmBox: { backgroundColor: v_1bfbd0.white, borderRadius: 20, padding: 24, maxWidth: 360, width: "100%", alignItems: "center" },
  confirmTitle: { fontSize: 18, fontWeight: "600", color: v_1bfbd0.zinc900, marginBottom: 8 },
  confirmDesc: { fontSize: 14, color: v_1bfbd0.zinc600, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  confirmBtns: { flexDirection: "row", gap: 12, width: "100%" },

  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: v_1bfbd0.zinc300, alignSelf: "center", marginTop: 12, marginBottom: 12 },
  commentSheet: { backgroundColor: v_1bfbd0.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24, height: "65%" },
  commentHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  commentTitle: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900 },
  commentScroll: { flex: 1 },
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: v_1bfbd0.zinc200 },
  commentInfo: { flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc900 },
  commentTime: { fontSize: 12, color: v_1bfbd0.zinc400 },
  commentContent: { fontSize: 14, color: v_1bfbd0.zinc700, lineHeight: 20 },
  emptyComment: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: v_1bfbd0.zinc400, marginTop: 8 },
  emptySubText: { fontSize: 12, color: v_1bfbd0.zinc400, marginTop: 2 },
  commentInputRow: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: v_1bfbd0.zinc200, paddingTop: 12 },
  commentInput: { flex: 1, height: 40, backgroundColor: v_1bfbd0.zinc100, borderRadius: v_8b0c90.full, paddingHorizontal: 16, fontSize: 14, color: v_1bfbd0.zinc900 },

  callSheet: { backgroundColor: v_1bfbd0.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24, height: "75%" },
  callSheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  callSheetTitle: { fontSize: 18, fontWeight: "700", color: v_1bfbd0.zinc900 },
  callSearchWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: v_1bfbd0.zinc100, borderRadius: v_8b0c90.full, paddingHorizontal: 16, height: 44, marginBottom: 16 },
  callSearchInput: { flex: 1, fontSize: 14, color: v_1bfbd0.zinc900 },
  callScroll: { flex: 1 },
  callSectionBordered: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: v_1bfbd0.zinc200 },
  callSection: { marginBottom: 20 },
  callSectionTitle: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900, marginBottom: 12 },
  callRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  callAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: v_1bfbd0.zinc200 },
  callInfo: { flex: 1 },
  callName: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc900 },
  callSub: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 1 },
  callMeta: { fontSize: 11, color: v_1bfbd0.zinc400, marginTop: 2 },
  callBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: v_1bfbd0.zinc900, borderRadius: v_8b0c90.full },
  callBtnText: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.white },

  toast: { position: "absolute", bottom: 100, alignSelf: "center", paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "rgba(0,0,0,0.8)", borderRadius: v_8b0c90.full },
  toastText: { fontSize: 14, color: v_1bfbd0.white },
});
