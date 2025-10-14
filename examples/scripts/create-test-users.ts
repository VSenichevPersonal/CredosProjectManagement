/**
 * Script to create test users in Supabase Auth
 * Run this script to automatically create test users with verified emails
 *
 * Usage: node scripts/create-test-users.ts
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
  },
  {
    email: "regulator@mail.ru",
    password: "regulator@mail.ru",
    name: "Инспектор ФСТЭК",
    role: "regulator_admin",
  },
  {
    email: "ministry@mail.ru",
    password: "ministry@mail.ru",
    name: "Сотрудник Министерства",
    role: "ministry_user",
  },
  {
    email: "institution@mail.ru",
    password: "institution@mail.ru",
    name: "Специалист ЦИТ",
    role: "institution_user",
  },
  {
    email: "ciso@mail.ru",
    password: "ciso@mail.ru",
    name: "CISO ЦИТ",
    role: "ciso",
  },
  {
    email: "auditor@mail.ru",
    password: "auditor@mail.ru",
    name: "Аудитор ИБ",
    role: "auditor",
  },
]

async function createTestUsers() {
  console.log("🚀 Creating test users in Supabase Auth...\n")

  for (const user of testUsers) {
    try {
      // Create user in Supabase Auth with email verification
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-verify email
        user_metadata: {
          name: user.name,
          role: user.role,
        },
      })

      if (error) {
        if (error.message.includes("already registered")) {
          console.log(`⚠️  User ${user.email} already exists`)
        } else {
          console.error(`❌ Error creating ${user.email}:`, error.message)
        }
      } else {
        console.log(`✅ Created user: ${user.email} (${user.role})`)
        console.log(`   ID: ${data.user?.id}`)
      }
    } catch (err) {
      console.error(`❌ Unexpected error for ${user.email}:`, err)
    }
  }

  console.log("\n✨ Test users creation completed!")
  console.log("\n📋 Test Credentials:")
  testUsers.forEach((user) => {
    console.log(`   ${user.role.padEnd(20)} → ${user.email} / ${user.password}`)
  })
}

createTestUsers()
