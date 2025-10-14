/**
 * Script to create users in Supabase Auth using Admin API
 * This script creates users in auth.users table and syncs with public.users
 *
 * Usage: npx tsx scripts/create-auth-users.ts
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing required environment variables:")
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗")
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const testUsers = [
  {
    email: "admin@mail.ru",
    password: "admin@mail.ru",
    name: "Системный Администратор",
    role: "super_admin",
    organizationId: null,
  },
  {
    email: "regulator@mail.ru",
    password: "regulator@mail.ru",
    name: "Инспектор ФСТЭК",
    role: "regulator_admin",
    organizationId: null,
  },
  {
    email: "ministry@mail.ru",
    password: "ministry@mail.ru",
    name: "Сотрудник Министерства",
    role: "ministry_user",
    organizationId: "00000000-0000-0000-0000-000000000001",
  },
  {
    email: "institution@mail.ru",
    password: "institution@mail.ru",
    name: "Специалист ЦИТ",
    role: "institution_user",
    organizationId: "00000000-0000-0000-0000-000000000002",
  },
  {
    email: "ciso@mail.ru",
    password: "ciso@mail.ru",
    name: "CISO ЦИТ",
    role: "ciso",
    organizationId: "00000000-0000-0000-0000-000000000002",
  },
  {
    email: "auditor@mail.ru",
    password: "auditor@mail.ru",
    name: "Аудитор ИБ",
    role: "auditor",
    organizationId: null,
  },
]

async function createAuthUsers() {
  console.log("🚀 Creating users in Supabase Auth...\n")
  console.log("📍 Supabase URL:", supabaseUrl)
  console.log("")

  const results = {
    created: 0,
    existing: 0,
    errors: 0,
  }

  for (const user of testUsers) {
    try {
      console.log(`📝 Processing: ${user.email} (${user.role})`)

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-verify email
        user_metadata: {
          name: user.name,
          role: user.role,
        },
      })

      if (authError) {
        if (authError.message.includes("already registered")) {
          console.log(`   ⚠️  Already exists in auth.users`)
          results.existing++
        } else {
          console.error(`   ❌ Auth error:`, authError.message)
          results.errors++
          continue
        }
      } else {
        console.log(`   ✅ Created in auth.users (ID: ${authData.user?.id})`)
        results.created++
      }

      // Get the user ID (either from creation or by looking up existing user)
      let userId = authData?.user?.id

      if (!userId) {
        // User already exists, get their ID
        const { data: existingUser } = await supabase.auth.admin.listUsers()
        const found = existingUser?.users.find((u) => u.email === user.email)
        userId = found?.id
      }

      if (!userId) {
        console.error(`   ❌ Could not get user ID`)
        continue
      }

      // Sync with public.users table
      const { error: dbError } = await supabase.from("users").upsert(
        {
          id: userId,
          email: user.email,
          name: user.name,
          role: user.role,
          organization_id: user.organizationId,
          is_active: true,
        },
        {
          onConflict: "id",
        },
      )

      if (dbError) {
        console.error(`   ❌ Database sync error:`, dbError.message)
        results.errors++
      } else {
        console.log(`   ✅ Synced to public.users`)
      }

      console.log("")
    } catch (err: any) {
      console.error(`   ❌ Unexpected error:`, err.message)
      results.errors++
      console.log("")
    }
  }

  console.log("=".repeat(60))
  console.log("📊 Summary:")
  console.log(`   ✅ Created: ${results.created}`)
  console.log(`   ⚠️  Already existed: ${results.existing}`)
  console.log(`   ❌ Errors: ${results.errors}`)
  console.log("")
  console.log("✨ User creation completed!")
  console.log("")
  console.log("📋 Test Credentials:")
  testUsers.forEach((user) => {
    console.log(`   ${user.role.padEnd(20)} → ${user.email} / ${user.password}`)
  })
  console.log("")
  console.log("🔗 Next steps:")
  console.log("   1. Try logging in at /auth/login")
  console.log("   2. Check Supabase Dashboard → Authentication → Users")
  console.log("   3. Check public.users table for synced data")
}

createAuthUsers().catch((err) => {
  console.error("💥 Fatal error:", err)
  process.exit(1)
})
