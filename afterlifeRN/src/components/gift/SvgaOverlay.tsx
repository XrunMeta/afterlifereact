

import React, { useMemo } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { COLORS } from "../constants";

interface Props {
  visible: boolean;
  svgaUrl: string | null;
  onClose: () => void;
}

function buildHtml(url: string): string {
  const safe = url.replace(/"/g, '\\"');
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
      fetch("${safe}", { credentials: 'omit', mode: 'cors', cache: 'no-store' })
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

export default function SvgaOverlay({ visible, svgaUrl, onClose }: Props) {
  const html = useMemo(() => (svgaUrl ? buildHtml(svgaUrl) : ""), [svgaUrl]);
  return (
    <Modal visible={visible && !!svgaUrl} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.root}>
        {svgaUrl ? (
          <WebView
            originWhitelist={["*"]}
            source={{ html, baseUrl: "https://unpkg.com/" }}
            style={s.web}
            javaScriptEnabled
            domStorageEnabled
            allowFileAccess
            mixedContentMode="always"
            onMessage={(e) => {
              try {
                const msg = JSON.parse(e.nativeEvent.data) as { type?: string };
                console.log(`[SvgaOverlay] webview msg`, msg);
                if (msg?.type === "finished" || msg?.type === "error") {
                  setTimeout(onClose, msg.type === "finished" ? 200 : 0);
                }
              } catch {

              }
            }}
          />
        ) : null}
        <TouchableOpacity style={s.close} onPress={onClose} activeOpacity={0.7}>
          <Feather name="x" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
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
