

import v_a3453e from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_09d0e5,
  v_472849,
  v_326be8,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_1bfbd0, v_8b0c90 } from "../../../components/constants";

export type ImageSourceExtraAction = {
  label: string;
  onPress: () => void;
};

interface Props {
  visible: boolean;
  title: string;
  cameraLabel: string;
  libraryLabel: string;
  cancelLabel: string;
  onCamera: () => void;
  onLibrary: () => void;
  onClose: () => void;

  extraActions?: ImageSourceExtraAction[];
}

export default function v_c7021f({
  visible: v_cf55be,
  title: v_9f1622,
  cameraLabel: v_dcaafa,
  libraryLabel: v_4ec7de,
  cancelLabel: v_ec78e0,
  onCamera: v_c117b1,
  onLibrary: v_66c398,
  onClose: v_0890f8,
  extraActions: v_6eb403,
}: Props) {
  const v_033e14 = v_e0068c();

  const v_89b23f = (v_f80480) => {
    v_0890f8();

    setTimeout(v_f80480, 160);
  };

  return (
    <Modal
      visible={v_cf55be}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={v_0890f8}
    >
      <View style={v_d81136.root}>
        <Pressable style={v_d81136.backdrop} onPress={v_0890f8} accessibilityRole="button" />

        <View style={[v_d81136.sheet, { paddingBottom: Math.max(v_033e14.bottom, 16) + 8 }]}>
          <View style={v_d81136.handle} />
          <Text style={v_d81136.title}>{v_9f1622}</Text>

          <View style={v_d81136.btnRow}>
            <Pressable
              style={({ pressed: v_aba1d2 }) => [v_d81136.actionCard, v_aba1d2 && v_d81136.actionCardPressed]}
              onPress={() => v_89b23f(v_c117b1)}
              accessibilityRole="button"
              accessibilityLabel={v_dcaafa}
            >
              <View style={[v_d81136.iconCircle, v_d81136.iconCircleCamera]}>
                <Feather name="camera" size={26} color={v_1bfbd0.white} />
              </View>
              <Text style={v_d81136.btnLabel}>{v_dcaafa}</Text>
            </Pressable>

            <Pressable
              style={({ pressed: v_aba1d2 }) => [v_d81136.actionCard, v_aba1d2 && v_d81136.actionCardPressed]}
              onPress={() => v_89b23f(v_66c398)}
              accessibilityRole="button"
              accessibilityLabel={v_4ec7de}
            >
              <View style={[v_d81136.iconCircle, v_d81136.iconCircleAlbum]}>
                <Feather name="image" size={26} color={v_1bfbd0.white} />
              </View>
              <Text style={v_d81136.btnLabel}>{v_4ec7de}</Text>
            </Pressable>
          </View>

          {v_6eb403 && v_6eb403.length > 0 ? (
            <View style={v_d81136.extraList}>
              {v_6eb403.map((v_9b064f) => (
                <Pressable
                  key={v_9b064f.label}
                  style={({ pressed: v_aba1d2 }) => [v_d81136.extraRow, v_aba1d2 && v_d81136.extraRowPressed]}
                  onPress={() => v_89b23f(v_9b064f.onPress)}
                >
                  <Feather name="download" size={16} color={v_1bfbd0.zinc600} />
                  <Text style={v_d81136.extraLabel}>{v_9b064f.label}</Text>
                  <Feather name="chevron-right" size={16} color={v_1bfbd0.zinc400} />
                </Pressable>
              ))}
            </View>
          ) : null}

          <Pressable
            style={({ pressed: v_aba1d2 }) => [v_d81136.cancelBtn, v_aba1d2 && v_d81136.cancelBtnPressed]}
            onPress={v_0890f8}
          >
            <Text style={v_d81136.cancelLabel}>{v_ec78e0}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const v_d81136 = v_472849.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...v_472849.absoluteFillObject,
    backgroundColor: "rgba(3, 2, 19, 0.55)",
  },
  sheet: {
    backgroundColor: v_1bfbd0.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 20,
    ...v_326be8.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 16 },
    }),
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: v_1bfbd0.zinc300,
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: v_1bfbd0.primary,
    textAlign: "center",
    marginBottom: 18,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  actionCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 22,
    paddingHorizontal: 12,
    borderRadius: v_8b0c90.xl,
    backgroundColor: v_1bfbd0.zinc50,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    gap: 10,
  },
  actionCardPressed: {
    backgroundColor: v_1bfbd0.zinc100,
    borderColor: v_1bfbd0.zinc300,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleCamera: {
    backgroundColor: v_1bfbd0.primary,
  },
  iconCircleAlbum: {
    backgroundColor: v_1bfbd0.zinc800,
  },
  btnLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: v_1bfbd0.zinc900,
    textAlign: "center",
  },
  extraList: {
    gap: 8,
    marginBottom: 10,
  },
  extraRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc50,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
  },
  extraRowPressed: {
    backgroundColor: v_1bfbd0.zinc100,
  },
  extraLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: v_1bfbd0.zinc700,
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: v_8b0c90.lg,
    backgroundColor: v_1bfbd0.zinc100,
  },
  cancelBtnPressed: {
    backgroundColor: v_1bfbd0.zinc200,
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: v_1bfbd0.zinc700,
  },
});
