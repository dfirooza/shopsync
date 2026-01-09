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
    <main className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to home
          </Link>
          <LogoutButton />
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-8">
            <h1 className="text-3xl font-bold mb-4">Dashboard</h1>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Your Account</h2>
              <p className="text-gray-600">Email: {user.email}</p>
              <p className="text-gray-600">
                Account Type: {profile?.role === "business" ? "Business" : "Customer"}
              </p>
              {profile?.role === "business" && (
                <p className="text-gray-600">
                  Status:{" "}
                  {profile.business_approved ? (
                    <span className="text-green-600 font-semibold">Approved</span>
                  ) : (
                    <span className="text-yellow-600 font-semibold">
                      Pending Approval
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

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
            <div className="border rounded-lg p-8 bg-yellow-50">
              <h2 className="text-xl font-semibold text-yellow-800 mb-4">
                Request Pending
              </h2>
              <p className="text-yellow-700 mb-4">
                Your business account request is currently pending approval.
              </p>
              <div className="text-sm text-gray-700">
                <p>
                  <strong>Business Name:</strong> {existingRequest.business_name}
                </p>
                <p>
                  <strong>Category:</strong> {existingRequest.business_category}
                </p>
                <p>
                  <strong>Address:</strong> {existingRequest.business_address}
                </p>
                <p className="mt-2 text-gray-600">
                  Submitted: {new Date(existingRequest.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <BusinessRequestForm />
          )}
        </div>
      </div>
    </main>
  );
}
