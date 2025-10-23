-- ========================================
-- STEP 1: Add user_id column (SAFE)
-- ========================================
-- This just adds a new column, doesn't modify existing data
ALTER TABLE coffees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- STOP HERE and verify in Supabase Table Editor that the user_id column was added
-- You should see a new "user_id" column (all values will be NULL for now)


-- ========================================
-- STEP 2: Assign existing data to your user (SAFE)
-- ========================================
-- IMPORTANT: First sign up in your app to create your user account!
-- Then come back and run this:

-- Option A: If you have only ONE user account, run this:
UPDATE coffees
SET user_id = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1)
WHERE user_id IS NULL;

-- Option B: If you want to assign to a specific user, first find your user_id:
-- SELECT id, email FROM auth.users;
-- Then run: UPDATE coffees SET user_id = 'YOUR-USER-ID-HERE' WHERE user_id IS NULL;

-- STOP HERE and verify in Supabase Table Editor that all coffees now have a user_id


-- ========================================
-- STEP 3: Create RLS policies BEFORE enabling RLS (SAFER!)
-- ========================================
-- Drop existing policies if they exist (safe, won't error)
DROP POLICY IF EXISTS "Users can view their own coffees" ON coffees;
DROP POLICY IF EXISTS "Users can insert their own coffees" ON coffees;
DROP POLICY IF EXISTS "Users can update their own coffees" ON coffees;
DROP POLICY IF EXISTS "Users can delete their own coffees" ON coffees;

-- Create policies (these do nothing until RLS is enabled)
CREATE POLICY "Users can view their own coffees"
ON coffees FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coffees"
ON coffees FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coffees"
ON coffees FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own coffees"
ON coffees FOR DELETE
USING (auth.uid() = user_id);

-- STOP HERE and verify policies were created (check Authentication > Policies in Supabase)


-- ========================================
-- STEP 4: Enable RLS (POINT OF NO RETURN)
-- ========================================
-- ⚠️ WARNING: After this, you can only access rows where user_id = your user ID
-- Make sure Step 2 completed successfully before running this!

ALTER TABLE coffees ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled:
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'coffees';
-- Expected result: rowsecurity = true


-- ========================================
-- EMERGENCY ROLLBACK (if something goes wrong)
-- ========================================
-- If you run Step 4 and lose access to your data, run this to disable RLS:
-- ALTER TABLE coffees DISABLE ROW LEVEL SECURITY;
--
-- Then investigate what went wrong, fix it, and re-enable RLS
