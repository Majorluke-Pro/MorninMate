-- Enable RLS on alarms table
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarms FORCE ROW LEVEL SECURITY;

-- Users can only read their own alarms
CREATE POLICY IF NOT EXISTS "Users can view own alarms"
  ON alarms FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own alarms
CREATE POLICY IF NOT EXISTS "Users can insert own alarms"
  ON alarms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own alarms
CREATE POLICY IF NOT EXISTS "Users can update own alarms"
  ON alarms FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own alarms
CREATE POLICY IF NOT EXISTS "Users can delete own alarms"
  ON alarms FOR DELETE
  USING (auth.uid() = user_id);
