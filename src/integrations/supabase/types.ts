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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      article_images: {
        Row: {
          article_id: string
          created_at: string
          id: string
          image_url: string
          note: string | null
          status: string
          updated_at: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          image_url: string
          note?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          image_url?: string
          note?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      article_measurements: {
        Row: {
          article_id: string
          created_at: string
          f: number | null
          id: string
          l: number | null
          l_xl: number | null
          m: number | null
          measurement: string
          s: number | null
          s_m: number | null
          updated_at: string
          xl: number | null
          xs: number | null
        }
        Insert: {
          article_id: string
          created_at?: string
          f?: number | null
          id?: string
          l?: number | null
          l_xl?: number | null
          m?: number | null
          measurement: string
          s?: number | null
          s_m?: number | null
          updated_at?: string
          xl?: number | null
          xs?: number | null
        }
        Update: {
          article_id?: string
          created_at?: string
          f?: number | null
          id?: string
          l?: number | null
          l_xl?: number | null
          m?: number | null
          measurement?: string
          s?: number | null
          s_m?: number | null
          updated_at?: string
          xl?: number | null
          xs?: number | null
        }
        Relationships: []
      }
      article_variations: {
        Row: {
          application1: number
          application2: number
          article_id: string
          color: string
          created_at: string
          cutting: number
          finishing: number
          id: string
          qc: number
          qty_order: number
          ready_to_shipping: number
          sewing: number
          shipping: number
          size: string
          updated_at: string
        }
        Insert: {
          application1?: number
          application2?: number
          article_id: string
          color: string
          created_at?: string
          cutting?: number
          finishing?: number
          id?: string
          qc?: number
          qty_order?: number
          ready_to_shipping?: number
          sewing?: number
          shipping?: number
          size: string
          updated_at?: string
        }
        Update: {
          application1?: number
          application2?: number
          article_id?: string
          color?: string
          created_at?: string
          cutting?: number
          finishing?: number
          id?: string
          qc?: number
          qty_order?: number
          ready_to_shipping?: number
          sewing?: number
          shipping?: number
          size?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_variations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          accs: string
          application1: string | null
          application2: string | null
          check_pattern: string
          code: string
          collection: string | null
          created_at: string
          due_date: string | null
          fabric: string
          garment_sheet_url: string | null
          id: string
          low_stock: boolean
          name: string
          notes: string | null
          overstock: boolean
          photoshoot: string
          pic: string | null
          ppm: string
          pps: string
          sizes: string[]
          style: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          accs?: string
          application1?: string | null
          application2?: string | null
          check_pattern?: string
          code: string
          collection?: string | null
          created_at?: string
          due_date?: string | null
          fabric?: string
          garment_sheet_url?: string | null
          id?: string
          low_stock?: boolean
          name: string
          notes?: string | null
          overstock?: boolean
          photoshoot?: string
          pic?: string | null
          ppm?: string
          pps?: string
          sizes?: string[]
          style?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          accs?: string
          application1?: string | null
          application2?: string | null
          check_pattern?: string
          code?: string
          collection?: string | null
          created_at?: string
          due_date?: string | null
          fabric?: string
          garment_sheet_url?: string | null
          id?: string
          low_stock?: boolean
          name?: string
          notes?: string | null
          overstock?: boolean
          photoshoot?: string
          pic?: string | null
          ppm?: string
          pps?: string
          sizes?: string[]
          style?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_collection_id_fkey"
            columns: ["collection"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      boms: {
        Row: {
          article_id: string
          balance: number
          category: string
          color: string
          consump: number
          created_at: string
          id: string
          item_name: string
          needed: number
          note: string | null
          receiving: number
          size: string
          total: number
          uom: string
          updated_at: string
        }
        Insert: {
          article_id: string
          balance?: number
          category: string
          color?: string
          consump?: number
          created_at?: string
          id?: string
          item_name: string
          needed?: number
          note?: string | null
          receiving?: number
          size: string
          total?: number
          uom: string
          updated_at?: string
        }
        Update: {
          article_id?: string
          balance?: number
          category?: string
          color?: string
          consump?: number
          created_at?: string
          id?: string
          item_name?: string
          needed?: number
          note?: string | null
          receiving?: number
          size?: string
          total?: number
          uom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boms_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          collection_name: string
          created_at: string
          due_date: string | null
          id: string
          updated_at: string
        }
        Insert: {
          collection_name: string
          created_at?: string
          due_date?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          collection_name?: string
          created_at?: string
          due_date?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          article_id: string
          article_variations: string[]
          checked_quantity: number | null
          created_at: string
          date: string
          defect_count: number | null
          id: string
          inspector: string
          measurement: boolean
          measurement_list: string[] | null
          notes: string | null
          remarks: string | null
          signature: string | null
          status: Database["public"]["Enums"]["daily_report_status"]
          updated_at: string
          vendor_signature: string | null
        }
        Insert: {
          article_id: string
          article_variations?: string[]
          checked_quantity?: number | null
          created_at?: string
          date: string
          defect_count?: number | null
          id?: string
          inspector: string
          measurement?: boolean
          measurement_list?: string[] | null
          notes?: string | null
          remarks?: string | null
          signature?: string | null
          status: Database["public"]["Enums"]["daily_report_status"]
          updated_at?: string
          vendor_signature?: string | null
        }
        Update: {
          article_id?: string
          article_variations?: string[]
          checked_quantity?: number | null
          created_at?: string
          date?: string
          defect_count?: number | null
          id?: string
          inspector?: string
          measurement?: boolean
          measurement_list?: string[] | null
          notes?: string | null
          remarks?: string | null
          signature?: string | null
          status?: Database["public"]["Enums"]["daily_report_status"]
          updated_at?: string
          vendor_signature?: string | null
        }
        Relationships: []
      }
      measurement_checks: {
        Row: {
          article_id: string
          created_at: string
          daily_report_id: string
          f_1: Database["public"]["Enums"]["measurement_value"] | null
          f_2: Database["public"]["Enums"]["measurement_value"] | null
          f_3: Database["public"]["Enums"]["measurement_value"] | null
          id: string
          l_1: Database["public"]["Enums"]["measurement_value"] | null
          l_2: Database["public"]["Enums"]["measurement_value"] | null
          l_3: Database["public"]["Enums"]["measurement_value"] | null
          lxl_1: Database["public"]["Enums"]["measurement_value"] | null
          lxl_2: Database["public"]["Enums"]["measurement_value"] | null
          lxl_3: Database["public"]["Enums"]["measurement_value"] | null
          m_1: Database["public"]["Enums"]["measurement_value"] | null
          m_2: Database["public"]["Enums"]["measurement_value"] | null
          m_3: Database["public"]["Enums"]["measurement_value"] | null
          measurement_detail_id: string
          s_1: Database["public"]["Enums"]["measurement_value"] | null
          s_2: Database["public"]["Enums"]["measurement_value"] | null
          s_3: Database["public"]["Enums"]["measurement_value"] | null
          sm_1: Database["public"]["Enums"]["measurement_value"] | null
          sm_2: Database["public"]["Enums"]["measurement_value"] | null
          sm_3: Database["public"]["Enums"]["measurement_value"] | null
          updated_at: string
          xl_1: Database["public"]["Enums"]["measurement_value"] | null
          xl_2: Database["public"]["Enums"]["measurement_value"] | null
          xl_3: Database["public"]["Enums"]["measurement_value"] | null
          xs_1: Database["public"]["Enums"]["measurement_value"] | null
          xs_2: Database["public"]["Enums"]["measurement_value"] | null
          xs_3: Database["public"]["Enums"]["measurement_value"] | null
        }
        Insert: {
          article_id: string
          created_at?: string
          daily_report_id: string
          f_1?: Database["public"]["Enums"]["measurement_value"] | null
          f_2?: Database["public"]["Enums"]["measurement_value"] | null
          f_3?: Database["public"]["Enums"]["measurement_value"] | null
          id?: string
          l_1?: Database["public"]["Enums"]["measurement_value"] | null
          l_2?: Database["public"]["Enums"]["measurement_value"] | null
          l_3?: Database["public"]["Enums"]["measurement_value"] | null
          lxl_1?: Database["public"]["Enums"]["measurement_value"] | null
          lxl_2?: Database["public"]["Enums"]["measurement_value"] | null
          lxl_3?: Database["public"]["Enums"]["measurement_value"] | null
          m_1?: Database["public"]["Enums"]["measurement_value"] | null
          m_2?: Database["public"]["Enums"]["measurement_value"] | null
          m_3?: Database["public"]["Enums"]["measurement_value"] | null
          measurement_detail_id: string
          s_1?: Database["public"]["Enums"]["measurement_value"] | null
          s_2?: Database["public"]["Enums"]["measurement_value"] | null
          s_3?: Database["public"]["Enums"]["measurement_value"] | null
          sm_1?: Database["public"]["Enums"]["measurement_value"] | null
          sm_2?: Database["public"]["Enums"]["measurement_value"] | null
          sm_3?: Database["public"]["Enums"]["measurement_value"] | null
          updated_at?: string
          xl_1?: Database["public"]["Enums"]["measurement_value"] | null
          xl_2?: Database["public"]["Enums"]["measurement_value"] | null
          xl_3?: Database["public"]["Enums"]["measurement_value"] | null
          xs_1?: Database["public"]["Enums"]["measurement_value"] | null
          xs_2?: Database["public"]["Enums"]["measurement_value"] | null
          xs_3?: Database["public"]["Enums"]["measurement_value"] | null
        }
        Update: {
          article_id?: string
          created_at?: string
          daily_report_id?: string
          f_1?: Database["public"]["Enums"]["measurement_value"] | null
          f_2?: Database["public"]["Enums"]["measurement_value"] | null
          f_3?: Database["public"]["Enums"]["measurement_value"] | null
          id?: string
          l_1?: Database["public"]["Enums"]["measurement_value"] | null
          l_2?: Database["public"]["Enums"]["measurement_value"] | null
          l_3?: Database["public"]["Enums"]["measurement_value"] | null
          lxl_1?: Database["public"]["Enums"]["measurement_value"] | null
          lxl_2?: Database["public"]["Enums"]["measurement_value"] | null
          lxl_3?: Database["public"]["Enums"]["measurement_value"] | null
          m_1?: Database["public"]["Enums"]["measurement_value"] | null
          m_2?: Database["public"]["Enums"]["measurement_value"] | null
          m_3?: Database["public"]["Enums"]["measurement_value"] | null
          measurement_detail_id?: string
          s_1?: Database["public"]["Enums"]["measurement_value"] | null
          s_2?: Database["public"]["Enums"]["measurement_value"] | null
          s_3?: Database["public"]["Enums"]["measurement_value"] | null
          sm_1?: Database["public"]["Enums"]["measurement_value"] | null
          sm_2?: Database["public"]["Enums"]["measurement_value"] | null
          sm_3?: Database["public"]["Enums"]["measurement_value"] | null
          updated_at?: string
          xl_1?: Database["public"]["Enums"]["measurement_value"] | null
          xl_2?: Database["public"]["Enums"]["measurement_value"] | null
          xl_3?: Database["public"]["Enums"]["measurement_value"] | null
          xs_1?: Database["public"]["Enums"]["measurement_value"] | null
          xs_2?: Database["public"]["Enums"]["measurement_value"] | null
          xs_3?: Database["public"]["Enums"]["measurement_value"] | null
        }
        Relationships: [
          {
            foreignKeyName: "measurement_checks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_checks_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_checks_measurement_detail_id_fkey"
            columns: ["measurement_detail_id"]
            isOneToOne: false
            referencedRelation: "article_measurements"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      qc_results: {
        Row: {
          article_id: string
          article_variation: string | null
          color: string
          created_at: string
          daily_report_id: string
          id: string
          ok: number | null
          r10: number | null
          r5: number | null
          size: string
          updated_at: string
        }
        Insert: {
          article_id: string
          article_variation?: string | null
          color: string
          created_at?: string
          daily_report_id: string
          id?: string
          ok?: number | null
          r10?: number | null
          r5?: number | null
          size: string
          updated_at?: string
        }
        Update: {
          article_id?: string
          article_variation?: string | null
          color?: string
          created_at?: string
          daily_report_id?: string
          id?: string
          ok?: number | null
          r10?: number | null
          r5?: number | null
          size?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qc_results_article_variation_fkey"
            columns: ["article_variation"]
            isOneToOne: false
            referencedRelation: "article_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping: {
        Row: {
          article_id: string | null
          created_at: string
          date: string
          id: string
          packing_list: string | null
          remarks: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          date: string
          id?: string
          packing_list?: string | null
          remarks?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          article_id?: string | null
          created_at?: string
          date?: string
          id?: string
          packing_list?: string | null
          remarks?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      shipping_list: {
        Row: {
          article_id: string
          article_variation: string | null
          color: string
          created_at: string
          id: string
          ok: number
          r10: number
          r5: number
          shipping_id: string
          size: string
          total_shipping: number
          updated_at: string
        }
        Insert: {
          article_id: string
          article_variation?: string | null
          color: string
          created_at?: string
          id?: string
          ok?: number
          r10?: number
          r5?: number
          shipping_id: string
          size: string
          total_shipping?: number
          updated_at?: string
        }
        Update: {
          article_id?: string
          article_variation?: string | null
          color?: string
          created_at?: string
          id?: string
          ok?: number
          r10?: number
          r5?: number
          shipping_id?: string
          size?: string
          total_shipping?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_list_article_variation_fkey"
            columns: ["article_variation"]
            isOneToOne: false
            referencedRelation: "article_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
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
      daily_report_status:
        | "Pattern Check"
        | "PPS Check"
        | "Inline Cutting"
        | "Inline Sewing"
        | "Photoshoot Check"
        | "Prefinal"
        | "Final + Measurement"
        | "Final"
      measurement_value:
        | "-2.5"
        | "-2"
        | "-1.5"
        | "-1"
        | "-0.5"
        | "✓"
        | "+0.5"
        | "+1"
        | "+1.5"
        | "+2"
        | "+2.5"
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
      daily_report_status: [
        "Pattern Check",
        "PPS Check",
        "Inline Cutting",
        "Inline Sewing",
        "Photoshoot Check",
        "Prefinal",
        "Final + Measurement",
        "Final",
      ],
      measurement_value: [
        "-2.5",
        "-2",
        "-1.5",
        "-1",
        "-0.5",
        "✓",
        "+0.5",
        "+1",
        "+1.5",
        "+2",
        "+2.5",
      ],
    },
  },
} as const
