import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getBusinessOrders } from "@/app/cart/actions";
import OrderStatusUpdater from "./OrderStatusUpdater";

export default async function BusinessOrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { orders, error } = await getBusinessOrders();

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
                href="/owner"
                className="text-sf-gray-2 px-4 py-2 rounded-lg text-sm font-medium hover:text-sf-blue-primary transition-colors"
              >
                ← Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-sf-blue-primary text-white border-b border-sf-blue-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold">Customer Orders</h1>
          <p className="text-sf-blue-lighter mt-1">
            Manage orders for your products
          </p>
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
            <p className="text-sf-gray-3">
              Orders containing your products will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sf-card overflow-hidden"
              >
                {/* Order Header */}
                <div className="p-6 border-b border-border-light">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-sf-gray-3">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-sf-gray-4 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString()} at{" "}
                        {new Date(order.createdAt).toLocaleTimeString()}
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

                  {/* Customer Info */}
                  <div className="mt-4 p-3 bg-sf-gray-7 rounded-lg">
                    <p className="text-sm text-sf-gray-2">
                      <span className="font-medium">Customer:</span>{" "}
                      {order.customerEmail || "Unknown"}
                    </p>
                    {order.customerNote && (
                      <p className="text-sm text-sf-gray-2 mt-1">
                        <span className="font-medium">Note:</span> {order.customerNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="divide-y divide-border-light">
                  {order.items.map((item, index) => (
                    <div key={index} className="px-6 py-3 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sf-gray-1">{item.productName}</p>
                        <p className="text-sm text-sf-gray-3">
                          ${item.productPrice.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-sf-gray-1">
                        ${(item.productPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="p-6 bg-sf-gray-7 border-t border-border-light">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-sf-gray-1">Your Items Total</span>
                    <span className="text-lg font-bold text-sf-gray-1">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>

                  {/* Status Update */}
                  <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
