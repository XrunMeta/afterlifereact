

import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_03e392,
} from "rcmrninabrnb";
import { v_772971 } from "jmpfvteuuztnp";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2d88fc } from "../../navigation/types";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_e775af from "../../components/ui/TextField";
import v_1a40c4 from "../../components/ui/Button";
import v_258c1c from "../../components/common/PageHeader";
import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_bb226e } from "../../api/clones";
import { v_84a859 } from "../../api/auth";
import type { v_eceede, v_4b85a1 as v_affcc0 } from "../../types/domain";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";

type Visibility = "public" | "private" | "followers";

type Props = v_432191<v_2d88fc, "CloneEdit">;

const v_9a666d = [
  { key: "firstMeeting", label: "첫 만남" },
  { key: "habit", label: "습관/말투" },
  { key: "personality", label: "성격" },
  { key: "memory", label: "가장 선명한 추억" },
] as const;
type SectionKey = (typeof v_9a666d)[number]["key"];

function v_b1c8dd(v_661aec): Record<SectionKey, string> {
  const v_8d4337 = {
    firstMeeting: "",
    habit: "",
    personality: "",
    memory: "",
  };
  if (!v_661aec) return v_8d4337;

  const v_2d716a = new Map<string, SectionKey>();
  for (const v_fd5f43 of v_9a666d) v_2d716a.set(v_fd5f43.label, v_fd5f43.key);

  const v_a52412 = v_661aec.split("\n");
  let v_c84c22 = null;
  const v_062bb0 = {
    firstMeeting: [],
    habit: [],
    personality: [],
    memory: [],
  };
  for (const v_e6293e of v_a52412) {
    const v_35f85c = v_e6293e.match(/^\[(.+)\]\s*$/);
    if (v_35f85c) {
      const v_b24339 = v_2d716a.get(v_35f85c[1]!);
      v_c84c22 = v_b24339 ?? null;
      continue;
    }
    if (v_c84c22) v_062bb0[v_c84c22].push(v_e6293e);
  }
  for (const v_fd5f43 of v_9a666d) {
    v_8d4337[v_fd5f43.key] = v_062bb0[v_fd5f43.key].join("\n").trim();
  }
  return v_8d4337;
}

function v_6c06d1(v_6fea0b): string {
  const v_468545 = [];
  for (const v_fd5f43 of v_9a666d) {
    const v_81e2ef = v_6fea0b[v_fd5f43.key].trim();
    if (v_81e2ef) v_468545.push(`[${v_fd5f43.label}]\n${v_81e2ef}`);
  }
  return v_468545.join("\n\n");
}

export default function v_541fbd({ route: v_c7daf6, navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_033e14 = v_e0068c();
  const { cloneId: v_6e0fd3 } = v_c7daf6.params;
  const v_eb25ce = v_194498((v_fd5f43) => v_fd5f43.getCloneById(v_6e0fd3));
  const v_941cd7 = v_194498((v_fd5f43) => v_fd5f43.updateLocalClone);

  const [v_1833e7, v_318f24] = v_5ab095("");
  const [v_6856a9, v_b7e174] = v_5ab095("");

  const [v_9d451c, v_087901] = v_5ab095("");
  const [v_7fae74, v_e2f100] = v_5ab095("");
  const [v_324a89, v_87462f] = v_5ab095("");
  const [v_773b4c, v_f714d9] = v_5ab095("");

  const [v_55a58f, v_249bdc] = v_5ab095<Record<string, string>>({});

  const [v_818579, v_2cf16e] = v_5ab095<Visibility>("public");
  const [v_35bf26, v_04e389] = v_5ab095(false);

  v_c4deb2(() => {
    if (!v_eb25ce) return;
    v_318f24(v_eb25ce.displayName);
    v_b7e174(v_eb25ce.description ?? "");
    v_2cf16e((v_eb25ce.visibility as Visibility) ?? "public");
    const v_8decf8 = v_b1c8dd(v_eb25ce.l1Profile?.notes ?? "");
    v_087901(v_8decf8.firstMeeting);
    v_e2f100(v_8decf8.habit);
    v_87462f(v_8decf8.personality);
    v_f714d9(v_8decf8.memory);
    v_249bdc(v_eb25ce.l1Profile?.attrs ?? {});
  }, [v_eb25ce]);

  if (!v_eb25ce) {
    return (
      <View style={v_fd5f43.notFound}>
        <Text style={v_fd5f43.notFoundText}>{v_8d41d7("edit.notFound")}</Text>
      </View>
    );
  }

  const v_1b8283 = async () => {
    if (v_35bf26) return;
    v_04e389(true);
    const v_661aec = v_6c06d1({ firstMeeting: v_9d451c, habit: v_7fae74, personality: v_324a89, memory: v_773b4c });
    const l1Payload: v_eceede = { attrs: v_55a58f, notes: v_661aec };
    const v_2ca7e0 = v_1ed7d9.getState().accessToken;

    try {
      if (v_2ca7e0) {
        await v_bb226e(v_2ca7e0, v_eb25ce.id, {
          name: v_1833e7,
          description: v_6856a9,
          visibility: v_818579,
          l1_profile: v_67628a,
        });
      }
      v_941cd7(v_eb25ce.id, {
        displayName: v_1833e7,
        description: v_6856a9,
        visibility: v_818579,
        l1Profile: v_67628a,
      } as Partial<v_affcc0>);
      v_c65f5d.goBack();
    } catch (v_49263d) {
      console.warn("[CloneEdit] save failed:", v_49263d);
      const v_badeaf = v_49263d instanceof v_84a859 ? v_49263d.message : v_8d41d7("edit.saveFailed");
      v_889fad(v_8d41d7("common.error"), v_badeaf);
    } finally {
      v_04e389(false);
    }
  };

  void v_2cf16e;

  return (
    <SafeScrollView
      backgroundColor={v_1bfbd0.white}
      autoAdjustKeyboardPadding
      additionalBottomPadding={80}
      showBottomBackground={false}
    >
      {}
      <PageHeader
        title={v_8d41d7("edit.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <View style={v_fd5f43.content}>
        {}
        <TextField
          label={v_8d41d7("edit.nameLabel")}
          value={v_1833e7}
          onChangeText={v_318f24}
          placeholder={v_8d41d7("edit.namePlaceholder")}
        />

        {}
        <TextField
          label={v_8d41d7("edit.descLabel")}
          value={v_6856a9}
          onChangeText={v_b7e174}
          placeholder={v_8d41d7("edit.descPlaceholder")}
          multiline
          containerStyle={{ marginTop: 16 }}
        />

        {}
        <Text style={v_fd5f43.sectionHeader}>페르소나 설명</Text>
        <TextField
          label="첫 만남"
          value={v_9d451c}
          onChangeText={v_087901}
          placeholder="처음 만났을 때의 장면, 인상, 분위기..."
          multiline
          containerStyle={{ marginTop: 8 }}
        />
        <TextField
          label="습관/말투"
          value={v_7fae74}
          onChangeText={v_e2f100}
          placeholder="자주 하던 말, 작은 습관, 좋아하던 자리..."
          multiline
          containerStyle={{ marginTop: 12 }}
        />
        <TextField
          label="성격"
          value={v_324a89}
          onChangeText={v_87462f}
          placeholder="MBTI, 성격, 평소 분위기..."
          multiline
          containerStyle={{ marginTop: 12 }}
        />
        <TextField
          label="가장 선명한 추억"
          value={v_773b4c}
          onChangeText={v_f714d9}
          placeholder="가장 행복하게 웃고 있던 그 순간..."
          multiline
          containerStyle={{ marginTop: 12 }}
        />
      </View>

      {}
      <View style={[v_fd5f43.bottomBar, { paddingBottom: 16 + Math.max(v_033e14.bottom, 0) }]}>
        <Button
          title={v_35bf26 ? v_8d41d7("common.loading") : v_8d41d7("edit.save")}
          variant="primary"
          onPress={v_1b8283}
          disabled={!v_1833e7 || v_35bf26}
          style={v_fd5f43.saveBtn}
        />
      </View>

      {}
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  notFoundText: { fontSize: 15, color: v_1bfbd0.zinc500 },
  content: {
    paddingHorizontal: v_9b1a04.large,
    paddingTop: 24,
    paddingBottom: 32,
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 4,
    fontSize: 16,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
  },
  bottomBar: {
    paddingHorizontal: v_9b1a04.large,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc100,
    backgroundColor: v_1bfbd0.white,
  },
  saveBtn: { width: "100%" },
  dropdown: {
    position: "absolute",
    right: 12,
    top: 56,
    backgroundColor: v_1bfbd0.white,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    paddingVertical: 4,
    zIndex: 50,
    minWidth: 200,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: { fontSize: 14, color: v_1bfbd0.zinc900 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 24,
  },
  modalBox: {
    backgroundColor: v_1bfbd0.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: v_1bfbd0.zinc900, marginBottom: 4 },
  modalDesc: { fontSize: 13, color: v_1bfbd0.zinc500, marginBottom: 16 },
  visibilityOptions: { gap: 8 },
  visibilityOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: v_8b0c90.md,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  visibilityOptionSelected: {
    borderColor: v_1bfbd0.violet600,
    backgroundColor: v_1bfbd0.violet600,
  },
  visibilityOptionText: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
});
