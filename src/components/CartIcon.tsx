"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCartCount } from "@/app/cart/actions";

export default function CartIcon() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await getCartCount();
      setCount(count);
    };

    fetchCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="/cart"
      className="relative p-2 text-sf-gray-3 hover:text-sf-gray-1 transition-colors"
      title="Shopping Cart"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      {count > 0 && (
        <span
          className="absolute -top-1 -right-1 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: "#ef4444" }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
