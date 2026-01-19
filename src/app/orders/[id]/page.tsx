import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrderDetails } from "@/app/cart/actions";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}

export default async function OrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
  const supabase = await createClient();
  const { id } = await params;
  const { success } = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { order, error } = await getOrderDetails(id);

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

  // Group items by business
  const itemsByBusiness = order?.items.reduce((acc, item) => {
    if (!acc[item.businessName]) {
      acc[item.businessName] = [];
    }
    acc[item.businessName].push(item);
    return acc;
  }, {} as Record<string, typeof order.items>);

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
                href="/orders"
                className="text-sf-gray-2 px-4 py-2 rounded-lg text-sm font-medium hover:text-sf-blue-primary transition-colors"
              >
                ← Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Success Banner */}
      {success === "true" && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-green-800">Order placed successfully!</p>
                <p className="text-sm text-green-700">
                  The business owner will be notified. They will contact you about payment and pickup/delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
            {error}
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Header */}
            <div className="bg-white rounded-lg shadow-sf-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-sf-gray-1">Order Details</h1>
                  <p className="text-sm text-sf-gray-3 mt-1">
                    Order ID: {order.id}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded text-sm font-semibold border capitalize ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-sf-gray-3">Order Date</p>
                  <p className="font-medium text-sf-gray-1">
                    {new Date(order.createdAt).toLocaleDateString()} at{" "}
                    {new Date(order.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-sf-gray-3">Total Amount</p>
                  <p className="font-semibold text-sf-gray-1 text-lg">
                    ${order.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {order.customerNote && (
                <div className="mt-4 pt-4 border-t border-border-light">
                  <p className="text-sf-gray-3 text-sm">Order Note</p>
                  <p className="text-sf-gray-1 mt-1">{order.customerNote}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sf-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border-light">
                <h2 className="text-lg font-semibold text-sf-gray-1">Order Items</h2>
              </div>

              {itemsByBusiness && Object.entries(itemsByBusiness).map(([businessName, items]) => (
                <div key={businessName}>
                  <div className="bg-sf-gray-6 px-6 py-2 border-b border-border-light">
                    <p className="text-sm font-medium text-sf-gray-2">{businessName}</p>
                  </div>
                  <div className="divide-y divide-border-light">
                    {items.map((item) => (
                      <div key={item.id} className="px-6 py-4 flex justify-between items-center">
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
                </div>
              ))}

              <div className="px-6 py-4 bg-sf-gray-7 flex justify-between items-center border-t border-border-light">
                <span className="font-semibold text-sf-gray-1">Total</span>
                <span className="text-xl font-bold text-sf-gray-1">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Link
                href="/orders"
                className="flex-1 py-3 px-6 text-center border border-border-light rounded-lg font-medium text-sf-gray-1 hover:bg-sf-gray-6 transition-colors"
              >
                Back to Orders
              </Link>
              <Link
                href="/"
                className="flex-1 py-3 px-6 text-center bg-sf-blue-primary text-white rounded-lg font-medium hover:bg-sf-blue-dark transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sf-card">
            <h2 className="text-xl font-bold text-sf-gray-1">Order not found</h2>
            <p className="text-sf-gray-3 mt-2">
              This order may have been deleted or you don't have permission to view it.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
