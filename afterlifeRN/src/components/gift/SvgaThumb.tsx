

import React, { useEffect, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { COLORS } from "../constants";

interface Props {
  url: string;
  size?: number;
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
  const g = globalThis as unknown as { btoa?: (s: string) => string };
  return typeof g.btoa === "function" ? g.btoa(bin) : bin;
}

function buildHtml(base64: string): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
    #stage { width: 100vw; height: 100vh; display: block; }
  </style>
  <script src="https://unpkg.com/svgaplayerweb@2.3.2/build/svga.min.js"></script>
</head>
<body>
  <div id="stage"></div>
  <script>
    (function () {
      var BASE64 = ${JSON.stringify(base64)};
      function decodeBase64() {
        var bin = atob(BASE64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes;
      }
      function tryPlay() {
        if (typeof SVGA === 'undefined' || !SVGA.Parser || !SVGA.Player) {
          return setTimeout(tryPlay, 200);
        }
        try {
          var parser = new SVGA.Parser();
          var bytes = decodeBase64();
          var start = function (video) {
            try {
              var player = new SVGA.Player(document.getElementById('stage'));
              player.loops = 0; // 무한 loop
              player.clearsAfterStop = false;
              player.setVideoItem(video);
              player.startAnimation();
            } catch (e) {}
          };
          if (typeof parser.loadFromBinary === 'function') {
            parser.loadFromBinary(bytes, start, function () {});
          } else {
            parser.load('data:application/octet-stream;base64,' + BASE64, start, function () {});
          }
        } catch (e) {}
      }
      tryPlay();
    })();
  </script>
</body>
</html>`;
}

export default function SvgaThumb({ url, size = 44 }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    fetch(url, { cache: "force-cache" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`http ${r.status}`);
        const buf = await r.arrayBuffer();
        const base64 = bytesToBase64(new Uint8Array(buf));
        if (!cancelled) setHtml(buildHtml(base64));
      })
      .catch((err) => {
        console.warn(`[SvgaThumb] fetch failed`, err);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  const dim = { width: size, height: size };
  return (
    <View style={[s.wrap, dim]}>
      {html ? (
        <WebView
          originWhitelist={["*"]}
          source={{ html, baseUrl: "https://unpkg.com/" }}
          style={s.web}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          pointerEvents="none"
          androidLayerType="hardware"
        />
      ) : (
        <ActivityIndicator size="small" color={COLORS.zinc500} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  web: { flex: 1, backgroundColor: "transparent" },
});
