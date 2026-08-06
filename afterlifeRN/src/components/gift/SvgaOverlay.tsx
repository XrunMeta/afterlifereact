

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { COLORS } from "../constants";

interface Props {
  visible: boolean;
  svgaUrl: string | null;
  onClose: () => void;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)),
    );
  }

  const globalAny = globalThis as unknown as { btoa?: (s: string) => string };
  if (typeof globalAny.btoa === "function") return globalAny.btoa(bin);

  return bin;
}

function buildHtml(base64: string): string {
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
  <div id="diag">loading svga.js…</div>
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
      var BASE64 = ${JSON.stringify(base64)};

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

export default function SvgaOverlay({ visible, svgaUrl, onClose }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !svgaUrl) {
      setHtml(null);
      setLoadErr(null);
      return;
    }
    let cancelled = false;
    setHtml(null);
    setLoadErr(null);
    console.log(`[SvgaOverlay] native fetch begin url=${svgaUrl}`);
    fetch(svgaUrl, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`http ${r.status}`);
        const buf = await r.arrayBuffer();
        const bytes = new Uint8Array(buf);
        console.log(`[SvgaOverlay] native fetch ok bytes=${bytes.length}`);
        const base64 = bytesToBase64(bytes);
        if (cancelled) return;
        setHtml(buildHtml(base64));
      })
      .catch((err) => {
        console.warn(`[SvgaOverlay] native fetch failed`, err);
        if (!cancelled) setLoadErr(String((err as Error).message ?? err));
      });
    return () => {
      cancelled = true;
    };
  }, [visible, svgaUrl]);

  return (
    <Modal visible={visible && !!svgaUrl} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.root}>
        {html ? (
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
                const msg = JSON.parse(e.nativeEvent.data) as { type?: string; reason?: string };
                console.log(`[SvgaOverlay] webview msg`, msg);
                if (msg?.type === "finished" || msg?.type === "error") {
                  setTimeout(onClose, msg.type === "finished" ? 200 : 800);
                }
              } catch {

              }
            }}
          />
        ) : loadErr ? (
          <View style={s.loader}>
            <Text style={s.errText}>재생 실패: {loadErr}</Text>
          </View>
        ) : (
          <View style={s.loader}>
            <ActivityIndicator color={COLORS.white} />
          </View>
        )}
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
  loader: { flex: 1, alignItems: "center", justifyContent: "center" },
  errText: { color: "#ffb4b4", fontSize: 12, paddingHorizontal: 24, textAlign: "center" },
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
