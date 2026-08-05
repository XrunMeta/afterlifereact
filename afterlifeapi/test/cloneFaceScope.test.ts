import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489 } from "lwkoweqmjbnvjqw";
import { v_929ead } from "../src/lib/cloneFaceScope";

v_469bf2("faceNamespace", () => {
  v_23805a("userId와 cloneId를 콜론으로 결합한다", () => {
    v_4d37e3(v_929ead(7, 42)).toBe("7:42");
  });

  v_23805a("서로 다른 클론은 서로 다른 namespace를 갖는다", () => {
    v_4d37e3(v_929ead(7, 42)).not.toBe(v_929ead(7, 43));
  });

  v_23805a("서로 다른 사용자는 서로 다른 namespace를 갖는다", () => {
    v_4d37e3(v_929ead(7, 42)).not.toBe(v_929ead(8, 42));
  });
});

v_469bf2("0109 스키마", () => {
  v_23805a("clone_person_faces 테이블이 존재한다", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='clone_person_faces'")
      .first<{ name: string }>();
    v_4d37e3(v_3ac7e7?.name).toBe("clone_person_faces");
  });

  v_23805a("clones에 self_person_id 컬럼이 있다", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_6c1676 = await v_a1651b.prepare("PRAGMA table_info(clones)").all<{ name: string }>();
    v_4d37e3(v_6c1676.results.map((v_3f4e2e) => v_3f4e2e.name)).toContain("self_person_id");
  });

  v_23805a("clone_person_faces에 (clone_id, person_id) 인덱스가 있다", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_cpf_clone_person'")
      .first<{ name: string }>();
    v_4d37e3(v_3ac7e7?.name).toBe("idx_cpf_clone_person");
  });

  v_23805a("폐기된 부분 유니크 인덱스가 제거됐다", async () => {
    const v_a1651b = v_c9c489.DB as unknown as D1Database;
    const v_3ac7e7 = await v_a1651b
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='uq_persons_user_name_no_clone'")
      .first<{ name: string }>();
    v_4d37e3(v_3ac7e7).toBeNull();
  });
});
