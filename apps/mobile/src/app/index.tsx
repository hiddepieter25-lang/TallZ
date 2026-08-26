import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProducts, rankProducts, type Product } from "@/lib/products";
import { getConsent, setConsent } from "@/lib/consent";
import { supabase } from "@/lib/supabase";
import { ProductCard } from "@/components/ProductCard";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

export default function Feed() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const all = await getProducts();
      // No quiz answers yet (onboarding lands in a later phase), so every
      // product scores zero and collapses into one tier — which still gives
      // the retailer round-robin rather than an arbitrary order.
      setProducts(rankProducts(all, { swipeTags: [], occasions: [] }));
    } catch {
      setError("Couldn't load products. Pull down to try again.");
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    void load();
    void getConsent().then((c) => setNeedsConsent(c === null));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const choose = async (state: "all" | "essential") => {
    await setConsent(state);
    setNeedsConsent(false);
  };

  if (products === null) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.foreground} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>TallZ</Text>
        <Pressable
          onPress={() => supabase.auth.signOut()}
          hitSlop={10}
          style={styles.signOut}
          accessibilityRole="button"
        >
          <Text style={styles.signOutText}>Log out</Text>
        </Pressable>
      </View>

      {needsConsent && (
        <View style={styles.consent}>
          <Text style={styles.consentText}>
            May we log which products you view and tap, to improve your feed? Links to shops work
            either way.
          </Text>
          <View style={styles.consentButtons}>
            <Pressable onPress={() => choose("essential")} style={styles.consentGhost}>
              <Text style={styles.consentGhostText}>No thanks</Text>
            </Pressable>
            <Pressable onPress={() => choose("all")} style={styles.consentPrimary}>
              <Text style={styles.consentPrimaryText}>Allow</Text>
            </Pressable>
          </View>
        </View>
      )}

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ProductCard product={item} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.foreground} />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.eyebrow}>just landed</Text>
            <Text style={styles.title}>The newest finds</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>{error ?? "Nothing here yet."}</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  wordmark: { ...type.h2, color: colors.foreground },
  signOut: { minHeight: MIN_TAP, justifyContent: "center" },
  signOutText: { ...type.label, color: colors.muted },
  consent: {
    margin: space.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    gap: space.md,
  },
  consentText: { ...type.small, color: colors.muted },
  consentButtons: { flexDirection: "row", gap: space.sm, justifyContent: "flex-end" },
  consentGhost: {
    minHeight: MIN_TAP,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.foreground,
  },
  consentGhostText: { ...type.label, color: colors.foreground },
  consentPrimary: {
    minHeight: MIN_TAP,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  consentPrimaryText: { ...type.label, color: colors.onAccent },
  list: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  listHeader: { paddingVertical: space.lg },
  eyebrow: { ...type.label, color: colors.muted, marginBottom: space.xs },
  title: { ...type.h1, color: colors.foreground },
  row: { gap: space.md, marginBottom: space.xl },
  empty: { ...type.small, color: colors.muted, textAlign: "center", paddingVertical: space.xxl },
});
