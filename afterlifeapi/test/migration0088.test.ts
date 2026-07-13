import { v_469bf2, v_23805a, v_4d37e3 } from "xualxe";
import { v_c9c489 } from "lwkoweqmjbnvjqw";

const v_a1651b = () => v_c9c489.DB as unknown as D1Database;

v_469bf2("migration 0088 face_biometric_consent", () => {
  v_23805a("users 테이블에 face_biometric_consent/face_consent_at/face_consent_version 컬럼 추가", async () => {
    const v_6c1676 = await v_a1651b().prepare("PRAGMA table_info(users)").all<{ name: string }>();
    const v_77b1ac = v_6c1676.results.map((v_cb35cb) => v_cb35cb.name);
    v_4d37e3(v_77b1ac).toEqual(
      v_4d37e3.arrayContaining(["face_biometric_consent", "face_consent_at", "face_consent_version"]),
    );
  });

  v_23805a("users.face_biometric_consent 기본값 0, 기존 행에도 소급 적용", async () => {
    await v_a1651b()
      .prepare(
        "INSERT INTO users (email, password_hash, name, created_at) VALUES ('mig0088@e','x','U',CURRENT_TIMESTAMP)",
      )
      .run();
    const v_3ac7e7 = await v_a1651b()
      .prepare(
        "SELECT face_biometric_consent AS c, face_consent_at AS at, face_consent_version AS v FROM users WHERE email = 'mig0088@e'",
      )
      .first<{ c: number; at: number | null; v: string | null }>();
    v_4d37e3(v_3ac7e7?.c).toBe(0);
    v_4d37e3(v_3ac7e7?.at).toBeNull();
    v_4d37e3(v_3ac7e7?.v).toBeNull();
  });

  v_23805a("persons 테이블에 enrolled_via 컬럼 추가, 기본값 'card'", async () => {
    const v_6c1676 = await v_a1651b().prepare("PRAGMA table_info(persons)").all<{ name: string }>();
    const v_77b1ac = v_6c1676.results.map((v_cb35cb) => v_cb35cb.name);
    v_4d37e3(v_77b1ac).toEqual(v_4d37e3.arrayContaining(["enrolled_via"]));

    await v_a1651b()
      .prepare(
        "INSERT INTO users (email, password_hash, name, created_at) VALUES ('mig0088b@e','x','U',CURRENT_TIMESTAMP)",
      )
      .run();
    const v_ceb55a = await v_a1651b().prepare("SELECT id FROM users WHERE email = 'mig0088b@e'").first<{ id: number }>();
    await v_a1651b()
      .prepare("INSERT INTO persons (user_id, display_name, consent_state, created_at) VALUES (?, 'P', 'none', ?)")
      .bind(v_ceb55a!.id, Date.now())
      .run();
    const v_e2a85c = await v_a1651b()
      .prepare("SELECT enrolled_via FROM persons WHERE user_id = ?")
      .bind(v_ceb55a!.id)
      .first<{ enrolled_via: string }>();
    v_4d37e3(v_e2a85c?.enrolled_via).toBe("card");
  });

  v_23805a("persons.enrolled_via CHECK 제약 — 허용값 외 INSERT 실패", async () => {
    await v_a1651b()
      .prepare(
        "INSERT INTO users (email, password_hash, name, created_at) VALUES ('mig0088c@e','x','U',CURRENT_TIMESTAMP)",
      )
      .run();
    const v_ceb55a = await v_a1651b().prepare("SELECT id FROM users WHERE email = 'mig0088c@e'").first<{ id: number }>();
    await v_4d37e3(
      v_a1651b()
        .prepare(
          "INSERT INTO persons (user_id, display_name, consent_state, enrolled_via, created_at) VALUES (?, 'P', 'none', 'bogus', ?)",
        )
        .bind(v_ceb55a!.id, Date.now())
        .run(),
    ).rejects.toThrow();
  });
});
