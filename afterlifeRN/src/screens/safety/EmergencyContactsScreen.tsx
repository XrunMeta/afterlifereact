import { showAlert } from "../../stores/dialogStore";
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import SafeScrollView from "../../components/ui/SafeScrollView";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/ui/Button";
import { COLORS, RADIUS, SIZES } from "../../components/constants";

type Role = "notify_only" | "primary_heir" | "secondary_heir";
interface Contact {
  id: number;
  contactEmail: string;
  role: Role;
  triggerCondition: string;
  status: string;
  invitedAt: string;
}

export default function EmergencyContactsScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("primary_heir");
  const [inactivityDays, setInactivityDays] = useState("180");
  const [contacts, setContacts] = useState<Contact[]>([]);

  async function invite() {
    if (!email.includes("@")) {
      showAlert(t("safety.emergency.invalidEmail"));
      return;
    }
    showAlert(t("safety.emergency.inviteSentTitle"), t("safety.emergency.inviteSentDesc", { email }));
    setContacts((prev) => [
      ...prev,
      {
        id: Date.now(),
        contactEmail: email,
        role,
        triggerCondition: `inactivity_${inactivityDays}d`,
        status: "pending",
        invitedAt: new Date().toISOString(),
      },
    ]);
    setEmail("");
  }

  function revoke(id: number) {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <SafeScrollView backgroundColor={COLORS.white}>
      <PageHeader title={t("safety.emergency.title")} />
      <View style={s.wrap}>
        <Text style={s.helper}>
          {t("safety.emergency.helper")}
        </Text>

        <Text style={s.label}>{t("safety.emergency.emailLabel")}</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="heir@example.com"
          style={s.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={s.label}>{t("safety.emergency.roleLabel")}</Text>
        <View style={s.roleRow}>
          {(["notify_only", "primary_heir", "secondary_heir"] as Role[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[s.roleChip, role === r && s.roleChipActive]}
              onPress={() => setRole(r)}
            >
              <Text style={role === r ? s.roleTextActive : s.roleText}>
                {r === "notify_only"
                  ? t("safety.emergency.roleNotifyOnly")
                  : r === "primary_heir"
                  ? t("safety.emergency.rolePrimary")
                  : t("safety.emergency.roleSecondary")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>{t("safety.emergency.inactivityLabel")}</Text>
        <TextInput
          value={inactivityDays}
          onChangeText={setInactivityDays}
          keyboardType="number-pad"
          style={s.input}
        />

        <Button title={t("safety.emergency.inviteAction")} onPress={invite} />

        <Text style={[s.label, { marginTop: 32 }]}>{t("safety.emergency.registeredContacts")}</Text>
        <FlatList
          data={contacts}
          keyExtractor={(i) => String(i.id)}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={s.empty}>{t("safety.emergency.emptyContacts")}</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardEmail}>{item.contactEmail}</Text>
                <Text style={s.cardMeta}>
                  {item.role} · {item.triggerCondition} · {item.status}
                </Text>
              </View>
              <TouchableOpacity onPress={() => revoke(item.id)}>
                <Text style={s.revoke}>{t("safety.emergency.revoke")}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </SafeScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: SIZES.medium, gap: 12 },
  helper: { color: COLORS.zinc600, fontSize: 13, lineHeight: 20, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.zinc700, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.zinc200,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 15,
  },
  roleRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.zinc300,
  },
  roleChipActive: { backgroundColor: COLORS.zinc900, borderColor: COLORS.zinc900 },
  roleText: { color: COLORS.zinc700, fontSize: 13 },
  roleTextActive: { color: COLORS.white, fontSize: 13 },
  card: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: COLORS.zinc50,
    borderRadius: RADIUS.md,
    marginTop: 8,
  },
  cardEmail: { fontSize: 14, fontWeight: "600", color: COLORS.zinc900 },
  cardMeta: { fontSize: 12, color: COLORS.zinc500, marginTop: 2 },
  revoke: { color: COLORS.error, fontWeight: "600" },
  empty: { color: COLORS.zinc500, textAlign: "center", paddingVertical: 16 },
});
