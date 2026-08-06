

import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import { v_472849, v_3094a2, v_39a996 } from "rcmrninabrnb";
import { v_2694e4 } from "ahewcyoxtiosvtfuluxp";
import { v_1bfbd0 } from "../constants";

interface Props {
  url: string;
  size?: number;
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
  const v_206b88 = globalThis as unknown as { btoa?: (v_fd5f43) => string };
  return typeof v_206b88.btoa === "function" ? v_206b88.btoa(v_d8cac9) : v_d8cac9;
}

function v_6587de(v_aef4ae): string {
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
      var BASE64 = ${JSON.stringify(v_aef4ae)};
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

export default function v_57f3da({ url: v_f71b56, size: v_05b441 = 44 }: Props) {
  const [v_d91d98, v_5420ce] = v_5ab095<string | null>(null);
  v_c4deb2(() => {
    let v_2008a4 = false;
    v_5420ce(null);
    fetch(v_f71b56, { cache: "force-cache" })
      .then(async (v_cb35cb) => {
        if (!v_cb35cb.ok) throw new Error(`http ${v_cb35cb.status}`);
        const v_83ee53 = await v_cb35cb.arrayBuffer();
        const v_aef4ae = v_4d2f90(new Uint8Array(v_83ee53));
        if (!v_2008a4) v_5420ce(v_6587de(v_aef4ae));
      })
      .catch((v_49263d) => {
        console.warn(`[SvgaThumb] fetch failed`, v_49263d);
      });
    return () => {
      v_2008a4 = true;
    };
  }, [v_f71b56]);
  const v_f037dc = { width: v_05b441, height: v_05b441 };
  return (
    <View style={[v_fd5f43.wrap, v_f037dc]}>
      {v_d91d98 ? (
        <WebView
          originWhitelist={["*"]}
          source={{ html: v_d91d98, baseUrl: "https://unpkg.com/" }}
          style={v_fd5f43.web}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          pointerEvents="none"
          androidLayerType="hardware"
        />
      ) : (
        <ActivityIndicator size="small" color={v_1bfbd0.zinc500} />
      )}
    </View>
  );
}

const v_fd5f43 = v_472849.create({
  wrap: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  web: { flex: 1, backgroundColor: "transparent" },
});
