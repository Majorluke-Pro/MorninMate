-- Patch: add FORCE ROW LEVEL SECURITY and fix UPDATE policy WITH CHECK
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- Drop and recreate the UPDATE policy with the correct WITH CHECK clause
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
