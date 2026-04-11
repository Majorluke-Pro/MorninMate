-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY IF NOT EXISTS "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can only insert their own profile
CREATE POLICY IF NOT EXISTS "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can only delete their own profile
CREATE POLICY IF NOT EXISTS "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);
