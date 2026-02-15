# Kesandu Supabase Integration Setup

## Step 1: Run Database Migrations

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project (kesandu)
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy the entire content from `supabase_migrations.sql` in this project
6. Paste it into the SQL editor
7. Click **Run**

This will create all necessary tables with Row Level Security enabled.

## Step 2: Verify Tables Created

After running the migrations, verify these tables exist in the **Table Editor**:
- `interviews`
- `practice_problems`
- `code_reviews`
- `portfolio_items`
- `spaced_repetition`
- `sync_log`

## Step 3: Enable Email Auth (Optional but Recommended)

1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. (Optional) Enable other providers like Google, GitHub, etc.

## Step 4: Update App Configuration

The Supabase config is already set up in `src/config/supabase.js` with:
- URL: `https://mqgmknhvartnuyjcqiwk.supabase.co`
- Anon Key: Already configured

## Step 5: Update CloudSyncScreen (Already Prepared)

Replace the old `useMobileSync` hook with the new `useMobileSyncSupabase`:

```javascript
// OLD
import useMobileSync from '../hooks/useMobileSync';

// NEW
import useMobileSync from '../hooks/useMobileSyncSupabase';
```

## Features Now Available

✅ **Real Authentication**
- Email/password signup and login
- Secure session management
- Password recovery

✅ **Cloud Data Sync**
- All interviews stored in Supabase
- All practice problems synced
- All code reviews backed up
- Portfolio items saved to cloud
- Spaced repetition data persisted

✅ **Multi-Device Sync**
- Same user can access from multiple devices
- Data automatically synced across devices
- Real-time updates

✅ **Security**
- Row-level security (RLS) enabled
- Users can only access their own data
- Encrypted authentication tokens

✅ **Sync Status Tracking**
- Sync log shows all sync operations
- Track pending changes
- View sync history

## API Endpoints Created

The following endpoints are now available:

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/signin` - Login
- `POST /auth/signout` - Logout

### Data Storage
- `GET /interviews` - Get user's interviews
- `POST /interviews` - Save new interview
- `GET /practice_problems` - Get practice attempts
- `GET /code_reviews` - Get code reviews
- `GET /portfolio_items` - Get portfolio
- `GET /spaced_repetition` - Get review schedule

## Testing the Integration

1. Sign up with an email and password
2. Submit a practice problem
3. Leave the app and return - data should persist
4. Log in from another device/browser - same data appears
5. Check Supabase SQL Editor to see your data being stored

## Troubleshooting

**Issue: "ANON_KEY not valid" error**
- The key is already configured in `src/config/supabase.js`
- No action needed

**Issue: "RLS policy prevents access"**
- Ensure you're logged in
- Check that RLS policies were created (step 1)
- Verify user ID matches auth.uid()

**Issue: Tables not appearing**
- Refresh the Supabase dashboard
- Check SQL Editor for any errors during migration
- Verify the migrations ran completely

**Issue: Data not syncing**
- Check that auth status is true (`isAuthenticated`)
- Verify pending changes are being queued
- Check browser console for errors

## Next Steps

1. ✅ Install Supabase client (`npm install` already done)
2. ✅ Create Supabase config file (already created)
3. ✅ Create Supabase-enabled sync hook (already created)
4. **→ RUN SQL MIGRATIONS** (you do this)
5. → Update CloudSyncScreen to use new hook
6. → Update other hooks to use Supabase for data persistence
7. → Test the integration end-to-end

## Support

For Supabase docs: https://supabase.com/docs
For help: Contact your Supabase project support
