# Supabase URL Configuration for Production

## The Problem

When testing authentication locally (`localhost:3000`), Supabase sends confirmation emails with `localhost` links. These won't work when you're not running the app locally.

For your **GitHub Pages deployment**, you need to configure Supabase to use your production URL.

## Steps to Fix

### 1. Go to Supabase Dashboard
Visit: https://app.supabase.com → Your Project → **Authentication** → **URL Configuration**

### 2. Set Site URL
Replace the default with your GitHub Pages URL:
```
https://tbuchboeck.github.io/coffee-tracker/
```

### 3. Add Redirect URLs (Optional but Recommended)
Add both localhost (for testing) and production:
```
http://localhost:3000/**
https://tbuchboeck.github.io/coffee-tracker/**
```

### 4. Save Changes

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
