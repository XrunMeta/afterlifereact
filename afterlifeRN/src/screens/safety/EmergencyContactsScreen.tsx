import { v_889fad } from "../../stores/dialogStore";
import v_a3453e, { v_5ab095 } from "bapkr";
import { v_3094a2, v_19b633, v_472849, v_79c4f2, v_9cabcb, v_4623af, v_03e392 } from "rcmrninabrnb";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import v_1a40c4 from "../../components/ui/Button";
import { v_1bfbd0, v_8b0c90, v_9b1a04 } from "../../components/constants";

type Role = "notify_only" | "primary_heir" | "secondary_heir";
interface Contact {
  id: number;
  contactEmail: string;
  role: Role;
  triggerCondition: string;
  status: string;
  invitedAt: string;
}

export default function v_d96c75() {
  const [v_e0c7e8, v_fedf34] = v_5ab095("");
  const [v_22da99, v_540819] = v_5ab095<Role>("primary_heir");
  const [v_173340, v_53d208] = v_5ab095("180");
  const [v_c1dbad, v_d93384] = v_5ab095<Contact[]>([]);

  async function v_dc5c7f() {
    if (!v_e0c7e8.includes("@")) {
      v_889fad("이메일 형식을 확인해주세요.");
      return;
    }
    v_889fad("초대 발송", `${v_e0c7e8}에게 비상연락처 초대를 보냈습니다.`);
    v_d93384((v_ba2215) => [
      ...v_ba2215,
      {
        id: Date.now(),
        contactEmail: v_e0c7e8,
        role: v_22da99,
        triggerCondition: `inactivity_${v_173340}d`,
        status: "pending",
        invitedAt: new Date().toISOString(),
      },
    ]);
    v_fedf34("");
  }

  function v_e0920a(v_389afb) {
    v_d93384((v_ba2215) => v_ba2215.filter((v_3f4e2e) => v_3f4e2e.id !== v_389afb));
  }

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white}>
      <PageHeader title="비상연락처 & 상속지정" />
      <View style={v_fd5f43.wrap}>
        <Text style={v_fd5f43.helper}>
          일정 기간 미활동 시 지정된 연락처로 상속 이관 절차가 시작됩니다. 관리자 승인 후 이관이 집행됩니다.
        </Text>

        <Text style={v_fd5f43.label}>이메일</Text>
        <TextInput
          value={v_e0c7e8}
          onChangeText={v_fedf34}
          placeholder="heir@example.com"
          style={v_fd5f43.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={v_fd5f43.label}>역할</Text>
        <View style={v_fd5f43.roleRow}>
          {(["notify_only", "primary_heir", "secondary_heir"] as Role[]).map((v_cb35cb) => (
            <TouchableOpacity
              key={v_cb35cb}
              style={[v_fd5f43.roleChip, v_22da99 === v_cb35cb && v_fd5f43.roleChipActive]}
              onPress={() => v_540819(v_cb35cb)}
            >
              <Text style={v_22da99 === v_cb35cb ? v_fd5f43.roleTextActive : v_fd5f43.roleText}>
                {v_cb35cb === "notify_only" ? "(가) 알림만" : v_cb35cb === "primary_heir" ? "(나) 1순위" : "(다) 2순위"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={v_fd5f43.label}>미활동 기준 (일)</Text>
        <TextInput
          value={v_173340}
          onChangeText={v_53d208}
          keyboardType="number-pad"
          style={v_fd5f43.input}
        />

        <Button title="초대 발송" onPress={v_dc5c7f} />

        <Text style={[v_fd5f43.label, { marginTop: 32 }]}>등록된 연락처</Text>
        <FlatList
          data={v_c1dbad}
          keyExtractor={(v_ebec57) => String(v_ebec57.id)}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={v_fd5f43.empty}>아직 등록된 연락처가 없습니다.</Text>}
          renderItem={({ item: v_8c0b26 }) => (
            <View style={v_fd5f43.card}>
              <View style={{ flex: 1 }}>
                <Text style={v_fd5f43.cardEmail}>{v_8c0b26.contactEmail}</Text>
                <Text style={v_fd5f43.cardMeta}>
                  {v_8c0b26.role} · {v_8c0b26.triggerCondition} · {v_8c0b26.status}
                </Text>
              </View>
              <TouchableOpacity onPress={() => v_e0920a(v_8c0b26.id)}>
                <Text style={v_fd5f43.revoke}>철회</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  wrap: { padding: v_9b1a04.medium, gap: 12 },
  helper: { color: v_1bfbd0.zinc600, fontSize: 13, lineHeight: 20, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "600", color: v_1bfbd0.zinc700, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.md,
    padding: 12,
    fontSize: 15,
  },
  roleRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: v_8b0c90.full,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc300,
  },
  roleChipActive: { backgroundColor: v_1bfbd0.zinc900, borderColor: v_1bfbd0.zinc900 },
  roleText: { color: v_1bfbd0.zinc700, fontSize: 13 },
  roleTextActive: { color: v_1bfbd0.white, fontSize: 13 },
  card: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: v_1bfbd0.zinc50,
    borderRadius: v_8b0c90.md,
    marginTop: 8,
  },
  cardEmail: { fontSize: 14, fontWeight: "600", color: v_1bfbd0.zinc900 },
  cardMeta: { fontSize: 12, color: v_1bfbd0.zinc500, marginTop: 2 },
  revoke: { color: v_1bfbd0.error, fontWeight: "600" },
  empty: { color: v_1bfbd0.zinc500, textAlign: "center", paddingVertical: 16 },
});
