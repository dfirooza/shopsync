"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

export default function ProductSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") || "name";

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== "name") {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="product-sort" className="text-xs font-semibold text-sf-gray-2 uppercase tracking-wide">
        Sort by:
      </label>
      <div className="relative">
        <select
          id="product-sort"
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="pl-3 pr-8 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-2 focus:ring-sf-blue-light focus:border-sf-blue-primary text-sf-gray-1 bg-white appearance-none cursor-pointer transition-all"
        >
          <option value="name">Name (A → Z)</option>
          <option value="price-asc">Price: Low → High</option>
          <option value="price-desc">Price: High → Low</option>
          <option value="newest">Newest First</option>
        </select>
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-sf-gray-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {isPending && (
        <div className="flex items-center text-xs text-sf-blue-primary">
          <svg className="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Updating...
        </div>
      )}
    </div>
  );
}
