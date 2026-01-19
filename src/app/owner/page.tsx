import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";
import BusinessRequestForm from "./BusinessRequestForm";
import BusinessForm from "./BusinessForm";
import ProductsManager from "./ProductsManager";
import NotificationBell from "@/components/NotificationBell";
import CartIcon from "@/components/CartIcon";
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
              {isApprovedBusiness && business && (
                <>
                  <Link
                    href="/owner/inbox"
                    className="text-sf-gray-1 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm px-3 py-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    Inbox
                  </Link>
                  <Link
                    href="/owner/analytics"
                    className="text-sf-gray-1 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm px-3 py-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analytics
                  </Link>
                  <Link
                    href="/owner/orders"
                    className="text-sf-gray-1 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm px-3 py-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Orders
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sf-gray-1 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm px-3 py-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Admin
                </Link>
              )}
              <CartIcon />
              <NotificationBell />
              <Link
                href="/"
                className="text-sf-gray-1 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm px-3 py-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="bg-sf-blue-primary text-white border-b border-sf-blue-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-1">
            Business Dashboard
          </h1>
          <p className="text-sf-blue-lighter">
            Manage your business profile and products
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Account Info Card */}
          <div className="bg-white rounded border border-border-light p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-sf-gray-1 mb-4">Account Information</h2>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-sf-gray-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm text-sf-gray-2">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-sf-gray-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-sf-gray-2 font-medium">
                      {profile?.role === "business" ? "Business Owner" : "Customer"}
                    </span>
                  </div>
                  {profile?.role === "business" && (
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-sf-gray-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {profile.business_approved ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-sf-success-light text-sf-success border border-sf-success">
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-sf-warning-light text-sf-warning border border-sf-warning">
                          Pending Approval
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-sf-blue-primary rounded flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="bg-sf-warning-light rounded border-2 border-sf-warning p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-sf-warning rounded flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-sf-gray-1 mb-2">
                    Request Pending Review
                  </h2>
                  <p className="text-sm text-sf-gray-2 mb-5">
                    Your business account request is currently being reviewed by our team. We'll notify you once it's approved.
                  </p>
                  <div className="bg-white rounded border border-border-light p-5 space-y-2.5">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-semibold text-sf-gray-3 min-w-[100px] uppercase tracking-wide">Business Name:</span>
                      <span className="text-sm text-sf-gray-1 font-medium">{existingRequest.business_name}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-semibold text-sf-gray-3 min-w-[100px] uppercase tracking-wide">Category:</span>
                      <span className="text-sm text-sf-gray-1">{existingRequest.business_category}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-semibold text-sf-gray-3 min-w-[100px] uppercase tracking-wide">Address:</span>
                      <span className="text-sm text-sf-gray-1">{existingRequest.business_address}</span>
                    </div>
                    <div className="flex items-start gap-3 pt-2 border-t border-border-light">
                      <span className="text-xs font-semibold text-sf-gray-3 min-w-[100px] uppercase tracking-wide">Submitted:</span>
                      <span className="text-sm text-sf-gray-2">{new Date(existingRequest.created_at).toLocaleDateString()}</span>
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
