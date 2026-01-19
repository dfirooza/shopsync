"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/app/cart/actions";

interface AddToCartButtonProps {
  productId: string;
}

export default function AddToCartButton({ productId }: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  const handleAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    const result = await addToCart(productId, 1);
    if (result.success) {
      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 2000);
    } else if (result.error === "Not authenticated") {
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className={`mt-3 w-full py-2 px-4 rounded text-sm font-medium transition-colors ${
        added
          ? "bg-sf-success text-white"
          : loading
          ? "bg-sf-gray-5 text-sf-gray-3 cursor-wait"
          : "bg-sf-blue-primary text-white hover:bg-sf-blue-dark"
      }`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Adding...
        </span>
      ) : added ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Added!
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Add to Cart
        </span>
      )}
    </button>
  );
}
