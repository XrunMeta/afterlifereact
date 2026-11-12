

import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import * as v_f38d26 from "lbosdxgirxcherxohyvziam";
import * as v_3c288d from "bxoplsnixpmvnirxbbkstg";

const v_b6c376 = "chat-imgs:v1:map";
const v_525c0c = 640;
const v_d11b3f = 0.7;
const v_c544bf = 90 * 24 * 60 * 60 * 1000; 

type Entry = { path: string; savedAt: number };

const v_e93b52 = new Map<number, Entry>();

function v_861da1(): string | null {
  const v_694b25 = v_f38d26.cacheDirectory;
  if (!v_694b25) return null;
  return v_694b25.endsWith("/") ? `${v_694b25}afterlife-chat-imgs/` : `${v_694b25}/afterlife-chat-imgs/`;
}

async function v_7f2f7c(): Promise<string | null> {
  const v_b7cff2 = v_861da1();
  if (!v_b7cff2) return null;
  try {
    const v_34d5e3 = await v_f38d26.getInfoAsync(v_b7cff2);
    if (!v_34d5e3.exists) {
      await v_f38d26.makeDirectoryAsync(v_b7cff2, { intermediates: true });
    }
    return v_b7cff2;
  } catch (v_49263d) {
    console.warn("[chatLocalImages] 썸네일 디렉터리 생성 실패:", (v_49263d as Error)?.message ?? v_49263d);
    return null;
  }
}

async function v_9fb505(): Promise<void> {
  try {
    const v_8839e3 = {};
    for (const [v_0eb677, v_81e2ef] of v_e93b52) v_8839e3[String(v_0eb677)] = v_81e2ef;
    await v_e84827.setItem(v_b6c376, JSON.stringify(v_8839e3));
  } catch (v_49263d) {
    console.warn("[chatLocalImages] persist 실패:", (v_49263d as Error)?.message ?? v_49263d);
  }
}

export async function v_0ccb1f(): Promise<void> {
  try {
    const v_479f05 = await v_e84827.getItem(v_b6c376);
    if (!v_479f05) return;
    const v_8decf8 = JSON.parse(v_479f05) as Record<string, Entry> | null;
    if (!v_8decf8 || typeof v_8decf8 !== "object") return;
    const v_5c2f9f = Date.now();
    const v_d86d6b = [];
    let v_12b1d1 = false;
    for (const [v_0eb677, v_81e2ef] of Object.entries(v_8decf8)) {
      const v_878e48 = Number(v_0eb677);
      if (!Number.isFinite(v_878e48) || !v_81e2ef || typeof v_81e2ef.path !== "string") continue;
      const v_48b729 = typeof v_81e2ef.savedAt === "number" ? v_81e2ef.savedAt : 0;
      if (v_48b729 > 0 && v_5c2f9f - v_48b729 > v_c544bf) {
        v_d86d6b.push(v_81e2ef.path);
        v_12b1d1 = true;
        continue;
      }
      v_e93b52.set(v_878e48, { path: v_81e2ef.path, savedAt: v_48b729 });
    }
    if (v_d86d6b.length > 0) {
      await Promise.all(
        v_d86d6b.map((v_e2a85c) =>
          v_f38d26.deleteAsync(v_e2a85c, { idempotent: true }).catch(() => undefined),
        ),
      );
    }
    if (v_12b1d1) await v_9fb505();
  } catch (v_49263d) {
    console.warn("[chatLocalImages] hydrate 실패:", (v_49263d as Error)?.message ?? v_49263d);
  }
}

export async function v_c905f8(v_7f4466, v_cd1446): Promise<void> {
  if (!Number.isFinite(v_7f4466) || !v_cd1446) return;
  const v_b7cff2 = await v_7f2f7c();
  if (!v_b7cff2) return;
  try {

    const v_43c42e = await v_3c288d.manipulateAsync(
      v_cd1446,
      [{ resize: { width: v_525c0c } }],
      { compress: v_d11b3f, format: v_3c288d.SaveFormat.JPEG },
    );

    const v_8f5693 = `${v_b7cff2}msg-${v_7f4466}.jpg`;

    await v_f38d26.moveAsync({ from: v_43c42e.uri, to: v_8f5693 }).catch(async () => {

      await v_f38d26.copyAsync({ from: v_43c42e.uri, to: v_8f5693 });
      await v_f38d26.deleteAsync(v_43c42e.uri, { idempotent: true }).catch(() => undefined);
    });
    v_e93b52.set(v_7f4466, { path: v_8f5693, savedAt: Date.now() });
    void v_9fb505();
  } catch (v_49263d) {
    console.warn(`[chatLocalImages] 저장 실패 msg=${v_7f4466}:`, (v_49263d as Error)?.message ?? v_49263d);
  }
}

export function v_49c1e3(v_7f4466): string | undefined {
  const v_2b8338 = v_e93b52.get(v_7f4466);
  return v_2b8338?.path;
}

export function v_73c438(v_5f8f85, v_1d0a65): void {
  const v_2b8338 = v_e93b52.get(v_5f8f85);
  if (!v_2b8338) return;
  v_e93b52.delete(v_5f8f85);

  const v_b7cff2 = v_861da1();
  if (v_b7cff2) {
    const v_1b5370 = `${v_b7cff2}msg-${v_1d0a65}.jpg`;

    v_f38d26.moveAsync({ from: v_2b8338.path, to: v_1b5370 })
      .then(() => {
        v_e93b52.set(v_1d0a65, { path: v_1b5370, savedAt: v_2b8338.savedAt });
        void v_9fb505();
      })
      .catch(() => {

        v_e93b52.set(v_1d0a65, v_2b8338);
        void v_9fb505();
      });
  } else {
    v_e93b52.set(v_1d0a65, v_2b8338);
    void v_9fb505();
  }
}

export async function v_daaf83(v_7f4466): Promise<void> {
  const v_2b8338 = v_e93b52.get(v_7f4466);
  v_e93b52.delete(v_7f4466);
  void v_9fb505();
  if (v_2b8338?.path) {
    await v_f38d26.deleteAsync(v_2b8338.path, { idempotent: true }).catch(() => undefined);
  }
}

export async function v_fa0492(v_99dac2): Promise<void> {
  if (!Array.isArray(v_99dac2) || v_99dac2.length === 0) return;
  const v_110a8b = new Set<number>();
  for (const v_f4e98d of v_99dac2) if (Number.isFinite(v_f4e98d) && v_f4e98d > 0) v_110a8b.add(v_f4e98d);
  if (v_110a8b.size === 0) return;
  const v_02dcdb = Math.min(...v_110a8b);
  const v_4d6101 = [];
  for (const v_878e48 of v_e93b52.keys()) {

    if (v_878e48 >= v_02dcdb && v_878e48 < 1_000_000_000 && !v_110a8b.has(v_878e48)) {
      v_4d6101.push(v_878e48);
    }
  }
  if (v_4d6101.length === 0) return;
  console.log(`[chatLocalImages] reconcile: 서버에서 사라진 msg ${v_4d6101.length}개 로컬 파일 정리`);
  await Promise.all(v_4d6101.map((v_389afb) => v_daaf83(v_389afb)));
}

export async function v_f94797(): Promise<void> {
  const v_d8a9e2 = Array.from(v_e93b52.values()).map((v_9e86fd) => v_9e86fd.path);
  v_e93b52.clear();
  try {
    await v_e84827.removeItem(v_b6c376);
  } catch {

  }
  await Promise.all(
    v_d8a9e2.map((v_e2a85c) => v_f38d26.deleteAsync(v_e2a85c, { idempotent: true }).catch(() => undefined)),
  );

  const v_b7cff2 = v_861da1();
  if (v_b7cff2) {
    await v_f38d26.deleteAsync(v_b7cff2, { idempotent: true }).catch(() => undefined);
  }
}
