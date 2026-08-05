

import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
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
import type { v_4b85a1 as v_affcc0 } from "../../types/domain";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";

type Visibility = "public" | "private" | "followers";

type Props = v_432191<v_2d88fc, "CloneEdit">;

export default function v_541fbd({ route: v_c7daf6, navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_033e14 = v_e0068c();
  const { cloneId: v_6e0fd3 } = v_c7daf6.params;
  const v_eb25ce = v_194498((v_fd5f43) => v_fd5f43.getCloneById(v_6e0fd3));
  const v_941cd7 = v_194498((v_fd5f43) => v_fd5f43.updateLocalClone);

  const [v_1833e7, v_318f24] = v_5ab095("");
  const [v_6856a9, v_b7e174] = v_5ab095("");

  const [v_818579, v_2cf16e] = v_5ab095<Visibility>("public");
  const [v_35bf26, v_04e389] = v_5ab095(false);

  v_c4deb2(() => {
    if (!v_eb25ce) return;
    v_318f24(v_eb25ce.displayName);

    v_b7e174((v_eb25ce.description ?? "").slice(0, 100));
    v_2cf16e((v_eb25ce.visibility as Visibility) ?? "public");
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
    const v_2ca7e0 = v_1ed7d9.getState().accessToken;

    try {
      if (v_2ca7e0) {

        await v_bb226e(v_2ca7e0, v_eb25ce.id, {
          name: v_1833e7,
          description: v_6856a9,
          visibility: v_818579,
        });
      }
      v_941cd7(v_eb25ce.id, {
        displayName: v_1833e7,
        description: v_6856a9,
        visibility: v_818579,
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
          onChangeText={(v_81e2ef) => v_b7e174(v_81e2ef.slice(0, 100))}
          placeholder={v_8d41d7("edit.descPlaceholder")}
          multiline
          maxLength={100}
          containerStyle={{ marginTop: 16 }}
        />
        <Text style={v_fd5f43.descCounter}>{v_6856a9.length}/100</Text>

        {}
        <TouchableOpacity
          onPress={() => v_c65f5d.navigate("CloneLearn", { cloneId: v_6e0fd3 })}
          activeOpacity={0.8}
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: v_8b0c90.md,
            borderWidth: 1,
            borderColor: v_1bfbd0.violet500,
            backgroundColor: v_1bfbd0.violet100,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: v_1bfbd0.violet500 }}>
              {v_8d41d7("edit.learnCtaTitle", { defaultValue: "학습하기 →" })}
            </Text>
            <Text style={{ fontSize: 12, color: v_1bfbd0.zinc600, marginTop: 4 }}>
              {v_8d41d7("edit.learnCtaDesc", { defaultValue: "관리자 질문에 답변해서 클론에게 지식을 쌓아주세요" })}
            </Text>
          </View>
        </TouchableOpacity>
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

  descCounter: {
    marginTop: 6,
    alignSelf: "flex-end",
    fontSize: 12,
    color: v_1bfbd0.zinc400,
  },
  bottomBar: {
    paddingHorizontal: v_9b1a04.large,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc100,
    backgroundColor: v_1bfbd0.white,
  },
  saveBtn: { width: "100%" },
});
