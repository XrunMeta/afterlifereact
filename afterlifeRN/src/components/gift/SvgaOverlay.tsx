

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
  </style>
  <script src="https://unpkg.com/svgaplayerweb@2.3.2/build/svga.min.js"></script>
</head>
<body>
  <div id="canvas"><div id="stage"></div></div>
  <script>
    (function () {
      var post = function (m) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          try { window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {}
        }
      };
      var fallback = setTimeout(function () { post({ type: 'error', reason: 'timeout' }); }, 12000);
      try {
        var parser = new SVGA.Parser();
        parser.load("${safe}",
          function (video) {
            clearTimeout(fallback);
            try {
              var player = new SVGA.Player(document.getElementById('stage'));
              player.loops = 1;
              player.clearsAfterStop = false;
              player.setVideoItem(video);
              player.onFinished(function () { post({ type: 'finished' }); });
              player.startAnimation();
              post({ type: 'started' });
            } catch (e) {
              post({ type: 'error', reason: String(e) });
            }
          },
          function (err) {
            clearTimeout(fallback);
            post({ type: 'error', reason: String(err) });
          }
        );
      } catch (e) {
        clearTimeout(fallback);
        post({ type: 'error', reason: String(e) });
      }
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
