import { useMemo, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";
import { currencySymbol, rankProducts, type Product } from "@/lib/products";
import { useCatalog } from "@/lib/catalog";
import { trackProductEvent } from "@/lib/track";
import { ErrorState } from "@/components/ErrorState";
import { t } from "@/lib/i18n";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

/**
 * The full-screen swipe feed. One product fills the screen; snap paging makes
 * each flick land on exactly one card.
 *
 * Ordered by the user's quiz answers, like Search. It used to ignore them on
 * purpose ("pure discovery"), but that left the quiz with no visible effect
 * anywhere, which made the promise on the quiz card untrue.
 */
function ExploreCard({ product, height }: { product: Product; height: number }) {
  const router = useRouter();
  const { isSaved, toggleSave } = useCatalog();
  const [skipped, setSkipped] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const liked = isSaved(product.id);
  // The URL itself, not a boolean: `a && b` yields b, so the old form left
  // TypeScript with `true` where an image source was needed.
  const photoUrl = imageFailed ? null : product.imageUrl;

  const skip = () => {
    setSkipped(true);
    void trackProductEvent({
      productId: product.id,
      retailerId: product.retailerId,
      signalType: "ignore",
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
      <Pressable
        onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id } })}
        style={styles.imagePress}
        accessibilityRole="button"
        accessibilityLabel={t("card.open", { name: product.name, retailer: product.retailer })}
      >
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.image}
            contentFit="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>{product.category}</Text>
          </View>
        )}
      </Pressable>

      <View style={styles.overlay} pointerEvents="box-none">
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
              <Text style={styles.shopButtonText}>{t("explore.shop")}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={skip}
            style={[styles.action, skipped && styles.actionSkipOn]}
            accessibilityLabel={t("explore.skip")}
          >
            <Text style={[styles.actionIcon, skipped && styles.actionIconSkipOn]}>✕</Text>
          </Pressable>
          <Pressable
            onPress={() => void toggleSave(product, "explore")}
            style={[styles.action, liked && styles.actionLikeOn]}
            accessibilityLabel={liked ? t("card.unsave") : t("explore.like")}
          >
            <Text style={styles.actionIcon}>♥</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function Explore() {
  const { products, answers, error, reload } = useCatalog();
  const [height, setHeight] = useState(Dimensions.get("window").height);

  const ranked = useMemo(() => (products ? rankProducts(products, answers) : []), [products, answers]);

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

  if (ranked.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.empty}>{t("explore.empty")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safe} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      <FlatList
        data={ranked}
        keyExtractor={(p) => p.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        decelerationRate="fast"
        // Full-screen images: without this the list mounts every card in the
        // catalog and holds each one's photo in memory.
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={3}
        removeClippedSubviews
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
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
  imagePress: { width: "100%", height: "100%" },
  image: { width: "100%", height: "100%" },
  placeholder: { backgroundColor: "#222", alignItems: "center", justifyContent: "center" },
  placeholderText: { ...type.label, color: "rgba(255,255,255,0.5)" },

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
