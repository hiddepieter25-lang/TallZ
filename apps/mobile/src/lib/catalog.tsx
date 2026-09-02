import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  getLatestOnboardingResponse,
  getProducts,
  getSavedProductIds,
  saveProduct,
  unsaveProduct,
  type Product,
  type QuizAnswers,
  type SavedOnboarding,
} from "@/lib/products";
import { trackProductEvent, type Placement } from "@/lib/track";
import { t } from "@/lib/i18n";

/**
 * One catalog, shared by every screen.
 *
 * Before this, Search, Explore and Home each fetched all 346 products with
 * their images on every visit — three round trips for the same rows, redone on
 * every tab switch. It also meant the quiz answers had nowhere to live, so no
 * screen used them, and the heart had no state to read, so it saved nothing.
 *
 * Everything a screen needs to render the catalog now comes from here:
 * the products, the user's quiz answers, which products they have saved, and
 * whether the load failed — with one `reload` that retries all of it.
 */

const NO_ANSWERS: QuizAnswers = { swipeTags: [], occasions: [] };

interface CatalogValue {
  /** null while loading; [] after a failed load (see `error`). */
  products: Product[] | null;
  /** The user's saved quiz answers, or the empty set if they never took it. */
  answers: QuizAnswers;
  /** True once a saved onboarding row was found — drives the "take the quiz" prompt. */
  hasAnswers: boolean;
  /** The stored row itself, including heightRange, which ranking does not use. */
  savedOnboarding: SavedOnboarding | null;
  savedIds: Set<string>;
  isSaved: (productId: string) => boolean;
  toggleSave: (product: Product, placement: Placement) => Promise<void>;
  /** Set when the last load failed. Cleared by a successful `reload`. */
  error: string | null;
  reload: () => Promise<void>;
  /** Called after the quiz saves, so the ranking picks the new answers up at once. */
  refreshAnswers: () => Promise<void>;
}

const CatalogContext = createContext<CatalogValue | null>(null);

export function useCatalog(): CatalogValue {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used inside CatalogProvider");
  return value;
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [products, setProducts] = useState<Product[] | null>(null);
  const [saved, setSaved] = useState<SavedOnboarding | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const refreshAnswers = useCallback(async () => {
    if (!userId) {
      setSaved(null);
      return;
    }
    setSaved(await getLatestOnboardingResponse(supabase, userId));
  }, [userId]);

  const reload = useCallback(async () => {
    setError(null);
    try {
      // Products don't need a session; the other two do. Loaded together so
      // one failure is reported once, and a retry retries everything.
      const [all, ids] = await Promise.all([
        getProducts(),
        userId ? getSavedProductIds() : Promise.resolve(new Set<string>()),
      ]);
      setProducts(all);
      setSavedIds(ids);
      await refreshAnswers();
    } catch {
      // Left as [] rather than null so screens stop showing a spinner and show
      // the error instead. Previously this silently became an empty catalog.
      setProducts([]);
      setError(t("error.catalog"));
    }
  }, [userId, refreshAnswers]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggleSave = useCallback(
    async (product: Product, placement: Placement) => {
      if (!userId) return;
      const wasSaved = savedIds.has(product.id);

      // Optimistic: the heart flips at once, and flips back only if the
      // write fails. Waiting for the round trip made it feel broken.
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(product.id);
        else next.add(product.id);
        return next;
      });

      void trackProductEvent({
        productId: product.id,
        retailerId: product.retailerId,
        signalType: wasSaved ? "ignore" : "save",
        placement,
      });

      try {
        if (wasSaved) await unsaveProduct(userId, product.id);
        else await saveProduct(userId, product.id);
      } catch {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(product.id);
          else next.delete(product.id);
          return next;
        });
      }
    },
    [userId, savedIds]
  );

  const value = useMemo<CatalogValue>(
    () => ({
      products,
      answers: saved ?? NO_ANSWERS,
      hasAnswers: saved !== null,
      savedOnboarding: saved,
      savedIds,
      isSaved: (id) => savedIds.has(id),
      toggleSave,
      error,
      reload,
      refreshAnswers,
    }),
    [products, saved, savedIds, toggleSave, error, reload, refreshAnswers]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}
