

import v_a3453e, { v_c4deb2, v_df9f57, v_5ab095 } from "bapkr";
import { v_aa7413, v_326be8, v_09d0e5, v_472849, v_19b633, v_4623af, v_3094a2 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_772971 } from "jmpfvteuuztnp";
import { v_1bfbd0, v_8b0c90 } from "../constants";
import v_8e7ad4 from "../ui/SwipeDownSheet";
import {
  v_be28b6,
  v_669b27,
  v_c3f0be,
  v_845110,
  v_cae033,
  v_280133,
  v_b3d1d6,
  type v_e77dc2,
  type v_d712c8,
} from "../../lib/dateRange";

const v_857bbc = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const v_18e715 = ["일", "월", "화", "수", "목", "금", "토"];
const PRESET_DEFAULTS: Record<v_d712c8, string> = {
  today: "오늘",
  last7: "최근 7일",
  thisMonth: "이번 달",
  lastMonth: "지난달",
};

export function v_59a8d3({ value: v_3b402b, onChange: v_b187d9 }: { value: v_e77dc2 | null; onChange: (r: v_e77dc2 | null) => void }) {
  const [v_207c31, v_3cc8fd] = v_5ab095(false);
  return (
    <>
      <TouchableOpacity
        onPress={() => v_3cc8fd(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        testID="date-range-button"
      >
        <Feather name="calendar" size={16} color={v_3b402b ? v_1bfbd0.zinc900 : v_1bfbd0.zinc400} />
      </TouchableOpacity>
      <DateRangeSheet
        visible={v_207c31}
        value={v_3b402b}
        onClose={() => v_3cc8fd(false)}
        onApply={(v_cb35cb) => {
          v_3cc8fd(false);
          v_b187d9(v_cb35cb);
        }}
      />
    </>
  );
}

export function v_6e313b({ value: v_3b402b, onClear: v_95c36b }: { value: v_e77dc2 | null; onClear: () => void }) {
  if (!v_3b402b) return null;
  return (
    <View style={v_d81136.chipRow}>
      <TouchableOpacity style={v_d81136.chip} onPress={v_95c36b} activeOpacity={0.75} testID="date-range-chip">
        <Feather name="calendar" size={12} color={v_1bfbd0.zinc600} />
        <Text style={v_d81136.chipText}>{v_669b27(v_3b402b)}</Text>
        <Feather name="x" size={12} color={v_1bfbd0.zinc500} />
      </TouchableOpacity>
    </View>
  );
}

function v_504b91({
  visible: v_cf55be,
  value: v_3b402b,
  onClose: v_0890f8,
  onApply: v_e67921,
}: {
  visible: boolean;
  value: v_e77dc2 | null;
  onClose: () => void;
  onApply: (r: v_e77dc2 | null) => void;
}) {
  const { t: v_8d41d7 } = v_772971();
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);
  const v_284e24 = Math.max(v_033e14.bottom, v_f9771e, v_326be8.OS === "android" ? 24 : 16);

  const [v_f04727, v_a07441] = v_5ab095<{ from: string | null; to: string | null }>({ from: null, to: null });
  const [v_2836d4, v_baf152] = v_5ab095(() => {
    const v_d5dda0 = new Date();
    return { y: v_d5dda0.getFullYear(), m: v_d5dda0.getMonth() };
  });

  v_c4deb2(() => {
    if (!v_cf55be) return;
    v_a07441(v_3b402b ? { from: v_3b402b.from, to: v_3b402b.to } : { from: null, to: null });
    const v_694b25 = v_3b402b ? v_845110(v_3b402b.to) : new Date();
    v_baf152({ y: v_694b25.getFullYear(), m: v_694b25.getMonth() });
  }, [v_cf55be, v_3b402b]);

  const v_227df7 = v_b3d1d6(new Date());
  const v_f91018 = v_df9f57(() => v_c3f0be(v_2836d4.y, v_2836d4.m), [v_2836d4]);
  const v_30a0b6 = (v_e9396c) =>
    v_baf152((v_81e2ef) => {
      const v_d5dda0 = new Date(v_81e2ef.y, v_81e2ef.m + v_e9396c, 1);
      return { y: v_d5dda0.getFullYear(), m: v_d5dda0.getMonth() };
    });
  const v_676e39 = (p: v_d712c8) => {
    const v_cb35cb = v_280133(v_e2a85c);
    v_a07441(v_cb35cb);
    const v_d5dda0 = v_845110(v_cb35cb.to);
    v_baf152({ y: v_d5dda0.getFullYear(), m: v_d5dda0.getMonth() });
  };
  const v_c01be8 = v_be28b6.find((v_e2a85c) => {
    const v_cb35cb = v_280133(v_e2a85c);
    return v_f04727.from === v_cb35cb.from && v_f04727.to === v_cb35cb.to;
  });
  const v_e3876c = !!v_f04727.from;

  return (
    <Modal visible={v_cf55be} transparent animationType="fade" onRequestClose={v_0890f8} statusBarTranslucent>
      <View style={v_d81136.overlay}>
        <Pressable style={v_472849.absoluteFillObject} onPress={v_0890f8} />
        <SwipeDownSheet onClose={v_0890f8} style={[v_d81136.sheet, { paddingBottom: 16 + v_284e24 }]} fitContent>
          <View style={v_d81136.handle} />
          <Text style={v_d81136.title}>{v_8d41d7("giftBox.rangeTitle", { defaultValue: "기간 선택" })}</Text>

          <View style={v_d81136.presetRow}>
            {v_be28b6.map((v_e2a85c) => {
              const v_abacaa = v_c01be8 === v_e2a85c;
              return (
                <TouchableOpacity
                  key={v_e2a85c}
                  style={[v_d81136.preset, v_abacaa && v_d81136.presetOn]}
                  onPress={() => v_676e39(v_e2a85c)}
                  activeOpacity={0.75}
                >
                  <Text style={[v_d81136.presetText, v_abacaa && v_d81136.presetTextOn]}>
                    {v_8d41d7(`giftBox.rangePreset_${v_e2a85c}`, { defaultValue: v_c507d5[v_e2a85c] })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={v_d81136.monthRow}>
            <TouchableOpacity onPress={() => v_30a0b6(-1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="chevron-left" size={20} color={v_1bfbd0.zinc900} />
            </TouchableOpacity>
            <Text style={v_d81136.monthText}>
              {v_2836d4.y}.{String(v_2836d4.m + 1).padStart(2, "0")}
            </Text>
            <TouchableOpacity onPress={() => v_30a0b6(1)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="chevron-right" size={20} color={v_1bfbd0.zinc900} />
            </TouchableOpacity>
          </View>

          <View style={v_d81136.weekRow}>
            {v_857bbc.map((v_0eb677, v_ebec57) => (
              <Text key={v_0eb677} style={[v_d81136.weekText, v_ebec57 === 0 && { color: v_1bfbd0.rose500 }]}>
                {v_8d41d7(`giftBox.weekdayShort${v_0eb677}`, { defaultValue: v_18e715[v_ebec57] })}
              </Text>
            ))}
          </View>
          {v_f91018.map((v_3ac7e7, v_749a5e) => (
            <View key={v_749a5e} style={v_d81136.weekRow}>
              {v_3ac7e7.map((v_087ffc, v_9f8c39) => {
                if (!v_087ffc) return <View key={v_9f8c39} style={v_d81136.cell} />;
                const v_3b508c = v_f04727.to ?? v_f04727.from;
                const v_30dc70 = v_087ffc === v_f04727.from || v_087ffc === v_f04727.to;
                const v_ffb68e = !!v_f04727.from && !!v_3b508c && v_087ffc > v_f04727.from && v_087ffc < v_3b508c;
                return (
                  <Pressable
                    key={v_9f8c39}
                    style={[v_d81136.cell, v_ffb68e && v_d81136.cellIn]}
                    onPress={() => v_a07441((v_d5dda0) => v_cae033(v_d5dda0, v_087ffc))}
                  >
                    <View style={[v_d81136.dayDot, v_30dc70 && v_d81136.dayDotOn]}>
                      <Text
                        style={[
                          v_d81136.dayText,
                          v_087ffc === v_227df7 && v_d81136.dayToday,
                          v_30dc70 && v_d81136.dayTextOn,
                        ]}
                      >
                        {Number(v_087ffc.slice(8))}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <View style={v_d81136.btnRow}>
            <TouchableOpacity style={[v_d81136.btn, v_d81136.btnGhost]} onPress={() => v_e67921(null)} activeOpacity={0.8}>
              <Text style={v_d81136.btnGhostText}>{v_8d41d7("giftBox.rangeReset", { defaultValue: "초기화" })}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[v_d81136.btn, v_d81136.btnPrimary, !v_e3876c && { opacity: 0.4 }]}
              disabled={!v_e3876c}
              onPress={() => v_f04727.from && v_e67921({ from: v_f04727.from, to: v_f04727.to ?? v_f04727.from })}
              activeOpacity={0.8}
            >
              <Text style={v_d81136.btnPrimaryText}>{v_8d41d7("giftBox.rangeApply", { defaultValue: "적용" })}</Text>
            </TouchableOpacity>
          </View>
        </SwipeDownSheet>
      </View>
    </Modal>
  );
}

const v_d81136 = v_472849.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: v_1bfbd0.zinc300, alignSelf: "center", marginVertical: 12 },
  title: { fontSize: 17, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 14 },
  presetRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  preset: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: v_8b0c90.full,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  presetOn: { backgroundColor: v_1bfbd0.zinc900, borderColor: v_1bfbd0.zinc900 },
  presetText: { fontSize: 13, color: v_1bfbd0.zinc600 },
  presetTextOn: { color: v_1bfbd0.white, fontWeight: "600" },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, paddingHorizontal: 4 },
  monthText: { fontSize: 16, fontWeight: "700", color: v_1bfbd0.zinc900, fontVariant: ["tabular-nums"] },
  weekRow: { flexDirection: "row" },
  weekText: { flex: 1, textAlign: "center", fontSize: 12, color: v_1bfbd0.zinc500, paddingVertical: 6 },
  cell: { flex: 1, height: 42, alignItems: "center", justifyContent: "center" },
  cellIn: { backgroundColor: v_1bfbd0.zinc100 },
  dayDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  dayDotOn: { backgroundColor: v_1bfbd0.zinc900 },
  dayText: { fontSize: 14, color: v_1bfbd0.zinc900, fontVariant: ["tabular-nums"] },
  dayToday: { fontWeight: "800", textDecorationLine: "underline" },
  dayTextOn: { color: v_1bfbd0.white, fontWeight: "700" },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  btn: { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnGhost: { backgroundColor: v_1bfbd0.zinc100 },
  btnGhostText: { fontSize: 15, fontWeight: "600", color: v_1bfbd0.zinc600 },
  btnPrimary: { backgroundColor: v_1bfbd0.zinc900 },
  btnPrimaryText: { fontSize: 15, fontWeight: "700", color: v_1bfbd0.white },
  chipRow: { flexDirection: "row", marginTop: -4, marginBottom: 12 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: v_8b0c90.full,
    backgroundColor: v_1bfbd0.zinc200,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: v_1bfbd0.zinc900, fontVariant: ["tabular-nums"] },
});
