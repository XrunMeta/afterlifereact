import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  Dimensions,
  Animated,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import SafeView from "../../components/ui/SafeView";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/common/PageHeader";
import { COLORS, SIZES, RADIUS } from "../../components/constants";
import type { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { useFollowStore } from "../../stores/followStore";
import { seedSource } from "../../api/source";
import type { DomainClone, DomainFeed } from "../../types/domain";

type RootNav = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_W } = Dimensions.get("window");
const DEFAULT_USER_ID = 1;

type FollowedPersona = {
  id: number;
  name: string;
  avatar: string;
  interests: string[];
  creatorAccount: string;
  intimacy: number; 
  interactions: number; 
};

const mockIntimacy = (cloneId: number) => ((cloneId * 17) % 100);
const mockInteractions = (cloneId: number) => 100 + ((cloneId * 137) % 5000);

const toPersona = (clone: DomainClone, ownerHandle?: string): FollowedPersona => ({
  id: clone.id,
  name: clone.displayName,
  avatar: clone.imageUrl ?? "",
  interests: clone.interests,
  creatorAccount: ownerHandle ? `@${ownerHandle}` : "",
  intimacy: mockIntimacy(clone.id),
  interactions: mockInteractions(clone.id),
});

const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default function FollowingScreen() {
  const rootNav = useNavigation<RootNav>();
  const authUser = useAuthStore((s) => s.user);
  const follows = useFollowStore((s) => s.follows);
  const toggleFollow = useFollowStore((s) => s.toggleFollow);

  const uid = authUser?.id ?? DEFAULT_USER_ID;

  const followedPersonas = useMemo<FollowedPersona[]>(() => {
    const followingCloneIds = follows
      .filter((f) => f.followerUserId === uid)
      .map((f) => f.followingCloneId);
    return followingCloneIds
      .map((cid) => seedSource.clones().find((c) => c.id === cid))
      .filter((c): c is DomainClone => Boolean(c))
      .map((clone) => {
        const owner = seedSource.users().find((u) => u.id === clone.ownerId);
        return toPersona(clone, owner?.handle);
      });
  }, [follows, uid]);

  const feeds = useMemo<DomainFeed[]>(() => {
    const followingIds = new Set(followedPersonas.map((p) => p.id));
    return seedSource.feeds()
      .filter((f) => followingIds.has(f.cloneId))
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [followedPersonas]);

  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [unfollowConfirmId, setUnfollowConfirmId] = useState<number | null>(null);
  const [showIntimacyInfo, setShowIntimacyInfo] = useState(false);
  const [showInteractionInfo, setShowInteractionInfo] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callSearchQuery, setCallSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const scrollY = useRef(0);
  const fabAnim = useRef(new Animated.Value(0)).current; 

  const onFeedScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentY = e.nativeEvent.contentOffset.y;
    const diff = currentY - scrollY.current;
    if (diff > 8 && currentY > 50) {

      Animated.timing(fabAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else if (diff < -8) {

      Animated.timing(fabAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }
    scrollY.current = currentY;
  }, [fabAnim]);

  const fabTranslateY = fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 2000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const categories = useMemo(() => {
    const tags = new Set<string>();
    followedPersonas.forEach((p) => p.interests.forEach((i) => tags.add(i)));
    return ["전체", ...Array.from(tags)];
  }, [followedPersonas]);

  const posts = useMemo(() => {
    let filtered = feeds;
    if (selectedCategory !== "전체") {
      const ids = followedPersonas
        .filter((p) => p.interests.includes(selectedCategory))
        .map((p) => p.id);
      filtered = filtered.filter((f) => ids.includes(f.cloneId));
    }
    return filtered
      .map((feed) => {
        const persona = followedPersonas.find((p) => p.id === feed.cloneId);
        return persona ? { feed, persona } : null;
      })
      .filter((x): x is { feed: DomainFeed; persona: FollowedPersona } =>
        Boolean(x),
      );
  }, [feeds, selectedCategory, followedPersonas]);

  const filteredCallList = useMemo(() => {
    if (!callSearchQuery.trim()) return followedPersonas;
    const q = callSearchQuery.toLowerCase();
    return followedPersonas.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.creatorAccount.toLowerCase().includes(q),
    );
  }, [callSearchQuery, followedPersonas]);

  const toggleLike = (id: number) => {
    setLikedPosts((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const confirmUnfollow = async () => {
    if (unfollowConfirmId) {
      await toggleFollow(unfollowConfirmId);
      setUnfollowConfirmId(null);
    }
  };

  const currentComments: Array<{
    id: string;
    author: string;
    avatar: string;
    content: string;
    time: string;
  }> = [];

  const renderPost = ({ item }: { item: (typeof posts)[0] }) => {
    const feedImage = item.feed.mediaUrl ?? item.persona.avatar;
    return (
      <View style={s.postWrap}>
        {}
        <View style={s.imageWrap}>
          <Image source={{ uri: feedImage }} style={s.postImage} resizeMode="cover" />

          {}
          <View style={s.statsBadge}>
            <TouchableOpacity style={s.badgeBtn} onPress={() => setShowIntimacyInfo(true)}>
              <Feather name="thermometer" size={12} color="#fb923c" />
              <Text style={s.badgeText}>{item.persona.intimacy}°C</Text>
            </TouchableOpacity>
            <View style={s.badgeDivider} />
            <TouchableOpacity style={s.badgeBtn} onPress={() => setShowInteractionInfo(true)}>
              <Ionicons name="chatbubbles-outline" size={12} color="#60a5fa" />
              <Text style={s.badgeText}>{formatCount(item.persona.interactions)}</Text>
            </TouchableOpacity>
          </View>

          {}
          <View style={s.overlayContent}>
            <Text style={s.personaName}>{item.persona.name}</Text>
            {item.persona.creatorAccount ? (
              <Text style={s.creatorAccount}>{item.persona.creatorAccount}</Text>
            ) : null}
            <View style={s.tagRow}>
              {item.persona.interests.slice(0, 3).map((tag, i) => (
                <View key={i} style={s.overlayTag}>
                  <Text style={s.overlayTagText}>#{tag}</Text>
                </View>
              ))}
            </View>
            <Text style={s.postContent} numberOfLines={3}>{item.feed.content}</Text>
            <View style={s.overlayBtns}>
              <Button
                title="통화하기"
                variant="secondary"
                size="md"
                leftIcon={<Feather name="video" size={14} color={COLORS.zinc900} />}
                onPress={() =>
                  rootNav.navigate("Call", {
                    cloneId: item.persona.id,
                    name: item.persona.name,
                    image: item.persona.avatar,
                  })
                }
                style={s.overlayBtn}
                textColor={COLORS.zinc900}
                backgroundColor={COLORS.white}
              />
              <Button
                title="팔로우 취소"
                variant="ghost"
                size="md"
                leftIcon={<Feather name="user-minus" size={14} color={COLORS.white} />}
                onPress={() => setUnfollowConfirmId(item.persona.id)}
                style={{ ...s.overlayBtn, ...s.overlayBtnGhost }}
                textColor={COLORS.white}
                backgroundColor="rgba(255,255,255,0.2)"
              />
            </View>
          </View>
        </View>

        {}
        <View style={s.actionsRow}>
          <View style={s.actionsLeft}>
            <TouchableOpacity onPress={() => toggleLike(item.feed.id)}>
              <Ionicons
                name={likedPosts.has(item.feed.id) ? "heart" : "heart-outline"}
                size={24}
                color={likedPosts.has(item.feed.id) ? "#ef4444" : COLORS.zinc700}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCommentPostId(item.feed.id)}>
              <Feather name="message-circle" size={24} color={COLORS.zinc700} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Feather name="share-2" size={22} color={COLORS.zinc700} />
            </TouchableOpacity>
          </View>
          <View style={s.actionsRight}>
            <Text style={s.countText}>
              좋아요 {likedPosts.has(item.feed.id) ? 1 : 0}개
            </Text>
            <Text style={s.countTextSub}>댓글 0개</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeView backgroundColor={COLORS.white} showBottomBackground={false}>
      <PageHeader
        title="Following"
        rightAction={
          <TouchableOpacity style={{ padding: 4 }}>
            <Feather name="bell" size={22} color={COLORS.zinc700} />
          </TouchableOpacity>
        }
      />

      {}
      <View style={s.tabWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabRow}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat} style={[s.tab, selectedCategory === cat && s.tabActive]} onPress={() => setSelectedCategory(cat)}>
              <Text style={[s.tabText, selectedCategory === cat && s.tabTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {}
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.feed.id)}
        renderItem={renderPost}
        contentContainerStyle={s.feed}
        showsVerticalScrollIndicator={false}
        onScroll={onFeedScroll}
        scrollEventThrottle={16}
      />

      {}
      <Animated.View style={[s.floatingCallBtn, { transform: [{ translateY: fabTranslateY }] }]}>
        <TouchableOpacity
          style={s.floatingCallBtnInner}
          activeOpacity={0.8}
          onPress={() => { setCallSearchQuery(""); setShowCallModal(true); }}
        >
          <Feather name="phone" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </Animated.View>

      {}
      <Modal visible={showIntimacyInfo} transparent animationType="fade">
        <Pressable style={s.centerOverlay} onPress={() => setShowIntimacyInfo(false)}>
          <Pressable style={s.infoBox} onPress={(e) => e.stopPropagation()}>
            <View style={s.infoHeader}>
              <View style={s.infoHeaderLeft}>
                <Feather name="thermometer" size={18} color="#fb923c" />
                <Text style={s.infoTitle}>친밀도 온도</Text>
              </View>
              <TouchableOpacity onPress={() => setShowIntimacyInfo(false)}>
                <Feather name="x" size={20} color={COLORS.zinc400} />
              </TouchableOpacity>
            </View>
            <Text style={s.infoDesc}>
              친밀도 온도는 페르소나와의 관계 깊이를 나타냅니다. 대화를 나누고 상호작용할수록 온도가 올라가며, 더욱 자연스럽고 개인화된 대화가 가능해집니다.
            </Text>
            {[["0-30°C", "처음 만나는 단계"], ["31-60°C", "친숙해지는 단계"], ["61-90°C", "깊은 유대감 형성"], ["91-100°C", "최고의 친밀도"]].map(([range, desc], i) => (
              <View key={i} style={s.levelRow}>
                <Text style={[s.levelRange, i === 3 && { color: "#f97316" }]}>{range}</Text>
                <Text style={[s.levelDesc, i === 3 && { color: "#f97316" }]}>{desc}</Text>
              </View>
            ))}
            <Button title="확인" variant="primary" onPress={() => setShowIntimacyInfo(false)} style={{ marginTop: 20, width: "100%", borderRadius: RADIUS.full }} />
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={showInteractionInfo} transparent animationType="fade">
        <Pressable style={s.centerOverlay} onPress={() => setShowInteractionInfo(false)}>
          <Pressable style={s.infoBox} onPress={(e) => e.stopPropagation()}>
            <View style={s.infoHeader}>
              <View style={s.infoHeaderLeft}>
                <Ionicons name="chatbubbles-outline" size={18} color="#60a5fa" />
                <Text style={s.infoTitle}>상호작용 횟수</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInteractionInfo(false)}>
                <Feather name="x" size={20} color={COLORS.zinc400} />
              </TouchableOpacity>
            </View>
            <Text style={s.infoDesc}>
              상호작용 횟수는 페르소나와 나눈 대화, 통화, 학습 활동의 총 횟수를 의미합니다.
            </Text>
            <View style={s.activityBox}>
              <Text style={s.activityBoxTitle}>포함되는 활동</Text>
              {["채팅 대화", "음성/영상 통화", "학습 세션", "피드 상호작용"].map((a, i) => (
                <Text key={i} style={s.activityItem}>• {a}</Text>
              ))}
            </View>
            <Button title="확인" variant="primary" onPress={() => setShowInteractionInfo(false)} style={{ marginTop: 16, width: "100%", borderRadius: RADIUS.full }} />
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!commentPostId} transparent animationType="slide">
        <Pressable style={s.bottomOverlay} onPress={() => setCommentPostId(null)}>
          <View style={s.commentSheet} onStartShouldSetResponder={() => true}>
            <View style={s.sheetHandle} />
            <View style={s.commentHeaderRow}>
              <Text style={s.commentTitle}>댓글 {currentComments.length}개</Text>
              <TouchableOpacity onPress={() => setCommentPostId(null)}>
                <Feather name="x" size={20} color={COLORS.zinc600} />
              </TouchableOpacity>
            </View>
            <ScrollView style={s.commentScroll} showsVerticalScrollIndicator={false}>
              {currentComments.length > 0 ? currentComments.map((c) => (
                <View key={c.id} style={s.commentRow}>
                  <Image source={{ uri: c.avatar }} style={s.commentAvatar} />
                  <View style={s.commentInfo}>
                    <View style={s.commentMeta}>
                      <Text style={s.commentAuthor}>{c.author}</Text>
                      <Text style={s.commentTime}>{c.time}</Text>
                    </View>
                    <Text style={s.commentContent}>{c.content}</Text>
                  </View>
                </View>
              )) : (
                <View style={s.emptyComment}>
                  <Feather name="message-circle" size={40} color={COLORS.zinc300} />
                  <Text style={s.emptyText}>아직 댓글이 없습니다</Text>
                  <Text style={s.emptySubText}>첫 번째 댓글을 작성해보세요!</Text>
                </View>
              )}
            </ScrollView>
            <View style={s.commentInputRow}>
              <TextInput
                style={s.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="댓글 달기..."
                placeholderTextColor={COLORS.placeholder}
              />
              <TouchableOpacity disabled={!commentText.trim()} onPress={() => setCommentText("")}>
                <Feather name="send" size={18} color={commentText.trim() ? COLORS.zinc900 : COLORS.zinc400} />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>

      {}
      <Modal visible={!!unfollowConfirmId} transparent animationType="fade">
        <Pressable style={s.centerOverlay} onPress={() => setUnfollowConfirmId(null)}>
          <Pressable style={s.confirmBox} onPress={(e) => e.stopPropagation()}>
            <Text style={s.confirmTitle}>팔로우 취소</Text>
            <Text style={s.confirmDesc}>
              정말 이 페르소나의 팔로우를 취소하시겠습니까?{"\n"}피드에서 해당 페르소나의 포스트가 더 이상 표시되지 않습니다.
            </Text>
            <View style={s.confirmBtns}>
              <Button title="취소" variant="ghost" onPress={() => setUnfollowConfirmId(null)} style={{ flex: 1 }} />
              <Button title="팔로우 취소" variant="danger" onPress={confirmUnfollow} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {}
      <Modal visible={showCallModal} transparent animationType="slide">
        <Pressable style={s.bottomOverlay} onPress={() => setShowCallModal(false)}>
          <View style={s.callSheet} onStartShouldSetResponder={() => true}>
            <View style={s.sheetHandle} />
            <View style={s.callSheetHeader}>
              <Text style={s.callSheetTitle}>통화하기</Text>
              <TouchableOpacity onPress={() => setShowCallModal(false)}>
                <Feather name="x" size={20} color={COLORS.zinc600} />
              </TouchableOpacity>
            </View>

            {}
            <View style={s.callSearchWrap}>
              <Feather name="search" size={18} color={COLORS.zinc400} />
              <TextInput
                style={s.callSearchInput}
                value={callSearchQuery}
                onChangeText={setCallSearchQuery}
                placeholder="페르소나 검색..."
                placeholderTextColor={COLORS.placeholder}
              />
              {callSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setCallSearchQuery("")}>
                  <Feather name="x-circle" size={16} color={COLORS.zinc400} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={s.callScroll} showsVerticalScrollIndicator={false}>
              {}
              <View style={s.callSection}>
                <Text style={s.callSectionTitle}>{callSearchQuery ? "검색 결과" : "팔로잉 목록"}</Text>
                {filteredCallList.length > 0 ? filteredCallList.map((p) => (
                  <View key={p.id} style={s.callRow}>
                    <Image source={{ uri: p.avatar }} style={s.callAvatar} />
                    <View style={s.callInfo}>
                      <Text style={s.callName}>{p.name}</Text>
                      <Text style={s.callSub}>{p.creatorAccount}</Text>
                    </View>
                    <TouchableOpacity
                      style={s.callBtn}
                      onPress={() => { setShowCallModal(false); rootNav.navigate("Call", { cloneId: p.id, name: p.name, image: p.avatar }); }}
                    >
                      <Feather name="video" size={14} color={COLORS.white} />
                      <Text style={s.callBtnText}>통화</Text>
                    </TouchableOpacity>
                  </View>
                )) : null}
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {}
      {toastMessage && (
        <View style={s.toast}><Text style={s.toastText}>{toastMessage}</Text></View>
      )}
    </SafeView>
  );
}

const s = StyleSheet.create({

  tabWrap: { borderBottomWidth: 1, borderBottomColor: COLORS.zinc200 },
  tabRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: COLORS.zinc100 },
  tabActive: { backgroundColor: COLORS.zinc900 },
  tabText: { fontSize: 13, fontWeight: "500", color: COLORS.zinc600 },
  tabTextActive: { color: COLORS.white },

  feed: { padding: 16, gap: 16 },
  postWrap: { marginBottom: 8 },

  imageWrap: { borderRadius: 24, overflow: "hidden", backgroundColor: COLORS.zinc100 },
  postImage: { width: "100%", aspectRatio: 3 / 4 },
  overlayContent: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: 24, paddingTop: 30, backgroundColor: "rgba(0,0,0,0.45)",
  },
  personaName: { fontSize: 16, fontWeight: "700", color: COLORS.white },
  creatorAccount: { fontSize: 12, color: COLORS.white, marginBottom: 8, opacity: 0.8 },
  tagRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  overlayTag: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: RADIUS.full },
  overlayTagText: { fontSize: 11, color: COLORS.white },
  postContent: { fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 20, marginBottom: 16 },
  overlayBtns: { flexDirection: "row", gap: 10 },
  overlayBtn: { flex: 1, borderRadius: RADIUS.full },
  overlayBtnGhost: { borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" },

  statsBadge: {
    position: "absolute", top: 16, right: 16, flexDirection: "row", alignItems: "center",
    gap: 4, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: RADIUS.full, zIndex: 10,
  },
  badgeBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  badgeText: { fontSize: 11, fontWeight: "600", color: COLORS.white },
  badgeDivider: { width: 1, height: 12, backgroundColor: "rgba(255,255,255,0.3)" },

  actionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4, paddingVertical: 12 },
  actionsLeft: { flexDirection: "row", gap: 16 },
  actionsRight: { alignItems: "flex-end" },
  countText: { fontSize: 12, fontWeight: "600", color: COLORS.zinc900 },
  countTextSub: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },

  floatingCallBtn: {
    position: "absolute", right: 24, bottom: 24,
    zIndex: 50,
  },
  floatingCallBtnInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.zinc900, alignItems: "center", justifyContent: "center",
    elevation: 8, shadowColor: COLORS.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12,
  },

  centerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  bottomOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },

  infoBox: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, maxWidth: 360, width: "100%" },
  infoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  infoHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoTitle: { fontSize: 18, fontWeight: "600", color: COLORS.zinc900 },
  infoDesc: { fontSize: 14, color: COLORS.zinc600, lineHeight: 20, marginBottom: 16 },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  levelRange: { width: 80, fontSize: 14, fontWeight: "500", color: COLORS.zinc700 },
  levelDesc: { fontSize: 14, color: COLORS.zinc500 },
  activityBox: { backgroundColor: "#eff6ff", borderRadius: RADIUS.lg, padding: 16 },
  activityBoxTitle: { fontSize: 12, fontWeight: "500", color: "#2563eb", marginBottom: 8 },
  activityItem: { fontSize: 14, color: "#1e3a5f", marginBottom: 4 },

  confirmBox: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, maxWidth: 360, width: "100%", alignItems: "center" },
  confirmTitle: { fontSize: 18, fontWeight: "600", color: COLORS.zinc900, marginBottom: 8 },
  confirmDesc: { fontSize: 14, color: COLORS.zinc600, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  confirmBtns: { flexDirection: "row", gap: 12, width: "100%" },

  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.zinc300, alignSelf: "center", marginTop: 12, marginBottom: 12 },
  commentSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24, height: "65%" },
  commentHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  commentTitle: { fontSize: 16, fontWeight: "700", color: COLORS.zinc900 },
  commentScroll: { flex: 1 },
  commentRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.zinc200 },
  commentInfo: { flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: COLORS.zinc900 },
  commentTime: { fontSize: 12, color: COLORS.zinc400 },
  commentContent: { fontSize: 14, color: COLORS.zinc700, lineHeight: 20 },
  emptyComment: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, color: COLORS.zinc400, marginTop: 8 },
  emptySubText: { fontSize: 12, color: COLORS.zinc400, marginTop: 2 },
  commentInputRow: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: COLORS.zinc200, paddingTop: 12 },
  commentInput: { flex: 1, height: 40, backgroundColor: COLORS.zinc100, borderRadius: RADIUS.full, paddingHorizontal: 16, fontSize: 14, color: COLORS.zinc900 },

  callSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 24, height: "75%" },
  callSheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  callSheetTitle: { fontSize: 18, fontWeight: "700", color: COLORS.zinc900 },
  callSearchWrap: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.zinc100, borderRadius: RADIUS.full, paddingHorizontal: 16, height: 44, marginBottom: 16 },
  callSearchInput: { flex: 1, fontSize: 14, color: COLORS.zinc900 },
  callScroll: { flex: 1 },
  callSectionBordered: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.zinc200 },
  callSection: { marginBottom: 20 },
  callSectionTitle: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900, marginBottom: 12 },
  callRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  callAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.zinc200 },
  callInfo: { flex: 1 },
  callName: { fontSize: 15, fontWeight: "600", color: COLORS.zinc900 },
  callSub: { fontSize: 12, color: COLORS.zinc500, marginTop: 1 },
  callMeta: { fontSize: 11, color: COLORS.zinc400, marginTop: 2 },
  callBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.zinc900, borderRadius: RADIUS.full },
  callBtnText: { fontSize: 13, fontWeight: "600", color: COLORS.white },

  toast: { position: "absolute", bottom: 100, alignSelf: "center", paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "rgba(0,0,0,0.8)", borderRadius: RADIUS.full },
  toastText: { fontSize: 14, color: COLORS.white },
});
