import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import BusinessRequestForm from "./BusinessRequestForm";
import BusinessForm from "./BusinessForm";
import ProductsManager from "./ProductsManager";
import type { Tables } from "@/types/database";

export default async function OwnerDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile
  const profileResult = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileResult.data as Tables<"profiles"> | null;

  // Check if user is admin
  const isAdmin = profile?.role === 'admin';

  // Check if user has pending business request
  const requestResult = await supabase
    .from("business_requests")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  const existingRequest = requestResult.data as Tables<"business_requests"> | null;

  // Check if user is approved business user
  const isApprovedBusiness =
    profile?.role === "business" && profile?.business_approved === true;

  // Fetch user's business if they have one
  const businessResult = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  const business = businessResult.data as Tables<"businesses"> | null;

  // Fetch products if business exists
  const productsResult = business
    ? await supabase
        .from("products")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
    : null;

  const products = (productsResult?.data as Tables<"products">[] | null) ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ShopSync
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-purple-700 hover:text-purple-900 font-medium flex items-center gap-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Admin
                </Link>
              )}
              <Link
                href="/"
                className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
            Business Dashboard
          </h1>
          <p className="text-blue-100 text-lg">
            Manage your business profile and products
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Account Info Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-700">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700 font-medium">
                      {profile?.role === "business" ? "Business Owner" : "Customer"}
                    </span>
                  </div>
                  {profile?.role === "business" && (
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {profile.business_approved ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                          Pending Approval
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Business/Request Content */}
          {isApprovedBusiness ? (
            <>
              {business ? (
                <>
                  <BusinessForm business={business} />
                  <ProductsManager
                    businessId={business.id}
                    initialProducts={products || []}
                  />
                </>
              ) : (
                <BusinessForm />
              )}
            </>
          ) : existingRequest ? (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-md border-2 border-yellow-200 p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-yellow-900 mb-2">
                    Request Pending Review
                  </h2>
                  <p className="text-yellow-800 mb-6">
                    Your business account request is currently being reviewed by our team. We'll notify you once it's approved.
                  </p>
                  <div className="bg-white/60 rounded-xl p-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-semibold text-gray-700 min-w-[100px]">Business Name:</span>
                      <span className="text-sm text-gray-900 font-medium">{existingRequest.business_name}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-semibold text-gray-700 min-w-[100px]">Category:</span>
                      <span className="text-sm text-gray-900">{existingRequest.business_category}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-semibold text-gray-700 min-w-[100px]">Address:</span>
                      <span className="text-sm text-gray-900">{existingRequest.business_address}</span>
                    </div>
                    <div className="flex items-start gap-3 pt-2 border-t border-gray-200">
                      <span className="text-sm font-semibold text-gray-700 min-w-[100px]">Submitted:</span>
                      <span className="text-sm text-gray-600">{new Date(existingRequest.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <BusinessRequestForm />
          )}
        </div>
      </main>
    </div>
  );
}
