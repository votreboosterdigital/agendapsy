export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          slug: string
          full_name: string
          email: string
          phone: string | null
          bio: string | null
          specialty: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          created_at: string
        }
        Insert: {
          id: string
          slug: string
          full_name: string
          email: string
          phone?: string | null
          bio?: string | null
          specialty?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          full_name?: string
          email?: string
          phone?: string | null
          bio?: string | null
          specialty?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          created_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          id: string
          therapist_id: string
          full_name: string
          email: string
          whatsapp: string | null
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          therapist_id: string
          full_name: string
          email: string
          whatsapp?: string | null
          status?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          therapist_id?: string
          full_name?: string
          email?: string
          whatsapp?: string | null
          status?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          id: string
          therapist_id: string
          patient_id: string | null
          patient_name: string
          patient_email: string
          patient_whatsapp: string | null
          service_name: string
          price_usd: number | null
          starts_at: string
          ends_at: string
          status: string
          notes: string | null
          reminder_24h_sent: boolean
          reminder_1h_sent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          therapist_id: string
          patient_id?: string | null
          patient_name: string
          patient_email: string
          patient_whatsapp?: string | null
          service_name: string
          price_usd?: number | null
          starts_at: string
          ends_at: string
          status?: string
          notes?: string | null
          reminder_24h_sent?: boolean
          reminder_1h_sent?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          therapist_id?: string
          patient_id?: string | null
          patient_name?: string
          patient_email?: string
          patient_whatsapp?: string | null
          service_name?: string
          price_usd?: number | null
          starts_at?: string
          ends_at?: string
          status?: string
          notes?: string | null
          reminder_24h_sent?: boolean
          reminder_1h_sent?: boolean
          created_at?: string
        }
        Relationships: []
      }
      session_notes: {
        Row: {
          id: string
          appointment_id: string
          therapist_id: string
          subjective: string | null
          objective: string | null
          assessment: string | null
          plan: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          therapist_id: string
          subjective?: string | null
          objective?: string | null
          assessment?: string | null
          plan?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          therapist_id?: string
          subjective?: string | null
          objective?: string | null
          assessment?: string | null
          plan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          id: string
          therapist_id: string
          name: string
          duration_min: number
          price_usd: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          therapist_id: string
          name: string
          duration_min?: number
          price_usd: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          therapist_id?: string
          name?: string
          duration_min?: number
          price_usd?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      availability_rules: {
        Row: {
          id: string
          therapist_id: string
          day_of_week: number
          start_time: string
          end_time: string
          session_duration_min: number
          created_at: string
        }
        Insert: {
          id?: string
          therapist_id: string
          day_of_week: number
          start_time: string
          end_time: string
          session_duration_min?: number
          created_at?: string
        }
        Update: {
          id?: string
          therapist_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          session_duration_min?: number
          created_at?: string
        }
        Relationships: []
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
