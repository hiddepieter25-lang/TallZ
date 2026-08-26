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
 * Home carries the brand and the catalog at once.
 *
 * Two failed attempts got us here, both worth not repeating: the website's
 * homepage ported literally cost roughly three screens of scrolling before a
 * single product; stripping it back to a bare grid lost the identity
 * entirely. What's here is the compromise — the logo and one headline in a
 * fixed header of about 170pt, then product. The statement line sits at the
 * bottom of the feed instead of blocking the top of it.
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
      {/* The real TallZ lockup, at native height so it stays crisp. */}
      <View style={styles.bar}>
        <Image source={require("../../../assets/tallz-logo.png")} style={styles.logo} contentFit="contain" />
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
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>for women 173cm+ / men 183cm+</Text>
            <Text style={styles.hero}>Your closet.{"\n"}One tap from yours.</Text>

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

            <View style={styles.sectionHead}>
              <Text style={styles.eyebrow}>just landed</Text>
            </View>
          </View>
        }
        ListFooterComponent={
          products.length > 0 ? (
            <View style={styles.statement}>
              <Image
                source={require("../../../assets/tallz-mark.png")}
                style={styles.statementMark}
                contentFit="contain"
                tintColor={colors.onAccent}
              />
              <Text style={styles.statementEyebrow}>the fit problem</Text>
              <Text style={styles.statementText}>
                Cheap fashion shouldn&apos;t mean settling for a hem that stops an inch too soon.
              </Text>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  logo: { width: 96, height: 47 },
  count: { ...type.label, color: colors.muted },

  list: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: 0 },
  row: { gap: space.md, marginBottom: space.xl },

  eyebrow: { ...type.label, color: colors.muted },
  hero: { ...type.h1, color: colors.foreground, marginTop: space.sm },

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

  sectionHead: { marginTop: space.xl, marginBottom: space.lg },

  // Full-bleed inside a padded list: negative margins cancel the list padding.
  statement: {
    marginHorizontal: -space.lg,
    paddingHorizontal: space.xl,
    paddingVertical: space.xxl,
    backgroundColor: colors.foreground,
    alignItems: "flex-start",
    gap: space.sm,
  },
  statementMark: { width: 64, height: 64, marginBottom: space.md },
  statementEyebrow: { ...type.label, color: "rgba(255,255,255,0.6)" },
  statementText: { ...type.h2, color: colors.onAccent },

  empty: { ...type.small, color: colors.muted, textAlign: "center", paddingVertical: space.xxl },
});
