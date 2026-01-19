-- Fix: Allow users to read profiles of people they have conversations with
-- This enables business owners to see customer emails in their inbox

-- Allow business owners to see profiles of customers who messaged them
CREATE POLICY "Business owners can view customer profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN businesses b ON b.id = c.business_id
      WHERE c.customer_id = profiles.id
      AND b.owner_id = auth.uid()
    )
  );

-- Allow customers to see profiles of business owners they messaged
CREATE POLICY "Customers can view business owner profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN businesses b ON b.id = c.business_id
      WHERE b.owner_id = profiles.id
      AND c.customer_id = auth.uid()
    )
  );
