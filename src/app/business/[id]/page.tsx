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
    <div className="min-h-screen bg-sf-gray-7">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-border-light sticky top-0 z-50 shadow-sf-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sf-blue-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-semibold text-sf-gray-1">
                ShopSync
              </span>
            </Link>
            <Link
              href="/"
              className="text-sf-gray-1 hover:text-sf-blue-primary font-medium flex items-center gap-1.5 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Businesses
            </Link>
          </div>
        </div>
      </nav>

      {/* Business Header */}
      <div className="bg-sf-blue-primary text-white border-b border-sf-blue-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-sf-blue-dark text-white mb-3">
                {business.category}
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {business.name}
              </h1>
              <div className="flex items-center text-sf-blue-lighter">
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm">{business.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Products Section */}
        <div className="bg-white rounded border border-border-light p-6">
          <div className="flex justify-between items-center mb-5 pb-4 border-b border-border-light">
            <h2 className="text-xl font-semibold text-sf-gray-1">Products</h2>
            <ProductSort />
          </div>

          {businessProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businessProducts.map((product) => (
                <div
                  key={product.id}
                  className="group bg-white border border-border-light rounded overflow-hidden hover:shadow-sf-md hover:border-sf-blue-primary transition-all duration-200"
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
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-sf-gray-6 rounded-full mb-3">
                <svg className="w-6 h-6 text-sf-gray-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-sf-gray-1 mb-1">
                No products yet
              </h3>
              <p className="text-sm text-sf-gray-3">
                This business hasn't added any products yet
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
