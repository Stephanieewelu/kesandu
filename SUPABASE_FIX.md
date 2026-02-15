# 🔧 Supabase Database Fix

## ⚠️ Issue
Your app is missing the `users` table in the Supabase database, causing the error:
```
Could not find the 'email' column of 'users' in the schema cache
```

## ✅ Solution - Run This SQL in Supabase

### **Step 1: Go to Supabase SQL Editor**
1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `mqgmknhvartnuyjcqiwk`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### **Step 2: Run This SQL**

Copy and paste this entire SQL script and click **RUN**:

```sql
-- Users table (public profiles)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL,
  email text NOT NULL,
  name text NOT NULL,
  tier text DEFAULT 'free',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT users_email_unique UNIQUE (email)
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable RLS for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

### **Step 3: Update Practice Problems Table**

If you already have a `practice_problems` table, run this to update it:

```sql
-- Add missing columns to practice_problems
ALTER TABLE public.practice_problems
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS constraints text,
  ADD COLUMN IF NOT EXISTS examples text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Make problem_id, role, and solution optional
ALTER TABLE public.practice_problems
  ALTER COLUMN problem_id DROP NOT NULL,
  ALTER COLUMN role DROP NOT NULL,
  ALTER COLUMN solution DROP NOT NULL;
```

### **Step 4: Verify Tables**

Run this to check your tables:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- ✅ users
- ✅ practice_problems
- ✅ interviews
- ✅ code_reviews
- ✅ portfolio_items
- ✅ spaced_repetition
- ✅ sync_log

---

## 🚀 After Running SQL

1. **Refresh your Vercel deployment** (it should work now!)
2. **Test user registration** - Create a new account
3. **Test practice problems** - Generate and save a problem
4. **Check Dashboard** - Your problems should appear

---

## 🔍 Troubleshooting

### If you still see errors:

**Check if users table exists:**
```sql
SELECT * FROM public.users LIMIT 1;
```

**Check table structure:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND table_schema = 'public';
```

**View your auth users:**
```sql
SELECT id, email, created_at
FROM auth.users;
```

---

## 📞 Need Help?

If you still have issues after running the SQL:
1. Check the Supabase SQL Editor output for errors
2. Verify your Supabase URL and anon key are correct in `src/config/supabase.js`
3. Make sure RLS policies are enabled
4. Check browser console for detailed error messages
