import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { currencySymbol, getProducts, rankProducts, type Product } from "@/lib/products";
import { trackProductEvent } from "@/lib/track";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

/**
 * The full-screen swipe feed, ported from the website's /explore. One product
 * fills the screen; snap paging makes each flick land on exactly one card,
 * which is what made it feel like a feed rather than a long scroll.
 */
function ExploreCard({ product, height }: { product: Product; height: number }) {
  const [decision, setDecision] = useState<"liked" | "skipped" | null>(null);

  const decide = (kind: "liked" | "skipped") => {
    setDecision(kind);
    void trackProductEvent({
      productId: product.id,
      retailerId: product.retailerId,
      signalType: kind === "liked" ? "save" : "ignore",
      placement: "explore",
    });
  };

  const open = async () => {
    if (!product.productUrl) return;
    void trackProductEvent({
      productId: product.id,
      retailerId: product.retailerId,
      signalType: "click",
      placement: "explore",
      linkUrl: product.productUrl,
    });
    await WebBrowser.openBrowserAsync(product.productUrl);
  };

  return (
    <View style={[styles.card, { height }]}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]} />
      )}

      <View style={styles.overlay}>
        <View style={styles.info}>
          <Text style={styles.brand}>{product.retailer}</Text>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.price}>
            {currencySymbol(product.currency)}
            {product.price}
          </Text>
          {product.productUrl && (
            <Pressable onPress={open} style={styles.shopButton}>
              <Text style={styles.shopButtonText}>Shop this</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => decide("skipped")}
            style={[styles.action, decision === "skipped" && styles.actionSkipOn]}
            accessibilityLabel="Skip"
          >
            <Text style={[styles.actionIcon, decision === "skipped" && styles.actionIconSkipOn]}>✕</Text>
          </Pressable>
          <Pressable
            onPress={() => decide("liked")}
            style={[styles.action, decision === "liked" && styles.actionLikeOn]}
            accessibilityLabel="Like"
          >
            <Text style={styles.actionIcon}>♥</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function Explore() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [height, setHeight] = useState(Dimensions.get("window").height);

  useEffect(() => {
    void getProducts()
      // No quiz answers here on purpose — pure discovery. rankProducts still
      // diversifies by retailer rather than leaving an arbitrary order.
      .then((all) => setProducts(rankProducts(all, { swipeTags: [], occasions: [] })))
      .catch(() => setProducts([]));
  }, []);

  if (products === null) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.foreground} />
      </SafeAreaView>
    );
  }

  if (products.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.empty}>Nothing to explore yet.</Text>
      </SafeAreaView>
    );
  }

  return (
    <View
      style={styles.safe}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        renderItem={({ item }) => <ExploreCard product={item} height={height} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.foreground },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  empty: { ...type.small, color: colors.muted },

  card: { width: "100%", backgroundColor: colors.foreground },
  image: { width: "100%", height: "100%" },
  placeholder: { backgroundColor: "#222" },

  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: space.md,
    padding: space.xl,
    paddingBottom: space.xxl,
    backgroundColor: "rgba(0,0,0,0.82)",
  },
  info: { flex: 1, gap: space.xs },
  brand: { ...type.label, color: "rgba(255,255,255,0.7)" },
  name: { ...type.h2, color: colors.onAccent },
  price: { ...type.price, color: colors.onAccent },
  shopButton: {
    alignSelf: "flex-start",
    minHeight: MIN_TAP,
    justifyContent: "center",
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.onAccent,
    marginTop: space.md,
  },
  shopButtonText: { ...type.label, color: colors.foreground },

  actions: { gap: space.md },
  action: {
    width: MIN_TAP,
    height: MIN_TAP,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionSkipOn: { backgroundColor: colors.onAccent, borderColor: colors.onAccent },
  actionLikeOn: { backgroundColor: "#DC2626", borderColor: "#DC2626" },
  actionIcon: { color: colors.onAccent, fontSize: 18 },
  actionIconSkipOn: { color: colors.foreground },
});
