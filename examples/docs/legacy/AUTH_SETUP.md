# Authentication Setup Guide

## Problem: "Invalid login credentials"

This error occurs when users exist in `public.users` table but NOT in `auth.users` (Supabase Auth).

## Solution: Create Users in Supabase Auth

### Step 1: Run the Auth User Creation Script

\`\`\`bash
npx tsx scripts/create-auth-users.ts
\`\`\`

This script will:
1. Create users in Supabase Auth (`auth.users`)
2. Auto-verify their emails
3. Sync data to `public.users` table

### Step 2: Verify Users Were Created

Check Supabase Dashboard:
1. Go to **Authentication** → **Users**
2. You should see 6 users:
   - admin@mail.ru
   - regulator@mail.ru
   - ministry@mail.ru
   - institution@mail.ru
   - ciso@mail.ru
   - auditor@mail.ru

### Step 3: Test Login

Try logging in with:
- **Email:** admin@mail.ru
- **Password:** admin@mail.ru

## Test Users

| Role | Email | Password | Organization |
|------|-------|----------|--------------|
| Super Admin | admin@mail.ru | admin@mail.ru | None |
| Regulator Admin | regulator@mail.ru | regulator@mail.ru | None |
| Ministry User | ministry@mail.ru | ministry@mail.ru | Министерство |
| Institution User | institution@mail.ru | institution@mail.ru | ЦИТ |
| CISO | ciso@mail.ru | ciso@mail.ru | ЦИТ |
| Auditor | auditor@mail.ru | auditor@mail.ru | None |

## Troubleshooting

### Error: "Missing required environment variables"

Make sure these environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Error: "User already registered"

This is normal if you run the script multiple times. The script will skip existing users and sync their data to `public.users`.

### Error: "Invalid API key"

Check that `SUPABASE_SERVICE_ROLE_KEY` is correct. This is the **service role key**, not the anon key.

### Users created but can't login

1. Check that email is verified in Supabase Dashboard
2. Check that user exists in both `auth.users` AND `public.users`
3. Try resetting the password in Supabase Dashboard

## Architecture Notes

### Why Two Tables?

- **auth.users** - Managed by Supabase Auth, handles authentication
- **public.users** - Your application data (role, organization, etc.)

### Sync Process

The script ensures both tables are in sync:
1. Creates user in `auth.users` with email/password
2. Gets the user ID from Supabase Auth
3. Inserts/updates `public.users` with the same ID

### Provider Layer

The authentication uses the Provider Pattern:
- `lib/supabase/client.ts` - Client-side Supabase client
- `lib/supabase/server.ts` - Server-side Supabase client
- `lib/supabase/middleware.ts` - Middleware for auth checks

All auth operations go through these providers, not direct Supabase calls.
