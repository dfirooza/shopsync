"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function BusinessRequestForm() {
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to submit a request");
      setLoading(false);
      return;
    }

    // Submit business request
    const { error: insertError } = await supabase
      .from("business_requests")
      .insert({
        user_id: user.id,
        business_name: businessName,
        business_category: businessCategory,
        business_address: businessAddress,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      // Clear form
      setBusinessName("");
      setBusinessCategory("");
      setBusinessAddress("");
    }
  };

  if (success) {
    return (
      <div className="border rounded-lg p-8 bg-green-50">
        <h2 className="text-xl font-semibold text-green-800 mb-4">
          Request Submitted Successfully
        </h2>
        <p className="text-green-700">
          Your business account request has been submitted and is pending
          approval. You will be able to access business features once your
          request is approved.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-8">
      <h2 className="text-xl font-semibold mb-4">
        Request Business Account Access
      </h2>
      <p className="text-gray-600 mb-6">
        To manage businesses and products, you need to request business account
        privileges. Fill out the form below to submit your request.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="businessName"
            className="block text-sm font-medium mb-2"
          >
            Business Name
          </label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your business name"
          />
        </div>

        <div>
          <label
            htmlFor="businessCategory"
            className="block text-sm font-medium mb-2"
          >
            Business Category
          </label>
          <input
            id="businessCategory"
            type="text"
            value={businessCategory}
            onChange={(e) => setBusinessCategory(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Restaurant, Retail, Service"
          />
        </div>

        <div>
          <label
            htmlFor="businessAddress"
            className="block text-sm font-medium mb-2"
          >
            Business Address
          </label>
          <input
            id="businessAddress"
            type="text"
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Full business address"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
