

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_aa7413,
  v_326be8,
  v_09d0e5,
  v_122070,
  v_472849,
  v_19b633,
  v_3094a2,
  v_39a996,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import v_8e7ad4 from "../ui/SwipeDownSheet";
import { v_1bfbd0 } from "../constants";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_d24912,
  type v_1d741a,
} from "../../api/clones";

interface Props {
  visible: boolean;
  cloneId: number | null;
  cloneName: string;
  onClose: () => void;
}

export default function v_03e207({ visible: v_cf55be, cloneId: v_6e0fd3, cloneName: v_f2ff36, onClose: v_0890f8 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);
  const v_ad9bbd = v_326be8.OS === "android" ? 56 : 0;
  const v_53dd92 = Math.max(v_033e14.bottom, v_f9771e, v_ad9bbd);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_4622b9, v_fa923c] = v_5ab095<v_1d741a[] | null>(null);
  const [v_683210, v_34a50a] = v_5ab095(false);

  v_c4deb2(() => {
    if (!v_cf55be || !v_6e0fd3 || !v_2ca7e0) {
      v_fa923c(null);
      return;
    }
    let v_2008a4 = false;
    v_34a50a(true);
    v_fa923c(null);
    v_d24912(v_2ca7e0, v_6e0fd3)
      .then((v_8f00b9) => {
        if (v_2008a4) return;
        v_fa923c(v_8f00b9.items ?? []);
      })
      .catch((v_49263d) => {
        if (v_2008a4) return;
        console.warn("[GiftReceiptsSheet] listCloneGiftReceipts failed:", v_49263d);
        v_fa923c([]);
      })
      .finally(() => {
        if (!v_2008a4) v_34a50a(false);
      });
    return () => {
      v_2008a4 = true;
    };
  }, [v_cf55be, v_6e0fd3, v_2ca7e0]);

  const v_c83285 = v_4622b9?.reduce((v_dce0a8, v_23805a) => v_dce0a8 + v_23805a.count, 0) ?? 0;

  return (
    <Modal visible={v_cf55be} transparent animationType="slide">
      <Pressable style={v_fd5f43.bottomOverlay} onPress={v_0890f8}>
        <SwipeDownSheet
          onClose={v_0890f8}
          style={[v_fd5f43.sheet, { paddingBottom: 32 + v_53dd92 }]}
        >
          <View style={v_fd5f43.handle} />
          <Text style={v_fd5f43.title}>
            {v_8d41d7("feed.giftReceiptsTitle", { defaultValue: "받은 선물" })}
          </Text>
          <Text style={v_fd5f43.sub}>{v_f2ff36}</Text>

          {v_4622b9 && v_4622b9.length > 0 ? (
            <View style={v_fd5f43.summary}>
              <Feather name="gift" size={20} color="#a78bfa" />
              <Text style={v_fd5f43.summaryTotal}>
                {v_8d41d7("feed.giftReceiptsTotal", { defaultValue: "총 {{n}}개", n: v_c83285 })}
              </Text>
            </View>
          ) : null}

          <ScrollView
            style={v_fd5f43.scrollArea}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {v_683210 ? (
              <ActivityIndicator color={v_1bfbd0.zinc500} style={{ paddingVertical: 24 }} />
            ) : !v_4622b9 || v_4622b9.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: "center" }}>
                <Feather name="gift" size={28} color={v_1bfbd0.zinc300} />
                <Text style={v_fd5f43.empty}>
                  {v_8d41d7("feed.giftReceiptsEmpty", {
                    defaultValue: "아직 받은 선물이 없어요",
                  })}
                </Text>
              </View>
            ) : (
              v_4622b9.map((v_23805a, v_e86ad8) => (
                <View key={`${v_23805a.giftId}-${v_23805a.sender}-${v_e86ad8}`} style={v_fd5f43.row}>
                  <View style={v_fd5f43.iconBox}>
                    <Feather name="gift" size={16} color="#a78bfa" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={v_fd5f43.giftName}>{v_23805a.giftName}</Text>
                    <Text style={v_fd5f43.sender}>{v_23805a.sender}</Text>
                  </View>
                  <Text style={v_fd5f43.count}>×{v_23805a.count}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </SwipeDownSheet>
      </Pressable>
    </Modal>
  );
}

const v_fd5f43 = v_472849.create({
  bottomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: "80%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc300,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    textAlign: "center",
  },
  sub: {
    fontSize: 13,
    color: v_1bfbd0.zinc500,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
    marginBottom: 8,
  },
  summaryTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
  },
  scrollArea: {
    minHeight: 120,
  },
  empty: {
    color: v_1bfbd0.zinc500,
    fontSize: 13,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: v_1bfbd0.zinc100,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#a78bfa22",
    alignItems: "center",
    justifyContent: "center",
  },
  giftName: {
    fontSize: 15,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
  },
  sender: {
    fontSize: 12,
    color: v_1bfbd0.zinc500,
    marginTop: 2,
  },
  count: {
    fontSize: 14,
    fontWeight: "700",
    color: "#a78bfa",
  },
});
