/**
 * Supabase Client Configuration
 * 
 * Provides configured Supabase client for Credos Project Management.
 * Includes auth helpers for Next.js App Router.
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Client-side Supabase client
export const createClient = () => createClientComponentClient()

// Server-side Supabase client with cookies
export const createServerClient = () => 
  createServerComponentClient({ cookies })

// Database types will be generated from Supabase
export type Database = {
  public: {
    Tables: {
      // Will be populated by supabase gen types
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
