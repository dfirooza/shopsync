"use client";

import Image from "next/image";
import { logProductClick } from "@/lib/analytics";
import AddToCartButton from "./AddToCartButton";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    description: string | null;
    image_url: string | null;
    discount_percent: number | null;
    is_discount_active: boolean;
  };
  businessId: string;
  showAddToCart?: boolean;
}

export default function ProductCard({ product, businessId, showAddToCart = true }: ProductCardProps) {
  const handleClick = () => {
    logProductClick(businessId, product.id);
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-white border border-border-light rounded overflow-hidden hover:shadow-sf-md hover:border-sf-blue-primary transition-all duration-200 cursor-pointer"
    >
      {product.image_url && (
        <div className="relative h-40 bg-sf-gray-6 overflow-hidden">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.is_discount_active && product.discount_percent && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              -{product.discount_percent}% OFF
            </span>
          )}
        </div>
      )}
      {!product.image_url && product.is_discount_active && product.discount_percent && (
        <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 text-center">
          {product.discount_percent}% OFF - IN-APP ONLY
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-base text-sf-gray-1 group-hover:text-sf-blue-primary transition-colors flex-1">
            {product.name}
          </h3>
          {product.is_discount_active && product.discount_percent ? (
            <div className="flex flex-col items-end ml-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-semibold bg-red-500 text-white">
                ${(product.price * (1 - product.discount_percent / 100)).toFixed(2)}
              </span>
              <span className="text-xs text-sf-gray-4 line-through mt-0.5">
                ${product.price.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-semibold bg-sf-success text-white ml-2">
              ${product.price.toFixed(2)}
            </span>
          )}
        </div>
        {product.description && (
          <p className="text-sf-gray-3 text-sm mt-2 line-clamp-2">
            {product.description}
          </p>
        )}
        {showAddToCart && <AddToCartButton productId={product.id} />}
      </div>
    </div>
  );
}
