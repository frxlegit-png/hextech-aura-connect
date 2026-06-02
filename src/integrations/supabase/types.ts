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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      coverage_areas: {
        Row: {
          created_at: string
          id: string
          latitude: number
          longitude: number
          name: string
          radius: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          radius?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          radius?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_billing: {
        Row: {
          account_id: string | null
          account_state: string
          balance: number
          billing_day: number | null
          billing_end: string | null
          billing_start: string | null
          created_at: string
          frequency: string | null
          ip_address: string | null
          last_paid_date: string | null
          monthly_fee: number
          paid_until: string | null
          signal_strength: string | null
          station_model: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          account_state?: string
          balance?: number
          billing_day?: number | null
          billing_end?: string | null
          billing_start?: string | null
          created_at?: string
          frequency?: string | null
          ip_address?: string | null
          last_paid_date?: string | null
          monthly_fee?: number
          paid_until?: string | null
          signal_strength?: string | null
          station_model?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          account_state?: string
          balance?: number
          billing_day?: number | null
          billing_end?: string | null
          billing_start?: string | null
          created_at?: string
          frequency?: string | null
          ip_address?: string | null
          last_paid_date?: string | null
          monthly_fee?: number
          paid_until?: string | null
          signal_strength?: string | null
          station_model?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          due_date: string
          id: string
          invoice_date: string
          plan: string
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          due_date: string
          id?: string
          invoice_date: string
          plan?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          due_date?: string
          id?: string
          invoice_date?: string
          plan?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      monthly_revenue: {
        Row: {
          amount: number
          created_at: string
          id: string
          logged_by: string | null
          month: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          logged_by?: string | null
          month: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          logged_by?: string | null
          month?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string
          date: string
          description: string
          id: string
          invoice_id: string | null
          method: string
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          invoice_id?: string | null
          method?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          description?: string
          id?: string
          invoice_id?: string | null
          method?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          bank_account: string | null
          ecocash: string | null
          id: string
          omari: string | null
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          ecocash?: string | null
          id?: string
          omari?: string | null
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          ecocash?: string | null
          id?: string
          omari?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_assets: {
        Row: {
          alt_text: string | null
          asset_key: string
          asset_type: string
          asset_url: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          alt_text?: string | null
          asset_key: string
          asset_type?: string
          asset_url: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          alt_text?: string | null
          asset_key?: string
          asset_type?: string
          asset_url?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json | null
          description: string | null
          id: string
          section_key: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          description?: string | null
          id?: string
          section_key: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          description?: string | null
          id?: string
          section_key?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          created_at: string
          customer_name: string | null
          id: string
          message: string | null
          status: string
          subject: string
          ticket_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          id?: string
          message?: string | null
          status?: string
          subject: string
          ticket_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          id?: string
          message?: string | null
          status?: string
          subject?: string
          ticket_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "customer"
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
      app_role: ["admin", "moderator", "user", "customer"],
    },
  },
} as const
