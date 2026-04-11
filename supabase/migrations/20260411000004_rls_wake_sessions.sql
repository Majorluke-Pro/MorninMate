-- Enable RLS on wake_sessions table
ALTER TABLE wake_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wake_sessions FORCE ROW LEVEL SECURITY;

-- Users can only read their own wake sessions
CREATE POLICY IF NOT EXISTS "Users can view own wake_sessions"
  ON wake_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own wake sessions
CREATE POLICY IF NOT EXISTS "Users can insert own wake_sessions"
  ON wake_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own wake sessions
CREATE POLICY IF NOT EXISTS "Users can update own wake_sessions"
  ON wake_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own wake sessions
CREATE POLICY IF NOT EXISTS "Users can delete own wake_sessions"
  ON wake_sessions FOR DELETE
  USING (auth.uid() = user_id);
