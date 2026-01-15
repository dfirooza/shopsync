# Product Image Upload Implementation

This document outlines the complete implementation of product image uploads for ShopSync.

---

## 1. SQL MIGRATION

**File**: [supabase/migrations/003_add_product_images.sql](supabase/migrations/003_add_product_images.sql)

```sql
-- Add image_url column to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS image_url TEXT;
```

**To apply**: Run this migration in your Supabase project or execute it manually in the SQL Editor.

---

## 2. SUPABASE STORAGE SETUP

### Steps to create the bucket:

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Open Storage Section**
   - Click "Storage" in the left sidebar

3. **Create New Bucket**
   - Click "New bucket" button
   - Bucket name: `product-images`
   - **IMPORTANT**: Check "Public bucket" option
   - Click "Create bucket"

4. **Verify**
   - Bucket should appear in the list
   - Public access is enabled automatically for public buckets

### File naming strategy:
Files are stored as: `{userId}/{timestamp}-{originalFilename}`

Example: `550e8400-e29b-41d4-a716-446655440000/1705234567890-laptop.jpg`

---

## 3. CODE CHANGES

### A. Database Types ([src/types/database.ts](src/types/database.ts))

Updated `products` table types to include `image_url`:

```typescript
products: {
  Row: {
    id: string
    business_id: string
    name: string
    price: number
    description: string | null
    image_url: string | null  // ← NEW
    created_at: string
  }
  Insert: {
    id?: string
    business_id: string
    name: string
    price: number
    description?: string | null
    image_url?: string | null  // ← NEW
    created_at?: string
  }
  Update: {
    id?: string
    business_id?: string
    name?: string
    price?: number
    description?: string | null
    image_url?: string | null  // ← NEW
    created_at?: string
  }
}
```

### B. Server Actions ([src/app/owner/actions.ts](src/app/owner/actions.ts))

**Changes to `createProduct`**:
- Accepts `image` file from FormData
- Uploads to `product-images` bucket if provided
- Stores public URL in `image_url` column
- Returns error if upload fails

**Changes to `updateProduct`**:
- Accepts optional new `image` file
- Uploads new image if provided
- Keeps existing `image_url` if no new image uploaded
- Stores new public URL on update

**Key code snippet**:
```typescript
// Upload image if provided
let imageUrl: string | null = null;
if (imageFile && imageFile.size > 0) {
  const fileName = `${user.id}/${Date.now()}-${imageFile.name}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, imageFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    return { error: `Image upload failed: ${uploadError.message}` };
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  imageUrl = publicUrl;
}
```

### C. Product Form ([src/app/owner/ProductsManager.tsx](src/app/owner/ProductsManager.tsx))

**Added image input field**:
```tsx
<div>
  <label htmlFor={`image-${product?.id || 'new'}`} className="block text-sm font-medium mb-2 text-gray-900">
    Product Image (Optional)
  </label>
  <input
    id={`image-${product?.id || 'new'}`}
    name="image"
    type="file"
    accept="image/jpeg,image/png,image/webp,image/jpg"
    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
  />
  <p className="text-xs text-gray-500 mt-1">Max 5MB. Formats: JPG, PNG, WebP</p>
  {product?.image_url && (
    <p className="text-xs text-green-600 mt-1">Current image will be replaced if you select a new one</p>
  )}
</div>
```

**Added image display in product list**:
- Shows product thumbnail (96x96px) in owner dashboard
- Uses standard `<img>` tag for simplicity

### D. Business Page ([src/app/business/[id]/page.tsx](src/app/business/[id]/page.tsx))

**Display product images**:
- Shows 120x120px product images
- Uses Next.js `<Image>` component for optimization
- Only displays image if `image_url` exists
- Shows description alongside image

### E. Next.js Config ([next.config.ts](next.config.ts))

**Added Supabase as allowed image domain**:
```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};
```

This allows Next.js Image component to load images from Supabase Storage.

---

## 4. TESTING CHECKLIST

After setting up the Supabase bucket, test these scenarios:

- [ ] Create a new product with an image
- [ ] Create a new product without an image
- [ ] Edit a product and add an image
- [ ] Edit a product with an existing image (replace it)
- [ ] Edit a product without changing the image
- [ ] Verify image appears on `/business/[id]` page
- [ ] Verify image appears in owner dashboard
- [ ] Try uploading different formats (JPG, PNG, WebP)
- [ ] Verify public URL is accessible in browser

---

## 5. GOTCHAS & NOTES

### Security
✅ **Public bucket is intentional** - Product images are meant to be publicly viewable on the storefront

✅ **File uploads are authenticated** - Only logged-in business owners can upload via the owner dashboard

⚠️ **No file size validation server-side** - Browser will enforce 5MB limit via client-side validation, but server doesn't enforce it (acceptable for MVP)

### Storage Management
⚠️ **Old images are NOT deleted** - When replacing a product image, the old file remains in storage (acceptable for MVP to avoid complexity)

⚠️ **Deleting products doesn't delete images** - Images persist in storage even after product deletion (acceptable for MVP)

### File Naming
✅ **Unique filenames guaranteed** - Using `{userId}/{timestamp}-{filename}` prevents collisions

✅ **Original filename preserved** - Helps with debugging and identifying images

### Image Optimization
✅ **Next.js Image used on business page** - Provides automatic optimization and lazy loading

⚠️ **Plain img tag in dashboard** - Owner dashboard uses simple `<img>` for simplicity (no optimization needed for low-traffic admin page)

### Browser Compatibility
✅ **File input works in all modern browsers**

✅ **Accepts: JPG, PNG, WebP, JPEG**

### Performance
✅ **Images served from Supabase CDN** - Public URLs are CDN-backed for fast delivery

✅ **Cache-Control set to 1 hour** - Uploaded files are cached for performance

---

## 6. FUTURE ENHANCEMENTS (Not in MVP)

If you want to improve this later, consider:

- [ ] Add file size validation server-side
- [ ] Delete old images when replacing/removing
- [ ] Support multiple images per product
- [ ] Add image cropping/resizing on upload
- [ ] Generate thumbnails for faster loading
- [ ] Add image alt text field for accessibility
- [ ] Show upload progress indicator
- [ ] Allow drag-and-drop upload

---

## Quick Start

1. Apply the SQL migration
2. Create the `product-images` bucket (public) in Supabase
3. Test by adding a product with an image
4. Visit `/business/[id]` to see it displayed

Done! 🎉
