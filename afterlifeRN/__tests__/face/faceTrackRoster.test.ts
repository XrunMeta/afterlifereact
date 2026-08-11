import {
  ACTIVE_TTL_MS,
  MAX_TRACK_ENTRIES,
  attachDiag,
  formatTrackLine,
  initFaceRoster,
  isTrackActive,
  observeFaceTracks,
  type FaceRosterState,
} from "../../src/face/faceTrackRoster";
import type { FaceDiag } from "../../src/config/faceDiag";

const T0 = 1_000_000;

function labelsOf(s: FaceRosterState): Array<[number, number]> {
  return s.entries.map((e) => [e.trackingId, e.label]);
}

describe("observeFaceTracks — 라벨 부여", () => {
  it("새 trackingId 는 등장 순서대로 1,2,3 라벨을 받는다", () => {
    let s = initFaceRoster();
    s = observeFaceTracks(s, [7], T0);
    s = observeFaceTracks(s, [7, 42], T0 + 1000);
    s = observeFaceTracks(s, [99], T0 + 2000);
    expect(labelsOf(s)).toEqual([
      [7, 1],
      [42, 2],
      [99, 3],
    ]);
    expect(s.nextLabel).toBe(4);
  });

  it("이미 본 trackingId 는 같은 라벨을 유지하고 lastSeen/seenCount 만 갱신된다", () => {
    let s = initFaceRoster();
    s = observeFaceTracks(s, [7], T0);
    s = observeFaceTracks(s, [7], T0 + 1000);
    s = observeFaceTracks(s, [7], T0 + 2000);
    expect(s.entries).toHaveLength(1);
    expect(s.entries[0].label).toBe(1);
    expect(s.entries[0].seenCount).toBe(3);
    expect(s.entries[0].firstSeenMs).toBe(T0);
    expect(s.entries[0].lastSeenMs).toBe(T0 + 2000);
    expect(s.nextLabel).toBe(2); 
  });

  it("사라졌다 다시 나타난 trackingId 는 새 라벨을 받지 않는다", () => {
    let s = initFaceRoster();
    s = observeFaceTracks(s, [7], T0);
    s = observeFaceTracks(s, [42], T0 + 1000);
    s = observeFaceTracks(s, [7], T0 + 9000);
    expect(labelsOf(s)).toEqual([
      [7, 1],
      [42, 2],
    ]);
  });

  it("같은 프레임에 중복 id 가 와도 항목이 두 개 생기지 않는다", () => {
    const s = observeFaceTracks(initFaceRoster(), [7, 7, 7], T0);
    expect(s.entries).toHaveLength(1);
    expect(s.nextLabel).toBe(2);
  });

  it("빈 배열이면 동일 참조를 돌려준다(구독자 통지 억제)", () => {
    const s0 = observeFaceTracks(initFaceRoster(), [7], T0);
    expect(observeFaceTracks(s0, [], T0 + 100)).toBe(s0);
  });

  it("숫자가 아니거나 NaN 인 id 는 무시한다", () => {
    const bad = [NaN, undefined as unknown as number, 5];
    const s = observeFaceTracks(initFaceRoster(), bad, T0);
    expect(labelsOf(s)).toEqual([[5, 1]]);
  });
});

describe("observeFaceTracks — 목록 상한(trackingId 재사용/폭주 방지)", () => {
  it("상한을 넘으면 가장 오래 안 보인 항목부터 버린다", () => {
    let s = initFaceRoster();

    for (let i = 1; i <= MAX_TRACK_ENTRIES; i++) {
      s = observeFaceTracks(s, [i], T0 + i * 100);
    }
    expect(s.entries).toHaveLength(MAX_TRACK_ENTRIES);
    s = observeFaceTracks(s, [777], T0 + 100_000);
    expect(s.entries).toHaveLength(MAX_TRACK_ENTRIES);
    expect(s.entries.map((e) => e.trackingId)).not.toContain(1);
    expect(s.entries.map((e) => e.trackingId)).toContain(777);
  });

  it("방금 보인 항목은 상한 초과 시에도 살아남는다", () => {
    let s = initFaceRoster();
    for (let i = 1; i <= MAX_TRACK_ENTRIES; i++) {
      s = observeFaceTracks(s, [i], T0 + i * 100);
    }

    s = observeFaceTracks(s, [1, 777], T0 + 100_000);
    const ids = s.entries.map((e) => e.trackingId);
    expect(ids).toContain(1);
    expect(ids).toContain(777);
    expect(ids).not.toContain(2); 
    expect(s.entries).toHaveLength(MAX_TRACK_ENTRIES);
  });

  it("남은 항목의 라벨은 재번호되지 않는다", () => {
    let s = initFaceRoster();
    for (let i = 1; i <= MAX_TRACK_ENTRIES + 1; i++) {
      s = observeFaceTracks(s, [i], T0 + i * 100);
    }
    expect(s.entries[0].trackingId).toBe(2);
    expect(s.entries[0].label).toBe(2); 
  });
});

describe("isTrackActive — 활성/비활성 판정", () => {
  const s = observeFaceTracks(initFaceRoster(), [7], T0);
  const e = s.entries[0];

  it("방금 본 얼굴은 활성", () => {
    expect(isTrackActive(e, T0)).toBe(true);
  });
  it("유예 경계(ACTIVE_TTL_MS)까지는 활성", () => {
    expect(isTrackActive(e, T0 + ACTIVE_TTL_MS)).toBe(true);
  });
  it("유예를 넘기면 비활성", () => {
    expect(isTrackActive(e, T0 + ACTIVE_TTL_MS + 1)).toBe(false);
  });
});

const diag = (over: Partial<FaceDiag> = {}): FaceDiag => ({
  score: 0.812,
  personId: 5,
  displayName: "철수",
  streak: 3,
  verdict: "confirmed",
  threshold: 0.6,
  ...over,
});

describe("attachDiag — 판정 결과 귀속", () => {
  it("활성 얼굴이 정확히 1개면 그 얼굴에 귀속한다", () => {
    let s = observeFaceTracks(initFaceRoster(), [7], T0);
    s = attachDiag(s, diag(), T0);
    expect(s.entries[0].match).toEqual({
      personId: 5,
      displayName: "철수",
      score: 0.812,
      verdict: "confirmed",
      streak: 3,
    });
  });

  it("활성 얼굴이 2개 이상이면 어느 얼굴 결과인지 확정 못 하므로 귀속하지 않는다", () => {
    let s = observeFaceTracks(initFaceRoster(), [7, 42], T0);
    s = attachDiag(s, diag(), T0);
    expect(s.entries.every((e) => e.match == null)).toBe(true);
    expect(s.lastDiag).not.toBeNull(); 
  });

  it("비활성 얼굴만 있으면 귀속하지 않는다", () => {
    let s = observeFaceTracks(initFaceRoster(), [7], T0);
    s = attachDiag(s, diag(), T0 + ACTIVE_TTL_MS + 1);
    expect(s.entries[0].match).toBeNull();
  });

  it("diag=null 은 헤더 스냅샷만 지우고 얼굴 이력은 보존한다", () => {
    let s = observeFaceTracks(initFaceRoster(), [7], T0);
    s = attachDiag(s, diag(), T0);
    s = attachDiag(s, null, T0 + 10);
    expect(s.lastDiag).toBeNull();
    expect(s.entries[0].match).not.toBeNull();
  });
});

describe("formatTrackLine", () => {
  it("활성 얼굴은 '*' 로 시작하고 trackingId 원값을 노출한다", () => {
    const s = observeFaceTracks(initFaceRoster(), [7], T0);
    expect(formatTrackLine(s.entries[0], true)).toBe("* 얼굴1 id:7 -");
  });

  it("비활성 얼굴은 '*' 가 없다", () => {
    const s = observeFaceTracks(initFaceRoster(), [7], T0);
    expect(formatTrackLine(s.entries[0], false)).toBe("  얼굴1 id:7 -");
  });

  it("매칭되면 이름·score·verdict·streak 를 함께 보여준다", () => {
    let s = observeFaceTracks(initFaceRoster(), [7], T0);
    s = attachDiag(s, diag(), T0);
    expect(formatTrackLine(s.entries[0], true)).toBe("* 얼굴1 id:7 철수 0.81 conf 3/3");
  });

  it("이름이 없으면 #personId 로 대체한다", () => {
    let s = observeFaceTracks(initFaceRoster(), [7], T0);
    s = attachDiag(s, diag({ displayName: null }), T0);
    expect(formatTrackLine(s.entries[0], true)).toBe("* 얼굴1 id:7 #5 0.81 conf 3/3");
  });

  it("얼굴은 잡히는데 매칭이 안 되는 상태(unknown)를 구분할 수 있다", () => {
    let s = observeFaceTracks(initFaceRoster(), [7], T0);
    s = attachDiag(s, diag({ verdict: "unknown", personId: null, displayName: null, streak: 0, score: 0.31 }), T0);
    expect(formatTrackLine(s.entries[0], true)).toBe("* 얼굴1 id:7 ? 0.31 unkn 0/3");
  });
});
