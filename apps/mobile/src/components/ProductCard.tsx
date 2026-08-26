import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { currencySymbol, type Product } from "@/lib/products";
import { trackProductClick, trackProductEvent, type Placement } from "@/lib/track";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

const BOTTOMS_CATEGORIES = new Set(["Trousers", "Denim", "Cargo", "Activewear"]);

function fitLine(product: Product): string | null {
  if (BOTTOMS_CATEGORIES.has(product.category)) {
    return product.inseamCm ? `${product.inseamCm}cm inseam` : null;
  }
  const parts: string[] = [];
  if (product.sleeveCm) parts.push(`${product.sleeveCm}cm sleeve`);
  if (product.bodyLengthCm) parts.push(`${product.bodyLengthCm}cm body`);
  return parts.length ? parts.join(" · ") : null;
}

export function ProductCard({
  product,
  placement = "feed",
}: {
  product: Product;
  /** Which surface the card is on — kept on every event so the admin analytics
   *  and the ranking signal can tell the home grid from search results. */
  placement?: Placement;
}) {
  const [saved, setSaved] = useState(false);
  const fit = fitLine(product);

  const toggleSave = () => {
    const next = !saved;
    setSaved(next);
    void trackProductEvent({
      productId: product.id,
      retailerId: product.retailerId,
      signalType: next ? "save" : "ignore",
      placement,
    });
  };

  // Opens inside the app rather than kicking the user out to Safari/Chrome —
  // they come back to their place in the feed when they close it.
  const openRetailer = async () => {
    if (!product.productUrl) return;
    trackProductClick({
      productId: product.id,
      retailerId: product.retailerId,
      linkUrl: product.productUrl,
      placement,
    });
    await WebBrowser.openBrowserAsync(product.productUrl);
  };

  return (
    <Pressable
      onPress={openRetailer}
      disabled={!product.productUrl}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${product.name} by ${product.retailer}. Opens the retailer's site.`}
    >
      <View style={styles.imageWrap}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[styles.image, styles.placeholder]} />
        )}

        <Pressable
          onPress={toggleSave}
          hitSlop={10}
          style={[styles.heart, saved && styles.heartOn]}
          accessibilityRole="button"
          accessibilityLabel={saved ? "Remove from saved" : "Save"}
        >
          <Text style={[styles.heartIcon, saved && styles.heartIconOn]}>♥</Text>
        </Pressable>

        {fit && (
          <View style={styles.fitBadge}>
            <Text style={styles.fitText}>{fit}</Text>
          </View>
        )}
      </View>

      <View style={styles.meta}>
        <Text style={styles.brand} numberOfLines={1}>
          {product.retailer}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>
          {currencySymbol(product.currency)}
          {product.price}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: "hidden",
  },
  pressed: { opacity: 0.7 },
  imageWrap: {
    aspectRatio: 3 / 4,
    borderRadius: radius.card,
    overflow: "hidden",
    backgroundColor: colors.line,
  },
  image: { width: "100%", height: "100%" },
  placeholder: { backgroundColor: colors.line },
  heart: {
    position: "absolute",
    top: space.sm,
    right: space.sm,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  heartOn: { backgroundColor: colors.accent },
  heartIcon: { color: colors.foreground, fontSize: 15, lineHeight: 18 },
  heartIconOn: { color: colors.onAccent },
  fitBadge: {
    position: "absolute",
    bottom: space.sm,
    left: space.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  fitText: { ...type.label, fontSize: 10, letterSpacing: 0.5, color: colors.onAccent },
  meta: { paddingTop: space.md, gap: 2, minHeight: MIN_TAP },
  brand: { ...type.label, color: colors.muted },
  name: { ...type.small, color: colors.foreground },
  price: { ...type.price, color: colors.foreground, marginTop: space.xs },
});
