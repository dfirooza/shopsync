import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCartItems } from "./actions";
import CartItemCard from "./CartItemCard";
import CheckoutForm from "./CheckoutForm";

export default async function CartPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { cart, error } = await getCartItems();

  // Group items by business
  const itemsByBusiness = cart.items.reduce((acc, item) => {
    if (!acc[item.businessId]) {
      acc[item.businessId] = {
        businessName: item.businessName,
        items: [],
        subtotal: 0,
      };
    }
    acc[item.businessId].items.push(item);
    acc[item.businessId].subtotal += item.productPrice * item.quantity;
    return acc;
  }, {} as Record<string, { businessName: string; items: typeof cart.items; subtotal: number }>);

  return (
    <div className="min-h-screen bg-sf-gray-7">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-border-light sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-sf-blue-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-semibold text-sf-gray-1">ShopSync</span>
            </Link>
            <div className="flex gap-3 items-center">
              <Link
                href="/"
                className="text-sf-gray-2 px-4 py-2 rounded-lg text-sm font-medium hover:text-sf-blue-primary transition-colors"
              >
                Continue Shopping
              </Link>
              <Link
                href="/orders"
                className="text-sf-gray-2 px-4 py-2 rounded-lg text-sm font-medium hover:text-sf-blue-primary transition-colors"
              >
                My Orders
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white border-b border-border-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-sf-gray-1">Shopping Cart</h1>
          {cart.itemCount > 0 && (
            <p className="text-sf-gray-3 mt-1">
              {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"} in your cart
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        ) : cart.items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sf-card">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-sf-gray-6 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-sf-gray-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-sf-gray-1 mb-2">Your cart is empty</h2>
            <p className="text-sf-gray-3 mb-6">
              Discover amazing products from local businesses
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-sf-blue-primary text-white rounded-lg font-medium hover:bg-sf-blue-dark transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items grouped by business */}
            {Object.entries(itemsByBusiness).map(([businessId, { businessName, items, subtotal }]) => (
              <div key={businessId} className="bg-white rounded-lg shadow-sf-card overflow-hidden">
                <div className="bg-sf-gray-6 px-6 py-3 border-b border-border-light">
                  <h2 className="font-semibold text-sf-gray-1">{businessName}</h2>
                </div>
                <div className="divide-y divide-border-light">
                  {items.map((item) => (
                    <CartItemCard key={item.id} item={item} />
                  ))}
                </div>
                <div className="px-6 py-3 bg-sf-gray-7 flex justify-between items-center">
                  <span className="text-sm text-sf-gray-2">Subtotal</span>
                  <span className="font-semibold text-sf-gray-1">${subtotal.toFixed(2)}</span>
                </div>
              </div>
            ))}

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sf-card p-6">
              <h2 className="text-lg font-semibold text-sf-gray-1 mb-4">Order Summary</h2>
              <div className="space-y-3 pb-4 border-b border-border-light">
                <div className="flex justify-between text-sm">
                  <span className="text-sf-gray-2">Subtotal ({cart.itemCount} items)</span>
                  <span className="text-sf-gray-1">${cart.totalAmount.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex justify-between pt-4 mb-6">
                <span className="text-lg font-semibold text-sf-gray-1">Total</span>
                <span className="text-lg font-bold text-sf-gray-1">${cart.totalAmount.toFixed(2)}</span>
              </div>

              <CheckoutForm />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
