import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { applyCatalogFilters, getProducts, type CatalogFilters, type Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

/** The same quick filters the website put under its search box. */
const CHIPS: { label: string; filters: CatalogFilters }[] = [
  { label: '34" inseam', filters: { minInseamCm: 86 } },
  { label: '36" inseam', filters: { minInseamCm: 91 } },
  { label: '38" inseam', filters: { minInseamCm: 97 } },
  { label: 'Long sleeve 37"', filters: { minSleeveCm: 94 } },
  { label: "Men", filters: { gender: "men" } },
  { label: "Women", filters: { gender: "women" } },
  { label: "EU retailers", filters: { euOnly: true } },
];

export default function Search() {
  const [all, setAll] = useState<Product[] | null>(null);
  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState<number | null>(null);

  useEffect(() => {
    void getProducts()
      .then(setAll)
      .catch(() => setAll([]));
  }, []);

  const results = useMemo(() => {
    if (!all) return [];
    const filtered =
      activeChip === null ? all : applyCatalogFilters(all, CHIPS[activeChip].filters);
    const q = query.trim().toLowerCase();
    if (!q) return filtered;
    return filtered.filter(
      (p) => p.name.toLowerCase().includes(q) || p.retailer.toLowerCase().includes(q)
    );
  }, [all, query, activeChip]);

  if (all === null) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.foreground} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <View style={styles.head}>
        <Text style={styles.eyebrow}>find your fit</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Trousers, 36 inseam, black"
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
                <Text style={[styles.chipText, active && styles.chipTextOn]}>{chip.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={styles.count}>
          {results.length} {results.length === 1 ? "item" : "items"}
        </Text>
      </View>

      <FlatList
        data={results}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <ProductCard product={item} placement="explore" />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {query || activeChip !== null
              ? "Nothing matches that. Try a different word or filter."
              : "Start typing, or pick a filter."}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  head: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: space.md,
  },
  eyebrow: { ...type.label, color: colors.muted },
  input: {
    ...type.body,
    height: 48,
    paddingHorizontal: space.lg,
    borderWidth: 1,
    borderColor: colors.foreground,
    borderRadius: radius.pill,
    color: colors.foreground,
  },
  chips: { gap: space.sm, paddingRight: space.lg },
  chip: {
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.foreground,
  },
  chipOn: { backgroundColor: colors.accent },
  chipText: { ...type.label, fontSize: 10, color: colors.foreground },
  chipTextOn: { color: colors.onAccent },
  count: { ...type.label, color: colors.muted },
  list: { paddingHorizontal: space.lg, paddingTop: space.xl, paddingBottom: space.xxl },
  row: { gap: space.md, marginBottom: space.xl },
  empty: { ...type.small, color: colors.muted, textAlign: "center", paddingVertical: space.xxl },
});
