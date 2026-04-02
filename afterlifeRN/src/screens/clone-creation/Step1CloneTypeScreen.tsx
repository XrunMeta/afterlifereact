import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
} from "rcmrninabrnb";
import v_1a40c4 from "../../components/ui/Button";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import type { v_390fcc } from "xpfgrcdafpntkgxfmgxpxnedjkvmtc";
import type { v_2b51a5 } from "../../navigation/types";

import v_556baf from "../../components/ui/SafeView";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_3183b2 from "../../components/common/StepIndicator";
import v_84e2fc from "../../components/ui/InterestChip";
import { v_194498 } from "../../stores/cloneStore";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";
import v_e775af from "../../components/ui/TextField";

type Props = {
  navigation: v_390fcc<v_2b51a5, "Step1">;
};

import { v_6e79a1, v_a3360a } from "../../mocks/interestHelpers";

export default function v_84d7a5({ navigation: v_c65f5d }: Props) {
  const v_5795de = v_194498((v_fd5f43) => v_fd5f43.setCreationDraft);

  const [v_69ddfb, v_09b78b] = v_5ab095<string>("");
  const [v_976e06, v_770327] = v_5ab095<string[]>([]);
  const [v_7a5ffe, v_8c18c7] = v_5ab095("");

  const v_774c91 = v_69ddfb ? v_a3360a[v_69ddfb] ?? [] : [];

  const v_d82a00 = (v_e4601c) => {
    v_770327((v_ba2215) =>
      v_ba2215.includes(v_e4601c)
        ? v_ba2215.filter((v_ebec57) => v_ebec57 !== v_e4601c)
        : [...v_ba2215, v_e4601c]
    );
  };

  const v_d64dc0 = () => {
    const v_2f361a = v_7a5ffe.trim();
    if (v_2f361a && !v_976e06.includes(v_2f361a)) {
      v_770327((v_ba2215) => [...v_ba2215, v_2f361a]);
      v_8c18c7("");
    }
  };

  const v_420661 = () => {
    v_5795de({
      category: v_69ddfb,
      interests: v_976e06,
    });
    v_c65f5d.navigate("Step2");
  };

  return (
    <SafeView backgroundColor={v_1bfbd0.white}>
      <PageHeader
        title="클론 생성"
        showBackButton
        onBackPress={() => {
          const v_4eab4b = v_c65f5d.getParent();

          v_4eab4b?.navigate("HomeTab" as never);
        }}
        stepInfo={{ current: 1, total: 7 }}
      />
      <StepIndicator currentStep={1} totalSteps={7} />

      <SafeScrollView
        contentContainerStyle={v_d81136.content}
        showsVerticalScrollIndicator={false}
        autoAdjustKeyboardPadding={true}
        showBottomBackground={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={v_d81136.container}>
          {}
          <Text style={v_d81136.sectionTitle}>카테고리 선택</Text>
          <View style={v_d81136.categoryGrid}>
            {v_6e79a1.map((v_9bf432) => (
              <TouchableOpacity
                key={v_9bf432.id}
                style={[
                  v_d81136.categoryCard,
                  v_69ddfb === v_9bf432.id && v_d81136.categoryCardActive,
                ]}
                onPress={() => {
                  v_09b78b(v_9bf432.id);
                  v_770327([]);
                }}
                activeOpacity={0.7}
              >

                <Text style={v_d81136.categoryEmoji}>{v_9bf432.emoji}</Text>
                <Text
                  style={[
                    v_d81136.categoryLabel,
                    v_69ddfb === v_9bf432.id && v_d81136.categoryLabelActive,
                  ]}
                >
                  {v_9bf432.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {}
          {v_774c91.length > 0 && (
            <>
              <Text style={v_d81136.sectionTitle}>관심사 선택</Text>
              <View style={v_d81136.chipGrid}>
                {v_774c91.map((v_e4601c) => (
                  <InterestChip
                    key={v_e4601c}
                    label={v_e4601c}
                    selected={v_976e06.includes(v_e4601c)}
                    onPress={() => v_d82a00(v_e4601c)}
                  />
                ))}
                {}
                {v_976e06
                  .filter((v_ebec57) => !v_774c91.includes(v_ebec57))
                  .map((v_e4601c) => (
                    <InterestChip
                      key={v_e4601c}
                      label={v_e4601c}
                      selected
                      onPress={() => v_d82a00(v_e4601c)}
                    />
                  ))}
              </View>

              {}
              <View style={v_d81136.customRow}>
                <TextField
                  value={v_7a5ffe}
                  onChangeText={v_8c18c7}
                  placeholderTextColor={v_1bfbd0.zinc400}
                  onSubmitEditing={v_d64dc0}
                  placeholder="커스텀 관심사 추가"
                  containerStyle={v_d81136.customInput}
                />
                <TouchableOpacity
                  onPress={v_d64dc0}
                  style={v_d81136.addButton}
                >
                  <Feather name="plus" size={20} color={v_1bfbd0.white} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </SafeScrollView>

      {}
      <View style={v_d81136.bottomBar}>
        <Button title="다음 단계로 이동" onPress={v_420661} disabled={v_976e06.length === 0} />
      </View>
    </SafeView>
  );
}

const v_d81136 = v_472849.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: v_9b1a04.xlarge,
    paddingVertical: v_9b1a04.xlarge,
  },
  container: { width: "100%", maxWidth: 780, gap: v_9b1a04.xlarge },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "47%",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: v_8b0c90.lg,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    backgroundColor: v_1bfbd0.white,
    alignItems: "center",
    gap: 8,
  },
  categoryCardActive: {
    borderColor: v_1bfbd0.violet500,
    backgroundColor: v_1bfbd0.violet100,
  },
  categoryEmoji: { fontSize: 28 },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: v_1bfbd0.zinc700,
    textAlign: "center",
  },
  categoryLabelActive: { color: v_1bfbd0.violet600 },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  customInput: {
    flex: 1,
    minWidth: 0,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc900,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    paddingHorizontal: v_9b1a04.xlarge,
    paddingVertical: v_9b1a04.medium,
    borderTopWidth: 1,
    borderTopColor: v_1bfbd0.zinc200,
  },
});
