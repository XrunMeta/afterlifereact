

import v_a3453e, { v_df9f57 } from "bapkr";
import { v_aa7413, v_472849, v_4623af, v_3094a2 } from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_2694e4 } from "ahewcyoxtiosvtfuluxp";
import { v_1bfbd0 } from "../constants";

interface Props {
  visible: boolean;
  svgaUrl: string | null;
  onClose: () => void;
}

function v_6587de(v_f71b56): string {
  const v_29dbaf = v_f71b56.replace(/"/g, '\\"');
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <style>
    html, body { margin: 0; padding: 0; background: #000; height: 100%; }
    #canvas { position: fixed; inset: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    #canvas > div { width: 80vw; height: 80vh; }
    #diag { position: fixed; left: 8px; bottom: 8px; color: #fff; font: 11px monospace; opacity: 0.6; z-index: 999; }
  </style>
  <script src="https://unpkg.com/svgaplayerweb@2.3.2/build/svga.min.js"></script>
</head>
<body>
  <div id="canvas"><div id="stage"></div></div>
  <div id="diag">loading…</div>
  <script>
    (function () {
      var diag = document.getElementById('diag');
      var setDiag = function (s) { if (diag) diag.textContent = s; };
      var post = function (m) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          try { window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {}
        }
      };
      var fallback = setTimeout(function () { setDiag('timeout'); post({ type: 'error', reason: 'timeout' }); }, 15000);

      function playFromBinary(bytes) {
        try {
          if (typeof SVGA === 'undefined' || !SVGA.Parser || !SVGA.Player) {
            throw new Error('svga.min.js not loaded');
          }
          var parser = new SVGA.Parser();
          if (typeof parser.loadFromBinary === 'function') {
            parser.loadFromBinary(bytes,
              function (video) { start(video); },
              function (e) { fail('loadFromBinary: ' + String(e)); }
            );
            return;
          }
          var b64 = '';
          var CHUNK = 0x8000;
          for (var i = 0; i < bytes.length; i += CHUNK) {
            b64 += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
          }
          var dataUrl = 'data:application/octet-stream;base64,' + btoa(b64);
          parser.load(dataUrl, function (video) { start(video); }, function (e) { fail('parser.load: ' + String(e)); });
        } catch (e) {
          fail(String(e));
        }
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

      function fail(reason) {
        clearTimeout(fallback);
        setDiag('err: ' + reason);
        post({ type: 'error', reason: reason });
      }

      setDiag('fetch…');
      fetch("${v_29dbaf}", { credentials: 'omit', mode: 'cors', cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) throw new Error('http ' + r.status);
          setDiag('fetched, parsing…');
          return r.arrayBuffer();
        })
        .then(function (buf) {
          playFromBinary(new Uint8Array(buf));
        })
        .catch(function (e) {
          fail('fetch: ' + String(e && e.message ? e.message : e));
        });
    })();
  </script>
</body>
</html>`;
}

export default function v_194b37({ visible: v_cf55be, svgaUrl: v_1d09c0, onClose: v_0890f8 }: Props) {
  const v_d91d98 = v_df9f57(() => (v_1d09c0 ? v_6587de(v_1d09c0) : ""), [v_1d09c0]);
  return (
    <Modal visible={v_cf55be && !!v_1d09c0} transparent animationType="fade" onRequestClose={v_0890f8}>
      <View style={v_fd5f43.root}>
        {v_1d09c0 ? (
          <WebView
            originWhitelist={["*"]}
            source={{ html: v_d91d98, baseUrl: "https://unpkg.com/" }}
            style={v_fd5f43.web}
            javaScriptEnabled
            domStorageEnabled
            allowFileAccess
            mixedContentMode="always"
            onMessage={(v_9e86fd) => {
              try {
                const v_badeaf = JSON.parse(v_9e86fd.nativeEvent.data) as { type?: string };
                console.log(`[SvgaOverlay] webview msg`, v_badeaf);
                if (v_badeaf?.type === "finished" || v_badeaf?.type === "error") {
                  setTimeout(v_0890f8, v_badeaf.type === "finished" ? 200 : 0);
                }
              } catch {

              }
            }}
          />
        ) : null}
        <TouchableOpacity style={v_fd5f43.close} onPress={v_0890f8} activeOpacity={0.7}>
          <Feather name="x" size={24} color={v_1bfbd0.white} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const v_fd5f43 = v_472849.create({
  root: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)" },
  web: { flex: 1, backgroundColor: "transparent" },
  close: {
    position: "absolute",
    top: 44,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
});
