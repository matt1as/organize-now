export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      association_members: {
        Row: {
          association_id: string
          id: string
          joined_at: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          association_id: string
          id?: string
          joined_at?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          association_id?: string
          id?: string
          joined_at?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "association_members_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      associations: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          association_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          association_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          association_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_relationships: {
        Row: {
          can_edit: boolean | null
          can_sign_consent: boolean | null
          can_view: boolean | null
          child_member_id: string
          created_at: string | null
          guardian_user_id: string
          id: string
          is_primary: boolean | null
          relationship_type: string
          updated_at: string | null
        }
        Insert: {
          can_edit?: boolean | null
          can_sign_consent?: boolean | null
          can_view?: boolean | null
          child_member_id: string
          created_at?: string | null
          guardian_user_id: string
          id?: string
          is_primary?: boolean | null
          relationship_type?: string
          updated_at?: string | null
        }
        Update: {
          can_edit?: boolean | null
          can_sign_consent?: boolean | null
          can_view?: boolean | null
          child_member_id?: string
          created_at?: string | null
          guardian_user_id?: string
          id?: string
          is_primary?: boolean | null
          relationship_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardian_relationships_child_member_id_fkey"
            columns: ["child_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          association_id: string
          birth_date: string | null
          consents: Json | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          email: string | null
          full_name: string
          guardian_id: string | null
          id: string
          joined_date: string | null
          member_number: string | null
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string | null
          user_profile_id: string | null
        }
        Insert: {
          association_id: string
          birth_date?: string | null
          consents?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          email?: string | null
          full_name: string
          guardian_id?: string | null
          id?: string
          joined_date?: string | null
          member_number?: string | null
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string | null
          user_profile_id?: string | null
        }
        Update: {
          association_id?: string
          birth_date?: string | null
          consents?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          email?: string | null
          full_name?: string
          guardian_id?: string | null
          id?: string
          joined_date?: string | null
          member_number?: string | null
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string | null
          user_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferences?: Json | null
          updated_at?: string | null
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
      member_status: "active" | "inactive" | "pending"
      user_role: "admin" | "leader" | "member" | "guardian"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      member_status: ["active", "inactive", "pending"],
      user_role: ["admin", "leader", "member", "guardian"],
    },
  },
} as const

