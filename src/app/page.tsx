import { businesses } from "@/data/businesses";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">ShopSync</h1>
      <p className="mt-2 text-gray-600">
        Discover and support local Berkeley businesses.
      </p>

      <div className="mt-8 grid gap-4">
        {businesses.map((business) => (
          <div key={business.id} className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold">{business.name}</h2>
            <p className="text-sm text-gray-500">{business.category}</p>
            <p className="mt-2 text-gray-700">{business.address}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
