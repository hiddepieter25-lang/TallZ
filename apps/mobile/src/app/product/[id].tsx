import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { currencySymbol } from "@/lib/products";
import { useCatalog } from "@/lib/catalog";
import { trackProductClick } from "@/lib/track";
import { fitLine } from "@/components/ProductCard";
import { t } from "@/lib/i18n";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

/**
 * The product screen.
 *
 * Tapping a card used to jump straight out to the retailer. That gave people
 * no way to look properly before leaving, and it counted every curious tap as
 * an outbound click — inflating the popularity score that now orders the home
 * page. The click is recorded here, on the button that actually leaves.
 */
export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { products, isSaved, toggleSave } = useCatalog();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const width = Dimensions.get("window").width;
  const product = useMemo(() => products?.find((p) => p.id === id) ?? null, [products, id]);

  if (products === null) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.foreground} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.notFound}>{t("product.notFound")}</Text>
        <Pressable onPress={() => router.back()} style={styles.ghost}>
          <Text style={styles.ghostText}>{t("common.back")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const saved = isSaved(product.id);
  const fit = fitLine(product);
  const photos = product.imageUrls.filter((url) => !failed[url]);

  const open = async () => {
    if (!product.productUrl) return;
    trackProductClick({
      productId: product.id,
      retailerId: product.retailerId,
      linkUrl: product.productUrl,
      placement: "product_card",
    });
    await WebBrowser.openBrowserAsync(product.productUrl);
  };

  const rows: { label: string; value: string }[] = [
    { label: t("product.fit"), value: product.fit },
    ...(product.material ? [{ label: t("product.material"), value: product.material }] : []),
    ...(product.color ? [{ label: t("product.color"), value: product.color }] : []),
    { label: t("product.category"), value: product.category },
    ...(product.shippingCountries.length
      ? [{ label: t("product.ships"), value: product.shippingCountries.join(", ") }]
      : []),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.ghost} accessibilityRole="button">
            <Text style={styles.ghostText}>{t("common.back")}</Text>
          </Pressable>
          <Pressable
            onPress={() => void toggleSave(product, "product_card")}
            style={[styles.heart, saved && styles.heartOn]}
            accessibilityRole="button"
            accessibilityLabel={saved ? t("card.unsave") : t("card.save")}
          >
            <Text style={[styles.heartIcon, saved && styles.heartIconOn]}>♥</Text>
          </Pressable>
        </View>

        {photos.length > 0 ? (
          <View>
            <FlatList
              data={photos}
              keyExtractor={(url) => url}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))
              }
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={[styles.photo, { width: width - space.lg * 2 }]}
                  contentFit="cover"
                  transition={150}
                  onError={() => setFailed((prev) => ({ ...prev, [item]: true }))}
                />
              )}
            />
            {photos.length > 1 && (
              <Text style={styles.photoCount}>
                {t("product.photoOf", { n: photoIndex + 1, total: photos.length })}
              </Text>
            )}
          </View>
        ) : (
          <View style={[styles.photo, styles.placeholder, { width: width - space.lg * 2 }]}>
            <Text style={styles.placeholderText}>{product.category}</Text>
          </View>
        )}

        <Text style={styles.brand}>{product.retailer}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>
          {currencySymbol(product.currency)}
          {product.price}
        </Text>
        {fit && <Text style={styles.fit}>{fit}</Text>}

        {product.productUrl ? (
          <Pressable onPress={open} style={styles.cta} accessibilityRole="button">
            <Text style={styles.ctaText}>{t("product.open", { retailer: product.retailer })}</Text>
          </Pressable>
        ) : (
          <Text style={styles.noLink}>{t("product.noLink")}</Text>
        )}

        <Text style={styles.sectionLabel}>{t("product.details")}</Text>
        <View style={styles.group}>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {product.fitNotes && <Text style={styles.notes}>{product.fitNotes}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space.lg,
    backgroundColor: colors.background,
  },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  notFound: { ...type.body, color: colors.muted, textAlign: "center", paddingHorizontal: space.xl },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: space.md,
  },
  ghost: {
    minHeight: MIN_TAP,
    justifyContent: "center",
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.foreground,
  },
  ghostText: { ...type.label, color: colors.foreground },
  heart: {
    width: MIN_TAP,
    height: MIN_TAP,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.foreground,
    alignItems: "center",
    justifyContent: "center",
  },
  heartOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  heartIcon: { color: colors.foreground, fontSize: 18 },
  heartIconOn: { color: colors.onAccent },

  photo: { aspectRatio: 3 / 4, borderRadius: radius.card, backgroundColor: colors.line },
  placeholder: { alignItems: "center", justifyContent: "center" },
  placeholderText: { ...type.label, color: colors.muted },
  photoCount: { ...type.label, color: colors.muted, textAlign: "center", marginTop: space.sm },

  brand: { ...type.label, color: colors.muted, marginTop: space.xl },
  name: { ...type.h1, color: colors.foreground, marginTop: space.xs },
  price: { ...type.price, color: colors.foreground, marginTop: space.md },
  fit: { ...type.small, color: colors.muted, marginTop: space.xs },

  cta: {
    minHeight: MIN_TAP,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space.xl,
  },
  ctaText: { ...type.label, color: colors.onAccent },
  noLink: { ...type.small, color: colors.muted, marginTop: space.xl },

  sectionLabel: { ...type.label, color: colors.muted, marginTop: space.xxl, marginBottom: space.sm },
  group: { borderTopWidth: 1, borderColor: colors.line },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLabel: { ...type.small, color: colors.muted },
  rowValue: { ...type.small, color: colors.foreground, flexShrink: 1, textAlign: "right" },
  notes: { ...type.small, color: colors.muted, marginTop: space.lg },
});
