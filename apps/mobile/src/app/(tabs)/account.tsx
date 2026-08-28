import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLatestOnboardingResponse, type SavedOnboarding } from "@/lib/products";
import { getConsent, setConsent, type ConsentState } from "@/lib/consent";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

function Row({
  label,
  value,
  onPress,
  danger,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && onPress ? styles.rowPressed : null]}
    >
      <Text style={[styles.rowLabel, danger && styles.danger]}>{label}</Text>
      {value !== undefined && <Text style={styles.rowValue}>{value}</Text>}
    </Pressable>
  );
}

export default function Account() {
  const router = useRouter();
  const { session } = useAuth();
  const [saved, setSaved] = useState<SavedOnboarding | null>(null);
  const [consent, setConsentState] = useState<ConsentState | null>(null);

  useEffect(() => {
    const userId = session?.user?.id;
    if (userId) void getLatestOnboardingResponse(supabase, userId).then(setSaved);
    void getConsent().then(setConsentState);
  }, [session]);

  const toggleConsent = async () => {
    const next: ConsentState = consent === "all" ? "essential" : "all";
    await setConsent(next);
    setConsentState(next);
  };

  const confirmSignOut = () => {
    Alert.alert("Log out?", "You'll need to sign in again to see your feed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => void supabase.auth.signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Account</Text>
        <Text style={styles.title}>your account</Text>

        <Text style={styles.sectionLabel}>Signed in as</Text>
        <Text style={styles.email}>{session?.user?.email ?? "—"}</Text>

        <Text style={styles.sectionLabel}>Your style</Text>
        <View style={styles.group}>
          {saved ? (
            <>
              <Row label="Height" value={saved.heightRange ?? "—"} />
              <Row label="Fit" value={saved.fitPreference ?? "—"} />
              <Row label="Budget" value={saved.budget ?? "—"} />
              <Row
                label="Change my style answers"
                onPress={() => router.push("/onboarding")}
              />
            </>
          ) : (
            <Row label="Take the style quiz" onPress={() => router.push("/onboarding")} />
          )}
        </View>

        <Text style={styles.sectionLabel}>Privacy</Text>
        <View style={styles.group}>
          <Row
            label={consent === "all" ? "Activity logging: on" : "Activity logging: off"}
            value="Change"
            onPress={toggleConsent}
          />
        </View>

        <View style={styles.group}>
          <Row label="Log out" onPress={confirmSignOut} danger />
        </View>

        <Text style={styles.note}>
          Deleting your account and data is handled on the website for now — that screen hasn&apos;t
          moved across yet.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xxl },
  eyebrow: { ...type.label, color: colors.muted },
  title: { ...type.hero, color: colors.foreground, marginTop: space.sm, marginBottom: space.xxl },
  sectionLabel: { ...type.label, color: colors.muted, marginBottom: space.sm, marginTop: space.xl },
  email: { ...type.body, color: colors.foreground },
  group: {
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  row: {
    minHeight: MIN_TAP + 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingVertical: space.md,
    gap: space.md,
  },
  rowPressed: { opacity: 0.6 },
  rowLabel: { ...type.body, color: colors.foreground, flexShrink: 1 },
  rowValue: { ...type.small, color: colors.muted },
  danger: { color: colors.danger },
  note: { ...type.small, color: colors.muted, marginTop: space.xxl },
});
