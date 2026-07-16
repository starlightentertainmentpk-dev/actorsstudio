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
