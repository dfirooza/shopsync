"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Business {
  id: string;
  name: string;
}

interface KPIs {
  views_count: number;
  clicks_count: number;
}

interface TopProduct {
  product_id: string;
  product_name: string;
  click_count: number;
}

interface TopSearchTerm {
  search_term: string;
  occurrence_count: number;
}

interface AnalyticsDashboardProps {
  businesses: Business[];
}

export default function AnalyticsDashboard({ businesses }: AnalyticsDashboardProps) {
  const [selectedBusinessId, setSelectedBusinessId] = useState(businesses[0]?.id || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KPI data
  const [kpis24h, setKpis24h] = useState<KPIs | null>(null);
  const [kpis7d, setKpis7d] = useState<KPIs | null>(null);
  const [kpis30d, setKpis30d] = useState<KPIs | null>(null);

  // Top lists
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topSearchTerms, setTopSearchTerms] = useState<TopSearchTerm[]>([]);

  useEffect(() => {
    if (!selectedBusinessId) return;

    async function fetchAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Fetch all data in parallel
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = supabase as any;
        const [kpis24hRes, kpis7dRes, kpis30dRes, topProductsRes, topSearchRes] = await Promise.all([
          client.rpc("get_business_kpis", { p_business_id: selectedBusinessId, p_days: 1 }),
          client.rpc("get_business_kpis", { p_business_id: selectedBusinessId, p_days: 7 }),
          client.rpc("get_business_kpis", { p_business_id: selectedBusinessId, p_days: 30 }),
          client.rpc("get_top_products", { p_business_id: selectedBusinessId, p_days: 7, p_limit: 5 }),
          client.rpc("get_top_search_terms", { p_business_id: selectedBusinessId, p_days: 7, p_limit: 10 }),
        ]);

        // Check for errors
        if (kpis24hRes.error) throw new Error(kpis24hRes.error.message);
        if (kpis7dRes.error) throw new Error(kpis7dRes.error.message);
        if (kpis30dRes.error) throw new Error(kpis30dRes.error.message);
        if (topProductsRes.error) throw new Error(topProductsRes.error.message);
        if (topSearchRes.error) throw new Error(topSearchRes.error.message);

        // Set KPIs (RPC returns array, take first row)
        setKpis24h(kpis24hRes.data?.[0] || { views_count: 0, clicks_count: 0 });
        setKpis7d(kpis7dRes.data?.[0] || { views_count: 0, clicks_count: 0 });
        setKpis30d(kpis30dRes.data?.[0] || { views_count: 0, clicks_count: 0 });

        // Set top lists
        setTopProducts(topProductsRes.data || []);
        setTopSearchTerms(topSearchRes.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedBusinessId]);

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId);

  return (
    <div className="space-y-6">
      {/* Business Selector (if multiple) */}
      {businesses.length > 1 && (
        <div className="bg-white rounded border border-border-light p-4">
          <label htmlFor="business-select" className="block text-sm font-medium text-sf-gray-2 mb-2">
            Select Business
          </label>
          <select
            id="business-select"
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="w-full md:w-64 px-4 py-2.5 text-sm border border-sf-gray-5 rounded-lg focus:outline-none focus:ring-2 focus:ring-sf-blue-light focus:border-sf-blue-primary text-sf-gray-1 bg-white"
          >
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-sf-error-light border border-sf-error rounded p-4">
          <p className="text-sf-error text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-sf-blue-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {/* Dashboard Content */}
      {!loading && !error && (
        <>
          {/* Business Name Header */}
          <div className="bg-white rounded border border-border-light p-4">
            <h2 className="text-lg font-semibold text-sf-gray-1">
              {selectedBusiness?.name}
            </h2>
          </div>

          {/* KPI Cards - Views */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="Views (24h)"
              value={kpis24h?.views_count || 0}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
            />
            <KPICard
              title="Views (7d)"
              value={kpis7d?.views_count || 0}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
            />
            <KPICard
              title="Views (30d)"
              value={kpis30d?.views_count || 0}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
            />
          </div>

          {/* KPI Cards - Clicks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KPICard
              title="Product Clicks (7d)"
              value={kpis7d?.clicks_count || 0}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              }
            />
            <KPICard
              title="Product Clicks (30d)"
              value={kpis30d?.clicks_count || 0}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              }
            />
          </div>

          {/* Top Products and Search Terms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded border border-border-light p-6">
              <h3 className="text-lg font-semibold text-sf-gray-1 mb-4">Top Products (7d)</h3>
              {topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={product.product_id} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-sf-blue-lighter rounded-full flex items-center justify-center text-xs font-semibold text-sf-blue-primary">
                          {index + 1}
                        </span>
                        <span className="text-sm text-sf-gray-1">{product.product_name}</span>
                      </div>
                      <span className="text-sm font-medium text-sf-gray-2">{product.click_count} clicks</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-sf-gray-3 text-center py-4">No product clicks yet</p>
              )}
            </div>

            {/* Top Search Terms */}
            <div className="bg-white rounded border border-border-light p-6">
              <h3 className="text-lg font-semibold text-sf-gray-1 mb-4">Top Search Terms (7d)</h3>
              {topSearchTerms.length > 0 ? (
                <div className="space-y-3">
                  {topSearchTerms.map((term, index) => (
                    <div key={term.search_term} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-sf-purple-lighter rounded-full flex items-center justify-center text-xs font-semibold text-sf-purple">
                          {index + 1}
                        </span>
                        <span className="text-sm text-sf-gray-1">&quot;{term.search_term}&quot;</span>
                      </div>
                      <span className="text-sm font-medium text-sf-gray-2">{term.occurrence_count}x</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-sf-gray-3 text-center py-4">No search data yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded border border-border-light p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-sf-gray-3 mb-1">{title}</p>
          <p className="text-3xl font-bold text-sf-gray-1">{value.toLocaleString()}</p>
        </div>
        <div className="w-12 h-12 bg-sf-blue-lighter rounded-lg flex items-center justify-center text-sf-blue-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}
