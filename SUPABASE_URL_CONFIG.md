# Supabase URL Configuration for Production

## The Problem

After signing up on your GitHub Pages app, Supabase redirects you to `localhost:3000` instead of keeping you on GitHub Pages!

**Why?** Supabase is configured with the wrong redirect URL.

For your **GitHub Pages deployment**, you need to configure Supabase to use your production URL, not localhost.

## Steps to Fix (DO THIS NOW!)

### 1. Go to Supabase Dashboard
Visit: https://app.supabase.com → Your Project → **Authentication** → **URL Configuration**

### 2. Set Site URL (MOST IMPORTANT!)
Replace `http://localhost:3000` with your GitHub Pages URL:
```
https://tbuchboeck.github.io/coffee-tracker/
```

### 3. Add Redirect URLs
Under "Redirect URLs", add your GitHub Pages URL:
```
https://tbuchboeck.github.io/coffee-tracker/**
```

**Optional**: Also add localhost if you want to test locally:
```
http://localhost:3000/**
```

### 4. Save Changes

### 5. Test Again
- Go to your GitHub Pages app (not localhost!)
- Sign out or use incognito mode
- Sign up or sign in
- Should stay on GitHub Pages now! ✅

## What This Does

- **Confirmation emails** will now link to your GitHub Pages URL
- **OAuth redirects** (if you add Google/GitHub login later) will work correctly
- **Password reset emails** will go to the right URL
- You can still test locally since we added `localhost` too

## Testing Locally vs Production

### Local Testing (what you're doing now):
- URL: `http://localhost:3000`
- Confirmation emails work only if you're running locally
- Good for development

### Production (GitHub Pages):
- URL: `https://tbuchboeck.github.io/coffee-tracker/`
- Confirmation emails work for anyone
- This is what your users will use

## Email Confirmation

Supabase can be configured to:
- **Require email confirmation** (more secure, default)
- **Skip confirmation** (easier for testing)

To skip confirmation for testing:
1. Go to **Authentication** → **Providers** → **Email**
2. Turn OFF "Confirm email"

⚠️ **Warning**: This allows anyone to sign up without verifying their email!

## Current Status

Based on your signup, you're testing on `localhost:3000`. The authentication works, but:
- If email confirmation is enabled, the link goes to localhost
- For production, configure the URLs above so emails work correctly

## Quick Fix for Now

If you want to test without email confirmation:
1. Supabase Dashboard → Authentication → Providers → Email
2. Disable "Confirm email"
3. Sign up again with a new email (or delete the old user first)
