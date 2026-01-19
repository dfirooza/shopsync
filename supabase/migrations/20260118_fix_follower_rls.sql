-- Fix: Allow business owners to see their business followers
-- This is needed so when a business owner creates a product,
-- they can query who follows their business to send notifications

-- Business owners can view followers of their businesses
CREATE POLICY "Business owners can view followers" ON business_followers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = business_followers.business_id
      AND businesses.owner_id = auth.uid()
    )
  );
