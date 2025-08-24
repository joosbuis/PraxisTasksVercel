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
      users: {
        Row: {
          id: string
          employee_number: string
          username: string
          name: string | null
          role: string
          temporary_code: string | null
          is_first_login: boolean
          boards: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_number: string
          username: string
          name?: string | null
          role?: string
          temporary_code?: string | null
          is_first_login?: boolean
          boards?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_number?: string
          username?: string
          name?: string | null
          role?: string
          temporary_code?: string | null
          is_first_login?: boolean
          boards?: Json
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          status: string
          priority: string
          assigned_to: string | null
          assigned_to_name: string
          board: string
          deadline: string | null
          activities: Json
          started_by: string | null
          started_by_name: string | null
          started_at: string | null
          picked_up_by: string | null
          picked_up_by_name: string | null
          picked_up_at: string | null
          completed_by: string | null
          completed_by_name: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          status?: string
          priority?: string
          assigned_to?: string | null
          assigned_to_name?: string
          board?: string
          deadline?: string | null
          activities?: Json
          started_by?: string | null
          started_by_name?: string | null
          started_at?: string | null
          picked_up_by?: string | null
          picked_up_by_name?: string | null
          picked_up_at?: string | null
          completed_by?: string | null
          completed_by_name?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: string
          priority?: string
          assigned_to?: string | null
          assigned_to_name?: string
          board?: string
          deadline?: string | null
          activities?: Json
          started_by?: string | null
          started_by_name?: string | null
          started_at?: string | null
          picked_up_by?: string | null
          picked_up_by_name?: string | null
          picked_up_at?: string | null
          completed_by?: string | null
          completed_by_name?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          key: string
          value: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}