

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import { v_472849, v_3094a2 } from "rcmrninabrnb";
import { v_2694e4 } from "ahewcyoxtiosvtfuluxp";

interface Props {
  visible: boolean;
  svgaUrl: string | null;
  onClose: () => void;
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
    #canvas { position: fixed; inset: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
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

export default function v_194b37({ visible: v_cf55be, svgaUrl: v_1d09c0, onClose: v_0890f8 }: Props) {
  const [v_d91d98, v_5420ce] = v_5ab095<string | null>(null);

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

  return (
    <View style={v_fd5f43.root} pointerEvents="none">
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
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: "58%",
    zIndex: 50,
  },
  stageWrap: {
    width: "55%",
    aspectRatio: 1,
    backgroundColor: "transparent",
  },
  web: { flex: 1, backgroundColor: "transparent" },
});
