

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import { v_cf9c33, v_472849, v_19b633, v_3094a2 } from "rcmrninabrnb";
import { v_e0068c } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_2694e4 } from "ahewcyoxtiosvtfuluxp";

interface Props {
  visible: boolean;
  svgaUrl: string | null;
  onClose: () => void;

  senderName?: string | null;
  senderAvatarUrl?: string | null;
  giftName?: string | null;
}

function v_4d2f90(v_fbb6da): string {
  let v_d8cac9 = "";
  const v_334f63 = 0x8000;
  for (let v_ebec57 = 0; v_ebec57 < v_fbb6da.length; v_ebec57 += v_334f63) {
    v_d8cac9 += String.fromCharCode.apply(
      null,
      Array.from(v_fbb6da.subarray(v_ebec57, v_ebec57 + v_334f63)),
    );
  }

  const v_26bc51 = globalThis as unknown as { btoa?: (v_fd5f43) => string };
  if (typeof v_26bc51.btoa === "function") return v_26bc51.btoa(v_d8cac9);

  return v_d8cac9;
}

function v_6587de(v_aef4ae): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <style>
    html, body { margin: 0; padding: 0; background: transparent; height: 100%; overflow: hidden; }
    #canvas { position: fixed; inset: 0; width: 100%; height: 100%; display: flex; align-items: flex-end; justify-content: center; }
    #canvas > div { width: 100%; height: 100%; }
  </style>
  <script src="https://unpkg.com/svgaplayerweb@2.3.2/build/svga.min.js"></script>
</head>
<body>
  <div id="canvas"><div id="stage"></div></div>
  <script>
    (function () {
      var setDiag = function () {}; // T-338: 사용자 화면에 diag 안 노출.
      var post = function (m) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          try { window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {}
        }
      };
      var fallback = setTimeout(function () { setDiag('timeout'); post({ type: 'error', reason: 'timeout' }); }, 15000);
      var BASE64 = ${JSON.stringify(v_aef4ae)};

      function decodeBase64() {
        var bin = atob(BASE64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes;
      }

      function fail(reason) {
        clearTimeout(fallback);
        setDiag('err: ' + reason);
        post({ type: 'error', reason: reason });
      }

      function start(video) {
        clearTimeout(fallback);
        try {
          var player = new SVGA.Player(document.getElementById('stage'));
          player.loops = 1;
          player.clearsAfterStop = false;
          player.setVideoItem(video);
          player.onFinished(function () { post({ type: 'finished' }); });
          player.startAnimation();
          setDiag('playing');
          post({ type: 'started' });
        } catch (e) {
          fail('play: ' + String(e));
        }
      }

      function tryPlay() {
        if (typeof SVGA === 'undefined' || !SVGA.Parser || !SVGA.Player) {
          setDiag('svga.js not loaded');
          return setTimeout(tryPlay, 300);
        }
        setDiag('decoding…');
        try {
          var bytes = decodeBase64();
          var parser = new SVGA.Parser();
          if (typeof parser.loadFromBinary === 'function') {
            setDiag('parsing…');
            parser.loadFromBinary(bytes, start, function (e) { fail('loadFromBinary: ' + String(e)); });
            return;
          }
          setDiag('parsing (dataurl)…');
          var dataUrl = 'data:application/octet-stream;base64,' + BASE64;
          parser.load(dataUrl, start, function (e) { fail('parser.load: ' + String(e)); });
        } catch (e) {
          fail('decode: ' + String(e));
        }
      }

      tryPlay();
    })();
  </script>
</body>
</html>`;
}

export default function v_194b37({
  visible: v_cf55be,
  svgaUrl: v_1d09c0,
  onClose: v_0890f8,
  senderName: v_b85763,
  senderAvatarUrl: v_670f24,
  giftName: v_dcbe7a,
}: Props) {
  const [v_d91d98, v_5420ce] = v_5ab095<string | null>(null);

  const v_033e14 = v_e0068c();
  const v_284e24 = v_033e14.bottom + 124;

  v_c4deb2(() => {
    if (!v_cf55be || !v_1d09c0) {
      v_5420ce(null);
      return;
    }
    let v_2008a4 = false;
    v_5420ce(null);
    console.log(`[SvgaOverlay] native fetch begin url=${v_1d09c0}`);
    fetch(v_1d09c0, { cache: "no-store" })
      .then(async (v_cb35cb) => {
        if (!v_cb35cb.ok) throw new Error(`http ${v_cb35cb.status}`);
        const v_83ee53 = await v_cb35cb.arrayBuffer();
        const v_fbb6da = new Uint8Array(v_83ee53);
        console.log(`[SvgaOverlay] native fetch ok bytes=${v_fbb6da.length}`);
        const v_aef4ae = v_4d2f90(v_fbb6da);
        if (v_2008a4) return;
        v_5420ce(v_6587de(v_aef4ae));
      })
      .catch((v_49263d) => {
        console.warn(`[SvgaOverlay] native fetch failed`, v_49263d);

        if (!v_2008a4) setTimeout(v_0890f8, 100);
      });
    return () => {
      v_2008a4 = true;
    };

  }, [v_cf55be, v_1d09c0]);

  if (!v_cf55be || !v_1d09c0 || !v_d91d98) return null;

  const v_f25ee5 = !!(v_b85763 && v_dcbe7a);
  return (
    <View style={[v_fd5f43.root, { paddingBottom: v_284e24 }]} pointerEvents="none">
      {v_f25ee5 && (
        <View style={v_fd5f43.notice}>
          {v_670f24 ? (
            <Image source={{ uri: v_670f24 }} style={v_fd5f43.noticeAvatar} />
          ) : (
            <View style={[v_fd5f43.noticeAvatar, v_fd5f43.noticeAvatarPlaceholder]} />
          )}
          <View style={v_fd5f43.noticeText}>
            <Text style={v_fd5f43.noticeName} numberOfLines={1}>
              {v_b85763}
            </Text>
            <Text style={v_fd5f43.noticeMsg} numberOfLines={1}>
              님의 {v_dcbe7a} 선물을 보냈습니다
            </Text>
          </View>
        </View>
      )}
      <View style={v_fd5f43.stageWrap}>
        <WebView
          originWhitelist={["*"]}
          source={{ html: v_d91d98, baseUrl: "https://unpkg.com/" }}
          style={v_fd5f43.web}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          mixedContentMode="always"
          scrollEnabled={false}
          androidLayerType="hardware"

          backgroundColor="transparent"
          onMessage={(v_9e86fd) => {
            try {
              const v_badeaf = JSON.parse(v_9e86fd.nativeEvent.data) as { type?: string; reason?: string };
              console.log(`[SvgaOverlay] webview msg`, v_badeaf);
              if (v_badeaf?.type === "finished" || v_badeaf?.type === "error") {
                setTimeout(v_0890f8, v_badeaf.type === "finished" ? 300 : 100);
              }
            } catch {

            }
          }}
        />
      </View>
    </View>
  );
}

const v_fd5f43 = v_472849.create({

  root: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "stretch",
    justifyContent: "flex-end",
    zIndex: 50,
  },

  notice: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    maxWidth: "80%",
  },
  noticeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: "#333",
  },
  noticeAvatarPlaceholder: {

  },
  noticeText: {
    flexShrink: 1,
  },
  noticeName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  noticeMsg: {
    color: "#fff",
    fontSize: 12,
    marginTop: 2,
  },
  stageWrap: {
    alignSelf: "center",

    width: "100%",
    height: "70%",
    backgroundColor: "transparent",
  },
  web: { flex: 1, backgroundColor: "transparent" },
});
