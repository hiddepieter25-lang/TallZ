import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { currencySymbol, type Product } from "@/lib/products";
import { useCatalog } from "@/lib/catalog";
import { trackProductEvent, type Placement } from "@/lib/track";
import { t } from "@/lib/i18n";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

const BOTTOMS_CATEGORIES = new Set(["Trousers", "Denim", "Cargo", "Activewear"]);

export function fitLine(product: Product): string | null {
  if (BOTTOMS_CATEGORIES.has(product.category)) {
    return product.inseamCm ? t("fit.inseam", { cm: product.inseamCm }) : null;
  }
  const parts: string[] = [];
  if (product.sleeveCm) parts.push(t("fit.sleeve", { cm: product.sleeveCm }));
  if (product.bodyLengthCm) parts.push(t("fit.body", { cm: product.bodyLengthCm }));
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
  const router = useRouter();
  const { isSaved, toggleSave } = useCatalog();
  // A photo that exists but fails to load used to leave a blank tile. Now it
  // falls through to the same category placeholder as a missing photo.
  const [imageFailed, setImageFailed] = useState(false);
  const saved = isSaved(product.id);
  const fit = fitLine(product);
  // The URL itself, not a boolean: `a && b` yields b, so the old form left
  // TypeScript with `true` where an image source was needed.
  const photoUrl = imageFailed ? null : product.imageUrl;

  // Tapping a card opens the product inside the app, not the retailer. The
  // retailer link lives on the detail screen, so a curious tap is no longer
  // counted as a click — which was inflating the popularity score.
  const openDetail = () => {
    void trackProductEvent({
      productId: product.id,
      retailerId: product.retailerId,
      signalType: "impression",
      placement,
    });
    router.push({ pathname: "/product/[id]", params: { id: product.id } });
  };

  // The card and the heart are siblings, not nested. A Pressable inside a
  // Pressable leaves it ambiguous which one a tap belongs to, and on web it
  // renders a <button> inside a <button>, which is invalid HTML.
  return (
    <View style={styles.card}>
      <Pressable
        onPress={openDetail}
        style={({ pressed }) => (pressed ? styles.pressed : null)}
        accessibilityRole="button"
        accessibilityLabel={t("card.open", { name: product.name, retailer: product.retailer })}
      >
        <View style={styles.imageWrap}>
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.image}
              contentFit="cover"
              transition={150}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text style={styles.placeholderText}>{product.category}</Text>
            </View>
          )}

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

      <Pressable
        onPress={() => void toggleSave(product, placement)}
        hitSlop={10}
        style={[styles.heart, saved && styles.heartOn]}
        accessibilityRole="button"
        accessibilityLabel={saved ? t("card.unsave") : t("card.save")}
      >
        <Text style={[styles.heartIcon, saved && styles.heartIconOn]}>♥</Text>
      </Pressable>
    </View>
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
  placeholder: { backgroundColor: colors.line, alignItems: "center", justifyContent: "center" },
  placeholderText: { ...type.label, color: colors.muted },
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
