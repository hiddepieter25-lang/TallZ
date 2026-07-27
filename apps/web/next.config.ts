import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Real product photos ingested from Shopify-powered retailers
        // (American Tall, Just Tall, Faherty) — see MARKET_RESEARCH.md §4.
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
  },
};

export default nextConfig;
