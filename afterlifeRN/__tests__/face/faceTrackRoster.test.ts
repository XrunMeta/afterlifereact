import {
  v_815431,
  v_70cd73,
  v_40137b,
  v_204d2e,
  v_6e2c23,
  v_772beb,
  v_99b411,
  type v_2f9753,
} from "../../src/face/faceTrackRoster";
import type { v_8a6b56 } from "../../src/config/faceDiag";

const v_ca573c = 1_000_000;

function v_efeab9(s: v_2f9753): Array<[number, number]> {
  return v_fd5f43.entries.map((v_9e86fd) => [v_9e86fd.trackingId, v_9e86fd.label]);
}

describe("observeFaceTracks — 라벨 부여", () => {
  it("새 trackingId 는 등장 순서대로 1,2,3 라벨을 받는다", () => {
    let v_fd5f43 = v_6e2c23();
    v_fd5f43 = v_99b411(v_fd5f43, [7], v_ca573c);
    v_fd5f43 = v_99b411(v_fd5f43, [7, 42], v_ca573c + 1000);
    v_fd5f43 = v_99b411(v_fd5f43, [99], v_ca573c + 2000);
    expect(v_efeab9(v_fd5f43)).toEqual([
      [7, 1],
      [42, 2],
      [99, 3],
    ]);
    expect(v_fd5f43.nextLabel).toBe(4);
  });

  it("이미 본 trackingId 는 같은 라벨을 유지하고 lastSeen/seenCount 만 갱신된다", () => {
    let v_fd5f43 = v_6e2c23();
    v_fd5f43 = v_99b411(v_fd5f43, [7], v_ca573c);
    v_fd5f43 = v_99b411(v_fd5f43, [7], v_ca573c + 1000);
    v_fd5f43 = v_99b411(v_fd5f43, [7], v_ca573c + 2000);
    expect(v_fd5f43.entries).toHaveLength(1);
    expect(v_fd5f43.entries[0].label).toBe(1);
    expect(v_fd5f43.entries[0].seenCount).toBe(3);
    expect(v_fd5f43.entries[0].firstSeenMs).toBe(v_ca573c);
    expect(v_fd5f43.entries[0].lastSeenMs).toBe(v_ca573c + 2000);
    expect(v_fd5f43.nextLabel).toBe(2); 
  });

  it("사라졌다 다시 나타난 trackingId 는 새 라벨을 받지 않는다", () => {
    let v_fd5f43 = v_6e2c23();
    v_fd5f43 = v_99b411(v_fd5f43, [7], v_ca573c);
    v_fd5f43 = v_99b411(v_fd5f43, [42], v_ca573c + 1000);
    v_fd5f43 = v_99b411(v_fd5f43, [7], v_ca573c + 9000);
    expect(v_efeab9(v_fd5f43)).toEqual([
      [7, 1],
      [42, 2],
    ]);
  });

  it("같은 프레임에 중복 id 가 와도 항목이 두 개 생기지 않는다", () => {
    const v_fd5f43 = v_99b411(v_6e2c23(), [7, 7, 7], v_ca573c);
    expect(v_fd5f43.entries).toHaveLength(1);
    expect(v_fd5f43.nextLabel).toBe(2);
  });

  it("빈 배열이면 동일 참조를 돌려준다(구독자 통지 억제)", () => {
    const v_ca01e0 = v_99b411(v_6e2c23(), [7], v_ca573c);
    expect(v_99b411(v_ca01e0, [], v_ca573c + 100)).toBe(v_ca01e0);
  });

  it("숫자가 아니거나 NaN 인 id 는 무시한다", () => {
    const v_0af197 = [NaN, undefined as unknown as number, 5];
    const v_fd5f43 = v_99b411(v_6e2c23(), v_0af197, v_ca573c);
    expect(v_efeab9(v_fd5f43)).toEqual([[5, 1]]);
  });
});

describe("observeFaceTracks — 목록 상한(trackingId 재사용/폭주 방지)", () => {
  it("상한을 넘으면 가장 오래 안 보인 항목부터 버린다", () => {
    let v_fd5f43 = v_6e2c23();

    for (let v_ebec57 = 1; v_ebec57 <= v_70cd73; v_ebec57++) {
      v_fd5f43 = v_99b411(v_fd5f43, [v_ebec57], v_ca573c + v_ebec57 * 100);
    }
    expect(v_fd5f43.entries).toHaveLength(v_70cd73);
    v_fd5f43 = v_99b411(v_fd5f43, [777], v_ca573c + 100_000);
    expect(v_fd5f43.entries).toHaveLength(v_70cd73);
    expect(v_fd5f43.entries.map((v_9e86fd) => v_9e86fd.trackingId)).not.toContain(1);
    expect(v_fd5f43.entries.map((v_9e86fd) => v_9e86fd.trackingId)).toContain(777);
  });

  it("방금 보인 항목은 상한 초과 시에도 살아남는다", () => {
    let v_fd5f43 = v_6e2c23();
    for (let v_ebec57 = 1; v_ebec57 <= v_70cd73; v_ebec57++) {
      v_fd5f43 = v_99b411(v_fd5f43, [v_ebec57], v_ca573c + v_ebec57 * 100);
    }

    v_fd5f43 = v_99b411(v_fd5f43, [1, 777], v_ca573c + 100_000);
    const v_52e08b = v_fd5f43.entries.map((v_9e86fd) => v_9e86fd.trackingId);
    expect(v_52e08b).toContain(1);
    expect(v_52e08b).toContain(777);
    expect(v_52e08b).not.toContain(2); 
    expect(v_fd5f43.entries).toHaveLength(v_70cd73);
  });

  it("남은 항목의 라벨은 재번호되지 않는다", () => {
    let v_fd5f43 = v_6e2c23();
    for (let v_ebec57 = 1; v_ebec57 <= v_70cd73 + 1; v_ebec57++) {
      v_fd5f43 = v_99b411(v_fd5f43, [v_ebec57], v_ca573c + v_ebec57 * 100);
    }
    expect(v_fd5f43.entries[0].trackingId).toBe(2);
    expect(v_fd5f43.entries[0].label).toBe(2); 
  });
});

describe("isTrackActive — 활성/비활성 판정", () => {
  const v_fd5f43 = v_99b411(v_6e2c23(), [7], v_ca573c);
  const v_9e86fd = v_fd5f43.entries[0];

  it("방금 본 얼굴은 활성", () => {
    expect(v_772beb(v_9e86fd, v_ca573c)).toBe(true);
  });
  it("유예 경계(ACTIVE_TTL_MS)까지는 활성", () => {
    expect(v_772beb(v_9e86fd, v_ca573c + v_815431)).toBe(true);
  });
  it("유예를 넘기면 비활성", () => {
    expect(v_772beb(v_9e86fd, v_ca573c + v_815431 + 1)).toBe(false);
  });
});

const v_ef2205 = (over: Partial<v_8a6b56> = {}): v_8a6b56 => ({
  score: 0.812,
  personId: 5,
  displayName: "철수",
  streak: 3,
  verdict: "confirmed",
  threshold: 0.6,
  ...v_b71f86,
});

describe("attachDiag — 판정 결과 귀속", () => {
  it("활성 얼굴이 정확히 1개면 그 얼굴에 귀속한다", () => {
    let v_fd5f43 = v_99b411(v_6e2c23(), [7], v_ca573c);
    v_fd5f43 = v_40137b(v_fd5f43, v_ef2205(), v_ca573c);
    expect(v_fd5f43.entries[0].match).toEqual({
      personId: 5,
      displayName: "철수",
      score: 0.812,
      verdict: "confirmed",
      streak: 3,
    });
  });

  it("활성 얼굴이 2개 이상이면 어느 얼굴 결과인지 확정 못 하므로 귀속하지 않는다", () => {
    let v_fd5f43 = v_99b411(v_6e2c23(), [7, 42], v_ca573c);
    v_fd5f43 = v_40137b(v_fd5f43, v_ef2205(), v_ca573c);
    expect(v_fd5f43.entries.every((v_9e86fd) => v_9e86fd.match == null)).toBe(true);
    expect(v_fd5f43.lastDiag).not.toBeNull(); 
  });

  it("비활성 얼굴만 있으면 귀속하지 않는다", () => {
    let v_fd5f43 = v_99b411(v_6e2c23(), [7], v_ca573c);
    v_fd5f43 = v_40137b(v_fd5f43, v_ef2205(), v_ca573c + v_815431 + 1);
    expect(v_fd5f43.entries[0].match).toBeNull();
  });

  it("diag=null 은 헤더 스냅샷만 지우고 얼굴 이력은 보존한다", () => {
    let v_fd5f43 = v_99b411(v_6e2c23(), [7], v_ca573c);
    v_fd5f43 = v_40137b(v_fd5f43, v_ef2205(), v_ca573c);
    v_fd5f43 = v_40137b(v_fd5f43, null, v_ca573c + 10);
    expect(v_fd5f43.lastDiag).toBeNull();
    expect(v_fd5f43.entries[0].match).not.toBeNull();
  });
});

describe("formatTrackLine", () => {
  it("활성 얼굴은 '*' 로 시작하고 trackingId 원값을 노출한다", () => {
    const v_fd5f43 = v_99b411(v_6e2c23(), [7], v_ca573c);
    expect(v_204d2e(v_fd5f43.entries[0], true)).toBe("* 얼굴1 id:7 -");
  });

  it("비활성 얼굴은 '*' 가 없다", () => {
    const v_fd5f43 = v_99b411(v_6e2c23(), [7], v_ca573c);
    expect(v_204d2e(v_fd5f43.entries[0], false)).toBe("  얼굴1 id:7 -");
  });

  it("매칭되면 이름·score·verdict·streak 를 함께 보여준다", () => {
    let v_fd5f43 = v_99b411(v_6e2c23(), [7], v_ca573c);
    v_fd5f43 = v_40137b(v_fd5f43, v_ef2205(), v_ca573c);
    expect(v_204d2e(v_fd5f43.entries[0], true)).toBe("* 얼굴1 id:7 철수 0.81 conf 3/3");
  });

  it("이름이 없으면 #personId 로 대체한다", () => {
    let v_fd5f43 = v_99b411(v_6e2c23(), [7], v_ca573c);
    v_fd5f43 = v_40137b(v_fd5f43, v_ef2205({ displayName: null }), v_ca573c);
    expect(v_204d2e(v_fd5f43.entries[0], true)).toBe("* 얼굴1 id:7 #5 0.81 conf 3/3");
  });

  it("얼굴은 잡히는데 매칭이 안 되는 상태(unknown)를 구분할 수 있다", () => {
    let v_fd5f43 = v_99b411(v_6e2c23(), [7], v_ca573c);
    v_fd5f43 = v_40137b(v_fd5f43, v_ef2205({ verdict: "unknown", personId: null, displayName: null, streak: 0, score: 0.31 }), v_ca573c);
    expect(v_204d2e(v_fd5f43.entries[0], true)).toBe("* 얼굴1 id:7 ? 0.31 unkn 0/3");
  });
});
