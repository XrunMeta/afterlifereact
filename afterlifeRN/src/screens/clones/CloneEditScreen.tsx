

import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_c4deb2, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_39a996,
  v_4623af,
  v_122070,
} from "rcmrninabrnb";
import { v_772971 } from "jmpfvteuuztnp";
import type { v_432191 } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2d88fc } from "../../navigation/types";
import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_e775af from "../../components/ui/TextField";
import v_1a40c4 from "../../components/ui/Button";
import v_258c1c from "../../components/common/PageHeader";
import { v_194498 } from "../../stores/cloneStore";
import { v_1ed7d9 } from "../../stores/authStore";
import {
  v_bb226e,
  v_d60cdf,
  v_3ee8c0,
  type v_d80981,
} from "../../api/clones";
import { v_84a859 } from "../../api/auth";
import { v_a8d790 } from "../../lib/adaptMyClone";
import { v_5401ae } from "../../testIDs";
import type { v_4b85a1 as v_affcc0 } from "../../types/domain";
import { v_1bfbd0, v_e3d001, v_9b1a04 } from "../../components/constants";
import { v_e82960, type v_0eab75 } from "qmmwyqbwrg";

type Visibility = "public" | "private" | "followers";

type Props = v_432191<v_2d88fc, "CloneEdit">;

export default function v_541fbd({ route: v_c7daf6, navigation: v_c65f5d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const { cloneId: v_6e0fd3 } = v_c7daf6.params;
  const v_eb25ce = v_194498((v_fd5f43) => v_fd5f43.getCloneById(v_6e0fd3));
  const v_941cd7 = v_194498((v_fd5f43) => v_fd5f43.updateLocalClone);
  const v_7a98d1 = v_194498((v_fd5f43) => v_fd5f43.upsertClones);

  const [v_1833e7, v_318f24] = v_5ab095("");
  const [v_6856a9, v_b7e174] = v_5ab095("");

  const [v_818579, v_2cf16e] = v_5ab095<Visibility>("public");
  const [v_35bf26, v_04e389] = v_5ab095(false);

  const [v_43fc49, v_ff2ade] = v_5ab095(false);

  const [v_1f4508, v_8dfbff] = v_5ab095<number | null>(null);
  const [v_53e1f3, v_de0f36] = v_5ab095<v_d80981[]>([]);
  const [v_7e4593, v_9ae340] = v_5ab095(false);
  const [v_aa617a, v_b76e01] = v_5ab095<number | null>(null);
  const v_b53f6c = v_e662ae<v_0eab75 | null>(null);

  const v_586061 = v_e662ae(false);
  v_c4deb2(() => {
    if (v_eb25ce || v_586061.current) return;
    v_586061.current = true;
    const v_2ca7e0 = v_1ed7d9.getState().accessToken;
    if (!v_2ca7e0) return; 
    v_ff2ade(true);
    v_d60cdf(v_2ca7e0)
      .then((v_8f00b9) => v_7a98d1(v_8f00b9.items.map(v_a8d790)))
      .catch((v_49263d) => {
        console.warn("[CloneEdit] hydrate failed:", v_49263d);
      })
      .finally(() => v_ff2ade(false));
  }, [v_eb25ce, v_7a98d1]);

  v_c4deb2(() => {
    if (!v_eb25ce) return;
    v_318f24(v_eb25ce.displayName);

    v_b7e174((v_eb25ce.description ?? "").slice(0, 500));
    v_2cf16e((v_eb25ce.visibility as Visibility) ?? "public");
    v_8dfbff(v_eb25ce.voicePresetId ?? null);
  }, [v_eb25ce]);

  const v_ae2f12 = () => {
    const v_e2a85c = v_b53f6c.current;
    v_b53f6c.current = null;
    if (!v_e2a85c) return;
    try {
      v_e2a85c.pause();
    } catch {

    }
    try {
      v_e2a85c.remove();
    } catch {

    }
  };

  v_c4deb2(() => {
    const v_2ca7e0 = v_1ed7d9.getState().accessToken;
    if (!v_2ca7e0) return;
    v_9ae340(true);
    v_3ee8c0(v_2ca7e0)
      .then(v_de0f36)
      .catch((v_49263d) => console.warn("[CloneEdit] getVoices failed:", v_49263d))
      .finally(() => v_9ae340(false));
    return () => {
      v_ae2f12();
    };

  }, []);

  const v_1bf8db = (v: v_d80981) => {

    const v_1b5fb6 = v_aa617a === v_81e2ef.id;
    v_ae2f12();
    if (v_1b5fb6) {
      v_b76e01(null);
      return;
    }
    if (!v_81e2ef.sampleUrl) return;
    try {
      const v_86394a = v_e82960(v_81e2ef.sampleUrl);
      v_b53f6c.current = v_86394a;
      v_b76e01(v_81e2ef.id);
      v_86394a.play();
    } catch (v_49263d) {
      console.warn("[CloneEdit] preview failed:", v_49263d);
      v_b76e01(null);
    }
  };

  if (!v_eb25ce) {
    return (
      <View style={v_fd5f43.notFound}>
        {v_43fc49 ? (
          <ActivityIndicator testID={v_5401ae.cloneEdit.loading} color={v_1bfbd0.zinc400} />
        ) : (
          <Text testID={v_5401ae.cloneEdit.notFound} style={v_fd5f43.notFoundText}>
            {v_8d41d7("edit.notFound")}
          </Text>
        )}
      </View>
    );
  }

  const v_1b8283 = async () => {
    if (v_35bf26) return;
    v_04e389(true);
    const v_2ca7e0 = v_1ed7d9.getState().accessToken;

    try {
      if (v_2ca7e0) {

        const v_931bf0 = { name: v_1833e7, description: v_6856a9, visibility: v_818579 };
        if (v_1f4508 !== (v_eb25ce.voicePresetId ?? null)) {
          v_931bf0.voice_preset_id = v_1f4508;
        }
        await v_bb226e(v_2ca7e0, v_eb25ce.id, v_931bf0);
      }
      v_941cd7(v_eb25ce.id, {
        displayName: v_1833e7,
        description: v_6856a9,
        visibility: v_818579,
        voicePresetId: v_1f4508,
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
    <SafeView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      {}
      <PageHeader
        title={v_8d41d7("edit.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <SafeScrollView
        style={{ flex: 1 }}
        contentContainerStyle={v_fd5f43.content}
        autoAdjustKeyboardPadding
        showBottomBackground={false}
        disableBottomPadding

        additionalBottomPadding={24}
      >
        {}
        <TextField
          testID={v_5401ae.cloneEdit.nameInput}
          label={v_8d41d7("edit.nameLabel")}
          value={v_1833e7}
          onChangeText={v_318f24}
          placeholder={v_8d41d7("edit.namePlaceholder")}
        />

        {}
        <TextField
          testID={v_5401ae.cloneEdit.descInput}
          label={v_8d41d7("edit.descLabel")}
          value={v_6856a9}
          onChangeText={(v_81e2ef) => v_b7e174(v_81e2ef.slice(0, 500))}
          placeholder={v_8d41d7("edit.descPlaceholder")}
          multiline
          maxLength={500}
          containerStyle={{ marginTop: 16 }}
        />
        <Text testID={v_5401ae.cloneEdit.descCounter} style={v_fd5f43.descCounter}>
          {v_6856a9.length}/500
        </Text>

        {}
        <View style={v_fd5f43.voiceSection}>
          <Text style={v_fd5f43.sectionLabel}>{v_8d41d7("edit.voiceLabel", { defaultValue: "목소리" })}</Text>

          {}
          <View style={v_fd5f43.currentVoiceCard}>
            <Text style={v_fd5f43.currentVoiceLabel}>{v_8d41d7("edit.currentVoiceLabel", { defaultValue: "현재 목소리" })}</Text>
            <Text style={v_fd5f43.currentVoiceValue}>
              {v_1f4508 == null
                ? v_8d41d7("edit.currentVoiceRecorded", { defaultValue: "🎙 직접 녹음한 목소리 (페르소나 생성 시 설정)" })
                : v_53e1f3.find((v_81e2ef) => v_81e2ef.id === v_1f4508)?.name
                  ? `🎵 ${v_53e1f3.find((v_81e2ef) => v_81e2ef.id === v_1f4508)!.name}`
                  : v_8d41d7("edit.currentVoiceCatalog", { defaultValue: "🎵 카탈로그 목소리" })}
            </Text>
            <Text style={v_fd5f43.currentVoiceHint}>
              {v_8d41d7("edit.currentVoiceHint", { defaultValue: "아래 목록에서 다른 목소리를 선택하면 통화 시 그 목소리로 재생됩니다." })}
            </Text>
          </View>

          {v_7e4593 ? (
            <ActivityIndicator color={v_1bfbd0.zinc400} style={{ marginTop: 12 }} />
          ) : v_53e1f3.length === 0 ? (
            <Text style={v_fd5f43.emptyVoice}>{v_8d41d7("edit.voiceEmpty", { defaultValue: "등록된 목소리가 없습니다." })}</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={v_fd5f43.voiceRow}
            >
              {v_53e1f3.map((v_81e2ef) => {
                const v_599a41 = v_81e2ef.id === v_1f4508;
                const v_087c92 = v_81e2ef.id === v_aa617a;
                return (
                  <TouchableOpacity
                    key={v_81e2ef.id}
                    style={[v_fd5f43.voiceCard, v_599a41 && v_fd5f43.voiceCardSelected]}
                    onPress={() => v_8dfbff(v_81e2ef.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[v_fd5f43.voiceName, v_599a41 && v_fd5f43.voiceNameSelected]}
                      numberOfLines={2}
                    >
                      {v_81e2ef.name}
                    </Text>
                    <Text style={v_fd5f43.voiceMeta} numberOfLines={1}>
                      {[v_81e2ef.gender, v_81e2ef.ageRange].filter(Boolean).join(" · ") || " "}
                    </Text>
                    <TouchableOpacity
                      style={v_fd5f43.previewBtn}
                      onPress={() => v_1bf8db(v_81e2ef)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={v_fd5f43.previewBtnText}>
                        {v_087c92
                          ? v_8d41d7("edit.voiceStop", { defaultValue: "■ 정지" })
                          : v_8d41d7("edit.voicePreview", { defaultValue: "▶ 미리듣기" })}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {
}
      </SafeScrollView>

      <View style={v_fd5f43.bottomBar}>
        <Button
          testID={v_5401ae.cloneEdit.save}
          title={v_35bf26 ? v_8d41d7("common.loading") : v_8d41d7("edit.save")}
          variant="primary"
          onPress={v_1b8283}
          disabled={!v_1833e7 || v_35bf26}
          style={v_fd5f43.saveBtn}
        />
      </View>
    </SafeView>
  );
}

const v_fd5f43 = v_472849.create({
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  notFoundText: { fontSize: 15, color: v_1bfbd0.zinc500 },
  content: {
    paddingHorizontal: v_9b1a04.large,
    paddingTop: 24,
  },

  descCounter: {
    marginTop: 6,
    alignSelf: "flex-end",
    fontSize: 12,
    color: v_1bfbd0.zinc400,
  },
  bottomBar: {
    padding: v_9b1a04.large,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc100,
    backgroundColor: v_1bfbd0.white,
  },
  saveBtn: { width: "100%", alignSelf: "stretch" },

  voiceSection: {
    marginTop: 24,
  },
  currentVoiceCard: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: v_1bfbd0.zinc100,
    marginBottom: 12,
  },
  currentVoiceLabel: {
    fontSize: 11,
    color: v_1bfbd0.zinc500,
    marginBottom: 4,
  },
  currentVoiceValue: {
    fontSize: 14,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
  },
  currentVoiceHint: {
    fontSize: 11,
    color: v_1bfbd0.zinc500,
    marginTop: 6,
    lineHeight: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: v_1bfbd0.zinc700,
    marginBottom: 10,
  },
  emptyVoice: {
    fontSize: 13,
    color: v_1bfbd0.zinc400,
    paddingVertical: 12,
  },
  voiceRow: {
    gap: 10,
    paddingRight: v_9b1a04.large,
  },

  voiceCard: {
    width: 140,
    height: 128,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
    backgroundColor: v_1bfbd0.white,
    overflow: "hidden",
  },
  voiceCardSelected: {
    borderWidth: 2,
    ...v_e3d001.cardTint,
  },
  voiceName: {
    fontSize: 14,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
    height: 36,
    lineHeight: 18,
  },
  voiceNameSelected: v_e3d001.accentText,
  voiceMeta: {
    fontSize: 11,
    color: v_1bfbd0.zinc500,
    marginTop: 4,
    height: 14,
    lineHeight: 14,
  },
  previewBtn: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: v_1bfbd0.zinc100,
    borderRadius: 6,
    alignItems: "center",
  },
  previewBtnText: {
    fontSize: 11,
    color: v_1bfbd0.zinc700,
    fontWeight: "600",
  },
});
