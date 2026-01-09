'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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

  const { error } = await supabase.from('products').insert({
    business_id: businessId,
    name,
    price,
    description,
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

  if (!name || isNaN(price)) {
    return { error: 'Name and valid price are required' };
  }

  // First verify ownership by checking if product belongs to user's business
  const { data: product } = await supabase
    .from('products')
    .select('business_id')
    .eq('id', productId)
    .maybeSingle();

  if (!product) {
    return { error: 'Product not found' };
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', product.business_id)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!business) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('products')
    .update({
      name,
      price,
      description,
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

  // Delete with ownership check via JOIN
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .in(
      'business_id',
      supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/owner');
  return { success: true };
}
