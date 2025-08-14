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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      grocery_aisles: {
        Row: {
          created_at: string
          display_order: number
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          display_order: number
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: number
          name?: string
        }
        Relationships: []
      }
      grocery_list_items: {
        Row: {
          created_at: string | null
          grocery_list_id: string | null
          id: string
          ingredient_id: number | null
          is_checked: boolean | null
          is_manual: boolean | null
          manual_name: string | null
          notes: string | null
          quantity: number
          source_recipes: string[] | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          grocery_list_id?: string | null
          id?: string
          ingredient_id?: number | null
          is_checked?: boolean | null
          is_manual?: boolean | null
          manual_name?: string | null
          notes?: string | null
          quantity: number
          source_recipes?: string[] | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          grocery_list_id?: string | null
          id?: string
          ingredient_id?: number | null
          is_checked?: boolean | null
          is_manual?: boolean | null
          manual_name?: string | null
          notes?: string | null
          quantity?: number
          source_recipes?: string[] | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grocery_list_items_grocery_list_id_fkey"
            columns: ["grocery_list_id"]
            isOneToOne: false
            referencedRelation: "grocery_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_list_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_list_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_list_recipes: {
        Row: {
          added_at: string | null
          grocery_list_id: string | null
          id: string
          recipe_id: string | null
          servings_multiplier: number | null
        }
        Insert: {
          added_at?: string | null
          grocery_list_id?: string | null
          id?: string
          recipe_id?: string | null
          servings_multiplier?: number | null
        }
        Update: {
          added_at?: string | null
          grocery_list_id?: string | null
          id?: string
          recipe_id?: string | null
          servings_multiplier?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grocery_list_recipes_grocery_list_id_fkey"
            columns: ["grocery_list_id"]
            isOneToOne: false
            referencedRelation: "grocery_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_list_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_completed: boolean
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          name: string
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          created_at: string
          display_order: number | null
          grocery_aisle_id: number | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          grocery_aisle_id?: number | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          grocery_aisle_id?: number | null
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_grocery_aisle_id_fkey"
            columns: ["grocery_aisle_id"]
            isOneToOne: false
            referencedRelation: "grocery_aisles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: number
          ingredient_id: number
          note: string | null
          recipe_id: string | null
          unit_amount: number | null
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          ingredient_id: number
          note?: string | null
          recipe_id?: string | null
          unit_amount?: number | null
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          ingredient_id?: number
          note?: string | null
          recipe_id?: string | null
          unit_amount?: number | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          image_url: string | null
          name: string
          servings: number
          steps: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string | null
          name: string
          servings: number
          steps: string[]
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string | null
          name?: string
          servings?: number
          steps?: string[]
        }
        Relationships: []
      }
      units: {
        Row: {
          abbreviation: string
          base_conversion_factor: number | null
          created_at: string | null
          id: string
          name: string
          system: string
          type: string
        }
        Insert: {
          abbreviation?: string
          base_conversion_factor?: number | null
          created_at?: string | null
          id?: string
          name: string
          system: string
          type: string
        }
        Update: {
          abbreviation?: string
          base_conversion_factor?: number | null
          created_at?: string | null
          id?: string
          name?: string
          system?: string
          type?: string
        }
        Relationships: []
      }
      units_backup_before_fix: {
        Row: {
          abbreviation: string | null
          base_conversion_factor: number | null
          created_at: string | null
          display_order: number | null
          id: string | null
          name: string | null
          system: string | null
          type: string | null
        }
        Insert: {
          abbreviation?: string | null
          base_conversion_factor?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string | null
          name?: string | null
          system?: string | null
          type?: string | null
        }
        Update: {
          abbreviation?: string | null
          base_conversion_factor?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string | null
          name?: string | null
          system?: string | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_manual_item_to_grocery_list: {
        Args: {
          list_id: string
          ingredient_name: string
          quantity: number
          unit_name: string
          notes?: string
        }
        Returns: string
      }
      add_recipe_to_grocery_list: {
        Args: {
          list_id: string
          p_recipe_id: string
          servings_multiplier?: number
        }
        Returns: boolean
      }
      delete_old_anonymous_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          deleted_count: number
        }[]
      }
      find_best_unit_for_quantity: {
        Args: {
          p_base_quantity: number
          p_unit_type: string
          p_preferred_system?: string
        }
        Returns: string
      }
      generate_simple_anonymous_username: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_public_and_user_recipes: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          image_url: string
          created_by: string
          steps: string[]
          servings: number
          created_at: string
        }[]
      }
      get_public_recipes: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          image_url: string
          created_by: string
          steps: string[]
          servings: number
          created_at: string
        }[]
      }
      regenerate_grocery_list_items: {
        Args: { list_id: string }
        Returns: undefined
      }
      remove_recipe_from_grocery_list: {
        Args: { list_id: string; recipe_id: number }
        Returns: boolean
      }
      trigger_delete_old_anonymous_users: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
