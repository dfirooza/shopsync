"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface TrendingBusiness {
  id: string;
  name: string;
  category: string;
  address: string;
  views_count: number;
  clicks_count: number;
}

interface TrendingProduct {
  id: string;
  business_id: string;
  name: string;
  price: number;
  image_url: string | null;
  clicks_count: number;
  business_name: string;
}

type TimeRange = "today" | "week";

export default function TrendingContent() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [businesses, setBusinesses] = useState<TrendingBusiness[]>([]);
  const [products, setProducts] = useState<TrendingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrending() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const days = timeRange === "today" ? 1 : 7;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = supabase as any;

        const [businessesRes, productsRes] = await Promise.all([
          client.rpc("get_trending_businesses", { p_days: days, p_limit: 10 }),
          client.rpc("get_trending_products", { p_days: days, p_limit: 10 }),
        ]);

        if (businessesRes.error) throw new Error(businessesRes.error.message);
        if (productsRes.error) throw new Error(productsRes.error.message);

        setBusinesses(businessesRes.data || []);
        setProducts(productsRes.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trending data");
      } finally {
        setLoading(false);
      }
    }

    fetchTrending();
  }, [timeRange]);

  return (
    <div className="space-y-8">
      {/* Time Range Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTimeRange("today")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            timeRange === "today"
              ? "bg-sf-blue-primary text-white"
              : "bg-white text-sf-gray-2 hover:bg-sf-gray-6 border border-border-light"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setTimeRange("week")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            timeRange === "week"
              ? "bg-sf-blue-primary text-white"
              : "bg-white text-sf-gray-2 hover:bg-sf-gray-6 border border-border-light"
          }`}
        >
          This Week
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-sf-error-light border border-sf-error rounded-lg p-4">
          <p className="text-sf-error text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-8 w-8 text-sf-blue-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Trending Businesses */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-sf-blue-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h2 className="text-xl font-semibold text-sf-gray-1">Trending Businesses</h2>
            </div>

            {businesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {businesses.map((business, index) => (
                  <Link
                    key={business.id}
                    href={`/business/${business.id}`}
                    className="group bg-white rounded-lg border border-border-light overflow-hidden hover:shadow-sf-md hover:border-sf-blue-primary transition-all"
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Rank Badge */}
                        <div className="flex-shrink-0 w-8 h-8 bg-sf-blue-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sf-gray-1 group-hover:text-sf-blue-primary transition-colors mb-1">
                            {business.name}
                          </h3>
                          <p className="text-sm text-sf-gray-3 mb-2">{business.category}</p>
                          <div className="flex items-center gap-4 text-xs text-sf-gray-3">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>{business.views_count} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                              </svg>
                              <span>{business.clicks_count} clicks</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-border-light p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-sf-gray-6 rounded-full mb-3">
                  <svg className="w-6 h-6 text-sf-gray-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-sf-gray-3 text-sm">No trending businesses yet</p>
                <p className="text-sf-gray-4 text-xs mt-1">Check back later or explore all businesses</p>
              </div>
            )}
          </section>

          {/* Trending Products */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-sf-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h2 className="text-xl font-semibold text-sf-gray-1">Trending Products</h2>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/business/${product.business_id}`}
                    className="group bg-white rounded-lg border border-border-light overflow-hidden hover:shadow-sf-md hover:border-sf-blue-primary transition-all"
                  >
                    {/* Product Image */}
                    <div className="relative">
                      {product.image_url ? (
                        <div className="h-36 bg-sf-gray-6 relative">
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-36 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                          <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
                        {index + 1}
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-sf-gray-1 group-hover:text-sf-blue-primary transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-sf-gray-3 mb-2 line-clamp-1">{product.business_name}</p>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-sf-success">
                          ${product.price.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-sf-gray-3">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                          </svg>
                          <span>{product.clicks_count}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-border-light p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-sf-gray-6 rounded-full mb-3">
                  <svg className="w-6 h-6 text-sf-gray-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-sf-gray-3 text-sm">No trending products yet</p>
                <p className="text-sf-gray-4 text-xs mt-1">Products will appear here as they get clicked</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
