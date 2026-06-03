

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_09d0e5,
  v_472849,
  v_122070,
  v_4623af,
  v_cf9c33,
  v_39a996,
  v_326be8,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_1ed7d9 } from "../../../stores/authStore";
import { v_5959d8, type v_7428e9 } from "../../../api/users";
import v_1a40c4 from "../../../components/ui/Button";
import v_8e7ad4 from "../../../components/ui/SwipeDownSheet";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../../components/constants";

interface Props {
  visible: boolean;

  initialSelected?: number[];
  onClose: () => void;
  onConfirm: (userIds: number[]) => void;
}

export default function v_4c2648({
  visible: v_cf55be,
  initialSelected: v_b83104 = [],
  onClose: v_0890f8,
  onConfirm: v_e2be2d,
}: Props) {
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const v_f5f393 = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser?.id ?? v_fd5f43.user?.id ?? null);
  const v_033e14 = v_e0068c();

  const v_284e24 = Math.max(v_033e14.bottom, v_326be8.OS === "android" ? 24 : 12);

  const [v_ba3f04, v_cd488d] = v_5ab095<v_7428e9[]>([]);
  const [v_683210, v_34a50a] = v_5ab095(false);
  const [v_587413, v_2122dd] = v_5ab095<Set<number>>(new Set(v_b83104));

  v_c4deb2(() => {
    if (!v_cf55be) return;
    v_2122dd(new Set(v_b83104));
    if (!v_2ca7e0 || !v_f5f393) {
      v_cd488d([]);
      return;
    }
    v_34a50a(true);
    v_5959d8(v_2ca7e0, v_f5f393)
      .then((v_8f00b9) => v_cd488d(v_8f00b9.items))
      .catch((v_49263d) => {
        console.warn("[FriendPicker] fetch following failed:", v_49263d);
        v_cd488d([]);
      })
      .finally(() => v_34a50a(false));

  }, [v_cf55be, v_2ca7e0, v_f5f393]);

  const v_09f2bd = (v_389afb) => {
    v_2122dd((v_ba2215) => {
      const v_a448ad = new Set(v_ba2215);
      if (v_a448ad.has(v_389afb)) v_a448ad.delete(v_389afb);
      else v_a448ad.add(v_389afb);
      return v_a448ad;
    });
  };

  return (
    <Modal
      visible={v_cf55be}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <Pressable style={v_fd5f43.overlay} onPress={v_0890f8}>
        <SwipeDownSheet
          onClose={v_0890f8}
          style={[v_fd5f43.box, { paddingBottom: v_284e24 }]}
        >
          <View style={v_fd5f43.handle} />
          <Text style={v_fd5f43.title}>특정 친구에게만 공개</Text>
          <Text style={v_fd5f43.desc}>
            내가 팔로우 중인 사람 중에 공개할 친구를 선택하세요.
          </Text>

          {v_683210 ? (
            <ActivityIndicator style={{ paddingVertical: 24 }} color={v_1bfbd0.zinc500} />
          ) : v_ba3f04.length === 0 ? (
            <View style={v_fd5f43.empty}>
              <Feather name="users" size={32} color={v_1bfbd0.zinc300} />
              <Text style={v_fd5f43.emptyText}>아직 팔로우 중인 사람이 없어요</Text>
            </View>
          ) : (
            <ScrollView style={v_fd5f43.list} keyboardShouldPersistTaps="handled">
              {v_ba3f04.map((v_ceb55a) => {
                const v_da90dc = v_587413.has(v_ceb55a.userId);
                return (
                  <TouchableOpacity
                    key={v_ceb55a.userId}
                    style={v_fd5f43.row}
                    onPress={() => v_09f2bd(v_ceb55a.userId)}
                    activeOpacity={0.7}
                  >
                    {v_ceb55a.avatarUrl ? (
                      <Image source={{ uri: v_ceb55a.avatarUrl }} style={v_fd5f43.avatar} />
                    ) : (
                      <View style={[v_fd5f43.avatar, v_fd5f43.avatarPh]}>
                        <Feather name="user" size={18} color={v_1bfbd0.zinc400} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={v_fd5f43.name} numberOfLines={1}>
                        {v_ceb55a.name ?? v_ceb55a.email}
                      </Text>
                      <Text style={v_fd5f43.email} numberOfLines={1}>
                        {v_ceb55a.email}
                      </Text>
                    </View>
                    <View style={[v_fd5f43.check, v_da90dc && v_fd5f43.checkOn]}>
                      {v_da90dc && <Feather name="check" size={14} color={v_1bfbd0.white} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={v_fd5f43.actions}>
            <Button title="취소" variant="ghost" onPress={v_0890f8} style={{ flex: 1 }} />
            <Button
              title={`확인 (${v_587413.size}명)`}
              variant="primary"
              onPress={() => v_e2be2d(Array.from(v_587413))}
              style={{ flex: 1 }}
            />
          </View>
        </SwipeDownSheet>
      </Pressable>
    </Modal>
  );
}

const v_fd5f43 = v_472849.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  box: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: v_9b1a04.large,
    paddingTop: 12,

    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc300,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 4 },
  desc: { fontSize: 13, color: v_1bfbd0.zinc500, marginBottom: 12 },
  list: { maxHeight: 360 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 13, color: v_1bfbd0.zinc500 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPh: {
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  email: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: v_1bfbd0.zinc300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: v_1bfbd0.white,
  },
  checkOn: {
    backgroundColor: v_1bfbd0.violet600,
    borderColor: v_1bfbd0.violet600,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
});

void v_8b0c90;
