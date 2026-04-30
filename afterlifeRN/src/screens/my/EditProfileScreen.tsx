import v_a3453e, { v_c4deb2, v_5ab095 } from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_79c4f2,
  v_cf9c33,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";
import { v_1ed7d9 } from "../../stores/authStore";
import { v_7ef860 } from "../../api/auth";

const v_9bbc99 = {
  male: "남성",
  female: "여성",
  other: "기타",
};

export default function v_e2b396() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();
  const v_b113dd = v_1ed7d9((v_fd5f43) => v_fd5f43.apiUser);
  const v_2ca7e0 = v_1ed7d9((v_fd5f43) => v_fd5f43.accessToken);

  const [v_774c91, v_8cb9cf] = v_5ab095<string[]>([]);

  v_c4deb2(() => {
    if (!v_2ca7e0) return;
    let v_2008a4 = false;
    (async () => {
      try {
        const v_b32680 = await v_7ef860(v_2ca7e0);
        if (v_2008a4) return;
        v_8cb9cf(v_b32680.interests ?? []);
      } catch (v_49263d) {
        console.warn("[EditProfile] getMe failed:", v_49263d);
      }
    })();
    return () => {
      v_2008a4 = true;
    };
  }, [v_2ca7e0]);

  const v_1833e7 = v_b113dd?.name ?? "";
  const v_d74a81 = v_b113dd?.phone ?? "";
  const v_c3eac4 = v_b113dd?.gender ?? null;
  const v_2694bd = v_b113dd?.age ?? null;
  const v_bf6b43 = v_b113dd?.avatarUrl ?? null;

  return (
    <SafeScrollView backgroundColor={v_1bfbd0.white} showBottomBackground={false}>
      <PageHeader
        title={v_8d41d7("settings.editProfile.title")}
        showBackButton
        onBackPress={() => v_c65f5d.goBack()}
      />

      <View style={v_fd5f43.content}>
        {}
        <TouchableOpacity style={v_fd5f43.avatarRow}>
          {v_bf6b43 ? (
            <Image source={{ uri: v_bf6b43 }} style={v_fd5f43.avatarImage} />
          ) : (
            <View style={v_fd5f43.avatarPlaceholder}>
              <Feather name="camera" size={28} color={v_1bfbd0.zinc400} />
            </View>
          )}
          <Text style={v_fd5f43.avatarLabel}>{v_8d41d7("settings.editProfile.fields.avatar")}</Text>
          <Feather name="chevron-right" size={20} color={v_1bfbd0.zinc400} />
        </TouchableOpacity>

        <View style={v_fd5f43.card}>
          {}
          <View style={v_fd5f43.fieldRow}>
            <Text style={v_fd5f43.fieldLabel}>{v_8d41d7("settings.editProfile.fields.name")}</Text>
            <TextInput
              style={v_fd5f43.fieldInput}
              editable={false}
              value={v_1833e7}
              placeholder="—"
              placeholderTextColor={v_1bfbd0.zinc400}
            />
          </View>

          <View style={v_fd5f43.divider} />

          {}
          <View style={v_fd5f43.fieldRow}>
            <Text style={v_fd5f43.fieldLabel}>{v_8d41d7("settings.editProfile.fields.phone")}</Text>
            <TextInput
              style={v_fd5f43.fieldInput}
              editable={false}
              value={v_d74a81}
              placeholder="—"
              placeholderTextColor={v_1bfbd0.zinc400}
            />
          </View>

          <View style={v_fd5f43.divider} />

          {}
          <TouchableOpacity style={v_fd5f43.fieldRow}>
            <Text style={v_fd5f43.fieldLabel}>{v_8d41d7("settings.editProfile.fields.gender")}</Text>
            <Text style={[v_fd5f43.fieldValue, v_c3eac4 && v_fd5f43.fieldValueFilled]}>
              {v_c3eac4 ? v_9bbc99[v_c3eac4] ?? v_c3eac4 : "—"}
            </Text>
            <Feather name="chevron-right" size={18} color={v_1bfbd0.zinc400} />
          </TouchableOpacity>

          <View style={v_fd5f43.divider} />

          {}
          <View style={v_fd5f43.fieldRow}>
            <Text style={v_fd5f43.fieldLabel}>{v_8d41d7("settings.editProfile.fields.age")}</Text>
            <TextInput
              style={v_fd5f43.fieldInput}
              editable={false}
              value={v_2694bd != null ? String(v_2694bd) : ""}
              placeholder="—"
              placeholderTextColor={v_1bfbd0.zinc400}
              keyboardType="numeric"
            />
          </View>

          <View style={v_fd5f43.divider} />

          {}
          <TouchableOpacity style={v_fd5f43.fieldRow}>
            <Text style={v_fd5f43.fieldLabel}>{v_8d41d7("settings.editProfile.fields.interests")}</Text>
            <Text
              style={[v_fd5f43.fieldValue, v_774c91.length > 0 && v_fd5f43.fieldValueFilled]}
              numberOfLines={1}
            >
              {v_774c91.length > 0 ? v_774c91.join(", ") : "—"}
            </Text>
            <Feather name="chevron-right" size={18} color={v_1bfbd0.zinc400} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeScrollView>
  );
}

const v_fd5f43 = v_472849.create({
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    maxWidth: 780,
    alignSelf: "center",
    width: "100%",
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: v_1bfbd0.zinc100,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: v_1bfbd0.zinc700 },
  card: {
    backgroundColor: v_1bfbd0.white,
    borderWidth: 1,
    borderColor: v_1bfbd0.zinc200,
    borderRadius: v_8b0c90.lg,
    overflow: "hidden",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  fieldLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: "500",
    color: v_1bfbd0.zinc700,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: v_1bfbd0.zinc900,
    textAlign: "right",
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    color: v_1bfbd0.zinc400,
    textAlign: "right",
  },
  fieldValueFilled: {
    color: v_1bfbd0.zinc900,
  },
  divider: { height: 1, backgroundColor: v_1bfbd0.zinc100, marginLeft: 20 },
});
