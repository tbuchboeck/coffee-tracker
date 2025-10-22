# Cloud Database Setup Guide

This guide will help you set up cloud database storage for your Coffee Tracker app using Supabase (free tier).

## Why Use Cloud Storage?

- **Sync across devices**: Access your coffee data from any device
- **Automatic backups**: Your data is safely stored in the cloud
- **No size limits**: Unlike localStorage (5-10MB), cloud storage can handle much more data
- **Always available**: Your data persists even if you clear browser data
- **Free tier**: Supabase offers 500MB database storage for free, no credit card required

## Current Status

The app is designed to work with **both** cloud storage and localStorage:
- **With cloud configured**: All data is stored in Supabase PostgreSQL database
- **Without cloud**: Falls back to browser localStorage (current behavior)
- **Migration tool**: Built-in utility to move existing localStorage data to cloud

## Setup Instructions

### Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up (free, no credit card required)
3. Verify your email address

### Step 2: Create a New Project

1. Click "New Project"
2. Choose an organization (or create one)
3. Fill in project details:
   - **Name**: `coffee-tracker` (or any name you prefer)
   - **Database Password**: Create a strong password (save it somewhere safe)
   - **Region**: Choose the closest region to you
4. Click "Create new project"
5. Wait 2-3 minutes for the project to be set up

### Step 3: Get Your API Credentials

1. Go to **Settings** (gear icon in sidebar) → **API**
2. Find these values:
   - **Project URL**: Something like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: A long string starting with `eyJ...`
3. Keep this page open for the next step

### Step 4: Create the Database Table

1. Go to **SQL Editor** in the Supabase dashboard
2. Click **New Query**
3. Copy and paste this SQL code:

```sql
CREATE TABLE coffees (
  id BIGINT PRIMARY KEY,
  cuppingTime TIMESTAMP,
  roaster TEXT,
  description TEXT,
  origin TEXT,
  url TEXT,
  percentArabica INTEGER,
  percentRobusta INTEGER,
  roastLevel TEXT,
  brewingMethod TEXT,
  recommendedMethod TEXT,
  grinded BOOLEAN,
  grindingTime TEXT,
  grindingDegree TEXT,
  preparationNotes TEXT,
  coffeeAmount TEXT,
  servings TEXT,
  cremaRating INTEGER,
  tasteRating INTEGER,
  tasteNotes TEXT,
  comment TEXT,
  favorite BOOLEAN,
  price TEXT,
  packageSize INTEGER,
  currency TEXT,
  coffeeGroup TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - IMPORTANT for security
ALTER TABLE coffees ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations for now
-- For production, you should add proper authentication
CREATE POLICY "Allow all operations for now"
  ON coffees
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

4. Click **Run** or press `Ctrl+Enter` (Mac: `Cmd+Enter`)
5. You should see "Success. No rows returned"

### Step 5: Configure Your Local Environment

#### For Local Development:

1. Create a `.env` file in your project root (same folder as `package.json`)
2. Add your credentials:

```env
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Replace the values with your actual Project URL and anon key from Step 3

**Important**: The `.env` file is already in `.gitignore` to keep your credentials safe!

#### For GitHub Pages Deployment:

To use cloud storage on your GitHub Pages site:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add two secrets:
   - Name: `REACT_APP_SUPABASE_URL`, Value: Your Supabase project URL
   - Name: `REACT_APP_SUPABASE_ANON_KEY`, Value: Your Supabase anon key

5. Update your GitHub Actions workflow file (`.github/workflows/deploy.yml`) to include these environment variables during build:

```yaml
- name: Build
  run: npm run build
  env:
    REACT_APP_SUPABASE_URL: ${{ secrets.REACT_APP_SUPABASE_URL }}
    REACT_APP_SUPABASE_ANON_KEY: ${{ secrets.REACT_APP_SUPABASE_ANON_KEY }}
```

### Step 6: Restart and Test

1. **Stop** your development server (Ctrl+C)
2. **Restart** it: `npm start`
3. Open your app: [http://localhost:3000](http://localhost:3000)
4. Look for the **cloud icon** in the header:
   - 🟢 **Green cloud icon**: Cloud storage is active
   - ⚪ **Gray cloud icon**: Using localStorage (cloud not configured)

### Step 7: Migrate Your Existing Data (Optional)

If you have existing coffee data in localStorage:

1. Click the **cloud icon** in the header
2. A modal will appear showing your cloud status
3. Click **"Migrate localStorage to Cloud"**
4. Your data will be uploaded to Supabase
5. From now on, all changes sync to the cloud automatically!

## How It Works

### Automatic Fallback

The app is smart about storage:

```
If Supabase is configured:
  ✅ Use cloud database
Else:
  ✅ Fall back to localStorage (current behavior)
```

### Data Operations

All data operations (add, edit, delete, import) now work with both storage types:

- **Add coffee**: Saved to cloud (or localStorage)
- **Edit coffee**: Updated in cloud (or localStorage)
- **Delete coffee**: Removed from cloud (or localStorage)
- **Import**: Uploads all data to cloud (or localStorage)
- **Export**: Downloads from current storage

### Migration

The migration tool (`Migrate localStorage to Cloud` button):
1. Reads all coffee entries from localStorage
2. Uploads them to Supabase
3. Future operations use cloud automatically
4. Your localStorage data remains as backup

## Troubleshooting

### Cloud icon stays gray after setup

1. Check that `.env` file is in the project root
2. Verify the environment variables are correctly named:
   - `REACT_APP_SUPABASE_URL` (not `SUPABASE_URL`)
   - `REACT_APP_SUPABASE_ANON_KEY` (not `SUPABASE_KEY`)
3. Make sure you restarted the dev server after creating `.env`
4. Check browser console (F12) for any error messages

### Error: "Failed to add/update coffee"

1. Verify the `coffees` table was created correctly in Supabase
2. Check that Row Level Security (RLS) policy allows all operations
3. Go to Supabase **Table Editor** → **coffees** to see if data is there
4. Check browser console for detailed error messages

### Data not syncing across devices

1. Make sure both devices are using the cloud (green icon)
2. Refresh the page to load latest data from cloud
3. Check Supabase dashboard → **Table Editor** to see the actual data

### Migration shows "No data to migrate"

This means your localStorage is empty. If you expected data:
1. Check if you're using the same browser/profile where you added coffees
2. Open browser console and type: `localStorage.getItem('coffeeTrackerData')`
3. If it returns `null`, your localStorage is indeed empty

### Still using GitHub Pages with localStorage

If you want to use cloud on GitHub Pages, you need to:
1. Add the secrets to GitHub (see Step 5)
2. Update your deploy workflow to pass the environment variables
3. Redeploy your site
4. Clear browser cache and reload

## Security Notes

### For Development (Current Setup)

The current setup allows **anyone** with your Supabase URL and anon key to read/write data. This is fine for:
- Personal use
- Development/testing
- Private projects

### For Production (Recommended)

If you want to share your app publicly, you should:

1. **Add authentication** (Supabase Auth makes this easy)
2. **Update RLS policies** to require authentication:

```sql
-- Remove the permissive policy
DROP POLICY "Allow all operations for now" ON coffees;

-- Add authenticated-only policies
CREATE POLICY "Users can view their own coffees"
  ON coffees FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own coffees"
  ON coffees FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own coffees"
  ON coffees FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own coffees"
  ON coffees FOR DELETE
  USING (auth.uid() IS NOT NULL);
```

3. Add a `user_id` column to track ownership:

```sql
ALTER TABLE coffees ADD COLUMN user_id UUID REFERENCES auth.users(id);
```

## Cost and Limits

### Supabase Free Tier Includes:

- ✅ 500MB database storage
- ✅ 1GB file storage
- ✅ 2GB bandwidth per month
- ✅ 50MB database size per table
- ✅ 500K API requests per month
- ✅ Unlimited API requests for authenticated users

This is **more than enough** for personal coffee tracking!

### When You Might Need to Upgrade:

- If you have more than 50,000+ coffee entries (unlikely!)
- If you share the app with many users
- If you add photos (current app doesn't, but future feature)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Getting Help

If you run into issues:

1. Check the browser console (F12 → Console tab) for error messages
2. Check the Supabase dashboard for your data
3. Try the localStorage fallback (remove `.env` file temporarily)
4. Open an issue on the GitHub repository

---

**Happy Coffee Tracking! ☕**
