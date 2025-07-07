export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      game_sessions: {
        Row: {
          created_at: string
          criminal_score: number
          current_phase: string
          current_round: number
          id: string
          players_score: number
          session_name: string
          status: string
          time_left: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          criminal_score?: number
          current_phase?: string
          current_round?: number
          id?: string
          players_score?: number
          session_name: string
          status?: string
          time_left?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          criminal_score?: number
          current_phase?: string
          current_round?: number
          id?: string
          players_score?: number
          session_name?: string
          status?: string
          time_left?: number
          updated_at?: string
        }
        Relationships: []
      }
      layouts: {
        Row: {
          canvas_data: Json
          created_at: string
          html_output: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          canvas_data: Json
          created_at?: string
          html_output?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          canvas_data?: Json
          created_at?: string
          html_output?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_submissions: {
        Row: {
          id: string
          player_name: string
          round_number: number
          score: number
          session_id: string
          strategy: string
          submitted_at: string
        }
        Insert: {
          id?: string
          player_name: string
          round_number: number
          score?: number
          session_id: string
          strategy: string
          submitted_at?: string
        }
        Update: {
          id?: string
          player_name?: string
          round_number?: number
          score?: number
          session_id?: string
          strategy?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_submissions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      round_results: {
        Row: {
          created_at: string
          criminal_response: string
          id: string
          round_number: number
          session_id: string
        }
        Insert: {
          created_at?: string
          criminal_response: string
          id?: string
          round_number: number
          session_id: string
        }
        Update: {
          created_at?: string
          criminal_response?: string
          id?: string
          round_number?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_player_roles: {
        Row: {
          assigned_at: string
          id: string
          player_name: string
          role: Database["public"]["Enums"]["dutch_legal_role"]
          session_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          player_name: string
          role: Database["public"]["Enums"]["dutch_legal_role"]
          session_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          player_name?: string
          role?: Database["public"]["Enums"]["dutch_legal_role"]
          session_id?: string
        }
        Relationships: []
      }
      session_players: {
        Row: {
          id: string
          is_ready: boolean
          joined_at: string
          player_name: string
          session_id: string
        }
        Insert: {
          id?: string
          is_ready?: boolean
          joined_at?: string
          player_name: string
          session_id: string
        }
        Update: {
          id?: string
          is_ready?: boolean
          joined_at?: string
          player_name?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_players_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_random_role: {
        Args: { p_session_id: string; p_player_name: string }
        Returns: Database["public"]["Enums"]["dutch_legal_role"]
      }
    }
    Enums: {
      dutch_legal_role:
        | "Advocaat"
        | "Rechter"
        | "Officier van Justitie"
        | "Notaris"
        | "Deurwaarder"
        | "Griffier"
        | "Procureur-Generaal"
        | "Advocaat-Generaal"
        | "Rechtsbijstand"
        | "Jurist"
        | "Rechtsbankpresident"
        | "Kantonrechter"
        | "Strafrechter"
        | "Civielrechter"
        | "Bestuursrechter"
        | "Belastingadviseur"
        | "Juridisch Adviseur"
        | "Compliance Officer"
        | "Contractmanager"
        | "Juridisch Secretaris"
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
      dutch_legal_role: [
        "Advocaat",
        "Rechter",
        "Officier van Justitie",
        "Notaris",
        "Deurwaarder",
        "Griffier",
        "Procureur-Generaal",
        "Advocaat-Generaal",
        "Rechtsbijstand",
        "Jurist",
        "Rechtsbankpresident",
        "Kantonrechter",
        "Strafrechter",
        "Civielrechter",
        "Bestuursrechter",
        "Belastingadviseur",
        "Juridisch Adviseur",
        "Compliance Officer",
        "Contractmanager",
        "Juridisch Secretaris",
      ],
    },
  },
} as const
