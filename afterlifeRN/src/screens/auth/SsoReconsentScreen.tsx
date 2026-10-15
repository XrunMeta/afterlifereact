

import v_a3453e, { v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_122070,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import v_556baf from "../../components/ui/SafeView";
import v_1a40c4 from "../../components/ui/Button";
import v_c0caa9, { type v_3ac6ea } from "../../components/common/TermsModal";
import { v_fa872d } from "../../hooks/useSsoReconsentGate";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_1bfbd0, v_9b1a04, v_8b0c90 } from "../../components/constants";

type Props = { onDone: () => void };

export default function v_ac767f({ onDone: v_7b5712 }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);
  const [v_d39271, v_fe0d62] = v_5ab095<v_3ac6ea | null>(null);
  const [v_51b53b, v_c8f346] = v_5ab095(false);
  const [v_09b7fa, v_1d4807] = v_5ab095(false);
  const [v_540cd3, v_a67880] = v_5ab095(false);
  const [v_ae0efb, v_f2d945] = v_5ab095(false);
  const [v_cb66b4, v_ee9ec1] = v_5ab095(false);

  const v_8c2724 = v_51b53b && v_09b7fa && v_540cd3 && v_ae0efb;

  const v_0217e6 = () => {
    const v_a448ad = !v_8c2724;
    v_c8f346(v_a448ad);
    v_1d4807(v_a448ad);
    v_a67880(v_a448ad);
    v_f2d945(v_a448ad);
  };

  const v_0577ff = async () => {
    if (!v_8c2724 || v_cb66b4) return;
    v_ee9ec1(true);
    try {
      await v_fa872d(v_2ca7e0);

      await v_1ed7d9.getState().refreshApiUser?.();
      v_7b5712();
    } finally {
      v_ee9ec1(false);
    }
  };

  return (
    <SafeView style={v_d81136.root}>
      <ScrollView contentContainerStyle={v_d81136.scroll}>
        <Text style={v_d81136.title}>
          {v_8d41d7("sso.reconsent.title", { defaultValue: "SSO 통합 계정 전환 안내" })}
        </Text>
        <Text style={v_d81136.subtitle}>
          {v_8d41d7("sso.reconsent.subtitle", {
            defaultValue:
              "서비스 통합을 위해 약관이 개정되었습니다.\n아래 필수 약관에 다시 동의해 주세요.",
          })}
        </Text>

        {}
        <TouchableOpacity onPress={v_0217e6} style={[v_d81136.row, v_d81136.rowAll]}>
          <View style={[v_d81136.checkbox, v_8c2724 && v_d81136.checkboxChecked]}>
            {v_8c2724 && <Feather name="check" size={14} color={v_1bfbd0.white} />}
          </View>
          <Text style={[v_d81136.text, v_d81136.textAll]}>
            {v_8d41d7("sso.reconsent.agreeAll", { defaultValue: "4개 필수 약관 모두 동의" })}
          </Text>
        </TouchableOpacity>

        <View style={v_d81136.divider} />

        {}
        <ConsentRow
          checked={v_51b53b}
          onCheck={() => v_c8f346(!v_51b53b)}
          onReadMore={() => v_fe0d62(1)}
          label="[필수] SSO 통합 서비스 이용약관"
        />
        {}
        <ConsentRow
          checked={v_09b7fa}
          onCheck={() => v_1d4807(!v_09b7fa)}
          onReadMore={() => v_fe0d62(3)}
          label="[필수] SSO 통합 개인정보 처리방침"
        />
        {}
        <ConsentRow
          checked={v_540cd3}
          onCheck={() => v_a67880(!v_540cd3)}
          onReadMore={() => v_fe0d62(2)}
          label="[필수] 위치기반서비스 이용약관"
        />
        {}
        <ConsentRow
          checked={v_ae0efb}
          onCheck={() => v_f2d945(!v_ae0efb)}
          onReadMore={() => v_fe0d62(5)}
          label="[필수] AI 데이터 활용 및 생성 동의"
        />

        <View style={{ height: 24 }} />

        <Button
          title={
            v_cb66b4
              ? v_8d41d7("sso.reconsent.saving", { defaultValue: "처리 중..." })
              : v_8d41d7("sso.reconsent.continue", { defaultValue: "동의하고 계속" })
          }
          onPress={v_0577ff}
          disabled={!v_8c2724 || v_cb66b4}
        />
      </ScrollView>

      <TermsModal
        visible={v_d39271 !== null}
        type={v_d39271}
        onClose={() => v_fe0d62(null)}
        onAgree={() => {
          if (v_d39271 === 1) v_c8f346(true);
          else if (v_d39271 === 3) v_1d4807(true);
          else if (v_d39271 === 2) v_a67880(true);
          else if (v_d39271 === 5) v_f2d945(true);
          v_fe0d62(null);
        }}
      />
    </SafeView>
  );
}

function v_303c42({
  checked: v_da90dc,
  onCheck: v_11e7c0,
  onReadMore: v_1f5aec,
  label: v_2869c1,
}: {
  checked: boolean;
  onCheck: () => void;
  onReadMore: () => void;
  label: string;
}) {
  return (
    <View style={v_d81136.row}>
      <TouchableOpacity onPress={v_11e7c0} hitSlop={8}>
        <View style={[v_d81136.checkbox, v_da90dc && v_d81136.checkboxChecked]}>
          {v_da90dc && <Feather name="check" size={14} color={v_1bfbd0.white} />}
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={v_d81136.textWrap} onPress={v_1f5aec} activeOpacity={0.7}>
        <Text style={[v_d81136.text, v_d81136.textLink]}>{v_2869c1}</Text>
      </TouchableOpacity>
    </View>
  );
}

const v_d81136 = v_472849.create({
  root: { flex: 1, backgroundColor: v_1bfbd0.white },
  scroll: { padding: v_9b1a04.large, paddingBottom: 60 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: v_1bfbd0.zinc900,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: v_1bfbd0.zinc600,
    lineHeight: 20,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  rowAll: {
    paddingVertical: 14,
    backgroundColor: v_1bfbd0.zinc50,
    paddingHorizontal: 12,
    borderRadius: v_8b0c90.small,
  },
  divider: {
    height: v_472849.hairlineWidth,
    backgroundColor: v_1bfbd0.zinc200,
    marginVertical: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: v_1bfbd0.zinc400,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: v_1bfbd0.violet600,
    borderColor: v_1bfbd0.violet600,
  },
  textWrap: { flex: 1 },
  text: { fontSize: 14, color: v_1bfbd0.zinc700 },
  textAll: { fontWeight: "700", color: v_1bfbd0.zinc900 },
  textLink: { textDecorationLine: "underline" },
});
