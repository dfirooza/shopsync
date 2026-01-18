import { createClient } from "@/lib/supabase/client";

type EventType = "business_view" | "product_click" | "search";

interface EventData {
  event_type: EventType;
  business_id?: string | null;
  product_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Log an analytics event to Supabase.
 * This is a fire-and-forget operation - errors are logged but not thrown.
 */
export async function logEvent(data: EventData): Promise<void> {
  try {
    const supabase = createClient();

    // Get current user if logged in (optional)
    const { data: { user } } = await supabase.auth.getUser();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("events").insert({
      event_type: data.event_type,
      business_id: data.business_id || null,
      product_id: data.product_id || null,
      actor_id: user?.id || null,
      metadata: data.metadata || null,
    });
  } catch (error) {
    // Log but don't throw - analytics should never break the app
    console.error("Failed to log analytics event:", error);
  }
}

/**
 * Log a business page view
 */
export function logBusinessView(businessId: string): void {
  logEvent({
    event_type: "business_view",
    business_id: businessId,
  });
}

/**
 * Log a product click
 */
export function logProductClick(businessId: string, productId: string): void {
  logEvent({
    event_type: "product_click",
    business_id: businessId,
    product_id: productId,
  });
}

/**
 * Log a search event
 */
export function logSearch(
  query: string,
  category: string | null,
  sort: string | null,
  resultsBusinessIds: string[]
): void {
  logEvent({
    event_type: "search",
    metadata: {
      query,
      category,
      sort,
      results_business_ids: resultsBusinessIds,
      results_count: resultsBusinessIds.length,
    },
  });
}
