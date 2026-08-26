/**
 * GENERATED FILE — do not edit by hand.
 *
 * Regenerate after any schema change:
 *   npx supabase gen types typescript --project-id vcitwawndwowctyvbzlc > src/types/supabase.ts
 *
 * Nothing imports this yet: the app's domain types are hand-written in
 * `server/queries/products.ts`, which maps snake_case columns to camelCase and
 * narrows loose `string` columns to real unions (StyleTag, Proportion, …) that
 * the generator can't infer from a text column. Wire this in where you want the
 * compiler to catch a column rename — e.g. `createClient<Database>(…)`.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      admins: {
        Row: { email: string };
        Insert: { email: string };
        Update: { email?: string };
        Relationships: [];
      };
      affiliate_links: {
        Row: {
          commission_rate: number | null;
          generated_at: string;
          id: string;
          network: string;
          product_id: string;
          tracking_url: string;
        };
        Insert: {
          commission_rate?: number | null;
          generated_at?: string;
          id?: string;
          network: string;
          product_id: string;
          tracking_url: string;
        };
        Update: {
          commission_rate?: number | null;
          generated_at?: string;
          id?: string;
          network?: string;
          product_id?: string;
          tracking_url?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          created_at: string;
          feedback_type: string;
          id: string;
          message: string;
          product_id: string | null;
          status: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          feedback_type: string;
          id?: string;
          message: string;
          product_id?: string | null;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          feedback_type?: string;
          id?: string;
          message?: string;
          product_id?: string | null;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      ingestion_jobs: {
        Row: {
          errors: string | null;
          id: string;
          items_ingested: number;
          retailer_id: string;
          run_at: string;
          source_type: string;
          status: string;
        };
        Insert: {
          errors?: string | null;
          id?: string;
          items_ingested?: number;
          retailer_id: string;
          run_at?: string;
          source_type: string;
          status: string;
        };
        Update: {
          errors?: string | null;
          id?: string;
          items_ingested?: number;
          retailer_id?: string;
          run_at?: string;
          source_type?: string;
          status?: string;
        };
        Relationships: [];
      };
      onboarding_responses: {
        Row: {
          budget: string | null;
          created_at: string;
          fit_preference: string | null;
          height_range: string;
          id: string;
          occasions: string[];
          photo_path: string | null;
          proportion: string | null;
          styles: string[];
          user_id: string | null;
        };
        Insert: {
          budget?: string | null;
          created_at?: string;
          fit_preference?: string | null;
          height_range: string;
          id?: string;
          occasions?: string[];
          photo_path?: string | null;
          proportion?: string | null;
          styles?: string[];
          user_id?: string | null;
        };
        Update: {
          budget?: string | null;
          created_at?: string;
          fit_preference?: string | null;
          height_range?: string;
          id?: string;
          occasions?: string[];
          photo_path?: string | null;
          proportion?: string | null;
          styles?: string[];
          user_id?: string | null;
        };
        Relationships: [];
      };
      product_events: {
        Row: {
          created_at: string;
          dwell_ms: number | null;
          id: string;
          link_url: string | null;
          placement: string;
          product_id: string | null;
          ranker_version: string | null;
          retailer_id: string | null;
          signal_type: string;
          user_id: string | null;
          variant: string | null;
        };
        Insert: {
          created_at?: string;
          dwell_ms?: number | null;
          id?: string;
          link_url?: string | null;
          placement: string;
          product_id?: string | null;
          ranker_version?: string | null;
          retailer_id?: string | null;
          signal_type: string;
          user_id?: string | null;
          variant?: string | null;
        };
        Update: {
          created_at?: string;
          dwell_ms?: number | null;
          id?: string;
          link_url?: string | null;
          placement?: string;
          product_id?: string | null;
          ranker_version?: string | null;
          retailer_id?: string | null;
          signal_type?: string;
          user_id?: string | null;
          variant?: string | null;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          image_url: string;
          is_model_shot: boolean;
          product_id: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          image_url: string;
          is_model_shot?: boolean;
          product_id: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          image_url?: string;
          is_model_shot?: boolean;
          product_id?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      products: {
        Row: {
          active: boolean;
          body_length_cm: number | null;
          category: string;
          color: string | null;
          created_at: string;
          currency: string;
          fit: string | null;
          fit_notes: string | null;
          gender: string | null;
          id: string;
          inseam_cm: number | null;
          material: string | null;
          name: string;
          pattern: string | null;
          price_cents: number;
          product_url: string | null;
          retailer_id: string;
          size_note: string | null;
          sleeve_cm: number | null;
          style_tags: string[];
        };
        Insert: {
          active?: boolean;
          body_length_cm?: number | null;
          category: string;
          color?: string | null;
          created_at?: string;
          currency: string;
          fit?: string | null;
          fit_notes?: string | null;
          gender?: string | null;
          id?: string;
          inseam_cm?: number | null;
          material?: string | null;
          name: string;
          pattern?: string | null;
          price_cents: number;
          product_url?: string | null;
          retailer_id: string;
          size_note?: string | null;
          sleeve_cm?: number | null;
          style_tags?: string[];
        };
        Update: {
          active?: boolean;
          body_length_cm?: number | null;
          category?: string;
          color?: string | null;
          created_at?: string;
          currency?: string;
          fit?: string | null;
          fit_notes?: string | null;
          gender?: string | null;
          id?: string;
          inseam_cm?: number | null;
          material?: string | null;
          name?: string;
          pattern?: string | null;
          price_cents?: number;
          product_url?: string | null;
          retailer_id?: string;
          size_note?: string | null;
          sleeve_cm?: number | null;
          style_tags?: string[];
        };
        Relationships: [];
      };
      profiles: {
        Row: { created_at: string; last_login_at: string | null; user_id: string };
        Insert: { created_at?: string; last_login_at?: string | null; user_id: string };
        Update: { created_at?: string; last_login_at?: string | null; user_id?: string };
        Relationships: [];
      };
      retailer_discovery_attempts: {
        Row: { checked_at: string; hostname: string; reason: string | null; result: string };
        Insert: { checked_at?: string; hostname: string; reason?: string | null; result: string };
        Update: { checked_at?: string; hostname?: string; reason?: string | null; result?: string };
        Relationships: [];
      };
      retailers: {
        Row: {
          clothing_type: string;
          country: string;
          created_at: string;
          id: string;
          name: string;
          region: string | null;
          shipping_countries: string[];
          size_system: string | null;
          status: string;
          tall_label_example: string | null;
          tall_section_url: string | null;
          website_url: string | null;
        };
        Insert: {
          clothing_type: string;
          country: string;
          created_at?: string;
          id?: string;
          name: string;
          region?: string | null;
          shipping_countries?: string[];
          size_system?: string | null;
          status?: string;
          tall_label_example?: string | null;
          tall_section_url?: string | null;
          website_url?: string | null;
        };
        Update: {
          clothing_type?: string;
          country?: string;
          created_at?: string;
          id?: string;
          name?: string;
          region?: string | null;
          shipping_countries?: string[];
          size_system?: string | null;
          status?: string;
          tall_label_example?: string | null;
          tall_section_url?: string | null;
          website_url?: string | null;
        };
        Relationships: [];
      };
      tall_sizes: {
        Row: {
          id: string;
          measurement_cm: number;
          measurement_type: string;
          product_id: string;
          size_label: string;
          size_system: string;
        };
        Insert: {
          id?: string;
          measurement_cm: number;
          measurement_type: string;
          product_id: string;
          size_label: string;
          size_system: string;
        };
        Update: {
          id?: string;
          measurement_cm?: number;
          measurement_type?: string;
          product_id?: string;
          size_label?: string;
          size_system?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      admin_algorithm_overview: { Args: { p_password: string }; Returns: Json };
      admin_list_feedback: {
        Args: { p_password: string };
        Returns: {
          created_at: string;
          feedback_type: string;
          id: string;
          message: string;
          product_id: string | null;
          status: string;
          user_id: string | null;
        }[];
      };
      admin_list_pending_retailers: {
        Args: { p_password: string };
        Returns: {
          country: string;
          created_at: string;
          id: string;
          name: string;
          region: string;
          website_url: string;
        }[];
      };
      admin_list_product_events: {
        Args: { p_password: string };
        Returns: {
          created_at: string;
          placement: string;
          product_name: string;
          retailer_name: string;
          signal_type: string;
        }[];
      };
      admin_list_products: {
        Args: { p_password: string };
        Returns: {
          active: boolean;
          category: string;
          color: string;
          currency: string;
          fit: string;
          gender: string;
          id: string;
          material: string;
          name: string;
          pattern: string;
          price_cents: number;
          retailer_name: string;
        }[];
      };
      admin_list_retailer_health: {
        Args: { p_password: string };
        Returns: {
          complete_pct: number;
          last_synced: string;
          name: string;
          photo_pct: number;
          product_count: number;
          retailer_id: string;
        }[];
      };
      admin_set_retailer_status: {
        Args: { p_id: string; p_password: string; p_status: string };
        Returns: undefined;
      };
      admin_update_feedback_status: {
        Args: { p_id: string; p_password: string; p_status: string };
        Returns: undefined;
      };
      admin_update_product: {
        Args: {
          p_category: string;
          p_color: string;
          p_fit: string;
          p_gender: string;
          p_id: string;
          p_material: string;
          p_password: string;
          p_pattern: string;
        };
        Returns: undefined;
      };
      ingest_shopify_page: {
        Args: {
          p_cap?: number;
          p_clothing_type?: string;
          p_country?: string;
          p_currency: string;
          p_page: number;
          p_retailer_name?: string;
          p_size_system: string;
          p_store: string;
        };
        Returns: Json;
      };
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Functions<T extends keyof PublicSchema["Functions"]> =
  PublicSchema["Functions"][T]["Returns"];
