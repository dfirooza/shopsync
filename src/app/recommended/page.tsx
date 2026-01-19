import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import RecommendedContent from "./RecommendedContent";

export default async function RecommendedPage() {
  const supabase = await createClient();

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="text-sf-gray-2 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm px-3 py-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Link>
              <Link
                href="/trending"
                className="text-sf-gray-1 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm px-3 py-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Trending
              </Link>
              {user ? (
                <Link
                  href="/owner"
                  className="text-sf-gray-1 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm px-3 py-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="bg-sf-blue-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-sf-blue-dark transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-sf-blue-primary text-white border-b border-sf-blue-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h1 className="text-3xl font-bold">Recommended For You</h1>
          </div>
          <p className="text-sf-blue-lighter">
            {user
              ? "Personalized picks based on your browsing activity"
              : "Sign in to get personalized recommendations"}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecommendedContent userId={user?.id || null} />
      </main>
    </div>
  );
}
