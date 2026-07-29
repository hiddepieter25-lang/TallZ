import { redirect } from "next/navigation";
import { ExploreFeed } from "@/components/ExploreFeed";
import { getProducts, rankProducts } from "@/lib/products";
import { createClient } from "@/lib/supabase/server";

export default async function Explore() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fexplore");

  const allProducts = await getProducts();
  // No quiz answers here on purpose — this is pure discovery, not the
  // personalized feed. rankProducts still gives every product a diversified,
  // photo-first order (all-zero scores collapse to one tier) instead of a
  // hardcoded sort, reusing the same retailer round-robin as /feed.
  const products = rankProducts(allProducts, { swipeTags: [], occasions: [] });

  return <ExploreFeed products={products} />;
}
