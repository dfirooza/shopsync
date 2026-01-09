import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export default async function Home() {
  const supabase = await createClient();

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch businesses from Supabase
  const businessesResult = await supabase
    .from("businesses")
    .select("*")
    .order("name");

  const businesses = businessesResult.data as Tables<"businesses">[] | null;
  const error = businessesResult.error;

  if (error) {
    console.error("Error fetching businesses:", error);
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">ShopSync</h1>
        <p className="mt-4 text-red-600">Failed to load businesses</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">ShopSync</h1>
          <p className="mt-2 text-gray-600">
            Discover and support local Berkeley businesses.
          </p>
        </div>
        <div className="flex gap-3">
          {user ? (
            <Link
              href="/owner"
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
              >
                Sign Up
              </Link>
              <Link
                href="/login"
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {businesses?.map((business) => (
          <Link
            key={business.id}
            href={`/business/${business.id}`}
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold">{business.name}</h2>
            <p className="text-sm text-gray-500">{business.category}</p>
            <p className="mt-2 text-gray-700">{business.address}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
