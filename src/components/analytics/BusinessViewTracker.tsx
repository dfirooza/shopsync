'use client';

import { useEffect } from 'react';
import { logEvent } from '@/lib/analytics/logEvent';

interface BusinessViewTrackerProps {
  businessId: string;
}

/**
 * Client component that tracks when a user views a business page.
 * Logs the event once on mount.
 */
export function BusinessViewTracker({ businessId }: BusinessViewTrackerProps) {
  useEffect(() => {
    // Fire the event once when the component mounts
    logEvent({
      eventType: 'business_view',
      businessId,
    });
  }, [businessId]);

  // This component doesn't render anything
  return null;
}
