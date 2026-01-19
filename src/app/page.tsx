import Link from "next/link";
import type { ReactElement } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import BusinessFilters from "./BusinessFilters";
import NotificationBell from "@/components/NotificationBell";
import CartIcon from "@/components/CartIcon";

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

  // Check if user is admin
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userProfile = profile as Pick<Tables<'profiles'>, 'role'> | null;
    isAdmin = userProfile?.role === 'admin';
  }

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

  // Map categories to icons
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, ReactElement> = {
      Restaurant: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
        </svg>
      ),
      Retail: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
      Services: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
        </svg>
      ),
      Healthcare: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
      Technology: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
        </svg>
      ),
    };

    // Default icon for unknown categories
    return iconMap[category] || (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-sf-gray-7">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-border-light sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-9 h-9 bg-sf-blue-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <span className="text-xl font-semibold text-sf-gray-1">
                  ShopSync
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/" className="text-sm font-medium text-sf-gray-2 hover:text-sf-blue-primary transition-colors">
                  Businesses
                </Link>
                <Link href="/trending" className="text-sm font-medium text-sf-gray-2 hover:text-sf-blue-primary transition-colors">
                  Trending
                </Link>
                {user && (
                  <Link href="/owner" className="text-sm font-medium text-sf-gray-2 hover:text-sf-blue-primary transition-colors">
                    Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link href="/admin" className="text-sm font-medium text-sf-gray-2 hover:text-sf-blue-primary transition-colors">
                    Admin
                  </Link>
                )}
              </div>
            </div>
            <div className="flex gap-3 items-center">
              {user ? (
                <>
                  <CartIcon />
                  <NotificationBell />
                  <Link
                    href="/owner"
                    className="bg-sf-blue-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-sf-blue-dark transition-colors"
                  >
                    My Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sf-gray-2 px-4 py-2 rounded-lg text-sm font-medium hover:text-sf-blue-primary transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-sf-blue-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-sf-blue-dark transition-colors"
                  >
                    Start for free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white border-b border-border-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold text-sf-gray-1 mb-4 leading-[1.1] tracking-tight">
              Discover Local Businesses
            </h1>
            <p className="text-lg text-sf-gray-2">
              Connect with amazing local businesses in your community. Support small businesses and find exactly what you need.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="mb-8">
          <BusinessFilters
            categories={uniqueCategories}
            resultsBusinessIds={businesses?.map(b => b.id) || []}
          />
        </div>

        {/* Business Grid */}
        {businesses && businesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {businesses.map((business) => (
              <Link
                key={business.id}
                href={`/business/${business.id}`}
                className="sf-card group block min-h-[240px]"
              >
                <div className="p-6 pb-24 relative z-10">
                  <h2 className="text-xl font-bold text-sf-gray-1 mb-2 leading-tight">
                    {business.name}
                  </h2>
                  <p className="text-sf-gray-3 text-sm mb-4 line-clamp-2">
                    {business.address}
                  </p>
                  <span className="sf-link text-sm">
                    Learn more
                  </span>
                </div>

                {/* Wave decoration */}
                <div className="sf-card-wave" />

                {/* Icon */}
                <div className="sf-card-icon">
                  {getCategoryIcon(business.category)}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-sf-card">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-sf-gray-6 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-sf-gray-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-sf-gray-1 mb-2">
              No businesses found
            </h3>
            <p className="text-sf-gray-3">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
