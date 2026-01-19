'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function toggleFollow(businessId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if already following
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('business_followers')
    .select('id')
    .eq('business_id', businessId)
    .eq('follower_id', user.id)
    .maybeSingle();

  const existingFollow = existing as { id: string } | null;

  if (existingFollow) {
    // Unfollow
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('business_followers')
      .delete()
      .eq('id', existingFollow.id);

    if (error) {
      return { error: `Failed to unfollow: ${error.message}` };
    }

    revalidatePath(`/business/${businessId}`);
    return { success: true, isFollowing: false };
  } else {
    // Follow
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('business_followers')
      .insert({
        business_id: businessId,
        follower_id: user.id,
      });

    if (error) {
      return { error: `Failed to follow: ${error.message}` };
    }

    revalidatePath(`/business/${businessId}`);
    return { success: true, isFollowing: true };
  }
}

export async function checkIsFollowing(businessId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isFollowing: false };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('business_followers')
    .select('id')
    .eq('business_id', businessId)
    .eq('follower_id', user.id)
    .maybeSingle();

  return { isFollowing: !!existing };
}

export async function getFollowerCount(businessId: string) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('business_followers')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId);

  return { count: count || 0 };
}
