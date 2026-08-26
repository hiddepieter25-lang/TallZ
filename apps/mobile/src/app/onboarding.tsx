import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  BUDGET_BANDS,
  FIT_PREFERENCES,
  OCCASION_TAGS,
  PROPORTIONS,
  getLatestOnboardingResponse,
  getSwipeDeckProducts,
  type BudgetBand,
  type FitPreference,
  type OccasionTag,
  type Product,
  type Proportion,
  type StyleTag,
} from "@/lib/products";
import { supabase } from "@/lib/supabase";
import { trackProductEvent } from "@/lib/track";
import { useAuth } from "@/lib/auth";
import { colors, radius, space, type, MIN_TAP } from "@/lib/theme";

const HEIGHT_RANGES = ["173–178cm", "179–184cm", "185–190cm", "191–196cm", "197cm+"];

function Choice({
  label,
  hint,
  selected,
  onPress,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.choice, selected && styles.choiceOn, pressed && styles.pressed]}
    >
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelOn]}>{label}</Text>
      {hint && <Text style={[styles.choiceHint, selected && styles.choiceHintOn]}>{hint}</Text>}
    </Pressable>
  );
}

/** The like/skip deck over real products — the richest taste signal in the quiz. */
function SwipeDeck({
  products,
  onComplete,
}: {
  products: Product[];
  onComplete: (tags: StyleTag[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<StyleTag[]>([]);

  if (products.length === 0) return <Text style={styles.muted}>No products to show yet.</Text>;
  if (index >= products.length) {
    return <Text style={styles.muted}>Thanks — that&apos;s enough to go on.</Text>;
  }

  const current = products[index];

  const decide = (isLike: boolean) => {
    const next = isLike ? [...liked, ...current.tags] : liked;
    if (isLike) setLiked(next);
    void trackProductEvent({
      productId: current.id,
      retailerId: current.retailerId,
      signalType: isLike ? "save" : "ignore",
      placement: "onboarding_swipe",
    });
    const nextIndex = index + 1;
    setIndex(nextIndex);
    if (nextIndex >= products.length) onComplete(next);
  };

  return (
    <View style={{ gap: space.md }}>
      <Text style={styles.muted}>
        {index + 1} / {products.length}
      </Text>
      <View style={styles.deckImageWrap}>
        {current.imageUrl ? (
          <Image source={{ uri: current.imageUrl }} style={styles.deckImage} contentFit="cover" />
        ) : (
          <View style={[styles.deckImage, { backgroundColor: colors.line }]} />
        )}
      </View>
      <Text style={styles.deckBrand}>{current.retailer}</Text>
      <Text style={styles.deckName} numberOfLines={2}>
        {current.name}
      </Text>
      <View style={styles.deckActions}>
        <Pressable onPress={() => decide(false)} style={styles.deckSkip} accessibilityLabel="Skip">
          <Text style={styles.deckSkipIcon}>✕</Text>
        </Pressable>
        <Pressable onPress={() => decide(true)} style={styles.deckLike} accessibilityLabel="Like">
          <Text style={styles.deckLikeIcon}>♥</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { session } = useAuth();

  const [step, setStep] = useState(0);
  const [height, setHeight] = useState<string | null>(null);
  const [proportion, setProportion] = useState<Proportion | null>(null);
  const [swipeProducts, setSwipeProducts] = useState<Product[] | null>(null);
  const [swipeTags, setSwipeTags] = useState<StyleTag[] | null>(null);
  const [occasions, setOccasions] = useState<OccasionTag[]>([]);
  const [fit, setFit] = useState<FitPreference | null>(null);
  const [budget, setBudget] = useState<BudgetBand | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getSwipeDeckProducts()
      .then((p) => {
        setSwipeProducts(p);
        if (p.length === 0) setSwipeTags([]); // nothing to swipe — don't block
      })
      .catch(() => {
        setSwipeProducts([]);
        setSwipeTags([]);
      });
  }, []);

  // Prefill so "change my answers" starts from what they picked before.
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    void getLatestOnboardingResponse(supabase, userId).then((saved) => {
      if (!saved) return;
      setHeight(saved.heightRange);
      setProportion(saved.proportion ?? null);
      setOccasions(saved.occasions);
      setFit(saved.fitPreference ?? null);
      setBudget(saved.budget ?? null);
      setSwipeTags(saved.swipeTags);
    });
  }, [session]);

  const toggleOccasion = (id: OccasionTag) =>
    setOccasions((prev) => (prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]));

  const finish = async () => {
    setSaving(true);
    setError(null);
    const userId = session?.user?.id;

    const { error: insertError } = await supabase.from("onboarding_responses").insert({
      height_range: height,
      styles: swipeTags ?? [],
      occasions,
      proportion,
      fit_preference: fit,
      budget,
      photo_path: null,
      user_id: userId ?? null,
    });

    setSaving(false);
    if (insertError) {
      setError("Couldn't save your answers. Please try again.");
      return;
    }
    router.replace("/");
  };

  const steps = [
    {
      label: "Your height",
      canContinue: !!height,
      content: (
        <View style={styles.stack}>
          {HEIGHT_RANGES.map((r) => (
            <Choice key={r} label={r} selected={height === r} onPress={() => setHeight(r)} />
          ))}
        </View>
      ),
    },
    {
      label: "Where's most of your height?",
      canContinue: !!proportion,
      content: (
        <View style={styles.stack}>
          {PROPORTIONS.map((p) => (
            <Choice
              key={p.id}
              label={p.label}
              hint={p.hint}
              selected={proportion === p.id}
              onPress={() => setProportion(p.id)}
            />
          ))}
        </View>
      ),
    },
    {
      label: "What catches your eye?",
      canContinue: swipeTags !== null,
      content:
        swipeProducts === null ? (
          <ActivityIndicator color={colors.foreground} />
        ) : (
          <SwipeDeck products={swipeProducts} onComplete={setSwipeTags} />
        ),
    },
    {
      label: "What are you shopping for?",
      canContinue: occasions.length > 0,
      content: (
        <View style={styles.wrap}>
          {OCCASION_TAGS.map((o) => (
            <Choice
              key={o.id}
              label={o.label}
              selected={occasions.includes(o.id)}
              onPress={() => toggleOccasion(o.id)}
            />
          ))}
        </View>
      ),
    },
    {
      label: "How do you like it to fit?",
      canContinue: !!fit,
      content: (
        <View style={styles.stack}>
          {FIT_PREFERENCES.map((f) => (
            <Choice key={f.id} label={f.label} selected={fit === f.id} onPress={() => setFit(f.id)} />
          ))}
        </View>
      ),
    },
    {
      label: "What's your budget, per item?",
      canContinue: !!budget,
      content: (
        <View style={styles.stack}>
          {BUDGET_BANDS.map((b) => (
            <Choice
              key={b.id}
              label={b.label}
              selected={budget === b.id}
              onPress={() => setBudget(b.id)}
            />
          ))}
        </View>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>
          {step + 1} / {steps.length}
        </Text>
        <Text style={styles.title}>{current.label}</Text>
        {current.content}
        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? (
          <Pressable onPress={() => setStep((s) => s - 1)} style={styles.back}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>Cancel</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => (isLast ? finish() : setStep((s) => s + 1))}
          disabled={!current.canContinue || saving}
          style={[styles.next, (!current.canContinue || saving) && styles.nextDisabled]}
        >
          {saving ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={styles.nextText}>{isLast ? "See my feed" : "Continue"}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xxl },
  eyebrow: { ...type.label, color: colors.muted },
  title: { ...type.h1, color: colors.foreground, marginTop: space.sm, marginBottom: space.xl },
  muted: { ...type.small, color: colors.muted },
  error: { ...type.small, color: colors.danger, marginTop: space.lg },

  stack: { gap: space.md },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: space.md },

  choice: {
    minHeight: MIN_TAP + 8,
    justifyContent: "center",
    paddingHorizontal: space.xl,
    paddingVertical: space.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  choiceOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  pressed: { opacity: 0.7 },
  choiceLabel: { ...type.body, color: colors.foreground },
  choiceLabelOn: { color: colors.onAccent },
  choiceHint: { ...type.small, color: colors.muted, marginTop: 2 },
  choiceHintOn: { color: "rgba(255,255,255,0.7)" },

  deckImageWrap: { aspectRatio: 3 / 4, borderRadius: radius.card, overflow: "hidden" },
  deckImage: { width: "100%", height: "100%" },
  deckBrand: { ...type.label, color: colors.muted },
  deckName: { ...type.body, color: colors.foreground },
  deckActions: { flexDirection: "row", justifyContent: "center", gap: space.xl, marginTop: space.md },
  deckSkip: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.foreground,
    alignItems: "center",
    justifyContent: "center",
  },
  deckSkipIcon: { fontSize: 20, color: colors.foreground },
  deckLike: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  deckLikeIcon: { fontSize: 20, color: colors.onAccent },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: space.md,
  },
  back: { minHeight: MIN_TAP, justifyContent: "center", paddingHorizontal: space.sm },
  backText: { ...type.label, color: colors.muted },
  next: {
    minHeight: MIN_TAP,
    justifyContent: "center",
    paddingHorizontal: space.xxl,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  nextDisabled: { opacity: 0.4 },
  nextText: { ...type.label, color: colors.onAccent },
});
