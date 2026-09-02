import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTopPicks, type Product } from "@/lib/products";
import { useCatalog } from "@/lib/catalog";
import { getConsent, setConsent } from "@/lib/consent";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/ProductCard";
import { ErrorState } from "@/components/ErrorState";
import { t } from "@/lib/i18n";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

/**
 * The introduction: what TallZ is, and — for a visitor without one yet — an
 * account.
 *
 * Deliberately not a tab and not the landing screen. A first visit opens here
 * because nothing is more useful to someone who has never seen the app; after
 * that the tab bar's logo is the way back, and signing in lands on Search.
 *
 * Four products, not the catalog. The whole catalog lived here once, which made
 * this a feed with an essay stapled on top rather than a shop window.
 */
export default function Home() {
  const router = useRouter();
  const { session } = useAuth();
  const { products, answers, hasAnswers, error, reload } = useCatalog();
  const [picks, setPicks] = useState<Product[] | null>(null);
  const [needsConsent, setNeedsConsent] = useState(false);

  useEffect(() => {
    void getConsent().then((c) => setNeedsConsent(c === null));
  }, []);

  // Picks need one extra call for the popularity scores; the products
  // themselves come from the shared catalog rather than a second fetch.
  useEffect(() => {
    if (!products) return;
    void getTopPicks(products, 3, answers).then(setPicks);
  }, [products, answers]);

  const choose = async (state: "all" | "essential") => {
    await setConsent(state);
    setNeedsConsent(false);
  };

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  if (products === null || picks === null) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.foreground} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <FlatList
        data={picks}
        keyExtractor={(p) => p.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ProductCard product={item} />}
        ListHeaderComponent={
          <View>
            <Image
              source={require("../../assets/tallz-logo.png")}
              style={styles.logo}
              contentFit="contain"
            />

            <Text style={styles.eyebrow}>{t("home.eyebrow")}</Text>
            <Text style={styles.hero}>{t("home.hero")}</Text>
            <Text style={styles.lede}>{t("home.lede", { count: products.length })}</Text>

            {/* The point of this screen for anyone who hasn't signed up. For
                anyone who has, the same slot is simply the way back in. */}
            {session ? (
              <Pressable style={styles.cta} onPress={() => router.replace("/search")}>
                <Text style={styles.ctaText}>{t("home.browse")}</Text>
              </Pressable>
            ) : (
              <View style={styles.ctaBlock}>
                <Pressable style={styles.cta} onPress={() => router.push("/signup")}>
                  <Text style={styles.ctaText}>{t("home.createAccount")}</Text>
                </Pressable>
                <View style={styles.ctaFooter}>
                  <Text style={styles.ctaFooterText}>{t("home.haveOne")}</Text>
                  <Link href="/login" style={styles.ctaLink}>
                    {t("home.login")}
                  </Link>
                </View>
              </View>
            )}

            {/* The mark held at its native 256px so it never upscales. */}
            <View style={styles.heroCard}>
              <Image
                source={require("../../assets/tallz-mark.png")}
                style={styles.heroMark}
                contentFit="contain"
                tintColor={colors.onAccent}
              />
              <Text style={styles.heroCaption}>{t("home.heroCaption")}</Text>
            </View>

            <View style={styles.statement}>
              <Text style={styles.statementEyebrow}>{t("home.statementEyebrow")}</Text>
              <Text style={styles.statementText}>{t("home.statement")}</Text>
            </View>

            {needsConsent && (
              <View style={styles.card}>
                <Text style={styles.cardText}>{t("home.consent")}</Text>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => choose("essential")} style={styles.ghost}>
                    <Text style={styles.ghostText}>{t("home.noThanks")}</Text>
                  </Pressable>
                  <Pressable onPress={() => choose("all")} style={styles.primary}>
                    <Text style={styles.primaryText}>{t("home.allow")}</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {session && !hasAnswers && (
              <Pressable style={styles.card} onPress={() => router.push("/onboarding")}>
                <Text style={styles.cardTitle}>{t("home.quizTitle")}</Text>
                <Text style={styles.cardText}>{t("home.quizBody")}</Text>
                <View style={styles.cardActions}>
                  <View style={styles.primary}>
                    <Text style={styles.primaryText}>{t("home.start")}</Text>
                  </View>
                </View>
              </Pressable>
            )}

            <View style={styles.sectionHead}>
              <View style={styles.sectionHeadRow}>
                <View style={styles.sectionHeadText}>
                  {/* Neutral on purpose. These are the most-tapped items once
                      there is enough traffic to mean it, and the newest arrivals
                      until then — so neither "just landed" nor "best sellers"
                      would stay true. */}
                  <Text style={styles.eyebrow}>{t("home.picksEyebrow")}</Text>
                  <Text style={styles.sectionTitle}>{t("home.picksTitle")}</Text>
                </View>
                <Link href="/search" style={styles.viewAll}>
                  {t("home.viewAll")}
                </Link>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>{t("home.empty")}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },

  list: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xxl },
  // Three across on a 390pt phone leaves each card narrow, so the gap tightens.
  row: { gap: space.sm, marginBottom: space.xl },

  logo: { width: 110, height: 54, marginBottom: space.xl },
  eyebrow: { ...type.label, color: colors.muted },
  hero: { ...type.hero, color: colors.foreground, marginTop: space.md },
  lede: { ...type.body, color: colors.muted, marginTop: space.lg },

  ctaBlock: { marginTop: space.xl, gap: space.md },
  cta: {
    marginTop: space.xl,
    minHeight: MIN_TAP,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { ...type.label, color: colors.onAccent },
  ctaFooter: { flexDirection: "row", justifyContent: "center" },
  ctaFooterText: { ...type.small, color: colors.muted },
  ctaLink: { ...type.small, color: colors.foreground, textDecorationLine: "underline" },

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
  },
  sectionHeadRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  sectionHeadText: { gap: space.xs, flexShrink: 1 },
  sectionTitle: { ...type.h1, color: colors.foreground },
  viewAll: { ...type.label, color: colors.foreground, paddingBottom: space.xs },

  empty: { ...type.small, color: colors.muted, textAlign: "center", paddingVertical: space.xxl },
});
