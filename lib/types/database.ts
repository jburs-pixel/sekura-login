// Tipos del schema de Supabase. Hechos a mano para no depender de la CLI.
// Si más adelante instalamos `supabase` CLI, regenerar con:
//   npx supabase gen types typescript --project-id <id> > lib/types/database.ts

export type ItemStatus = "active" | "revoked" | "claimed";
export type ScanResult =
  | "authentic"
  | "suspicious"
  | "unknown"
  | "already_claimed";
export type DistributorRole = "distributor" | "admin";
export type ItemActionKind = "received" | "discrepancy" | "transferred";

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          manufacturer: string | null;
          category: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          manufacturer?: string | null;
          category?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      batches: {
        Row: {
          id: string;
          product_id: string | null;
          manufactured_at: string | null;
          origin_country: string | null;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          manufactured_at?: string | null;
          origin_country?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["batches"]["Insert"]>;
        Relationships: [];
      };
      items: {
        Row: {
          token: string;
          prefix: string;
          numeric_id: number;
          country_code: string;
          product_id: string | null;
          batch_id: string | null;
          status: ItemStatus;
          created_at: string;
        };
        Insert: {
          token: string;
          prefix: string;
          numeric_id: number;
          country_code: string;
          product_id?: string | null;
          batch_id?: string | null;
          status?: ItemStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["items"]["Insert"]>;
        Relationships: [];
      };
      scans: {
        Row: {
          id: string;
          token: string | null;
          scanned_at: string;
          ip_hash: string | null;
          country_geo: string | null;
          user_agent: string | null;
          user_id: string | null;
          result: ScanResult;
        };
        Insert: {
          id?: string;
          token?: string | null;
          scanned_at?: string;
          ip_hash?: string | null;
          country_geo?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          result: ScanResult;
        };
        Update: Partial<Database["public"]["Tables"]["scans"]["Insert"]>;
        Relationships: [];
      };
      distributors: {
        Row: {
          user_id: string;
          company_name: string | null;
          country_code: string | null;
          role: DistributorRole;
          created_at: string;
        };
        Insert: {
          user_id: string;
          company_name?: string | null;
          country_code?: string | null;
          role?: DistributorRole;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["distributors"]["Insert"]>;
        Relationships: [];
      };
      item_actions: {
        Row: {
          id: string;
          token: string | null;
          user_id: string | null;
          action: ItemActionKind;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          token?: string | null;
          user_id?: string | null;
          action: ItemActionKind;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["item_actions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      verify_token: {
        Args: { p_token: string };
        Returns: VerifyTokenResponse;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Forma del JSON que devuelve verify_token. Coincide con el RPC en
// supabase/migrations/0001_initial_schema.sql.
export type VerifyTokenResponse =
  | { result: "unknown" }
  | {
      result: Exclude<ScanResult, "unknown">;
      item: { token: string; country_code: string; status: ItemStatus };
      product: Database["public"]["Tables"]["products"]["Row"] | null;
      batch: Database["public"]["Tables"]["batches"]["Row"] | null;
    };
