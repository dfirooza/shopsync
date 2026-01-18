'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/database';

export async function approveBusinessRequest(requestId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const userProfile = profile as Pick<Tables<'profiles'>, 'role'> | null;

  if (!userProfile || userProfile.role !== 'admin') {
    return { error: 'Unauthorized: Admin access required' };
  }

  // Get the request to find the user_id
  const { data: request, error: requestError } = await supabase
    .from('business_requests')
    .select('user_id, business_name')
    .eq('id', requestId)
    .single();

  const businessRequest = request as Pick<Tables<'business_requests'>, 'user_id' | 'business_name'> | null;

  if (requestError || !businessRequest) {
    return { error: 'Business request not found' };
  }

  // Update the business request status to approved
  const { error: updateRequestError } = await supabase
    .from('business_requests')
    // @ts-expect-error - Supabase type inference issue
    .update({
      status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateRequestError) {
    return { error: `Failed to update request: ${updateRequestError.message}` };
  }

  // Update the user's profile to be a business user
  const { error: updateProfileError } = await supabase
    .from('profiles')
    // @ts-expect-error - Supabase type inference issue
    .update({
      role: 'business',
      business_approved: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', businessRequest.user_id);

  if (updateProfileError) {
    return { error: `Failed to update profile: ${updateProfileError.message}` };
  }

  // Get full request details to create the business
  const { data: fullRequest, error: fullRequestError } = await supabase
    .from('business_requests')
    .select('business_name, business_category, business_address, user_id')
    .eq('id', requestId)
    .single();

  const requestDetails = fullRequest as Pick<Tables<'business_requests'>, 'business_name' | 'business_category' | 'business_address' | 'user_id'> | null;

  if (fullRequestError || !requestDetails) {
    return { error: `Failed to get request details: ${fullRequestError?.message}` };
  }

  // Create the business in the businesses table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: createBusinessError } = await (supabase as any)
    .from('businesses')
    .insert({
      name: requestDetails.business_name,
      category: requestDetails.business_category,
      address: requestDetails.business_address,
      owner_id: requestDetails.user_id,
    });

  if (createBusinessError) {
    return { error: `Failed to create business: ${createBusinessError.message}` };
  }

  revalidatePath('/admin');
  return { success: true, message: `Approved business request for "${businessRequest.business_name}"` };
}

export async function rejectBusinessRequest(requestId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const userProfile = profile as Pick<Tables<'profiles'>, 'role'> | null;

  if (!userProfile || userProfile.role !== 'admin') {
    return { error: 'Unauthorized: Admin access required' };
  }

  // Get the request to find the business name
  const { data: request, error: requestError } = await supabase
    .from('business_requests')
    .select('business_name')
    .eq('id', requestId)
    .single();

  const businessRequest = request as Pick<Tables<'business_requests'>, 'business_name'> | null;

  if (requestError || !businessRequest) {
    return { error: 'Business request not found' };
  }

  // Update the business request status to rejected
  const { error: updateError } = await supabase
    .from('business_requests')
    // @ts-expect-error - Supabase type inference issue
    .update({
      status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) {
    return { error: `Failed to reject request: ${updateError.message}` };
  }

  revalidatePath('/admin');
  return { success: true, message: `Rejected business request for "${businessRequest.business_name}"` };
}
