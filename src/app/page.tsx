import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import BusinessFilters from "./BusinessFilters";

interface HomeProps {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const query = params.q || "";
  const category = params.category || "";
  const sort = params.sort || "name-asc";

  const supabase = await createClient();

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Build Supabase query with filters
  let businessQuery = supabase.from("businesses").select("*");

  // Apply search filter (matches name, category, or address)
  if (query) {
    businessQuery = businessQuery.or(
      `name.ilike.%${query}%,category.ilike.%${query}%,address.ilike.%${query}%`
    );
  }

  // Apply category filter
  if (category) {
    businessQuery = businessQuery.eq("category", category);
  }

  // Apply sorting
  if (sort === "name-desc") {
    businessQuery = businessQuery.order("name", { ascending: false });
  } else if (sort === "newest") {
    businessQuery = businessQuery.order("created_at", { ascending: false });
  } else {
    // Default: name-asc
    businessQuery = businessQuery.order("name", { ascending: true });
  }

  const businessesResult = await businessQuery;
  const businesses = businessesResult.data as Tables<"businesses">[] | null;
  const error = businessesResult.error;

  if (error) {
    console.error("Error fetching businesses:", error);
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">ShopSync</h1>
        <p className="mt-4 text-red-600">Failed to load businesses</p>
      </main>
    );
  }

  // Get unique categories for filter dropdown
  const allBusinessesResult = await supabase
    .from("businesses")
    .select("category");
  const allBusinesses = allBusinessesResult.data as { category: string }[] | null;
  const uniqueCategories = Array.from(
    new Set(allBusinesses?.map((b) => b.category) || [])
  ).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ShopSync
                </span>
              </Link>
            </div>
            <div className="flex gap-3">
              {user ? (
                <Link
                  href="/owner"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-6 rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-gray-900 py-2 px-6 rounded-full hover:bg-gray-100 transition-all duration-200 font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-6 rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
              Discover Local Businesses
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Support and connect with amazing local businesses in Berkeley
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="mb-8">
          <BusinessFilters categories={uniqueCategories} />
        </div>

        {/* Business Grid */}
        {businesses && businesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <Link
                key={business.id}
                href={`/business/${business.id}`}
                className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                        {business.name}
                      </h2>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {business.category}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-start text-gray-600">
                    <svg
                      className="w-5 h-5 mr-2 mt-0.5 text-gray-400 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-sm">{business.address}</span>
                  </div>
                  <div className="mt-4 flex items-center text-blue-600 font-medium text-sm group-hover:text-blue-700">
                    View Details
                    <svg
                      className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No businesses found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
