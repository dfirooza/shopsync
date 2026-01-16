import { createClient } from '@/lib/supabase/client';

export type EventType =
  | 'business_view'
  | 'product_click'
  | 'contact_click'
  | 'owner_request'
  | 'owner_approved';

export interface LogEventParams {
  eventType: EventType;
  businessId?: string;
  productId?: string;
  actorId?: string;
  metadata?: Record<string, any>;
}

/**
 * Logs an analytics event to Supabase.
 * This is a fire-and-forget operation that won't block the UI.
 * Failures are logged to console but don't throw errors.
 */
export async function logEvent({
  eventType,
  businessId,
  productId,
  actorId,
  metadata,
}: LogEventParams): Promise<void> {
  try {
    const supabase = createClient();

    // Get current user if actorId not provided
    let finalActorId = actorId;
    if (!finalActorId) {
      const { data: { user } } = await supabase.auth.getUser();
      finalActorId = user?.id;
    }

    const { error } = await supabase.from('events').insert({
      event_type: eventType,
      business_id: businessId || null,
      product_id: productId || null,
      actor_id: finalActorId || null,
      metadata: metadata || null,
    });

    if (error) {
      console.warn(`[Analytics] Failed to log ${eventType}:`, error.message);
    }
  } catch (err) {
    // Silently fail - don't break the user experience
    console.warn(`[Analytics] Error logging ${eventType}:`, err);
  }
}
