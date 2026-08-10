import v_a3453e, { v_de06a3, v_c4deb2, v_df9f57, v_e662ae, v_5ab095 } from "bapkr";
import {
  v_aa7413,
  v_3094a2,
  v_19b633,
  v_4623af,
  v_472849,
  v_700696,
  v_326be8,
  v_39a996,
} from "rcmrninabrnb";
import {
  v_862296,
  v_db5a6b,
  v_dce807,
  v_b08ef3,
  type v_862296 as v_6c59f3,
} from "mkqptszwrsxiemcjrtdlshyxlm";
import { v_d73d29 } from "fkysyevuehkssftyrtweoolhfw";
import { v_ac8611 } from "gegbzaufjmeglxlxrodgpkwzmpoxabawfpabkiqb";
import type { v_ab3a39 as v_1faf6a } from "gegbzaufjmeglxlxrodgpkwzmpoxabawfpabkiqb";
import { v_516d20, v_91a3cf } from "bxoplsnixpmvnirxbbkstg";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_c18c22 } from "svuoaeceudfxfjvvpmmmchnwljywbphjgb";
import { v_772971 } from "jmpfvteuuztnp";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import v_11c5c8 from "../../../components/clone/UpperBodyGuide";
import { v_1bfbd0 } from "../../../components/constants";
import type { v_73b64e } from "../../../lib/imagePicker";
import {
  v_069313,
  v_d43608,
} from "../../../lib/t208SilhouetteScale";
import { v_889fad } from "../../../stores/dialogStore";
import { v_9dd2d6 } from "../../../lib/centerCoverCrop1to2";
import { v_b83839 } from "../../../hooks/useFaceDetection";

interface Props {
  visible: boolean;
  onCapture: (image: v_73b64e) => void;
  onCancel: () => void;
}

function v_d6e7ce(v_9fe22d): string {
  return v_9fe22d.startsWith("file://") ? v_9fe22d : `file://${v_9fe22d}`;
}

export default function v_e0961f({ visible: v_cf55be, onCapture: v_94e3dc, onCancel: v_c7001c }: Props) {
  const { t: v_8d41d7 } = v_772971();
  const v_033e14 = v_e0068c();
  const v_f9771e = v_c18c22(0);
  const v_53dd92 =
    v_326be8.OS === "ios" ? v_033e14.bottom : Math.max(v_f9771e, v_033e14.bottom);

  const { width: v_df48e9, height: v_bd274b } = v_700696.get("window");
  const v_e0560a = Math.min(v_df48e9 * 0.86, (v_bd274b * 0.7) / 2);
  const v_fc2e4f = v_e0560a * 2;

  const [v_7b377a, v_3bbf8c] = v_5ab095(v_069313);
  v_c4deb2(() => v_d43608(() => v_3bbf8c(v_069313())), []);

  const [v_663b67, v_220cc9] = v_5ab095<"front" | "back">("front");
  const v_ac8c13 = v_db5a6b(v_663b67);

  const { hasPermission: v_02fdad, requestPermission: v_1e66f0 } = v_dce807();
  const v_1a165b = v_e662ae<v_6c59f3>(null);
  const [v_b1717e, v_0189ac] = v_5ab095(false);
  const [v_67358b, v_e335db] = v_5ab095(false);

  const { faceState: v_bbb3d3, onFaces: v_dfbd9a } = v_b83839();
  const { detectFaces: v_de4d76, stopListeners: v_62fe07 } = v_ac8611({
    performanceMode: "fast",
    trackingEnabled: true,
  });
  v_c4deb2(() => () => v_62fe07(), [v_62fe07]);

  const [v_1f6878, v_0c4941] = v_5ab095(0);

  const v_8090fb = v_df9f57(
    () =>
      v_d73d29.createRunOnJS((faces: v_1faf6a[], v_80396f) => {
        const v_29a122 = v_a51d09.map((v_8b5cd8) => ({
          trackingID: v_8b5cd8.trackingId,
          bounds: v_8b5cd8.bounds,
        }));
        v_dfbd9a(v_29a122);
        v_0c4941(v_80396f);
      }),

    [],
  );

  const v_f001a7 = v_b08ef3(
    (v_143cb5) => {
      "worklet";
      const v_a51d09 = v_de4d76(v_143cb5);

      let v_80396f = 0;
      if (v_a51d09.length > 0) {
        const v_148ff6 = v_a51d09[0].bounds;
        const v_3c588a = Math.max(v_143cb5.width, v_143cb5.height);
        const v_cecddc = Math.max(v_148ff6.width, v_148ff6.height);
        if (v_3c588a > 0) {
          v_80396f = v_cecddc / v_3c588a;
        }
      }
      v_8090fb(v_a51d09, v_80396f);
    },
    [v_8090fb, v_de4d76],
  );

  const v_7c2f5d = v_bbb3d3.status === "detected";
  const v_6a5345 = 0.15; 
  const v_822ad2 = 0.55; 
  const v_b85511 =
    v_7c2f5d && v_1f6878 >= v_6a5345 && v_1f6878 <= v_822ad2;

  const v_405d38 = !v_7c2f5d
    ? v_8d41d7("create.image.faceGuideHint")
    : v_1f6878 < v_6a5345
    ? v_8d41d7("create.image.faceTooSmall")
    : v_1f6878 > v_822ad2
    ? v_8d41d7("create.image.faceTooLarge")
    : null;

  v_c4deb2(() => {
    if (!v_cf55be) {
      v_0189ac(false);
      v_e335db(false);
      return;
    }
    let v_2008a4 = false;
    (async () => {
      if (!v_02fdad) {
        const v_3ed4c3 = await v_1e66f0();
        if (v_2008a4) return;
        if (!v_3ed4c3) {
          v_889fad(v_8d41d7("create.image.cameraPermTitle"), v_8d41d7("create.image.cameraPermDeniedMsg"));
          v_c7001c();
        }
      }
    })();
    return () => {
      v_2008a4 = true;
    };
  }, [v_cf55be, v_02fdad, v_1e66f0, v_c7001c, v_8d41d7]);

  v_c4deb2(() => {
    v_0189ac(false);
  }, [v_663b67, v_ac8c13?.id]);

  const v_04326c = v_de06a3(async () => {
    if (!v_1a165b.current || v_67358b) return;
    v_e335db(true);
    try {
      const v_2a5a61 = await v_1a165b.current.takePhoto({
        flash: "off",
        enableShutterSound: true,
      });
      const v_1c166f = v_d6e7ce(v_2a5a61.path);

      const v_99df03 = await v_516d20(v_1c166f, [], {
        compress: 1,
        format: v_91a3cf.JPEG,
      });
      if (!v_99df03.width || !v_99df03.height) {
        v_889fad(v_8d41d7("common.error"), v_8d41d7("create.image.loadFailed"));
        return;
      }
      const v_dab7d3 = v_9dd2d6(v_99df03.width, v_99df03.height);
      const v_cb762c = await v_516d20(
        v_99df03.uri,
        [
          {
            crop: {
              originX: Math.round(v_dab7d3.originX),
              originY: Math.round(v_dab7d3.originY),
              width: Math.round(v_dab7d3.width),
              height: Math.round(v_dab7d3.height),
            },
          },
        ],
        { compress: 1, format: v_91a3cf.JPEG },
      );
      if (!v_cb762c.width || !v_cb762c.height) {
        v_889fad(v_8d41d7("common.error"), v_8d41d7("create.image.loadFailed"));
        return;
      }
      v_94e3dc({ uri: v_cb762c.uri, width: v_cb762c.width, height: v_cb762c.height });
    } catch (v_49263d) {
      console.warn("[CaptureWithGuideModal] takePhoto 실패:", v_49263d);
      v_889fad(v_8d41d7("common.error"), v_8d41d7("create.image.loadFailed"));
    } finally {
      v_e335db(false);
    }
  }, [v_67358b, v_94e3dc, v_8d41d7]);

  const v_c4c9d7 = v_df9f57(
    () => ({
      top: (v_bd274b - v_fc2e4f) / 2,
      left: (v_df48e9 - v_e0560a) / 2,
      width: v_e0560a,
      height: v_fc2e4f,
    }),
    [v_bd274b, v_df48e9, v_fc2e4f, v_e0560a],
  );

  if (!v_cf55be) return null;

  return (
    <Modal visible={v_cf55be} animationType="slide" onRequestClose={v_c7001c}>
      <View style={v_fd5f43.root}>
        <View style={[v_fd5f43.previewSlot, v_c4c9d7]}>
          {v_ac8c13 && v_02fdad ? (
            <Camera
              ref={v_1a165b}
              style={v_472849.absoluteFill}
              device={v_ac8c13}
              isActive={v_cf55be}
              photo
              isMirrored={v_663b67 === "front"}
              androidPreviewViewType="texture-view"
              onInitialized={() => v_0189ac(true)}
              frameProcessor={v_f001a7}
            />
          ) : (
            <View style={[v_472849.absoluteFill, v_fd5f43.center]}>
              <ActivityIndicator color={v_1bfbd0.white} />
            </View>
          )}
          <View style={v_fd5f43.guideOverlay} pointerEvents="none">
            {}
            <UpperBodyGuide width={v_e0560a * v_7b377a} />
          </View>
          <View style={v_fd5f43.frameBorder} pointerEvents="none" />
          {v_b1717e && v_405d38 ? (
            <View style={v_fd5f43.faceHintOverlay} pointerEvents="none">
              <View style={v_fd5f43.faceHintBubble}>
                <Text style={v_fd5f43.faceHintText}>{v_405d38}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={[v_fd5f43.topBar, { paddingTop: Math.max(v_033e14.top, 12) }]}>
          <TouchableOpacity style={v_fd5f43.iconBtn} onPress={v_c7001c} accessibilityRole="button">
            <Feather name="x" size={24} color={v_1bfbd0.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={v_fd5f43.iconBtn}
            onPress={() => v_220cc9((v_8b5cd8) => (v_8b5cd8 === "front" ? "back" : "front"))}
            accessibilityRole="button"
          >
            <Feather name="refresh-cw" size={22} color={v_1bfbd0.white} />
          </TouchableOpacity>
        </View>

        <View style={[v_fd5f43.bottomBar, { paddingBottom: 20 + v_53dd92 }]}>
          <TouchableOpacity
            style={[v_fd5f43.shutter, (!v_b1717e || v_67358b || !v_b85511) && v_fd5f43.shutterDisabled]}
            onPress={v_04326c}
            disabled={!v_b1717e || v_67358b || !v_ac8c13 || !v_b85511}
            accessibilityRole="button"
            accessibilityLabel={v_8d41d7("create.image.sourceCamera")}
          >
            {v_67358b ? (
              <ActivityIndicator color={v_1bfbd0.zinc900} />
            ) : (
              <View style={v_fd5f43.shutterInner} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const v_fd5f43 = v_472849.create({
  root: { flex: 1, backgroundColor: "#000" },
  center: { alignItems: "center", justifyContent: "center", backgroundColor: "#111" },
  previewSlot: {
    position: "absolute",
    overflow: "hidden",
    backgroundColor: "#111",
  },
  guideOverlay: {
    ...v_472849.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  frameBorder: {
    ...v_472849.absoluteFillObject,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },
  faceHintOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
  },
  faceHintBubble: {
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: "88%",
  },
  faceHintText: {
    color: v_1bfbd0.white,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: v_1bfbd0.white,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  shutterDisabled: { opacity: 0.45 },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: v_1bfbd0.white,
  },
});
