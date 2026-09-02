import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import type { Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { assignToColumns, DEFAULT_ASPECT_RATIO } from "@/lib/masonry";
import { space } from "@/lib/theme";

/**
 * Three columns, each photo in its own proportions — the interlocking feed a
 * clothing app wants rather than a uniform grid of cropped squares.
 *
 * Cards go into whichever column is currently shortest, which is what stops the
 * three from drifting apart. That needs each photo's height, and a photo's
 * height isn't known until it loads: every card starts at 3:4 and reports its
 * real shape via `onAspectRatio`. Columns rebalance once as the first screenful
 * arrives, then stay put — the images are cached from then on.
 *
 * Rendered in a ScrollView, not a FlatList: a virtualised list assumes one
 * column of predictable rows, which is exactly what this isn't. Instead the
 * feed grows in pages as the user nears the bottom, so a 400-product catalog
 * never mounts at once.
 */

const COLUMNS = 3;
const PAGE_SIZE = 30;
/** How close to the bottom, in points, before the next page loads. */
const LOAD_AHEAD = 600;

export function MasonryFeed({
  products,
  placement = "explore",
  header,
  empty,
}: {
  products: Product[];
  placement?: "feed" | "explore" | "product_card";
  header?: React.ReactElement;
  empty?: React.ReactElement;
}) {
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const noteRatio = useCallback((productId: string, ratio: number) => {
    setRatios((prev) => (prev[productId] === ratio ? prev : { ...prev, [productId]: ratio }));
  }, []);

  const visible = useMemo(() => products.slice(0, visibleCount), [products, visibleCount]);

  const columns = useMemo(
    () => assignToColumns(visible, ratios, COLUMNS),
    [visible, ratios]
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (visibleCount >= products.length) return;
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const fromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (fromBottom < LOAD_AHEAD) {
      setVisibleCount((count) => Math.min(count + PAGE_SIZE, products.length));
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      onScroll={onScroll}
      scrollEventThrottle={200}
      keyboardShouldPersistTaps="handled"
    >
      {header}
      {products.length === 0
        ? empty
        : (
          <View style={styles.row}>
            {columns.map((column, i) => (
              <View key={i} style={styles.column}>
                {column.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    placement={placement}
                    aspectRatio={ratios[product.id] ?? DEFAULT_ASPECT_RATIO}
                    onAspectRatio={noteRatio}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xxl },
  row: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
  column: { flex: 1, gap: space.lg },
});
