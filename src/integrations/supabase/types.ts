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
      classified_listings: {
        Row: {
          area: string | null
          category: string
          condition: string | null
          contact_number: string
          created_at: string
          description: string | null
          emirate: string
          id: string
          images: string[] | null
          price: number | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: string | null
          category: string
          condition?: string | null
          contact_number: string
          created_at?: string
          description?: string | null
          emirate: string
          id?: string
          images?: string[] | null
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string | null
          category?: string
          condition?: string | null
          contact_number?: string
          created_at?: string
          description?: string | null
          emirate?: string
          id?: string
          images?: string[] | null
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          listing_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          listing_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          listing_type?: string
          user_id?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          emirate: string
          id: string
          plate_image_path: string | null
          plate_image_url: string | null
          plate_number: string
          plate_style: string | null
          price: number | null
          status: Database["public"]["Enums"]["listing_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          emirate: string
          id?: string
          plate_image_path?: string | null
          plate_image_url?: string | null
          plate_number: string
          plate_style?: string | null
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          emirate?: string
          id?: string
          plate_image_path?: string | null
          plate_image_url?: string | null
          plate_number?: string
          plate_style?: string | null
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mobile_numbers: {
        Row: {
          carrier: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          phone_number: string
          price: number | null
          status: Database["public"]["Enums"]["listing_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          carrier: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          phone_number: string
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          carrier?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          phone_number?: string
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      motors_listings: {
        Row: {
          area: string | null
          body_type: string | null
          category: string
          community: string | null
          condition: string | null
          contact_number: string
          created_at: string
          description: string | null
          doors: number | null
          emirate: string
          engine_size: string | null
          exterior_color: string | null
          features: Json | null
          fuel_type: string | null
          horsepower: number | null
          id: string
          images: string[] | null
          interior_color: string | null
          make: string | null
          mileage: number | null
          model: string | null
          price: number | null
          regional_specs: string | null
          status: Database["public"]["Enums"]["listing_status"]
          steering_side: string | null
          title: string
          transmission: string | null
          trim: string | null
          updated_at: string
          user_id: string
          warranty: string | null
          year: number | null
        }
        Insert: {
          area?: string | null
          body_type?: string | null
          category: string
          community?: string | null
          condition?: string | null
          contact_number: string
          created_at?: string
          description?: string | null
          doors?: number | null
          emirate: string
          engine_size?: string | null
          exterior_color?: string | null
          features?: Json | null
          fuel_type?: string | null
          horsepower?: number | null
          id?: string
          images?: string[] | null
          interior_color?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          price?: number | null
          regional_specs?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          steering_side?: string | null
          title: string
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          user_id: string
          warranty?: string | null
          year?: number | null
        }
        Update: {
          area?: string | null
          body_type?: string | null
          category?: string
          community?: string | null
          condition?: string | null
          contact_number?: string
          created_at?: string
          description?: string | null
          doors?: number | null
          emirate?: string
          engine_size?: string | null
          exterior_color?: string | null
          features?: Json | null
          fuel_type?: string | null
          horsepower?: number | null
          id?: string
          images?: string[] | null
          interior_color?: string | null
          make?: string | null
          mileage?: number | null
          model?: string | null
          price?: number | null
          regional_specs?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          steering_side?: string | null
          title?: string
          transmission?: string | null
          trim?: string | null
          updated_at?: string
          user_id?: string
          warranty?: string | null
          year?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          plate_call_number: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          plate_call_number?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          plate_call_number?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      property_listings: {
        Row: {
          amenities: Json | null
          area: string | null
          bathrooms: number | null
          bedrooms: number | null
          community: string | null
          contact_number: string
          created_at: string
          description: string | null
          emirate: string
          furnishing: string | null
          id: string
          images: string[] | null
          listing_type: string
          price: number | null
          property_type: string
          size_sqft: number | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amenities?: Json | null
          area?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          community?: string | null
          contact_number: string
          created_at?: string
          description?: string | null
          emirate: string
          furnishing?: string | null
          id?: string
          images?: string[] | null
          listing_type: string
          price?: number | null
          property_type: string
          size_sqft?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amenities?: Json | null
          area?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          community?: string | null
          contact_number?: string
          created_at?: string
          description?: string | null
          emirate?: string
          furnishing?: string | null
          id?: string
          images?: string[] | null
          listing_type?: string
          price?: number | null
          property_type?: string
          size_sqft?: number | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      admin_delete_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      listing_status: "active" | "sold" | "hidden" | "deleted"
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
      app_role: ["admin", "moderator", "user"],
      listing_status: ["active", "sold", "hidden", "deleted"],
    },
  },
} as const
