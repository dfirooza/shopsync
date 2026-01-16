'use client';

import Image from 'next/image';
import { logEvent } from '@/lib/analytics/logEvent';
import type { Tables } from '@/types/database';

type Product = Tables<'products'>;

interface ProductCardProps {
  product: Product;
}

/**
 * Client component for product cards that tracks clicks.
 */
export function ProductCard({ product }: ProductCardProps) {
  const handleClick = () => {
    // Log the product click event
    logEvent({
      eventType: 'product_click',
      businessId: product.business_id,
      productId: product.id,
    });
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
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-base text-sf-gray-1 group-hover:text-sf-blue-primary transition-colors flex-1">
            {product.name}
          </h3>
          <span className="inline-flex items-center px-2.5 py-1 rounded text-sm font-semibold bg-sf-success text-white ml-2">
            ${product.price.toFixed(2)}
          </span>
        </div>
        {product.description && (
          <p className="text-sf-gray-3 text-sm mt-2 line-clamp-2">
            {product.description}
          </p>
        )}
      </div>
    </div>
  );
}
