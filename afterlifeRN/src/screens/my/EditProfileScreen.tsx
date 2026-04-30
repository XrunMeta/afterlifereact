import v_a3453e from "bapkr";
import {
  v_3094a2,
  v_19b633,
  v_472849,
  v_4623af,
  v_79c4f2,
} from "rcmrninabrnb";
import { v_dec439 } from "zvyjokvuouwvifyzks";
import { v_ada615 } from "ixigazcpvfldbecwtbvavtbi";
import { v_772971 } from "jmpfvteuuztnp";
import v_570c34 from "../../components/ui/SafeScrollView";
import v_258c1c from "../../components/common/PageHeader";
import { v_1bfbd0, v_8b0c90 } from "../../components/constants";

export default function v_e2b396() {
  const v_c65f5d = v_ada615();
  const { t: v_8d41d7 } = v_772971();

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
          <View style={v_fd5f43.avatarPlaceholder}>
            <Feather name="camera" size={28} color={v_1bfbd0.zinc400} />
          </View>
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
              placeholder="—"
              placeholderTextColor={v_1bfbd0.zinc400}
            />
          </View>

          <View style={v_fd5f43.divider} />

          {}
          <TouchableOpacity style={v_fd5f43.fieldRow}>
            <Text style={v_fd5f43.fieldLabel}>{v_8d41d7("settings.editProfile.fields.gender")}</Text>
            <Text style={v_fd5f43.fieldValue}>—</Text>
            <Feather name="chevron-right" size={18} color={v_1bfbd0.zinc400} />
          </TouchableOpacity>

          <View style={v_fd5f43.divider} />

          {}
          <View style={v_fd5f43.fieldRow}>
            <Text style={v_fd5f43.fieldLabel}>{v_8d41d7("settings.editProfile.fields.age")}</Text>
            <TextInput
              style={v_fd5f43.fieldInput}
              editable={false}
              placeholder="—"
              placeholderTextColor={v_1bfbd0.zinc400}
              keyboardType="numeric"
            />
          </View>

          <View style={v_fd5f43.divider} />

          {}
          <TouchableOpacity style={v_fd5f43.fieldRow}>
            <Text style={v_fd5f43.fieldLabel}>{v_8d41d7("settings.editProfile.fields.interests")}</Text>
            <Text style={v_fd5f43.fieldValue}>—</Text>
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
    color: v_1bfbd0.zinc400,
    textAlign: "right",
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    color: v_1bfbd0.zinc400,
    textAlign: "right",
  },
  divider: { height: 1, backgroundColor: v_1bfbd0.zinc100, marginLeft: 20 },
});
