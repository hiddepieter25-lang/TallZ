import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getConsent, setConsent, type ConsentState } from "@/lib/consent";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { t } from "@/lib/i18n";
import { colors, space, type, MIN_TAP } from "@/lib/theme";

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
  const { products, savedIds, savedOnboarding, hasAnswers } = useCatalog();
  const [consent, setConsentState] = useState<ConsentState | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    void getConsent().then(setConsentState);
  }, []);

  // Saved products come from the catalog already in memory — no second query
  // for rows the app is holding anyway.
  const savedProducts = useMemo(
    () => (products ?? []).filter((p) => savedIds.has(p.id)),
    [products, savedIds]
  );

  const toggleConsent = async () => {
    const next: ConsentState = consent === "all" ? "essential" : "all";
    await setConsent(next);
    setConsentState(next);
  };

  const confirmSignOut = () => {
    Alert.alert(t("account.logoutTitle"), t("account.logoutBody"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("account.logout"), style: "destructive", onPress: () => void supabase.auth.signOut() },
    ]);
  };

  /**
   * Deletion runs entirely in the database (`delete_own_account`), scoped to
   * auth.uid(). The website used to do this with a service-role key on a
   * server; that server is gone, and shipping a service key into an app is
   * never an option. Required before an EU launch, so it cannot wait.
   */
  const confirmDelete = () => {
    Alert.alert(t("account.deleteTitle"), t("account.deleteBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("account.deleteConfirm"),
        style: "destructive",
        onPress: async () => {
          setDeleteError(null);
          const { error } = await supabase.rpc("delete_own_account");
          if (error) {
            setDeleteError(t("account.deleteFailed"));
            return;
          }
          // The account is gone; the stored session no longer refers to
          // anything. Signing out clears it and the route guard does the rest.
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{t("account.eyebrow")}</Text>
        <Text style={styles.title}>{t("account.title")}</Text>

        <Text style={styles.sectionLabel}>{t("account.signedInAs")}</Text>
        <Text style={styles.email}>{session?.user?.email ?? "—"}</Text>

        <Text style={styles.sectionLabel}>
          {t("account.saved")}
          {savedProducts.length > 0 ? ` · ${savedProducts.length}` : ""}
        </Text>
        {savedProducts.length === 0 ? (
          <Text style={styles.hint}>{t("account.savedEmpty")}</Text>
        ) : (
          <View style={styles.grid}>
            {savedProducts.map((product) => (
              <View key={product.id} style={styles.gridItem}>
                <ProductCard product={product} placement="feed" />
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionLabel}>{t("account.yourStyle")}</Text>
        <View style={styles.group}>
          {hasAnswers ? (
            <>
              <Row label={t("account.height")} value={savedOnboarding?.heightRange ?? "—"} />
              <Row label={t("account.fit")} value={savedOnboarding?.fitPreference ?? "—"} />
              <Row label={t("account.budget")} value={savedOnboarding?.budget ?? "—"} />
              <Row label={t("account.changeAnswers")} onPress={() => router.push("/onboarding")} />
            </>
          ) : (
            <Row label={t("account.takeQuiz")} onPress={() => router.push("/onboarding")} />
          )}
        </View>

        <Text style={styles.sectionLabel}>{t("account.privacy")}</Text>
        <View style={styles.group}>
          <Row
            label={consent === "all" ? t("account.loggingOn") : t("account.loggingOff")}
            value={t("account.change")}
            onPress={toggleConsent}
          />
        </View>

        <View style={styles.group}>
          <Row label={t("account.logout")} onPress={confirmSignOut} danger />
          <Row label={t("account.delete")} onPress={confirmDelete} danger />
        </View>

        {deleteError && <Text style={styles.error}>{deleteError}</Text>}
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
  hint: { ...type.small, color: colors.muted },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  // Two per row, matching the other grids: half the width minus half the gap.
  gridItem: { width: "47%" },
  group: { borderTopWidth: 1, borderColor: colors.line },
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
  error: { ...type.small, color: colors.danger, marginTop: space.lg },
});
