import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";
import ProductSort from "./ProductSort";

type Business = Tables<"businesses">;
type Product = Tables<"products">;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export default async function BusinessPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { sort = "name" } = await searchParams;
  const supabase = await createClient();

  // Fetch business by ID
  const businessResult = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const business = businessResult.data as Business | null;

  if (businessResult.error || !business) {
    return (
      <main className="p-8">
        <p>Business not found</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Back to home
        </Link>
      </main>
    );
  }

  // Fetch products for this business with dynamic sorting
  let productsQuery = supabase
    .from("products")
    .select("*")
    .eq("business_id", id);

  // Apply sorting based on query param
  if (sort === "price-asc") {
    productsQuery = productsQuery.order("price", { ascending: true });
  } else if (sort === "price-desc") {
    productsQuery = productsQuery.order("price", { ascending: false });
  } else if (sort === "newest") {
    productsQuery = productsQuery.order("created_at", { ascending: false });
  } else {
    // Default: sort by name
    productsQuery = productsQuery.order("name", { ascending: true });
  }

  const productsResult = await productsQuery;
  const businessProducts = (productsResult.data as Product[] | null) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ShopSync
              </span>
            </Link>
            <Link
              href="/"
              className="text-gray-700 hover:text-gray-900 font-medium flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Businesses
            </Link>
          </div>
        </div>
      </nav>

      {/* Business Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm text-white mb-4">
                {business.category}
              </div>
              <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
                {business.name}
              </h1>
              <div className="flex items-center text-blue-100">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{business.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Products Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Products</h2>
            <ProductSort />
          </div>

          {businessProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businessProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
                >
                  {product.image_url && (
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-base font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No products yet
              </h3>
              <p className="text-gray-500">
                This business hasn't added any products yet
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
