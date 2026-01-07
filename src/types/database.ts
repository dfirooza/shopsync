export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          name: string
          category: string
          address: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          address: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          address?: string
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          business_id: string
          name: string
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          price?: number
          created_at?: string
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

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
