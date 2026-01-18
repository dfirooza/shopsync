"use client";

import { useEffect } from "react";
import { logBusinessView } from "@/lib/analytics";

interface AnalyticsTrackerProps {
  businessId: string;
}

export default function AnalyticsTracker({ businessId }: AnalyticsTrackerProps) {
  useEffect(() => {
    logBusinessView(businessId);
  }, [businessId]);

  // This component renders nothing - it's just for tracking
  return null;
}
