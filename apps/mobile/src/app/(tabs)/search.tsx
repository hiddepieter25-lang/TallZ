import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { applyCatalogFilters, rankProducts, type CatalogFilters } from "@/lib/products";
import { useCatalog } from "@/lib/catalog";
import { t, tCount, type MessageKey } from "@/lib/i18n";
import { MasonryFeed } from "@/components/MasonryFeed";
import { ErrorState } from "@/components/ErrorState";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

const CHIPS: { label: MessageKey; filters: CatalogFilters }[] = [
  { label: "chip.inseam36", filters: { minInseamCm: 91 } },
  { label: "chip.inseam38", filters: { minInseamCm: 97 } },
  { label: "chip.sleeve37", filters: { minSleeveCm: 94 } },
  { label: "chip.men", filters: { gender: "men" } },
  { label: "chip.women", filters: { gender: "women" } },
  { label: "chip.eu", filters: { euOnly: true } },
];

/**
 * The whole catalog, searchable and filterable, ordered by the user's quiz
 * answers, and laid out as a three-column masonry feed — photos in their own
 * proportions rather than cropped to a uniform grid.
 */
export default function Search() {
  const { products, answers, hasAnswers, error, reload } = useCatalog();
  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState<number | null>(null);

  const results = useMemo(() => {
    if (!products) return [];
    const filtered =
      activeChip === null ? products : applyCatalogFilters(products, CHIPS[activeChip].filters);
    const q = query.trim().toLowerCase();
    const matched = q
      ? filtered.filter(
          (p) => p.name.toLowerCase().includes(q) || p.retailer.toLowerCase().includes(q)
        )
      : filtered;
    // Ranking runs after filtering, so a filter narrows and the quiz orders —
    // never the other way round.
    return rankProducts(matched, answers);
  }, [products, query, activeChip, answers]);

  if (products === null) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.foreground} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <ErrorState message={error} onRetry={reload} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <View style={styles.head}>
        <Text style={styles.eyebrow}>{t("search.eyebrow")}</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("search.placeholder")}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.input}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CHIPS.map((chip, i) => {
            const active = activeChip === i;
            return (
              <Pressable
                key={chip.label}
                onPress={() => setActiveChip(active ? null : i)}
                style={[styles.chip, active && styles.chipOn]}
              >
                <Text style={[styles.chipText, active && styles.chipTextOn]}>{t(chip.label)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={styles.count}>
          {tCount("search.count", results.length)}
          {hasAnswers ? ` · ${t("search.personalised")}` : ""}
        </Text>
      </View>

      <MasonryFeed
        products={results}
        placement="explore"
        empty={
          <Text style={styles.empty}>
            {query || activeChip !== null ? t("search.emptyFiltered") : t("search.empty")}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  head: { paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.md },
  eyebrow: { ...type.label, color: colors.muted },
  input: {
    ...type.body,
    height: 52,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: colors.foreground,
    borderRadius: radius.pill,
    color: colors.foreground,
  },
  chips: { gap: space.sm, paddingVertical: space.xs },
  chip: {
    minHeight: MIN_TAP - 8,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.foreground,
  },
  chipOn: { backgroundColor: colors.foreground },
  chipText: { ...type.label, color: colors.foreground },
  chipTextOn: { color: colors.onAccent },
  count: { ...type.label, color: colors.muted, marginBottom: space.sm },
  empty: { ...type.small, color: colors.muted, textAlign: "center", paddingVertical: space.xxl },
});
