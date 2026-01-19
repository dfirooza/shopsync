"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { checkout } from "./actions";

export default function CheckoutForm() {
  const [loading, setLoading] = useState(false);
  const [customerNote, setCustomerNote] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    const result = await checkout(customerNote || undefined);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.success && result.orderId) {
      router.push(`/orders/${result.orderId}?success=true`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Optional Note */}
      <div>
        <label htmlFor="customerNote" className="block text-sm font-medium text-sf-gray-2 mb-1">
          Order Note (optional)
        </label>
        <textarea
          id="customerNote"
          value={customerNote}
          onChange={(e) => setCustomerNote(e.target.value)}
          placeholder="Any special instructions or notes for your order..."
          className="w-full px-4 py-2 border border-border-light rounded-lg text-sf-gray-1 placeholder:text-sf-gray-4 focus:outline-none focus:ring-2 focus:ring-sf-blue-primary focus:border-transparent resize-none"
          rows={3}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
          loading
            ? "bg-sf-gray-4 cursor-wait"
            : "bg-sf-blue-primary hover:bg-sf-blue-dark"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </span>
        ) : (
          "Place Order"
        )}
      </button>

      <p className="text-xs text-sf-gray-4 text-center">
        By placing your order, you agree to contact the business directly for payment and pickup/delivery arrangements.
      </p>
    </div>
  );
}
