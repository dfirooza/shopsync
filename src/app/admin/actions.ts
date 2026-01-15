'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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

  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized: Admin access required' };
  }

  // Get the request to find the user_id
  const { data: request, error: requestError } = await supabase
    .from('business_requests')
    .select('user_id, business_name')
    .eq('id', requestId)
    .single();

  if (requestError || !request) {
    return { error: 'Business request not found' };
  }

  // Update the business request status to approved
  const { error: updateRequestError } = await supabase
    .from('business_requests')
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
    .update({
      role: 'business',
      business_approved: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', request.user_id);

  if (updateProfileError) {
    return { error: `Failed to update profile: ${updateProfileError.message}` };
  }

  revalidatePath('/admin');
  return { success: true, message: `Approved business request for "${request.business_name}"` };
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

  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized: Admin access required' };
  }

  // Get the request to find the business name
  const { data: request, error: requestError } = await supabase
    .from('business_requests')
    .select('business_name')
    .eq('id', requestId)
    .single();

  if (requestError || !request) {
    return { error: 'Business request not found' };
  }

  // Update the business request status to rejected
  const { error: updateError } = await supabase
    .from('business_requests')
    .update({
      status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) {
    return { error: `Failed to reject request: ${updateError.message}` };
  }

  revalidatePath('/admin');
  return { success: true, message: `Rejected business request for "${request.business_name}"` };
}
