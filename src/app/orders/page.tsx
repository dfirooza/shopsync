import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrders } from "@/app/cart/actions";

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { orders, error } = await getOrders();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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
                href="/cart"
                className="text-sf-gray-2 px-4 py-2 rounded-lg text-sm font-medium hover:text-sf-blue-primary transition-colors"
              >
                Cart
              </Link>
              <Link
                href="/"
                className="text-sf-gray-2 px-4 py-2 rounded-lg text-sm font-medium hover:text-sf-blue-primary transition-colors"
              >
                Browse
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-white border-b border-border-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-sf-gray-1">My Orders</h1>
          <p className="text-sf-gray-3 mt-1">Track and view your order history</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        ) : orders.length === 0 ? (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-sf-gray-1 mb-2">No orders yet</h2>
            <p className="text-sf-gray-3 mb-6">
              Start shopping to place your first order
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-sf-blue-primary text-white rounded-lg font-medium hover:bg-sf-blue-dark transition-colors"
            >
              Browse Businesses
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-lg shadow-sf-card hover:shadow-sf-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm text-sf-gray-3">
                        Order placed {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-sf-gray-4 mt-0.5">
                        ID: {order.id.slice(0, 8)}...
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold border capitalize ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-sf-gray-1">
                        ${order.totalAmount.toFixed(2)}
                      </p>
                      {order.customerNote && (
                        <p className="text-sm text-sf-gray-3 mt-1 truncate max-w-xs">
                          Note: {order.customerNote}
                        </p>
                      )}
                    </div>
                    <span className="text-sf-blue-primary text-sm font-medium">
                      View details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
