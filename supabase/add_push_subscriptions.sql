-- =============================================================================
-- Migration: Add Push Subscriptions for Web Push (VAPID) Notifications
-- =============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_email ON push_subscriptions(LOWER(user_email));
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public and service role access for registering and updating push subscriptions
CREATE POLICY "Allow public insert and update for push subscriptions"
  ON push_subscriptions FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
