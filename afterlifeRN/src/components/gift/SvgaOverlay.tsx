

import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

interface Props {
  visible: boolean;
  svgaUrl: string | null;
  onClose: () => void;

  senderName?: string | null;
  senderAvatarUrl?: string | null;
  giftName?: string | null;
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

export default function SvgaOverlay({
  visible,
  svgaUrl,
  onClose,
  senderName,
  senderAvatarUrl,
  giftName,
}: Props) {
  const [html, setHtml] = useState<string | null>(null);

  const insets = useSafeAreaInsets();
  const bottomPad = insets.bottom + 124;

  useEffect(() => {
    if (!visible || !svgaUrl) {
      setHtml(null);
      return;
    }
    let cancelled = false;
    setHtml(null);
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

        if (!cancelled) setTimeout(onClose, 100);
      });
    return () => {
      cancelled = true;
    };

  }, [visible, svgaUrl]);

  if (!visible || !svgaUrl || !html) return null;

  const hasNotice = !!(senderName && giftName);
  return (
    <View style={[s.root, { paddingBottom: bottomPad }]} pointerEvents="none">
      {hasNotice && (
        <View style={s.notice}>
          {senderAvatarUrl ? (
            <Image source={{ uri: senderAvatarUrl }} style={s.noticeAvatar} />
          ) : (

            <View style={[s.noticeAvatar, s.noticeAvatarPlaceholder]}>
              <Feather name="user" size={20} color="#999" />
            </View>
          )}
          <View style={s.noticeText}>
            <Text style={s.noticeName} numberOfLines={1}>
              {senderName}
            </Text>
            <Text style={s.noticeMsg} numberOfLines={1}>
              님의 {giftName} 선물을 보냈습니다
            </Text>
          </View>
        </View>
      )}
      <View style={s.stageWrap}>
        <WebView
          originWhitelist={["*"]}
          source={{ html, baseUrl: "https://unpkg.com/" }}
          style={s.web}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          mixedContentMode="always"
          scrollEnabled={false}
          androidLayerType="hardware"

          backgroundColor="transparent"
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data) as { type?: string; reason?: string };
              console.log(`[SvgaOverlay] webview msg`, msg);
              if (msg?.type === "finished" || msg?.type === "error") {
                setTimeout(onClose, msg.type === "finished" ? 300 : 100);
              }
            } catch {

            }
          }}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({

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

    backgroundColor: "#e5e5e5",
    alignItems: "center",
    justifyContent: "center",
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
    height: "45%",
    backgroundColor: "transparent",
  },
  web: { flex: 1, backgroundColor: "transparent" },
});
