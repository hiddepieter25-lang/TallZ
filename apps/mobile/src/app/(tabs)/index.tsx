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
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLatestOnboardingResponse, getProducts, rankProducts, type Product } from "@/lib/products";
import { getConsent, setConsent } from "@/lib/consent";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/ProductCard";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

/**
 * Home is the feed. A shopping app has to show product within a thumb's reach
 * of opening — the website's tall hero (giant headline, full-bleed logo card,
 * statement band) cost three screens of scrolling before a single item, so it
 * is deliberately not ported. What's left is a slim bar and the grid.
 */
export default function Home() {
  const router = useRouter();
  const { session } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [showQuizPrompt, setShowQuizPrompt] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const all = await getProducts();
      // Everything, not a teaser slice. rankProducts tiers by score and
      // round-robins retailers within each tier, photos first — so the whole
      // catalog is here with the strongest items at the top.
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

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    void getLatestOnboardingResponse(supabase, userId).then((saved) => setShowQuizPrompt(!saved));
  }, [session]);

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
      <View style={styles.bar}>
        <Text style={styles.wordmark}>TallZ</Text>
        <Text style={styles.count}>{products.length} items</Text>
      </View>

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
        // Keeps memory sane over a few hundred cards without the user noticing.
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={
          needsConsent || showQuizPrompt ? (
            <View style={styles.prompts}>
              {needsConsent && (
                <View style={styles.card}>
                  <Text style={styles.cardText}>
                    May we log which products you view and tap, to improve your feed? Links to shops
                    work either way.
                  </Text>
                  <View style={styles.cardActions}>
                    <Pressable onPress={() => choose("essential")} style={styles.ghost}>
                      <Text style={styles.ghostText}>No thanks</Text>
                    </Pressable>
                    <Pressable onPress={() => choose("all")} style={styles.primary}>
                      <Text style={styles.primaryText}>Allow</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {showQuizPrompt && (
                <Pressable style={styles.card} onPress={() => router.push("/onboarding")}>
                  <Text style={styles.cardTitle}>Make this feed yours</Text>
                  <Text style={styles.cardText}>
                    Six quick questions about your height and taste, and the order changes to match.
                  </Text>
                  <View style={styles.cardActions}>
                    <View style={styles.primary}>
                      <Text style={styles.primaryText}>Start</Text>
                    </View>
                  </View>
                </Pressable>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={<Text style={styles.empty}>{error ?? "Nothing here yet."}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },

  bar: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  wordmark: { ...type.h2, color: colors.foreground },
  count: { ...type.label, color: colors.muted },

  list: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xxl },
  row: { gap: space.md, marginBottom: space.xl },

  prompts: { gap: space.md, marginBottom: space.xl },
  card: {
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    gap: space.sm,
  },
  cardTitle: { ...type.h2, color: colors.foreground },
  cardText: { ...type.small, color: colors.muted },
  cardActions: { flexDirection: "row", gap: space.sm, justifyContent: "flex-end", marginTop: space.xs },
  ghost: {
    minHeight: MIN_TAP,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.foreground,
  },
  ghostText: { ...type.label, color: colors.foreground },
  primary: {
    minHeight: MIN_TAP,
    justifyContent: "center",
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  primaryText: { ...type.label, color: colors.onAccent },

  empty: { ...type.small, color: colors.muted, textAlign: "center", paddingVertical: space.xxl },
});
