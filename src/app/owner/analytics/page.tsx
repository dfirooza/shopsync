import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnalyticsDashboard from "./AnalyticsDashboard";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get all businesses owned by this user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: businesses } = await (supabase as any)
    .from("businesses")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("name", { ascending: true }) as { data: Array<{ id: string; name: string }> | null };

  if (!businesses || businesses.length === 0) {
    return (
      <div className="min-h-screen bg-sf-gray-7 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sf-card p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-sf-warning-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-sf-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-sf-gray-1 mb-2">No Business Found</h2>
          <p className="text-sf-gray-3 mb-6">You need to have an approved business to view analytics.</p>
          <Link href="/owner" className="sf-link">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

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
              <span className="text-xl font-semibold text-sf-gray-1">ShopSync</span>
            </Link>
            <Link
              href="/owner"
              className="text-sf-gray-2 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-sf-blue-primary text-white border-b border-sf-blue-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-1">Analytics</h1>
          <p className="text-sf-blue-lighter">
            Track views, clicks, and search performance
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsDashboard businesses={businesses} />
      </main>
    </div>
  );
}
