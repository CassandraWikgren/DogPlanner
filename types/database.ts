// /types/database.ts
// Standardiserade TypeScript-typer för Supabase-databasen

export interface Database {
  public: {
    Tables: {
      // === ABONNEMANG ===
      subscriptions: {
        Row: {
          id: string;
          org_id: string;
          plan: string;
          status: string;
          trial_starts_at?: string | null;
          trial_ends_at?: string | null;
          created_at: string;
        };
        Insert: {
          org_id: string;
          plan: string;
          status: string;
          trial_starts_at?: string | null;
          trial_ends_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          org_id: string;
          plan: string;
          status: string;
          trial_starts_at?: string | null;
          trial_ends_at?: string | null;
          created_at?: string;
        }>;
      };
      // === ORGANISATIONER ===
      orgs: {
        Row: {
          id: string;
          name: string;
          org_number: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          vat_included: boolean;
          vat_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["orgs"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["orgs"]["Insert"]>;
      };

      // === AVDELNINGAR/FILIALER ===
      branches: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["branches"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["branches"]["Insert"]>;
      };

      // === ÄGARE ===
      owners: {
        Row: {
          id: string;
          org_id: string;
          full_name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          customer_number: number | null;
          contact_person_2: string | null;
          contact_phone_2: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["owners"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["owners"]["Insert"]>;
      };

      // === RUM ===
      rooms: {
        Row: {
          id: string;
          org_id: string;
          branch_id: string | null;
          name: string;
          capacity_m2: number;
          room_type: "daycare" | "boarding" | "both";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["rooms"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["rooms"]["Insert"]>;
      };

      // === HUNDAR ===
      dogs: {
        Row: {
          id: string;
          org_id: string;
          owner_id: string;
          room_id: string | null;
          name: string;
          breed: string | null;
          birth: string | null;
          heightcm: number | null;
          subscription: string | null;
          days: string | null; // "Måndag,Tisdag,Onsdag"
          startdate: string | null;
          enddate: string | null;
          vaccdhp: string | null;
          vaccpi: string | null;
          photo_url: string | null;
          notes: string | null;
          events: any | null; // JSON
          checked_in: boolean | null;
          checkin_date: string | null;
          checkout_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["dogs"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["dogs"]["Insert"]>;
      };

      // === BOKNINGAR (Pensionat) ===
      bookings: {
        Row: {
          id: string;
          org_id: string;
          branch_id: string | null;
          dog_id: string;
          owner_id: string;
          room_id: string;
          start_date: string;
          end_date: string;
          status:
            | "pending"
            | "confirmed"
            | "checked_in"
            | "checked_out"
            | "cancelled";
          total_price: number | null;
          discount_amount: number | null;
          extra_service_ids: string[] | null; // JSON array
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["bookings"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };

      // === EXTRA TJÄNSTER ===
      extra_services: {
        Row: {
          id: string;
          org_id: string;
          branch_id: string | null;
          label: string;
          price: number;
          unit: string; // "per gång", "per dag", "fast pris"
          service_type: "boarding" | "daycare" | "both";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["extra_services"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["extra_services"]["Insert"]
        >;
      };

      // === UTFÖRDA EXTRA TJÄNSTER ===
      extra_service_performed: {
        Row: {
          id: string;
          org_id: string;
          dog_id: string;
          extra_service_id: string;
          booking_id: string | null; // Kan kopplas till bokning
          quantity: number;
          performed_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["extra_service_performed"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["extra_service_performed"]["Insert"]
        >;
      };

      // === HUNDJOURNAL ===
      dog_journal: {
        Row: {
          id: string;
          org_id: string;
          dog_id: string;
          text: string;
          journal_type: "general" | "medical" | "behavior" | "feeding";
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["dog_journal"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["dog_journal"]["Insert"]>;
      };

      // === PRISLISTOR ===
      price_lists: {
        Row: {
          id: string;
          org_id: string;
          effective_from: string;
          items: any; // JSON
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["price_lists"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["price_lists"]["Insert"]>;
      };

      // === PENSIONATSPRISER ===
      boarding_prices: {
        Row: {
          id: string;
          org_id: string;
          size_category: string; // "small", "medium", "large", "xlarge"
          base_price: number;
          weekend_multiplier: number;
          holiday_multiplier: number;
          high_season_multiplier: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["boarding_prices"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["boarding_prices"]["Insert"]
        >;
      };

      // === SÄSONGER ===
      boarding_seasons: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          start_date: string;
          end_date: string;
          type: "high" | "low" | "holiday";
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["boarding_seasons"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["boarding_seasons"]["Insert"]
        >;
      };

      // === ÄGARRABATTER ===
      owner_discounts: {
        Row: {
          id: string;
          org_id: string;
          owner_id: string;
          discount_name: string;
          discount_percent: number;
          valid_from: string | null;
          valid_to: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["owner_discounts"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["owner_discounts"]["Insert"]
        >;
      };

      // === FAKTUROR ===
      invoices: {
        Row: {
          id: string;
          org_id: string;
          owner_id: string;
          dog_id: string | null;
          invoice_number: string;
          month: string; // "2024-10"
          total_amount: number;
          vat_amount: number;
          status: "draft" | "sent" | "paid" | "overdue";
          due_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["invoices"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
      };

      // === INTRESSEANMÄLNINGAR ===
      interest_applications: {
        Row: {
          id: string;
          org_id: string;
          parent_name: string;
          parent_email: string;
          parent_phone: string;
          dog_name: string;
          dog_breed: string | null;
          dog_age: number | null;
          dog_size: "small" | "medium" | "large";
          preferred_start_date: string | null;
          preferred_days: string[] | null;
          special_needs: string | null;
          previous_daycare_experience: boolean | null;
          status: "pending" | "contacted" | "accepted" | "declined";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["interest_applications"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["interest_applications"]["Insert"]
        >;
      };

      // === DAGISTJÄNSTER (Kloklipp, tassklipp, bad) ===
      daycare_service_completions: {
        Row: {
          id: string;
          org_id: string | null;
          dog_id: string | null;
          service_type: "kloklipp" | "tassklipp" | "bad";
          scheduled_date: string;
          completed_at: string | null;
          completed_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["daycare_service_completions"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["daycare_service_completions"]["Insert"]
        >;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// === HELPER TYPER ===
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// === UTÖKADE TYPER MED RELATIONER ===
export interface DogWithRelations extends Tables<"dogs"> {
  owners?: Tables<"owners"> | null;
  rooms?: Tables<"rooms"> | null;
  orgs?: Tables<"orgs"> | null;
  extra_service_performed?: Tables<"extra_service_performed">[];
  dog_journal?: Tables<"dog_journal">[];
}

export interface BookingWithRelations extends Tables<"bookings"> {
  dogs?: Tables<"dogs"> | null;
  owners?: Tables<"owners"> | null;
  rooms?: Tables<"rooms"> | null;
}

export interface OwnerWithRelations extends Tables<"owners"> {
  dogs?: Tables<"dogs">[];
  owner_discounts?: Tables<"owner_discounts">[];
}
