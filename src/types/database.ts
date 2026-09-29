export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_managers: {
        Row: {
          agency_name: string
          created_at: string
          id: string
          represents_talent_ids: string[]
          user_id: string
        }
        Insert: {
          agency_name: string
          created_at?: string
          id?: string
          represents_talent_ids?: string[]
          user_id: string
        }
        Update: {
          agency_name?: string
          created_at?: string
          id?: string
          represents_talent_ids?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_managers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_at: string
          casting_call_id: string
          cover_note: string | null
          id: string
          status: Database["public"]["Enums"]["application_status"]
          talent_id: string
          updated_at: string
          withdrawn_at: string | null
        }
        Insert: {
          applied_at?: string
          casting_call_id: string
          cover_note?: string | null
          id?: string
          status?: Database["public"]["Enums"]["application_status"]
          talent_id: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          applied_at?: string
          casting_call_id?: string
          cover_note?: string | null
          id?: string
          status?: Database["public"]["Enums"]["application_status"]
          talent_id?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_casting_call_id_fkey"
            columns: ["casting_call_id"]
            isOneToOne: false
            referencedRelation: "casting_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          payload_json: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          payload_json?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          payload_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      auditions: {
        Row: {
          casting_call_id: string
          created_at: string
          feedback: string | null
          id: string
          location_or_link: string | null
          mode: Database["public"]["Enums"]["audition_mode"]
          result: string | null
          scheduled_at: string | null
          score: number | null
          talent_id: string
          updated_at: string
        }
        Insert: {
          casting_call_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          location_or_link?: string | null
          mode?: Database["public"]["Enums"]["audition_mode"]
          result?: string | null
          scheduled_at?: string | null
          score?: number | null
          talent_id: string
          updated_at?: string
        }
        Update: {
          casting_call_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          location_or_link?: string | null
          mode?: Database["public"]["Enums"]["audition_mode"]
          result?: string | null
          scheduled_at?: string | null
          score?: number | null
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditions_casting_call_id_fkey"
            columns: ["casting_call_id"]
            isOneToOne: false
            referencedRelation: "casting_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      casting_calls: {
        Row: {
          application_deadline: string | null
          category_id: string | null
          compensation: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          organization_id: string | null
          producer_id: string
          requirements_json: Json | null
          shoot_date: string | null
          status: Database["public"]["Enums"]["casting_call_status"]
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          category_id?: string | null
          compensation?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          organization_id?: string | null
          producer_id: string
          requirements_json?: Json | null
          shoot_date?: string | null
          status?: Database["public"]["Enums"]["casting_call_status"]
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          category_id?: string | null
          compensation?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          organization_id?: string | null
          producer_id?: string
          requirements_json?: Json | null
          shoot_date?: string | null
          status?: Database["public"]["Enums"]["casting_call_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "casting_calls_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casting_calls_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          duration_sec: number | null
          file_size_bytes: number | null
          id: string
          is_primary: boolean
          metadata_json: Json | null
          owner_id: string
          sort_order: number
          thumbnail_url: string | null
          type: string
          uploaded_at: string
          url: string
        }
        Insert: {
          duration_sec?: number | null
          file_size_bytes?: number | null
          id?: string
          is_primary?: boolean
          metadata_json?: Json | null
          owner_id: string
          sort_order?: number
          thumbnail_url?: string | null
          type: string
          uploaded_at?: string
          url: string
        }
        Update: {
          duration_sec?: number | null
          file_size_bytes?: number | null
          id?: string
          is_primary?: boolean
          metadata_json?: Json | null
          owner_id?: string
          sort_order?: number
          thumbnail_url?: string | null
          type?: string
          uploaded_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"]
          id: string
          payload_json: Json | null
          read_at: string | null
          sent_at: string
          type: string
          user_id: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          id?: string
          payload_json?: Json | null
          read_at?: string | null
          sent_at?: string
          type: string
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"]
          id?: string
          payload_json?: Json | null
          read_at?: string | null
          sent_at?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_tasks: {
        Row: {
          assigned_to_user_id: string | null
          client_id: string | null
          created_at: string
          created_by_user_id: string
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          priority: Database["public"]["Enums"]["task_priority_enum"]
          status: Database["public"]["Enums"]["task_status_enum"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by_user_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          priority?: Database["public"]["Enums"]["task_priority_enum"]
          status?: Database["public"]["Enums"]["task_status_enum"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          client_id?: string | null
          created_at?: string
          created_by_user_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["task_priority_enum"]
          status?: Database["public"]["Enums"]["task_status_enum"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_tasks_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_tasks_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          billing_email: string | null
          city: string
          company_name: string
          country: string
          created_at: string
          id: string
          industry: string
          internal_notes: string | null
          organization_id: string
          phone: string | null
          producer_profile_id: string | null
          status: Database["public"]["Enums"]["client_status_enum"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          billing_email?: string | null
          city?: string
          company_name: string
          country?: string
          created_at?: string
          id?: string
          industry?: string
          internal_notes?: string | null
          organization_id: string
          phone?: string | null
          producer_profile_id?: string | null
          status?: Database["public"]["Enums"]["client_status_enum"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          billing_email?: string | null
          city?: string
          company_name?: string
          country?: string
          created_at?: string
          id?: string
          industry?: string
          internal_notes?: string | null
          organization_id?: string
          phone?: string | null
          producer_profile_id?: string | null
          status?: Database["public"]["Enums"]["client_status_enum"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_producer_profile_id_fkey"
            columns: ["producer_profile_id"]
            isOneToOne: false
            referencedRelation: "producer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_primary: boolean
          notes: string | null
          organization_id: string
          phone: string | null
          role_title: string | null
          whatsapp_number: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          organization_id: string
          phone?: string | null
          role_title?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          organization_id?: string
          phone?: string | null
          role_title?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          author_id: string
          client_id: string
          created_at: string
          id: string
          is_pinned: boolean
          note_text: string
        }
        Insert: {
          author_id: string
          client_id: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          note_text: string
        }
        Update: {
          author_id?: string
          client_id?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          note_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_users: {
        Row: {
          can_approve_talent: boolean
          can_submit_briefs: boolean
          can_view_invoices: boolean
          client_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          can_approve_talent?: boolean
          can_submit_briefs?: boolean
          can_view_invoices?: boolean
          client_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          can_approve_talent?: boolean
          can_submit_briefs?: boolean
          can_view_invoices?: boolean
          client_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_briefs: {
        Row: {
          age_range_max: number | null
          age_range_min: number | null
          budget_range: string | null
          client_id: string
          converted_casting_id: string | null
          created_at: string
          gender_preference: Database["public"]["Enums"]["gender_type"] | null
          id: string
          location: string | null
          organization_id: string
          project_title: string
          raw_brief_text: string
          shoot_dates: string | null
          status: string
          submitted_by_user_id: string
          target_category_id: string | null
          updated_at: string
        }
        Insert: {
          age_range_max?: number | null
          age_range_min?: number | null
          budget_range?: string | null
          client_id: string
          converted_casting_id?: string | null
          created_at?: string
          gender_preference?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          location?: string | null
          organization_id: string
          project_title: string
          raw_brief_text: string
          shoot_dates?: string | null
          status?: string
          submitted_by_user_id: string
          target_category_id?: string | null
          updated_at?: string
        }
        Update: {
          age_range_max?: number | null
          age_range_min?: number | null
          budget_range?: string | null
          client_id?: string
          converted_casting_id?: string | null
          created_at?: string
          gender_preference?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          location?: string | null
          organization_id?: string
          project_title?: string
          raw_brief_text?: string
          shoot_dates?: string | null
          status?: string
          submitted_by_user_id?: string
          target_category_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_briefs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_briefs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_briefs_submitted_by_user_id_fkey"
            columns: ["submitted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      casting_submissions: {
        Row: {
          agent_pitch_note: string | null
          casting_call_id: string
          casting_role_id: string | null
          client_decision: string | null
          client_feedback: string | null
          client_id: string | null
          client_reviewed_at: string | null
          created_at: string
          currency: string
          id: string
          organization_id: string
          proposed_fee: number | null
          stage: string
          submitted_by_user_id: string | null
          talent_id: string
          updated_at: string
        }
        Insert: {
          agent_pitch_note?: string | null
          casting_call_id: string
          casting_role_id?: string | null
          client_decision?: string | null
          client_feedback?: string | null
          client_id?: string | null
          client_reviewed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          organization_id: string
          proposed_fee?: number | null
          stage?: string
          submitted_by_user_id?: string | null
          talent_id: string
          updated_at?: string
        }
        Update: {
          agent_pitch_note?: string | null
          casting_call_id?: string
          casting_role_id?: string | null
          client_decision?: string | null
          client_feedback?: string | null
          client_id?: string | null
          client_reviewed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          organization_id?: string
          proposed_fee?: number | null
          stage?: string
          submitted_by_user_id?: string | null
          talent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "casting_submissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casting_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casting_submissions_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          agency_type: Database["public"]["Enums"]["agency_type_enum"]
          bio: string | null
          brand_color: string | null
          country: string
          created_at: string
          currency: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          timezone: string
          updated_at: string
          website: string | null
        }
        Insert: {
          agency_type?: Database["public"]["Enums"]["agency_type_enum"]
          bio?: string | null
          brand_color?: string | null
          country?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          agency_type?: Database["public"]["Enums"]["agency_type_enum"]
          bio?: string | null
          brand_color?: string | null
          country?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      organization_settings: {
        Row: {
          custom_domain: string | null
          default_commission_rate: number
          email_from_name: string | null
          email_reply_to: string | null
          invoice_notes_default: string | null
          organization_id: string
          public_directory_enabled: boolean
          settings_json: Json
          updated_at: string
        }
        Insert: {
          custom_domain?: string | null
          default_commission_rate?: number
          email_from_name?: string | null
          email_reply_to?: string | null
          invoice_notes_default?: string | null
          organization_id: string
          public_directory_enabled?: boolean
          settings_json?: Json
          updated_at?: string
        }
        Update: {
          custom_domain?: string | null
          default_commission_rate?: number
          email_from_name?: string | null
          email_reply_to?: string | null
          invoice_notes_default?: string | null
          organization_id?: string
          public_directory_enabled?: boolean
          settings_json?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role_enum"]
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role_enum"]
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role_enum"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          call_time: string | null
          client_id: string
          conflict_override: boolean
          created_at: string
          currency: string
          deal_id: string | null
          fee_amount: number
          id: string
          location_address: string | null
          media: string
          organization_id: string
          project_name: string
          shoot_date_end: string
          shoot_date_start: string
          status: Database["public"]["Enums"]["booking_status_enum"]
          talent_id: string
          territory: string
          updated_at: string
          usage_rights: string
          wrap_time: string | null
        }
        Insert: {
          call_time?: string | null
          client_id: string
          conflict_override?: boolean
          created_at?: string
          currency?: string
          deal_id?: string | null
          fee_amount: number
          id?: string
          location_address?: string | null
          media?: string
          organization_id: string
          project_name: string
          shoot_date_end: string
          shoot_date_start: string
          status?: Database["public"]["Enums"]["booking_status_enum"]
          talent_id: string
          territory?: string
          updated_at?: string
          usage_rights: string
          wrap_time?: string | null
        }
        Update: {
          call_time?: string | null
          client_id?: string
          conflict_override?: boolean
          created_at?: string
          currency?: string
          deal_id?: string | null
          fee_amount?: number
          id?: string
          location_address?: string | null
          media?: string
          organization_id?: string
          project_name?: string
          shoot_date_end?: string
          shoot_date_start?: string
          status?: Database["public"]["Enums"]["booking_status_enum"]
          talent_id?: string
          territory?: string
          updated_at?: string
          usage_rights?: string
          wrap_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          agency_commission_amount: number
          casting_call_id: string | null
          client_id: string
          created_at: string
          currency: string
          deal_name: string
          deal_value: number
          end_date: string | null
          id: string
          notes: string | null
          organization_id: string
          payment_terms: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["deal_status_enum"]
          talent_id: string
          talent_payout_amount: number
          updated_at: string
        }
        Insert: {
          agency_commission_amount: number
          casting_call_id?: string | null
          client_id: string
          created_at?: string
          currency?: string
          deal_name: string
          deal_value: number
          end_date?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          payment_terms?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["deal_status_enum"]
          talent_id: string
          talent_payout_amount: number
          updated_at?: string
        }
        Update: {
          agency_commission_amount?: number
          casting_call_id?: string | null
          client_id?: string
          created_at?: string
          currency?: string
          deal_name?: string
          deal_value?: number
          end_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          payment_terms?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["deal_status_enum"]
          talent_id?: string
          talent_payout_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_casting_call_id_fkey"
            columns: ["casting_call_id"]
            isOneToOne: false
            referencedRelation: "casting_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      holds: {
        Row: {
          challenge_expires_at: string | null
          challenged_at: string | null
          client_id: string
          created_at: string
          hold_date_end: string
          hold_date_start: string
          id: string
          notes: string | null
          organization_id: string
          priority_level: number
          project_title: string
          status: Database["public"]["Enums"]["hold_status_enum"]
          talent_id: string
        }
        Insert: {
          challenge_expires_at?: string | null
          challenged_at?: string | null
          client_id: string
          created_at?: string
          hold_date_end: string
          hold_date_start: string
          id?: string
          notes?: string | null
          organization_id: string
          priority_level?: number
          project_title: string
          status?: Database["public"]["Enums"]["hold_status_enum"]
          talent_id: string
        }
        Update: {
          challenge_expires_at?: string | null
          challenged_at?: string | null
          client_id?: string
          created_at?: string
          hold_date_end?: string
          hold_date_start?: string
          id?: string
          notes?: string | null
          organization_id?: string
          priority_level?: number
          project_title?: string
          status?: Database["public"]["Enums"]["hold_status_enum"]
          talent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holds_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holds_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      producer_profiles: {
        Row: {
          bio: string | null
          company_name: string
          company_type: string | null
          created_at: string
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          representative_note: string | null
          updated_at: string
          user_id: string
          verification_docs_url: string | null
          verified: boolean
          website: string | null
        }
        Insert: {
          bio?: string | null
          company_name: string
          company_type?: string | null
          created_at?: string
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          representative_note?: string | null
          updated_at?: string
          user_id: string
          verification_docs_url?: string | null
          verified?: boolean
          website?: string | null
        }
        Update: {
          bio?: string | null
          company_name?: string
          company_type?: string | null
          created_at?: string
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          representative_note?: string | null
          updated_at?: string
          user_id?: string
          verification_docs_url?: string | null
          verified?: boolean
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_profiles: {
        Row: {
          agent_manager_id: string | null
          bio: string | null
          category_id: string | null
          city: string | null
          country: string
          created_at: string
          dob: string | null
          experience_years: number
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          height_cm: number | null
          id: string
          is_available: boolean
          is_premium: boolean
          languages: string[]
          measurements_json: Json | null
          skills: string[]
          slug: string | null
          stage_name: string | null
          sub_category_id: string | null
          subscription_tier: string
          union_member: boolean
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          weight_kg: number | null
        }
        Insert: {
          agent_manager_id?: string | null
          bio?: string | null
          category_id?: string | null
          city?: string | null
          country?: string
          created_at?: string
          dob?: string | null
          experience_years?: number
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id?: string
          is_available?: boolean
          is_premium?: boolean
          languages?: string[]
          measurements_json?: Json | null
          skills?: string[]
          slug?: string | null
          stage_name?: string | null
          sub_category_id?: string | null
          subscription_tier?: string
          union_member?: boolean
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          weight_kg?: number | null
        }
        Update: {
          agent_manager_id?: string | null
          bio?: string | null
          category_id?: string | null
          city?: string | null
          country?: string
          created_at?: string
          dob?: string | null
          experience_years?: number
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id?: string
          is_available?: boolean
          is_premium?: boolean
          languages?: string[]
          measurements_json?: Json | null
          skills?: string[]
          slug?: string | null
          stage_name?: string | null
          sub_category_id?: string | null
          subscription_tier?: string
          union_member?: boolean
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "talent_profiles_agent_manager_fk"
            columns: ["agent_manager_id"]
            isOneToOne: false
            referencedRelation: "agent_managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_profiles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_profiles_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "talent_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          locale: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          locale?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          locale?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
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
      deal_status_enum:
        | "lead"
        | "proposal"
        | "negotiation"
        | "approved"
        | "contract"
        | "booked"
        | "completed"
        | "invoiced"
        | "paid"
        | "cancelled"
      booking_status_enum: "draft" | "confirmed" | "completed" | "cancelled"
      hold_status_enum: "active" | "challenged" | "confirmed" | "released" | "expired"
      client_status_enum: "lead" | "prospect" | "active" | "inactive"
      task_priority_enum: "low" | "medium" | "high" | "urgent"
      task_status_enum: "todo" | "in_progress" | "completed"
      agency_type_enum:
        | "talent_agency"
        | "modeling_agency"
        | "casting_agency"
        | "entertainment_agency"
        | "influencer_agency"
        | "creator_management"
        | "sports_talent"
        | "other"
      organization_role_enum:
        | "super_admin"
        | "agency_owner"
        | "agency_admin"
        | "agent"
        | "casting_manager"
        | "talent_manager"
        | "finance_manager"
        | "viewer"
      application_status:
        | "applied"
        | "shortlisted"
        | "audition"
        | "selected"
        | "rejected"
        | "withdrawn"
      audition_mode: "in_person" | "self_tape" | "video_call"
      casting_call_status: "draft" | "open" | "closed" | "cancelled"
      gender_type: "male" | "female" | "non_binary" | "prefer_not_to_say"
      notification_channel: "email" | "whatsapp" | "sms" | "in_app"
      user_role:
        | "super_admin"
        | "studio_admin"
        | "studio_staff"
        | "talent"
        | "agent_manager"
        | "producer_brand"
        | "casting_director"
        | "client"
      verification_status:
        | "pending"
        | "under_review"
        | "interview_scheduled"
        | "audition_scheduled"
        | "approved"
        | "rejected"
        | "blacklisted"
        | "inactive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      deal_status_enum: [
        "lead",
        "proposal",
        "negotiation",
        "approved",
        "contract",
        "booked",
        "completed",
        "invoiced",
        "paid",
        "cancelled",
      ],
      booking_status_enum: ["draft", "confirmed", "completed", "cancelled"],
      hold_status_enum: ["active", "challenged", "confirmed", "released", "expired"],
      client_status_enum: ["lead", "prospect", "active", "inactive"],
      task_priority_enum: ["low", "medium", "high", "urgent"],
      task_status_enum: ["todo", "in_progress", "completed"],
      agency_type_enum: [
        "talent_agency",
        "modeling_agency",
        "casting_agency",
        "entertainment_agency",
        "influencer_agency",
        "creator_management",
        "sports_talent",
        "other",
      ],
      organization_role_enum: [
        "super_admin",
        "agency_owner",
        "agency_admin",
        "agent",
        "casting_manager",
        "talent_manager",
        "finance_manager",
        "viewer",
      ],
      application_status: [
        "applied",
        "shortlisted",
        "audition",
        "selected",
        "rejected",
        "withdrawn",
      ],
      audition_mode: ["in_person", "self_tape", "video_call"],
      casting_call_status: ["draft", "open", "closed", "cancelled"],
      gender_type: ["male", "female", "non_binary", "prefer_not_to_say"],
      notification_channel: ["email", "whatsapp", "sms", "in_app"],
      user_role: [
        "super_admin",
        "studio_admin",
        "studio_staff",
        "talent",
        "agent_manager",
        "producer_brand",
        "casting_director",
        "client",
      ],
      verification_status: [
        "pending",
        "under_review",
        "interview_scheduled",
        "audition_scheduled",
        "approved",
        "rejected",
        "blacklisted",
        "inactive",
      ],
    },
  },
} as const
