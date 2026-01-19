-- Add customer_email column to conversations table
-- This stores the email at conversation creation time to avoid RLS issues when reading profiles

ALTER TABLE conversations ADD COLUMN customer_email text;
