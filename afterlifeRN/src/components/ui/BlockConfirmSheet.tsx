

import v_a3453e from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_cf9c33,
  v_09d0e5,
  v_472849,
  v_e45a99,
} from "rcmrninabrnb";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_772971 } from "jmpfvteuuztnp";
import { v_1bfbd0 } from "../constants";

interface Props {
  visible: boolean;
  userName: string;
  userAvatarUrl?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

interface RowProps {
  icon: v_a3453e.ComponentProps<typeof v_dec439>["name"];
  text: string;
}

const InfoRow: v_a3453e.FC<RowProps> = ({ icon: v_9ddfab, text: v_9b6134 }) => (
  <View style={v_d81136.row}>
    <Feather name={v_9ddfab} size={24} color="#000000" style={{ marginTop: 2 }} />
    <Text style={v_d81136.rowText}>{v_9b6134}</Text>
  </View>
);

export default function v_4d9c69({ visible: v_cf55be, userName: v_f08a5e, userAvatarUrl: v_9839ce, onCancel: v_c7001c, onConfirm: v_e2be2d }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const { height: v_c86e33 } = v_e45a99();

  const v_033e14 = v_e0068c();
  return (
    <Modal visible={v_cf55be} transparent animationType="slide" onRequestClose={v_c7001c}>
      <Pressable style={v_d81136.backdrop} onPress={v_c7001c}>
        <Pressable
          style={[
            v_d81136.sheet,
            { maxHeight: v_c86e33 * 0.85, paddingBottom: 32 + Math.max(v_033e14.bottom, 0) },
          ]}
          onPress={(v_9e86fd) => v_9e86fd.stopPropagation?.()}
        >
          <View style={v_d81136.handle} />

          {}
          <View style={v_d81136.avatarWrap}>
            {v_9839ce ? (
              <Image source={{ uri: v_9839ce }} style={v_d81136.avatar} />
            ) : (
              <View style={[v_d81136.avatar, v_d81136.avatarPlaceholder]}>
                <Feather name="user" size={32} color={v_1bfbd0.zinc400} />
              </View>
            )}
          </View>

          {}
          <Text style={v_d81136.title}>{v_8d41d7("block.title", { name: v_f08a5e, defaultValue: "{{name}} 님을\n차단하시겠어요?" })}</Text>

          {}
          <Text style={v_d81136.subtitle}>
            {v_8d41d7("block.subtitle", { defaultValue: "이 사람이 만든 다른 프로필과 앞으로 만드는 모든 프로필이 함께 차단됩니다." })}
          </Text>

          {}
          <View style={v_d81136.infoList}>
            <InfoRow
              icon="slash"
              text={v_8d41d7("block.info1", { defaultValue: "차단된 사람은 회원님에게 댓글을 작성하거나 회원님의 프로필 · 콘텐츠를 찾을 수 없게 됩니다." })}
            />
            <InfoRow
              icon="bell-off"
              text={v_8d41d7("block.info2", { defaultValue: "상대방에게는 회원님이 차단한 사실을 알리지 않습니다." })}
            />
            <InfoRow
              icon="settings"
              text={v_8d41d7("block.info3", { defaultValue: "마이페이지 > 차단 사용자 관리에서 언제든지 차단을 해제할 수 있습니다." })}
            />
          </View>

          {}
          <Pressable
            style={({ pressed: v_aba1d2 }) => [v_d81136.confirmBtn, v_aba1d2 && { opacity: 0.85 }]}
            onPress={v_e2be2d}
          >
            <Text style={v_d81136.confirmBtnText}>{v_8d41d7("block.confirm", { defaultValue: "차단" })}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const v_d81136 = v_472849.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,

  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc300,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarPlaceholder: {
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: v_1bfbd0.zinc700,
    lineHeight: 20,
    marginBottom: 24,
  },
  infoList: {
    gap: 18,
    marginBottom: 32,
  },
  row: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: v_1bfbd0.zinc700,
    lineHeight: 20,
  },
  confirmBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: v_1bfbd0.white,
  },
});
