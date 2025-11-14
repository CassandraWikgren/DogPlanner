// /types/database.ts (reparerad)
// Standardiserade TypeScript-typer för Supabase-databasen – synkade mot schema.sql

export interface Database {
  public: {
    Tables: {
      orgs: {
        Row: {
          id: string;
          name: string | null;
          phone: string | null;
          address: string | null;
          email: string | null;
          org_number: string | null;
          vat_included: boolean | null;
          vat_rate: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          phone?: string | null;
          address?: string | null;
          email?: string | null;
          org_number?: string | null;
          vat_included?: boolean | null;
          vat_rate?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          phone?: string | null;
          address?: string | null;
          email?: string | null;
          org_number?: string | null;
          vat_included?: boolean | null;
          vat_rate?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      branches: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "branches_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
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
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          full_name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          customer_number?: number | null;
          contact_person_2?: string | null;
          contact_phone_2?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          full_name?: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          customer_number?: number | null;
          contact_person_2?: string | null;
          contact_phone_2?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "owners_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          org_id: string | null;
          role: string | null;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          org_id?: string | null;
          role?: string | null;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          role?: string | null;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          capacity_m2: number | null;
          room_type: string | null;
          max_dogs: number | null;
          notes: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          capacity_m2?: number | null;
          room_type?: string | null;
          max_dogs?: number | null;
          notes?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          capacity_m2?: number | null;
          room_type?: string | null;
          max_dogs?: number | null;
          notes?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
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
          days: string | null;
          startdate: string | null;
          enddate: string | null;
          vaccdhp: string | null;
          vaccpi: string | null;
          photo_url: string | null;
          notes: string | null;
          events: any | null;
          checked_in: boolean | null;
          checkin_date: string | null;
          checkout_date: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          owner_id: string;
          room_id?: string | null;
          name: string;
          breed?: string | null;
          birth?: string | null;
          heightcm?: number | null;
          subscription?: string | null;
          days?: string | null;
          startdate?: string | null;
          enddate?: string | null;
          vaccdhp?: string | null;
          vaccpi?: string | null;
          photo_url?: string | null;
          notes?: string | null;
          events?: any | null;
          checked_in?: boolean | null;
          checkin_date?: string | null;
          checkout_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          owner_id?: string;
          room_id?: string | null;
          name?: string;
          breed?: string | null;
          birth?: string | null;
          heightcm?: number | null;
          subscription?: string | null;
          days?: string | null;
          startdate?: string | null;
          enddate?: string | null;
          vaccdhp?: string | null;
          vaccpi?: string | null;
          photo_url?: string | null;
          notes?: string | null;
          events?: any | null;
          checked_in?: boolean | null;
          checkin_date?: string | null;
          checkout_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dogs_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "owners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dogs_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          org_id: string;
          dog_id: string;
          owner_id: string;
          room_id: string | null;
          start_date: string;
          end_date: string;
          status: string | null;
          total_price: number | null;
          discount_amount: number | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          dog_id: string;
          owner_id: string;
          room_id?: string | null;
          start_date: string;
          end_date: string;
          status?: string | null;
          total_price?: number | null;
          discount_amount?: number | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          dog_id?: string;
          owner_id?: string;
          room_id?: string | null;
          start_date?: string;
          end_date?: string;
          status?: string | null;
          total_price?: number | null;
          discount_amount?: number | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_dog_id_fkey";
            columns: ["dog_id"];
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "owners";
            referencedColumns: ["id"];
          },
        ];
      };
      extra_services: {
        Row: {
          id: string;
          org_id: string;
          branch_id: string | null;
          label: string;
          price: number;
          unit: string;
          service_type: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          branch_id?: string | null;
          label: string;
          price: number;
          unit: string;
          service_type?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          branch_id?: string | null;
          label?: string;
          price?: number;
          unit?: string;
          service_type?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "extra_services_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [key: string]: never };
    Functions: {
      heal_user_missing_org: {
        Args: { user_id: string };
        Returns: {
          success: boolean;
          message: string;
          org_id?: string;
          created_new_org?: boolean;
          error?: string;
        };
      };
    };
    Enums: { [key: string]: never };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export interface DogWithRelations extends Tables<"dogs"> {
  owners?: Tables<"owners"> | null;
  rooms?: Tables<"rooms"> | null;
  orgs?: Tables<"orgs"> | null;
}
