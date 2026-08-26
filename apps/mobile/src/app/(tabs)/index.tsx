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
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getLatestOnboardingResponse, getProducts, rankProducts, type Product } from "@/lib/products";
import { getConsent, setConsent } from "@/lib/consent";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/ProductCard";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

/**
 * Home opens with the introduction — the website's hero, brought across in
 * full: headline, the logo mark on a black card, and the statement band.
 * The whole catalog follows underneath.
 *
 * History worth keeping, because this screen has moved three times: the
 * intro was stripped once when the feed was showing only 24 of 255 products
 * and the page read as empty. The emptiness was the actual fault (an
 * anon-only RLS policy plus a teaser slice), not the intro — so the intro is
 * back by request, with the full catalog beneath it.
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
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={
          <View>
            {/* ---- Introduction ---- */}
            <Image
              source={require("../../../assets/tallz-logo.png")}
              style={styles.logo}
              contentFit="contain"
            />

            <Text style={styles.eyebrow}>for women 173cm+ / men 183cm+</Text>
            <Text style={styles.hero}>
              Your closet.{"\n"}One tap{"\n"}from yours.
            </Text>
            <Text style={styles.lede}>
              Affordable tall-fit finds from {products.length} pieces, curated like a feed you&apos;d
              actually want to scroll. Tap through and check out on the seller&apos;s own site —
              TallZ just makes the match.
            </Text>

            {/* The mark held at its native 256px so it never upscales. */}
            <View style={styles.heroCard}>
              <Image
                source={require("../../../assets/tallz-mark.png")}
                style={styles.heroMark}
                contentFit="contain"
                tintColor={colors.onAccent}
              />
              <Text style={styles.heroCaption}>Cut long, worn well</Text>
            </View>

            <View style={styles.statement}>
              <Text style={styles.statementEyebrow}>the fit problem</Text>
              <Text style={styles.statementText}>
                Cheap fashion shouldn&apos;t mean settling for a hem that stops an inch too soon.
              </Text>
            </View>

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

            {/* ---- Catalog ---- */}
            <View style={styles.sectionHead}>
              <Text style={styles.eyebrow}>just landed</Text>
              <Text style={styles.sectionTitle}>The newest finds</Text>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{error ?? "Nothing here yet."}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },

  list: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xxl },
  row: { gap: space.md, marginBottom: space.xl },

  logo: { width: 110, height: 54, marginBottom: space.xl },
  eyebrow: { ...type.label, color: colors.muted },
  hero: { ...type.hero, color: colors.foreground, marginTop: space.md },
  lede: { ...type.body, color: colors.muted, marginTop: space.lg },

  heroCard: {
    marginTop: space.xl,
    aspectRatio: 3 / 4,
    borderRadius: 24,
    backgroundColor: colors.foreground,
    alignItems: "center",
    justifyContent: "center",
  },
  heroMark: { width: "58%", maxWidth: 256, aspectRatio: 1 },
  heroCaption: {
    ...type.label,
    color: "rgba(255,255,255,0.7)",
    position: "absolute",
    bottom: space.xl,
    left: space.xl,
  },

  // Full-bleed inside a padded list: negative margins cancel the list padding.
  statement: {
    marginTop: space.xl,
    marginHorizontal: -space.lg,
    paddingHorizontal: space.xl,
    paddingVertical: space.xxl,
    backgroundColor: colors.foreground,
    gap: space.md,
  },
  statementEyebrow: { ...type.label, color: "rgba(255,255,255,0.6)" },
  statementText: { ...type.h1, color: colors.onAccent },

  card: {
    marginTop: space.xl,
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

  sectionHead: {
    marginTop: space.xxl,
    paddingBottom: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    marginBottom: space.xl,
    gap: space.xs,
  },
  sectionTitle: { ...type.h1, color: colors.foreground },

  empty: { ...type.small, color: colors.muted, textAlign: "center", paddingVertical: space.xxl },
});
