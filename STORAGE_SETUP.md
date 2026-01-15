# Supabase Storage Setup for Product Images

Follow these steps to set up the `product-images` bucket in Supabase:

## Steps:

1. **Go to Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard

2. **Open Storage Section**
   - Click on "Storage" in the left sidebar

3. **Create New Bucket**
   - Click "New bucket" button
   - Bucket name: `product-images`
   - Set as **Public bucket** (check the "Public bucket" option)
   - Click "Create bucket"

4. **Verify Bucket Settings**
   - The bucket should be publicly accessible for reading
   - No additional policies needed for MVP (public read is automatic for public buckets)

5. **Test the Setup**
   - After implementing the upload code, test by uploading an image
   - Verify the public URL is accessible in a browser

## File Path Strategy

Files will be stored as: `{userId}/{timestamp}-{originalFilename}`

Example: `550e8400-e29b-41d4-a716-446655440000/1705234567890-product.jpg`

This ensures:
- No filename collisions
- Easy tracking of who uploaded what
- Simple cleanup if needed

## Notes

- Public bucket means anyone with the URL can view images (perfect for product catalog)
- Deleting products does NOT auto-delete images (acceptable for MVP)
- Max file size is controlled client-side (we'll set 5MB limit)
