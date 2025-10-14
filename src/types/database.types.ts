/**
 * Database Types for Credos Project Management
 * 
 * Auto-generated from Supabase schema.
 * Run: npm run db:generate to update these types.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Core entities
      employees: {
        Row: {
          id: string
          email: string
          full_name: string
          position: string
          direction_id: string
          manager_id: string | null
          hourly_rate: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          position: string
          direction_id: string
          manager_id?: string | null
          hourly_rate: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          position?: string
          direction_id?: string
          manager_id?: string | null
          hourly_rate?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      directions: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          direction_id: string
          manager_id: string
          status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'critical'
          start_date: string | null
          end_date: string | null
          budget: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          direction_id: string
          manager_id: string
          status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          direction_id?: string
          manager_id?: string
          status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          name: string
          description: string | null
          assignee_id: string
          status: 'todo' | 'in_progress' | 'review' | 'done'
          priority: 'low' | 'medium' | 'high' | 'critical'
          estimated_hours: number | null
          actual_hours: number | null
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          description?: string | null
          assignee_id: string
          status?: 'todo' | 'in_progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          estimated_hours?: number | null
          actual_hours?: number | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          description?: string | null
          assignee_id?: string
          status?: 'todo' | 'in_progress' | 'review' | 'done'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          estimated_hours?: number | null
          actual_hours?: number | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          employee_id: string
          task_id: string
          date: string
          hours: number
          description: string | null
          status: 'draft' | 'submitted' | 'approved' | 'rejected'
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          task_id: string
          date: string
          hours: number
          description?: string | null
          status?: 'draft' | 'submitted' | 'approved' | 'rejected'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          task_id?: string
          date?: string
          hours?: number
          description?: string | null
          status?: 'draft' | 'submitted' | 'approved' | 'rejected'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
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
