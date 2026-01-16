"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

interface BusinessFiltersProps {
  categories: string[];
}

export default function BusinessFilters({ categories }: BusinessFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQuery = searchParams.get("q") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "name-asc";

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sf-card p-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        {/* Search Input */}
        <div className="flex-1 w-full">
          <label htmlFor="search" className="block text-sm font-medium mb-2 text-sf-gray-2">
            Search
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-sf-gray-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              id="search"
              type="text"
              placeholder="Ask Agentforce anything"
              defaultValue={currentQuery}
              onChange={(e) => updateFilters("q", e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-sm border border-sf-gray-5 rounded-full focus:outline-none focus:ring-2 focus:ring-sf-blue-light focus:border-sf-blue-primary text-sf-gray-1 bg-sf-gray-7 transition-all placeholder:text-sf-gray-4"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-48">
          <label htmlFor="category" className="block text-sm font-medium mb-2 text-sf-gray-2">
            Category
          </label>
          <div className="relative">
            <select
              id="category"
              value={currentCategory}
              onChange={(e) => updateFilters("category", e.target.value)}
              className="w-full px-4 py-3 text-sm border border-sf-gray-5 rounded-lg focus:outline-none focus:ring-2 focus:ring-sf-blue-light focus:border-sf-blue-primary text-sf-gray-1 bg-white appearance-none transition-all cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-sf-gray-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="w-full md:w-40">
          <label htmlFor="sort" className="block text-sm font-medium mb-2 text-sf-gray-2">
            Sort By
          </label>
          <div className="relative">
            <select
              id="sort"
              value={currentSort}
              onChange={(e) => updateFilters("sort", e.target.value)}
              className="w-full px-4 py-3 text-sm border border-sf-gray-5 rounded-lg focus:outline-none focus:ring-2 focus:ring-sf-blue-light focus:border-sf-blue-primary text-sf-gray-1 bg-white appearance-none transition-all cursor-pointer"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="newest">Newest</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-sf-gray-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {isPending && (
        <div className="mt-4 flex items-center text-sm text-sf-blue-primary">
          <svg
            className="animate-spin h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Updating results...
        </div>
      )}
    </div>
  );
}
