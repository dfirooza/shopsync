"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateCartQuantity, removeFromCart } from "./actions";
import type { CartItem } from "./actions";

interface CartItemCardProps {
  item: CartItem;
}

export default function CartItemCard({ item }: CartItemCardProps) {
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);
  const router = useRouter();

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    setLoading(true);
    setQuantity(newQuantity);
    await updateCartQuantity(item.productId, newQuantity);
    router.refresh();
    setLoading(false);
  };

  const handleRemove = async () => {
    setLoading(true);
    await removeFromCart(item.productId);
    router.refresh();
    setLoading(false);
  };

  return (
    <div className={`p-6 flex gap-4 ${loading ? "opacity-50" : ""}`}>
      {/* Product Image */}
      <div className="flex-shrink-0">
        {item.productImage ? (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-sf-gray-6">
            <Image
              src={item.productImage}
              alt={item.productName}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-lg bg-sf-gray-6 flex items-center justify-center">
            <svg className="w-8 h-8 text-sf-gray-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sf-gray-1 truncate">{item.productName}</h3>
        <p className="text-sm text-sf-gray-3 mt-0.5">${item.productPrice.toFixed(2)} each</p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center border border-border-light rounded">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={loading || quantity <= 1}
              className="px-3 py-1 text-sf-gray-2 hover:bg-sf-gray-6 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              −
            </button>
            <span className="px-3 py-1 text-sm font-medium text-sf-gray-1 min-w-[40px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={loading}
              className="px-3 py-1 text-sf-gray-2 hover:bg-sf-gray-6 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>

          <button
            onClick={handleRemove}
            disabled={loading}
            className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Line Total */}
      <div className="flex-shrink-0 text-right">
        <p className="font-semibold text-sf-gray-1">
          ${(item.productPrice * quantity).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
