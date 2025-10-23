-- Coffee Tracker Authentication Setup
-- Run these commands in your Supabase SQL Editor at https://app.supabase.com

-- 1. Add user_id column to coffees table (if not already exists)
ALTER TABLE coffees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Update existing rows to assign them to the first registered user (optional)
-- This ensures your existing coffee data is preserved and associated with your account
-- If you don't have any data yet, you can skip this step
UPDATE coffees
SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
WHERE user_id IS NULL;

-- 3. Enable Row Level Security (RLS) on the coffees table
ALTER TABLE coffees ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own coffees" ON coffees;
DROP POLICY IF EXISTS "Users can insert their own coffees" ON coffees;
DROP POLICY IF EXISTS "Users can update their own coffees" ON coffees;
DROP POLICY IF EXISTS "Users can delete their own coffees" ON coffees;

-- 5. Create RLS policies to ensure users can only access their own data

-- Policy: Users can only view their own coffees
CREATE POLICY "Users can view their own coffees"
ON coffees FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only insert coffees with their own user_id
CREATE POLICY "Users can insert their own coffees"
ON coffees FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own coffees
CREATE POLICY "Users can update their own coffees"
ON coffees FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own coffees
CREATE POLICY "Users can delete their own coffees"
ON coffees FOR DELETE
USING (auth.uid() = user_id);

-- 6. Verify the setup
-- Run this query to check if RLS is enabled and policies are in place
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'coffees';

-- Expected result: rowsecurity should be 'true'
