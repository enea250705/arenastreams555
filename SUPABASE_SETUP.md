# Supabase Setup Guide

## The Issue
You're getting the error: `Could not find the 'teamA' column of 'matches' in the schema cache`

This happens because the Supabase environment variables are not configured.

## Solution

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and service role key

### 2. Create Environment File
Create a `.env` file in the project root with:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server Configuration  
PORT=4000
NODE_ENV=production
```

### 3. Apply Database Schema
Run this SQL in your Supabase SQL Editor:

```sql
-- Matches table (for admin-created matches)
CREATE TABLE IF NOT EXISTS public.matches (
  id text PRIMARY KEY,
  sport text NOT NULL,
  teamA text NOT NULL,
  teamB text NOT NULL,
  competition text NOT NULL,
  date timestamptz NOT NULL,
  embed_urls jsonb DEFAULT '[]'::jsonb,
  teamABadge text,
  teamBBadge text,
  status text DEFAULT 'upcoming',
  slug text UNIQUE,
  source text DEFAULT 'admin',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Overrides table (extra servers for fetched matches)
CREATE TABLE IF NOT EXISTS public.overrides (
  slug text PRIMARY KEY,
  embed_urls jsonb NOT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overrides ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_matches_updated_at ON public.matches;
CREATE TRIGGER set_matches_updated_at BEFORE UPDATE ON public.matches
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_overrides_updated_at ON public.overrides;
CREATE TRIGGER set_overrides_updated_at BEFORE UPDATE ON public.overrides
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 4. Restart Server
After setting up the environment variables:

```bash
npm start
```

### 5. Test Admin Panel
Visit: `http://localhost:4000/admin`

The admin panel should now work without the "teamA column" error.

## Alternative: Use Local JSON Storage
If you don't want to use Supabase, you can modify the code to use local JSON files instead. Let me know if you'd prefer this approach.
