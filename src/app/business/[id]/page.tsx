import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BusinessPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch business by ID
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  if (businessError || !business) {
    return (
      <main className="p-8">
        <p>Business not found</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Back to home
        </Link>
      </main>
    );
  }

  // Fetch products for this business
  const { data: businessProducts, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", id)
    .order("name");

  if (productsError) {
    console.error("Error fetching products:", productsError);
  }

  return (
    <main className="p-8">
      <Link href="/" className="text-blue-600 hover:underline mb-4 block">
        ← Back to businesses
      </Link>

      <h1 className="text-3xl font-bold">{business.name}</h1>
      <p className="text-gray-500">{business.category}</p>
      <p className="mt-2 text-gray-700">{business.address}</p>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Products</h2>
        <div className="grid gap-3">
          {businessProducts?.map((product) => (
            <div key={product.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{product.name}</h3>
                <span className="text-green-600 font-semibold">
                  ${product.price.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
