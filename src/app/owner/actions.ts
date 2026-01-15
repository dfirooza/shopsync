'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

// Create a new business
export async function createBusiness(prevState: any, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const address = formData.get('address') as string;

  if (!name || !category || !address) {
    return { error: 'All fields are required' };
  }

  // @ts-expect-error - Supabase type inference issue
  const { error } = await supabase.from('businesses').insert({
    name,
    category,
    address,
    owner_id: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/owner');
  return { success: true };
}

// Update existing business
export async function updateBusiness(businessId: string, prevState: any, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const address = formData.get('address') as string;

  if (!name || !category || !address) {
    return { error: 'All fields are required' };
  }

  const { error } = await supabase
    .from('businesses')
    // @ts-expect-error - Supabase type inference issue
    .update({
      name,
      category,
      address,
    })
    .eq('id', businessId)
    .eq('owner_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/owner');
  return { success: true };
}

// Create a new product
export async function createProduct(businessId: string, prevState: any, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const price = parseFloat(formData.get('price') as string);
  const description = formData.get('description') as string;
  const imageFile = formData.get('image') as File | null;

  if (!name || isNaN(price)) {
    return { error: 'Name and valid price are required' };
  }

  // Verify business ownership
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', businessId)
    .eq('owner_id', user.id)
    .single();

  if (!business) {
    return { error: 'Business not found or unauthorized' };
  }

  // Upload image if provided
  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0) {
    const fileName = `${user.id}/${Date.now()}-${imageFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from('product-image')
      .upload(fileName, imageFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { error: `Image upload failed: ${uploadError.message}` };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-image')
      .getPublicUrl(fileName);

    imageUrl = publicUrl;
  }

  // @ts-expect-error - Supabase type inference issue
  const { error } = await supabase.from('products').insert({
    business_id: businessId,
    name,
    price,
    description,
    image_url: imageUrl,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/owner');
  return { success: true };
}

// Update existing product
export async function updateProduct(productId: string, prevState: any, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const price = parseFloat(formData.get('price') as string);
  const description = formData.get('description') as string;
  const imageFile = formData.get('image') as File | null;

  if (!name || isNaN(price)) {
    return { error: 'Name and valid price are required' };
  }

  // First verify ownership by checking if product belongs to user's business
  const productResult = await supabase
    .from('products')
    .select('business_id, image_url')
    .eq('id', productId)
    .maybeSingle();

  const product = productResult.data as { business_id: string; image_url: string | null } | null;

  if (!product) {
    return { error: 'Product not found' };
  }

  const businessResult = await supabase
    .from('businesses')
    .select('id')
    .eq('id', product.business_id)
    .eq('owner_id', user.id)
    .maybeSingle();

  const business = businessResult.data as { id: string } | null;

  if (!business) {
    return { error: 'Unauthorized' };
  }

  // Upload new image if provided
  let imageUrl: string | null = product.image_url;
  if (imageFile && imageFile.size > 0) {
    const fileName = `${user.id}/${Date.now()}-${imageFile.name}`;

    const { error: uploadError } = await supabase.storage
      .from('product-image')
      .upload(fileName, imageFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { error: `Image upload failed: ${uploadError.message}` };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-image')
      .getPublicUrl(fileName);

    imageUrl = publicUrl;
  }

  const { error } = await supabase
    .from('products')
    // @ts-expect-error - Supabase type inference issue
    .update({
      name,
      price,
      description,
      image_url: imageUrl,
    })
    .eq('id', productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/owner');
  return { success: true };
}

// Delete product
export async function deleteProduct(productId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // First verify ownership by checking if product belongs to user's business
  const productResult = await supabase
    .from('products')
    .select('business_id')
    .eq('id', productId)
    .maybeSingle();

  const product = productResult.data as { business_id: string } | null;

  if (!product) {
    return { error: 'Product not found' };
  }

  const businessResult = await supabase
    .from('businesses')
    .select('id')
    .eq('id', product.business_id)
    .eq('owner_id', user.id)
    .maybeSingle();

  const business = businessResult.data as { id: string } | null;

  if (!business) {
    return { error: 'Unauthorized' };
  }

  // Delete the product
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/owner');
  return { success: true };
}
