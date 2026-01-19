-- Follow Business + Notifications Feature
-- Migration: 20260118_follow_notifications.sql

-- Table: business_followers
-- Tracks which users follow which businesses
CREATE TABLE business_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, follower_id)
);

-- Table: notifications
-- Stores in-app notifications for users
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'new_product', etc.
  title text NOT NULL,
  body text,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE business_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_followers
-- Users can view their own follows
CREATE POLICY "Users can view own follows" ON business_followers
  FOR SELECT USING (auth.uid() = follower_id);

-- Users can insert their own follows
CREATE POLICY "Users can insert own follows" ON business_followers
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can delete their own follows
CREATE POLICY "Users can delete own follows" ON business_followers
  FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for notifications
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow inserts for notifications (needed for product creation trigger)
CREATE POLICY "Allow notification inserts" ON notifications
  FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_followers_business ON business_followers(business_id);
CREATE INDEX idx_followers_user ON business_followers(follower_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
