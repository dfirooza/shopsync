import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const userProfile = profile as Pick<Tables<'profiles'>, 'role'> | null;

  if (!userProfile || userProfile.role !== 'admin') {
    return (
      <main className="p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-red-600">Not Authorized</h1>
          <p className="mt-4 text-gray-700">
            You do not have permission to access this page.
          </p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  // Fetch last 50 events
  const { data: recentEvents } = await supabase
    .from('events')
    .select(`
      id,
      event_type,
      business_id,
      product_id,
      actor_id,
      metadata,
      created_at,
      businesses (name),
      products (name)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch event counts by type
  const { data: eventCounts } = await supabase
    .from('events')
    .select('event_type')
    .order('event_type');

  // Calculate counts
  const countsByType = eventCounts?.reduce((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Fetch top 10 businesses by business_view in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: businessViews } = await supabase
    .from('events')
    .select('business_id, businesses (name)')
    .eq('event_type', 'business_view')
    .gte('created_at', sevenDaysAgo.toISOString());

  // Calculate top businesses
  const businessViewCounts = businessViews?.reduce((acc, event) => {
    if (event.business_id) {
      const businessName = (event.businesses as any)?.name || 'Unknown';
      if (!acc[event.business_id]) {
        acc[event.business_id] = { name: businessName, count: 0 };
      }
      acc[event.business_id].count++;
    }
    return acc;
  }, {} as Record<string, { name: string; count: number }>) || {};

  const topBusinesses = Object.entries(businessViewCounts)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-sf-gray-7">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-border-light sticky top-0 z-50 shadow-sf-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sf-blue-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-semibold text-sf-gray-1">
                ShopSync
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="text-sf-gray-1 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm px-3 py-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Requests
              </Link>
              <Link
                href="/"
                className="text-sf-gray-1 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm px-3 py-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <div className="bg-sf-blue-primary text-white border-b border-sf-blue-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-2.5 mb-1">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          </div>
          <p className="text-sf-blue-lighter text-sm mt-1">
            Track user interactions and business performance
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Object.entries(countsByType).map(([type, count]) => (
            <div key={type} className="bg-white rounded border border-border-light p-5">
              <div className="text-sf-gray-3 text-xs font-medium uppercase mb-1">
                {type.replace(/_/g, ' ')}
              </div>
              <div className="text-2xl font-bold text-sf-gray-1">{count}</div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Businesses */}
          <div className="bg-white rounded border border-border-light">
            <div className="p-5 border-b border-border-light">
              <h2 className="text-lg font-semibold text-sf-gray-1">
                Top 10 Businesses (Last 7 Days)
              </h2>
            </div>
            <div className="p-5">
              {topBusinesses.length > 0 ? (
                <div className="space-y-3">
                  {topBusinesses.map((business, index) => (
                    <div key={business.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-sf-blue-lighter flex items-center justify-center text-sf-blue-dark text-xs font-bold">
                          {index + 1}
                        </div>
                        <Link
                          href={`/business/${business.id}`}
                          className="text-sm font-medium text-sf-gray-1 hover:text-sf-blue-primary transition-colors"
                        >
                          {business.name}
                        </Link>
                      </div>
                      <span className="text-sm font-semibold text-sf-gray-2">
                        {business.count} views
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-sf-gray-3">No data available</p>
              )}
            </div>
          </div>

          {/* Event Type Distribution */}
          <div className="bg-white rounded border border-border-light">
            <div className="p-5 border-b border-border-light">
              <h2 className="text-lg font-semibold text-sf-gray-1">
                Event Type Distribution
              </h2>
            </div>
            <div className="p-5">
              {Object.entries(countsByType).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(countsByType)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count]) => {
                      const total = Object.values(countsByType).reduce((a, b) => a + b, 0);
                      const percentage = Math.round((count / total) * 100);
                      return (
                        <div key={type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-sf-gray-1">
                              {type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-sf-gray-3">{percentage}%</span>
                          </div>
                          <div className="w-full bg-sf-gray-6 rounded-full h-2">
                            <div
                              className="bg-sf-blue-primary h-2 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-sf-gray-3">No data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Events Table */}
        <div className="bg-white rounded border border-border-light">
          <div className="p-5 border-b border-border-light">
            <h2 className="text-lg font-semibold text-sf-gray-1">
              Recent Events (Last 50)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sf-gray-7 border-b border-border-light">
                  <th className="px-5 py-3 text-left text-xs font-medium text-sf-gray-2 uppercase">
                    Event Type
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-sf-gray-2 uppercase">
                    Business
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-sf-gray-2 uppercase">
                    Product
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-sf-gray-2 uppercase">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {recentEvents && recentEvents.length > 0 ? (
                  recentEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-sf-gray-7 transition-colors">
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-sf-blue-lighter text-sf-blue-dark">
                          {event.event_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-sf-gray-1">
                        {event.business_id && (event.businesses as any)?.name ? (
                          <Link
                            href={`/business/${event.business_id}`}
                            className="hover:text-sf-blue-primary transition-colors"
                          >
                            {(event.businesses as any).name}
                          </Link>
                        ) : (
                          <span className="text-sf-gray-3">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-sf-gray-1">
                        {event.product_id && (event.products as any)?.name ? (
                          (event.products as any).name
                        ) : (
                          <span className="text-sf-gray-3">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-sf-gray-2">
                        {new Date(event.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-sf-gray-3">
                      No events found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
