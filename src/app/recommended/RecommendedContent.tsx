"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

interface RecommendedBusiness {
  id: string;
  name: string;
  category: string;
  address: string;
  created_at: string;
  views_count: number;
}

interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  business_id: string;
  business_name: string;
  business_category: string;
  clicks_count: number;
}

interface RecommendationsData {
  businesses: RecommendedBusiness[];
  products: RecommendedProduct[];
  top_categories: string[];
  recent_searches: string[];
  is_personalized: boolean;
}

interface RecommendedContentProps {
  userId: string | null;
}

export default function RecommendedContent({ userId }: RecommendedContentProps) {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const supabase = createClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: result, error: rpcError } = await (supabase as any).rpc(
          "get_recommendations_for_user",
          { p_user_id: userId }
        );

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        setData(result as RecommendationsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Loading skeleton for businesses */}
        <section>
          <div className="h-7 w-48 bg-sf-gray-5 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-border-light p-6 animate-pulse">
                <div className="h-5 w-32 bg-sf-gray-5 rounded mb-2" />
                <div className="h-4 w-20 bg-sf-gray-6 rounded mb-3" />
                <div className="h-4 w-full bg-sf-gray-6 rounded" />
              </div>
            ))}
          </div>
        </section>

        {/* Loading skeleton for products */}
        <section>
          <div className="h-7 w-48 bg-sf-gray-5 rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-border-light overflow-hidden animate-pulse">
                <div className="h-32 bg-sf-gray-5" />
                <div className="p-4">
                  <div className="h-4 w-24 bg-sf-gray-5 rounded mb-2" />
                  <div className="h-4 w-16 bg-sf-gray-6 rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm text-red-500 hover:text-red-700 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { businesses, products, top_categories, recent_searches, is_personalized } = data;
  const hasRecommendations = businesses.length > 0 || products.length > 0;

  return (
    <div className="space-y-10">
      {/* Personalization indicator */}
      {is_personalized && top_categories.length > 0 && (
        <div className="bg-white rounded-lg border border-border-light p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-sf-gray-2">
              <svg className="w-4 h-4 text-sf-blue-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Based on your interest in</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {top_categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sf-blue-light text-sf-blue-primary"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!is_personalized && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100 p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-sf-gray-2">
              {userId
                ? "Keep browsing to get personalized recommendations! Below are popular items in your area."
                : "Sign in and browse some businesses to get personalized recommendations!"}
            </p>
          </div>
        </div>
      )}

      {/* Recommended Businesses */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-sf-gray-1">
            {is_personalized ? "Recommended Businesses" : "Popular Businesses"}
          </h2>
          <Link
            href="/"
            className="text-sm text-sf-blue-primary hover:text-sf-blue-dark font-medium"
          >
            View all →
          </Link>
        </div>

        {businesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((business) => (
              <Link
                key={business.id}
                href={`/business/${business.id}`}
                className="bg-white rounded-lg border border-border-light p-5 hover:shadow-sf-md hover:border-sf-blue-primary transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sf-gray-1 group-hover:text-sf-blue-primary transition-colors">
                    {business.name}
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sf-gray-6 text-sf-gray-2">
                    {business.category}
                  </span>
                </div>
                <p className="text-sm text-sf-gray-3 mb-3 line-clamp-1">
                  {business.address}
                </p>
                {business.views_count > 0 && (
                  <div className="flex items-center gap-1 text-xs text-sf-gray-4">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{business.views_count} views this week</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-border-light p-8 text-center">
            <svg className="w-12 h-12 text-sf-gray-4 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-sf-gray-3">No business recommendations yet</p>
            <Link href="/" className="text-sm text-sf-blue-primary hover:underline mt-2 inline-block">
              Browse all businesses
            </Link>
          </div>
        )}
      </section>

      {/* Recommended Products */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-sf-gray-1">
            {is_personalized ? "Products You Might Like" : "Popular Products"}
          </h2>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/business/${product.business_id}`}
                className="bg-white rounded-lg border border-border-light overflow-hidden hover:shadow-sf-md hover:border-sf-blue-primary transition-all group"
              >
                {product.image_url ? (
                  <div className="relative h-32 bg-sf-gray-6">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-sf-gray-6 flex items-center justify-center">
                    <svg className="w-10 h-10 text-sf-gray-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-medium text-sf-gray-1 text-sm mb-1 line-clamp-1 group-hover:text-sf-blue-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-sf-gray-3 mb-2 line-clamp-1">
                    {product.business_name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sf-success text-sm">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.clicks_count > 0 && (
                      <span className="text-xs text-sf-gray-4">
                        {product.clicks_count} clicks
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-border-light p-8 text-center">
            <svg className="w-12 h-12 text-sf-gray-4 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sf-gray-3">No product recommendations yet</p>
          </div>
        )}
      </section>

      {/* Recent Searches */}
      {recent_searches.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-sf-gray-1 mb-4">
            Based on Your Searches
          </h2>
          <div className="bg-white rounded-lg border border-border-light p-5">
            <div className="flex flex-wrap gap-2">
              {recent_searches.map((query, index) => (
                <Link
                  key={index}
                  href={`/?q=${encodeURIComponent(query)}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sf-gray-6 text-sf-gray-2 hover:bg-sf-blue-light hover:text-sf-blue-primary transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {query}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* No recommendations at all */}
      {!hasRecommendations && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-sf-gray-1 mb-2">
            Start Exploring!
          </h3>
          <p className="text-sf-gray-3 mb-6 max-w-md mx-auto">
            Browse some businesses and products to help us learn your preferences. We'll show you personalized recommendations here.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-sf-blue-primary text-white rounded-lg font-medium hover:bg-sf-blue-dark transition-colors"
          >
            Explore Businesses
          </Link>
        </div>
      )}
    </div>
  );
}
