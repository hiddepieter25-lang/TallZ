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
import {
  diversifyByRetailer,
  getLatestOnboardingResponse,
  getProducts,
  type Product,
} from "@/lib/products";
import { getConsent, setConsent } from "@/lib/consent";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/ProductCard";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

const RECENT_WINDOW = 24;

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
      // Same shop-window rule as the website: recent, actually photographed,
      // and round-robined across retailers so one brand can't fill the grid.
      setProducts(
        diversifyByRetailer(
          all
            .filter((p) => p.imageUrl)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, RECENT_WINDOW)
        )
      );
    } catch {
      setError("Couldn't load products. Pull down to try again.");
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    void load();
    void getConsent().then((c) => setNeedsConsent(c === null));
  }, [load]);

  // The quiz prompt only shows for a signed-in user who hasn't answered yet,
  // and disappears for good once they have — same rule as the website.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    void getLatestOnboardingResponse(supabase, userId).then((saved) => {
      setShowQuizPrompt(!saved);
    });
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
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>for women 173cm+ / men 183cm+</Text>
            <Text style={styles.hero}>
              Your closet.{"\n"}One tap{"\n"}from yours.
            </Text>

            {/* The logo mark on a black card — the site's hero, adapted. Held
                at its native 256px so it never upscales into softness. */}
            <View style={styles.heroCard}>
              <Image
                source={require("../../../assets/icon.png")}
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
              <View style={styles.consent}>
                <Text style={styles.consentText}>
                  May we log which products you view and tap, to improve your feed? Links to shops
                  work either way.
                </Text>
                <View style={styles.consentButtons}>
                  <Pressable onPress={() => choose("essential")} style={styles.ghostButton}>
                    <Text style={styles.ghostButtonText}>No thanks</Text>
                  </Pressable>
                  <Pressable onPress={() => choose("all")} style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>Allow</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {showQuizPrompt && (
              <Pressable style={styles.quiz} onPress={() => router.push("/onboarding")}>
                <Text style={styles.quizEyebrow}>build your closet</Text>
                <Text style={styles.quizTitle}>
                  answer a few questions.{"\n"}get a feed made for your height.
                </Text>
                <View style={styles.quizCta}>
                  <Text style={styles.primaryButtonText}>Get started</Text>
                </View>
              </Pressable>
            )}

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
  list: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  eyebrow: { ...type.label, color: colors.muted },
  hero: { ...type.hero, color: colors.foreground, marginTop: space.md },

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

  statement: {
    marginTop: space.xl,
    marginHorizontal: -space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.xxl,
    backgroundColor: colors.foreground,
  },
  statementEyebrow: { ...type.label, color: "rgba(255,255,255,0.6)" },
  statementText: { ...type.h1, color: colors.onAccent, marginTop: space.md },

  consent: {
    marginTop: space.xl,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.card,
    gap: space.md,
  },
  consentText: { ...type.small, color: colors.muted },
  consentButtons: { flexDirection: "row", gap: space.sm, justifyContent: "flex-end" },

  ghostButton: {
    minHeight: MIN_TAP,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.foreground,
  },
  ghostButtonText: { ...type.label, color: colors.foreground },
  primaryButton: {
    minHeight: MIN_TAP,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  primaryButtonText: { ...type.label, color: colors.onAccent },

  quiz: {
    marginTop: space.xl,
    paddingVertical: space.xl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    gap: space.md,
  },
  quizEyebrow: { ...type.label, color: colors.muted },
  quizTitle: { ...type.h2, color: colors.foreground },
  quizCta: {
    alignSelf: "flex-start",
    minHeight: MIN_TAP,
    justifyContent: "center",
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    marginTop: space.xs,
  },

  sectionHead: {
    marginTop: space.xxl,
    paddingBottom: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    marginBottom: space.xl,
    gap: space.xs,
  },
  sectionTitle: { ...type.h1, color: colors.foreground },

  row: { gap: space.md, marginBottom: space.xl },
  empty: { ...type.small, color: colors.muted, textAlign: "center", paddingVertical: space.xxl },
});
