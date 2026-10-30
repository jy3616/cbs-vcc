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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applied_at: string
          firm: string
          id: string
          job_url: string
          title: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          firm?: string
          id?: string
          job_url: string
          title?: string
          user_id?: string
        }
        Update: {
          applied_at?: string
          firm?: string
          id?: string
          job_url?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      broken_link_reports: {
        Row: {
          id: string
          posting_id: string
          reported_at: string
          resolved: boolean
          user_id: string
        }
        Insert: {
          id?: string
          posting_id: string
          reported_at?: string
          resolved?: boolean
          user_id: string
        }
        Update: {
          id?: string
          posting_id?: string
          reported_at?: string
          resolved?: boolean
          user_id?: string
        }
        Relationships: []
      }
      job_analyses: {
        Row: {
          created_at: string
          fit_score: number
          id: string
          job_url: string
          result: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          fit_score?: number
          id?: string
          job_url: string
          result?: Json
          user_id?: string
        }
        Update: {
          created_at?: string
          fit_score?: number
          id?: string
          job_url?: string
          result?: Json
          user_id?: string
        }
        Relationships: []
      }
      job_runs: {
        Row: {
          last_result: Json | null
          last_run_at: string | null
          locked_until: string | null
          name: string
          paused_reason: string
        }
        Insert: {
          last_result?: Json | null
          last_run_at?: string | null
          locked_until?: string | null
          name: string
          paused_reason?: string
        }
        Update: {
          last_result?: Json | null
          last_run_at?: string | null
          locked_until?: string | null
          name?: string
          paused_reason?: string
        }
        Relationships: []
      }
      postings: {
        Row: {
          alumni: string
          created_at: string
          date_posted: string
          deadline: string | null
          expired: boolean
          firm: string
          firm_type: string
          focus: string
          fund_stage: string
          hidden: boolean
          id: string
          last_checked_at: string | null
          last_verified_at: string
          location: string
          mba_specific: boolean
          mentions_mba: boolean
          needs_review: boolean
          notes: string
          nyc: boolean
          review_reason: string
          role_type: string
          rolling: boolean
          sectors: string[]
          shared_by_vcc: boolean
          source_id: string | null
          source_job_id: string | null
          title: string
          url: string
        }
        Insert: {
          alumni?: string
          created_at?: string
          date_posted?: string
          deadline?: string | null
          expired?: boolean
          firm: string
          firm_type?: string
          focus?: string
          fund_stage?: string
          hidden?: boolean
          id?: string
          last_checked_at?: string | null
          last_verified_at?: string
          location?: string
          mba_specific?: boolean
          mentions_mba?: boolean
          needs_review?: boolean
          notes?: string
          nyc?: boolean
          review_reason?: string
          role_type?: string
          rolling?: boolean
          sectors?: string[]
          shared_by_vcc?: boolean
          source_id?: string | null
          source_job_id?: string | null
          title: string
          url: string
        }
        Update: {
          alumni?: string
          created_at?: string
          date_posted?: string
          deadline?: string | null
          expired?: boolean
          firm?: string
          firm_type?: string
          focus?: string
          fund_stage?: string
          hidden?: boolean
          id?: string
          last_checked_at?: string | null
          last_verified_at?: string
          location?: string
          mba_specific?: boolean
          mentions_mba?: boolean
          needs_review?: boolean
          notes?: string
          nyc?: boolean
          review_reason?: string
          role_type?: string
          rolling?: boolean
          sectors?: string[]
          shared_by_vcc?: boolean
          source_id?: string | null
          source_job_id?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "postings_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          content: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          content?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scrape_runs: {
        Row: {
          ended_at: string | null
          errors: Json
          id: string
          postings_added: number
          postings_expired: number
          postings_updated: number
          run_date: string
          source_results: Json
          sources_checked: number
          sources_expected: number
          sources_succeeded: number
          started_at: string
          status: string
        }
        Insert: {
          ended_at?: string | null
          errors?: Json
          id?: string
          postings_added?: number
          postings_expired?: number
          postings_updated?: number
          run_date: string
          source_results?: Json
          sources_checked?: number
          sources_expected?: number
          sources_succeeded?: number
          started_at?: string
          status?: string
        }
        Update: {
          ended_at?: string | null
          errors?: Json
          id?: string
          postings_added?: number
          postings_expired?: number
          postings_updated?: number
          run_date?: string
          source_results?: Json
          sources_checked?: number
          sources_expected?: number
          sources_succeeded?: number
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      scrape_source_runs: {
        Row: {
          ended_at: string | null
          run_id: string
          source_id: string
          started_at: string
          status: string
        }
        Insert: {
          ended_at?: string | null
          run_id: string
          source_id: string
          started_at?: string
          status?: string
        }
        Update: {
          ended_at?: string | null
          run_id?: string
          source_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrape_source_runs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "scrape_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scrape_source_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          active: boolean
          ats_board: string
          ats_type: string
          careers_url: string
          created_at: string
          firm_name: string
          firm_type: string
          id: string
          needs_review: boolean
          review_reason: string
          verified_at: string | null
        }
        Insert: {
          active?: boolean
          ats_board?: string
          ats_type?: string
          careers_url: string
          created_at?: string
          firm_name: string
          firm_type?: string
          id?: string
          needs_review?: boolean
          review_reason?: string
          verified_at?: string | null
        }
        Update: {
          active?: boolean
          ats_board?: string
          ats_type?: string
          careers_url?: string
          created_at?: string
          firm_name?: string
          firm_type?: string
          id?: string
          needs_review?: boolean
          review_reason?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      student_bookmarks: {
        Row: {
          job_url: string
          saved_at: string
          snapshot: Json
          status: string
          user_id: string
        }
        Insert: {
          job_url: string
          saved_at?: string
          snapshot?: Json
          status?: string
          user_id: string
        }
        Update: {
          job_url?: string
          saved_at?: string
          snapshot?: Json
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      student_preferences: {
        Row: {
          digest_enabled: boolean
          filters: Json
          resume_account: boolean
          user_id: string
        }
        Insert: {
          digest_enabled?: boolean
          filters?: Json
          resume_account?: boolean
          user_id: string
        }
        Update: {
          digest_enabled?: boolean
          filters?: Json
          resume_account?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      board_last_verified: { Args: never; Returns: string }
      claim_source_scrape: {
        Args: { p_date: string; p_source: string }
        Returns: string
      }
      finish_source_scrape: {
        Args: {
          p_error?: string
          p_jobs: Json
          p_run: string
          p_source: string
        }
        Returns: Json
      }
      grant_student_admin: {
        Args: { target_email: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_cbs_student: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
