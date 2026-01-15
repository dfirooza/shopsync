# Search, Filter & Sort Implementation

This document explains the search, filtering, and sorting features added to ShopSync.

---

## IMPLEMENTATION APPROACH

### ✅ Server-Side with URL Query Parameters

**Why server-side?**
- Already using Next.js Server Components for data fetching
- Better for SEO (crawlable filter states)
- Shareable/bookmarkable URLs with filters applied
- No need to convert existing server components to client components
- Minimal code changes and complexity

**Trade-off:**
- Each filter change causes a page reload (acceptable for MVP)
- Client-side would be smoother but requires more refactoring and state management

---

## PART 1: HOMEPAGE (Business List)

### Files Created/Modified

1. **[src/app/BusinessFilters.tsx](src/app/BusinessFilters.tsx)** - Client component for filter UI
2. **[src/app/page.tsx](src/app/page.tsx)** - Updated to accept searchParams and build dynamic queries

### Features Implemented

#### 1. Search Input
- **Filters by**: Business name, category, OR address (case-insensitive)
- **Query param**: `?q=coffee`
- **Supabase query**: Uses `.or()` with `.ilike` for partial matching

```typescript
businessQuery = businessQuery.or(
  `name.ilike.%${query}%,category.ilike.%${query}%,address.ilike.%${query}%`
);
```

#### 2. Category Dropdown
- **Filters by**: Exact category match
- **Query param**: `?category=Restaurant`
- **Dynamic options**: Fetches unique categories from all businesses
- **Supabase query**: Uses `.eq()` for exact match

```typescript
businessQuery = businessQuery.eq("category", category);
```

#### 3. Sort Dropdown
- **Options**:
  - A → Z (default)
  - Z → A
  - Newest First (uses `created_at` column)
- **Query param**: `?sort=newest`
- **Supabase query**: Uses `.order()` with ascending/descending

```typescript
if (sort === "name-desc") {
  businessQuery = businessQuery.order("name", { ascending: false });
} else if (sort === "newest") {
  businessQuery = businessQuery.order("created_at", { ascending: false });
} else {
  businessQuery = businessQuery.order("name", { ascending: true });
}
```

### How It Works

1. User changes a filter in the UI
2. `BusinessFilters` component updates URL params using `router.push()`
3. Page reloads with new params
4. Server component reads `searchParams`
5. Builds Supabase query dynamically
6. Fetches filtered/sorted data
7. Renders results

### Example URLs

```
/ (default - all businesses, sorted A-Z)
/?q=coffee (search for "coffee")
/?category=Restaurant (filter by Restaurant category)
/?sort=newest (sort by newest first)
/?q=berkeley&category=Cafe&sort=name-desc (combined filters)
```

---

## PART 2: BUSINESS DETAIL PAGE (Product List)

### Files Created/Modified

1. **[src/app/business/[id]/ProductSort.tsx](src/app/business/[id]/ProductSort.tsx)** - Client component for sort UI
2. **[src/app/business/[id]/page.tsx](src/app/business/[id]/page.tsx)** - Updated to accept searchParams and apply sorting

### Features Implemented

#### Product Sorting Options

- **Name (A → Z)** - Default, sorts alphabetically
- **Price: Low → High** - Cheapest products first
- **Price: High → Low** - Most expensive products first
- **Newest First** - Uses `created_at` column

### Query Parameters

```
/business/[id] (default - sorted by name)
/business/[id]?sort=price-asc (cheapest first)
/business/[id]?sort=price-desc (most expensive first)
/business/[id]?sort=newest (newest products first)
```

### Supabase Query

```typescript
let productsQuery = supabase
  .from("products")
  .select("*")
  .eq("business_id", id);

if (sort === "price-asc") {
  productsQuery = productsQuery.order("price", { ascending: true });
} else if (sort === "price-desc") {
  productsQuery = productsQuery.order("price", { ascending: false });
} else if (sort === "newest") {
  productsQuery = productsQuery.order("created_at", { ascending: false });
} else {
  productsQuery = productsQuery.order("name", { ascending: true });
}
```

---

## TECHNICAL DETAILS

### Database Schema

**No changes required!** All filtering/sorting uses existing columns:

- `businesses.name` - for search and sort
- `businesses.category` - for category filter
- `businesses.address` - for search
- `businesses.created_at` - for "Newest" sort (already exists)
- `products.name` - for product sort
- `products.price` - for price sort
- `products.created_at` - for newest products sort (already exists)

### Client Components

Both filter components use:
- `"use client"` directive
- `useRouter()` for navigation
- `useSearchParams()` for reading current params
- `useTransition()` for pending state during navigation

### Server Components

Both page components:
- Accept `searchParams` prop from Next.js
- Build dynamic Supabase queries
- Remain as server components (no "use client" needed)

---

## TESTING CHECKLIST

### Homepage Tests

- [ ] Search by business name (partial match)
- [ ] Search by category (e.g., "Rest" matches "Restaurant")
- [ ] Search by address (e.g., "Berkeley")
- [ ] Filter by category dropdown
- [ ] Sort A → Z
- [ ] Sort Z → A
- [ ] Sort by Newest First
- [ ] Combine search + category filter
- [ ] Combine search + sort
- [ ] Clear filters (should show all businesses)
- [ ] No results message displays when no matches

### Product Page Tests

- [ ] Sort by Name (default)
- [ ] Sort by Price: Low → High
- [ ] Sort by Price: High → Low
- [ ] Sort by Newest First
- [ ] URL updates with sort param
- [ ] Refresh page maintains sort state

---

## UI/UX FEATURES

### Loading States
- "Updating results..." message appears during filter changes
- Uses React `useTransition()` for non-blocking updates

### Empty States
- Homepage: "No businesses found matching your criteria."
- Product page: "No products available yet."

### Responsive Design
- Filters use CSS Grid with 3 columns on desktop
- Stack vertically on mobile (grid-cols-1)

### Accessibility
- All inputs have proper `<label>` elements
- Select dropdowns have descriptive labels
- Keyboard navigation works for all filters

---

## PERFORMANCE CONSIDERATIONS

### Optimizations
✅ Single query per page load (no N+1 queries)
✅ Server-side rendering (fast initial load)
✅ Supabase handles filtering/sorting (no client-side array operations)
✅ Category list cached in single additional query

### Potential Improvements (Not in MVP)
- Add debouncing to search input (reduce queries while typing)
- Client-side filtering for small datasets (< 50 businesses)
- Add loading skeletons instead of "Updating..." text
- Implement pagination for large result sets

---

## QUERY PARAM REFERENCE

### Homepage (`/`)

| Parameter | Values | Description | Example |
|-----------|--------|-------------|---------|
| `q` | any string | Search query | `?q=coffee` |
| `category` | category name | Filter by category | `?category=Restaurant` |
| `sort` | `name-asc`, `name-desc`, `newest` | Sort order | `?sort=newest` |

### Business Detail (`/business/[id]`)

| Parameter | Values | Description | Example |
|-----------|--------|-------------|---------|
| `sort` | `name`, `price-asc`, `price-desc`, `newest` | Sort order | `?sort=price-asc` |

---

## CODE SNIPPETS

### Reading Search Params in Server Component

```typescript
interface HomeProps {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const query = params.q || "";
  const category = params.category || "";
  const sort = params.sort || "name-asc";

  // Build query...
}
```

### Updating URL from Client Component

```typescript
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
```

---

## GOTCHAS & NOTES

### 1. Search is OR-based
Search matches ANY of: name, category, or address. This provides better UX than requiring exact matches.

### 2. Category filter is exact match
Unlike search, category filter requires exact match. This ensures clean filtering by business type.

### 3. Sort defaults to name-asc
If no sort param is provided, businesses/products sort alphabetically by name.

### 4. created_at column assumed
"Newest First" sorting uses `created_at` column. This already exists in both `businesses` and `products` tables.

### 5. Page reloads on filter change
This is intentional for the MVP. Server-side filtering provides better SEO and simpler code.

### 6. URL reflects all active filters
Users can bookmark or share filtered views. The URL is the source of truth.

---

## FUTURE ENHANCEMENTS (Not in MVP)

If you want to improve this later:

- [ ] Add search debouncing (wait 300ms after typing stops)
- [ ] Add "Clear All Filters" button
- [ ] Show active filter count badge
- [ ] Add price range filter for products
- [ ] Implement pagination (show 20 per page)
- [ ] Add URL-based pagination (?page=2)
- [ ] Show result count ("Showing 5 of 12 businesses")
- [ ] Add loading skeleton UI instead of text
- [ ] Client-side filtering for faster UX (if dataset is small)
- [ ] Add filter presets ("Popular", "Near Me", etc.)

---

## Quick Start Testing

1. **Test Homepage Search**:
   - Go to `/`
   - Type "berkeley" in search box
   - Should filter businesses with "berkeley" in name, category, or address

2. **Test Category Filter**:
   - Select a category from dropdown
   - Should show only businesses in that category

3. **Test Business List Sort**:
   - Change sort to "Z → A"
   - Businesses should reverse order

4. **Test Product Sort**:
   - Go to any business detail page (`/business/[id]`)
   - Change sort to "Price: Low → High"
   - Products should order by price ascending

5. **Test Combined Filters**:
   - Search for "coffee" + Category "Cafe" + Sort "Newest"
   - URL should be: `/?q=coffee&category=Cafe&sort=newest`

Done! 🎉
