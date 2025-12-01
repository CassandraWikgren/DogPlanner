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
          // Stripe & subscription fields
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: string | null;
          billing_period: string | null;
          has_had_subscription: boolean | null;
          // Enabled services
          enabled_services: string[] | null;
          // Payment fields (from invoice_system_improvements migration)
          bankgiro: string | null;
          plusgiro: string | null;
          swish_number: string | null;
          website: string | null;
          payment_terms_days: number | null;
          late_fee_amount: number | null;
          interest_rate: number | null;
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
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
          billing_period?: string | null;
          has_had_subscription?: boolean | null;
          enabled_services?: string[] | null;
          bankgiro?: string | null;
          plusgiro?: string | null;
          swish_number?: string | null;
          website?: string | null;
          payment_terms_days?: number | null;
          late_fee_amount?: number | null;
          interest_rate?: number | null;
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
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: string | null;
          billing_period?: string | null;
          has_had_subscription?: boolean | null;
          enabled_services?: string[] | null;
          bankgiro?: string | null;
          plusgiro?: string | null;
          swish_number?: string | null;
          website?: string | null;
          payment_terms_days?: number | null;
          late_fee_amount?: number | null;
          interest_rate?: number | null;
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
      customer_discounts: {
        Row: {
          id: string;
          owner_id: string;
          discount_type: "percentage" | "fixed_amount";
          discount_value: number;
          description: string;
          is_permanent: boolean;
          valid_from: string | null;
          valid_until: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          discount_type: "percentage" | "fixed_amount";
          discount_value: number;
          description: string;
          is_permanent?: boolean;
          valid_from?: string | null;
          valid_until?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          discount_type?: "percentage" | "fixed_amount";
          discount_value?: number;
          description?: string;
          is_permanent?: boolean;
          valid_from?: string | null;
          valid_until?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customer_discounts_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "owners";
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
          // Health & behavior fields
          is_castrated: boolean | null;
          allergies: string | null;
          medications: string | null;
          special_needs: string | null;
          behavior_notes: string | null;
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
          is_castrated?: boolean | null;
          allergies?: string | null;
          medications?: string | null;
          special_needs?: string | null;
          behavior_notes?: string | null;
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
          is_castrated?: boolean | null;
          allergies?: string | null;
          medications?: string | null;
          special_needs?: string | null;
          behavior_notes?: string | null;
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
      dog_journal: {
        Row: {
          id: string;
          dog_id: string;
          text: string | null;
          created_at: string | null;
          org_id: string | null;
          user_id: string | null;
          content: string;
        };
        Insert: {
          id?: string;
          dog_id: string;
          text?: string | null;
          created_at?: string | null;
          org_id?: string | null;
          user_id?: string | null;
          content?: string;
        };
        Update: {
          id?: string;
          dog_id?: string;
          text?: string | null;
          created_at?: string | null;
          org_id?: string | null;
          user_id?: string | null;
          content?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dog_journal_dog_id_fkey";
            columns: ["dog_id"];
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dog_journal_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      boarding_prices: {
        Row: {
          id: string;
          org_id: string;
          dog_size: string;
          base_price: number;
          weekend_surcharge: number | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          dog_size: string;
          base_price: number;
          weekend_surcharge?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          dog_size?: string;
          base_price?: number;
          weekend_surcharge?: number | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "boarding_prices_org_id_fkey";
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
          base_price: number | null;
          discount_amount: number | null;
          notes: string | null;
          special_requests: string | null;
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
          base_price?: number | null;
          discount_amount?: number | null;
          notes?: string | null;
          special_requests?: string | null;
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
          base_price?: number | null;
          discount_amount?: number | null;
          notes?: string | null;
          special_requests?: string | null;
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
      subscriptions: {
        Row: {
          id: string;
          org_id: string;
          status: string;
          plan: string | null;
          trial_starts_at: string | null;
          trial_ends_at: string | null;
          next_billing_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          plan_name: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          status?: string;
          plan?: string | null;
          trial_starts_at?: string | null;
          trial_ends_at?: string | null;
          next_billing_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          plan_name?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          status?: string;
          plan?: string | null;
          trial_starts_at?: string | null;
          trial_ends_at?: string | null;
          next_billing_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          plan_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          id: string;
          org_id: string;
          owner_id: string;
          invoice_date: string;
          due_date: string;
          total_amount: number;
          status: string;
          payment_method: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
          // Additional fields from migrations
          invoice_number: string | null;
          billed_name: string | null;
          billed_email: string | null;
          billed_address: string | null;
          invoice_type: string | null;
          sent_at: string | null;
          paid_at: string | null;
          reminder_1_date: string | null;
          reminder_2_date: string | null;
          reminder_1_fee: number | null;
          reminder_2_fee: number | null;
          collection_fee: number | null;
          late_interest: number | null;
          ocr_number: string | null;
          payment_reference: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          owner_id: string;
          invoice_date: string;
          due_date: string;
          total_amount: number;
          status?: string;
          payment_method?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          invoice_number?: string | null;
          billed_name?: string | null;
          billed_email?: string | null;
          billed_address?: string | null;
          invoice_type?: string | null;
          sent_at?: string | null;
          paid_at?: string | null;
          reminder_1_date?: string | null;
          reminder_2_date?: string | null;
          reminder_1_fee?: number | null;
          reminder_2_fee?: number | null;
          collection_fee?: number | null;
          late_interest?: number | null;
          ocr_number?: string | null;
          payment_reference?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          owner_id?: string;
          invoice_date?: string;
          due_date?: string;
          total_amount?: number;
          status?: string;
          payment_method?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          invoice_number?: string | null;
          billed_name?: string | null;
          billed_email?: string | null;
          billed_address?: string | null;
          invoice_type?: string | null;
          sent_at?: string | null;
          paid_at?: string | null;
          reminder_1_date?: string | null;
          reminder_2_date?: string | null;
          reminder_1_fee?: number | null;
          reminder_2_fee?: number | null;
          collection_fee?: number | null;
          late_interest?: number | null;
          ocr_number?: string | null;
          payment_reference?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "owners";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          booking_id: string | null;
          description: string | null;
          qty: number | null;
          unit_price: number | null;
          amount: number | null;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          booking_id?: string | null;
          description?: string | null;
          qty?: number | null;
          unit_price?: number | null;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          booking_id?: string | null;
          description?: string | null;
          qty?: number | null;
          unit_price?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      interest_applications: {
        Row: {
          id: string;
          org_id: string;
          parent_name: string;
          parent_email: string;
          parent_phone: string;
          owner_city: string | null;
          owner_address: string | null;
          dog_name: string;
          dog_breed: string | null;
          dog_birth: string | null;
          dog_age: number | null;
          dog_gender: string | null;
          dog_size: "small" | "medium" | "large";
          dog_height_cm: number | null;
          subscription_type: string | null;
          preferred_start_date: string | null;
          preferred_days: string[] | null;
          special_needs: string | null;
          special_care_needs: string | null;
          is_neutered: boolean | null;
          is_escape_artist: boolean | null;
          destroys_things: boolean | null;
          not_house_trained: boolean | null;
          previous_daycare_experience: boolean | null;
          gdpr_consent: boolean | null;
          status: string;
          notes: string | null;
          first_contact_date: string | null;
          first_contact_notes: string | null;
          visit_booked_date: string | null;
          visit_booked_time: string | null;
          visit_status: string | null;
          visit_completed_date: string | null;
          visit_result: string | null;
          contact_history: any | null;
          priority: number | null;
          expected_start_month: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          parent_name: string;
          parent_email: string;
          parent_phone: string;
          owner_city?: string | null;
          owner_address?: string | null;
          dog_name: string;
          dog_breed?: string | null;
          dog_birth?: string | null;
          dog_age?: number | null;
          dog_gender?: string | null;
          dog_size: "small" | "medium" | "large";
          dog_height_cm?: number | null;
          subscription_type?: string | null;
          preferred_start_date?: string | null;
          preferred_days?: string[] | null;
          special_needs?: string | null;
          special_care_needs?: string | null;
          is_neutered?: boolean | null;
          is_escape_artist?: boolean | null;
          destroys_things?: boolean | null;
          not_house_trained?: boolean | null;
          previous_daycare_experience?: boolean | null;
          gdpr_consent?: boolean | null;
          status?: string;
          notes?: string | null;
          first_contact_date?: string | null;
          first_contact_notes?: string | null;
          visit_booked_date?: string | null;
          visit_booked_time?: string | null;
          visit_status?: string | null;
          visit_completed_date?: string | null;
          visit_result?: string | null;
          contact_history?: any | null;
          priority?: number | null;
          expected_start_month?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          parent_name?: string;
          parent_email?: string;
          parent_phone?: string;
          owner_city?: string | null;
          owner_address?: string | null;
          dog_name?: string;
          dog_breed?: string | null;
          dog_birth?: string | null;
          dog_age?: number | null;
          dog_gender?: string | null;
          dog_size?: "small" | "medium" | "large";
          dog_height_cm?: number | null;
          subscription_type?: string | null;
          preferred_start_date?: string | null;
          preferred_days?: string[] | null;
          special_needs?: string | null;
          special_care_needs?: string | null;
          is_neutered?: boolean | null;
          is_escape_artist?: boolean | null;
          destroys_things?: boolean | null;
          not_house_trained?: boolean | null;
          previous_daycare_experience?: boolean | null;
          gdpr_consent?: boolean | null;
          status?: string;
          notes?: string | null;
          first_contact_date?: string | null;
          first_contact_notes?: string | null;
          visit_booked_date?: string | null;
          visit_booked_time?: string | null;
          visit_status?: string | null;
          visit_completed_date?: string | null;
          visit_result?: string | null;
          contact_history?: any | null;
          priority?: number | null;
          expected_start_month?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interest_applications_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      grooming_bookings: {
        Row: {
          id: string;
          org_id: string | null;
          dog_id: string | null;
          appointment_date: string;
          appointment_time: string | null;
          service_type: string;
          estimated_price: number | null;
          status: "confirmed" | "completed" | "cancelled" | "no_show";
          notes: string | null;
          external_customer_name: string | null;
          external_customer_phone: string | null;
          external_dog_name: string | null;
          external_dog_breed: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          dog_id?: string | null;
          appointment_date: string;
          appointment_time?: string | null;
          service_type: string;
          estimated_price?: number | null;
          status?: "confirmed" | "completed" | "cancelled" | "no_show";
          notes?: string | null;
          external_customer_name?: string | null;
          external_customer_phone?: string | null;
          external_dog_name?: string | null;
          external_dog_breed?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          dog_id?: string | null;
          appointment_date?: string;
          appointment_time?: string | null;
          service_type?: string;
          estimated_price?: number | null;
          status?: "confirmed" | "completed" | "cancelled" | "no_show";
          notes?: string | null;
          external_customer_name?: string | null;
          external_customer_phone?: string | null;
          external_dog_name?: string | null;
          external_dog_breed?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grooming_bookings_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grooming_bookings_dog_id_fkey";
            columns: ["dog_id"];
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
        ];
      };
      grooming_prices: {
        Row: {
          id: string;
          org_id: string;
          service_name: string;
          service_type: string;
          description: string | null;
          dog_size: string | null;
          coat_type: string | null;
          price: number;
          duration_minutes: number;
          active: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          service_name: string;
          service_type: string;
          description?: string | null;
          dog_size?: string | null;
          coat_type?: string | null;
          price: number;
          duration_minutes?: number;
          active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          service_name?: string;
          service_type?: string;
          description?: string | null;
          dog_size?: string | null;
          coat_type?: string | null;
          price?: number;
          duration_minutes?: number;
          active?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "grooming_prices_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      grooming_journal: {
        Row: {
          id: string;
          org_id: string | null;
          dog_id: string | null;
          appointment_date: string;
          service_type: string;
          clip_length: string | null;
          shampoo_type: string | null;
          special_treatments: string | null;
          final_price: number;
          duration_minutes: number | null;
          notes: string | null;
          before_photos: string[] | null;
          after_photos: string[] | null;
          next_appointment_recommended: string | null;
          external_customer_name: string | null;
          external_dog_name: string | null;
          external_dog_breed: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          dog_id?: string | null;
          appointment_date: string;
          service_type: string;
          clip_length?: string | null;
          shampoo_type?: string | null;
          special_treatments?: string | null;
          final_price?: number;
          duration_minutes?: number | null;
          notes?: string | null;
          before_photos?: string[] | null;
          after_photos?: string[] | null;
          next_appointment_recommended?: string | null;
          external_customer_name?: string | null;
          external_dog_name?: string | null;
          external_dog_breed?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          dog_id?: string | null;
          appointment_date?: string;
          service_type?: string;
          clip_length?: string | null;
          shampoo_type?: string | null;
          special_treatments?: string | null;
          final_price?: number;
          duration_minutes?: number | null;
          notes?: string | null;
          before_photos?: string[] | null;
          after_photos?: string[] | null;
          next_appointment_recommended?: string | null;
          external_customer_name?: string | null;
          external_dog_name?: string | null;
          external_dog_breed?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grooming_journal_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grooming_journal_dog_id_fkey";
            columns: ["dog_id"];
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_types: {
        Row: {
          id: string;
          org_id: string;
          subscription_type: string;
          height_min: number;
          height_max: number;
          price: number;
          description: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          subscription_type: string;
          height_min: number;
          height_max: number;
          price: number;
          description: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          subscription_type?: string;
          height_min?: number;
          height_max?: number;
          price?: number;
          description?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_types_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      daycare_pricing: {
        Row: {
          id: string;
          org_id: string;
          subscription_1day: number;
          subscription_2days: number;
          subscription_3days: number;
          subscription_4days: number;
          subscription_5days: number;
          single_day_price: number;
          sibling_discount_percent: number;
          trial_day_price: number;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          subscription_1day?: number;
          subscription_2days?: number;
          subscription_3days?: number;
          subscription_4days?: number;
          subscription_5days?: number;
          single_day_price?: number;
          sibling_discount_percent?: number;
          trial_day_price?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          subscription_1day?: number;
          subscription_2days?: number;
          subscription_3days?: number;
          subscription_4days?: number;
          subscription_5days?: number;
          single_day_price?: number;
          sibling_discount_percent?: number;
          trial_day_price?: number;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "daycare_pricing_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      extra_service: {
        Row: {
          id: string;
          org_id: string;
          dogs_id: string;
          service_id: string | null;
          service_type: string;
          frequency: string | null;
          quantity: number | null;
          price: number | null;
          notes: string | null;
          start_date: string | null;
          end_date: string | null;
          performed_at: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          dogs_id: string;
          service_id?: string | null;
          service_type: string;
          frequency?: string | null;
          quantity?: number | null;
          price?: number | null;
          notes?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          performed_at?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          dogs_id?: string;
          service_id?: string | null;
          service_type?: string;
          frequency?: string | null;
          quantity?: number | null;
          price?: number | null;
          notes?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          performed_at?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "extra_service_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "extra_service_dogs_id_fkey";
            columns: ["dogs_id"];
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
        ];
      };
      daycare_completions: {
        Row: {
          id: string;
          org_id: string;
          dog_id: string;
          service_type: string;
          is_completed: boolean;
          completed_at: string | null;
          completed_by_name: string | null;
          scheduled_month: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          dog_id: string;
          service_type: string;
          is_completed?: boolean;
          completed_at?: string | null;
          completed_by_name?: string | null;
          scheduled_month?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          dog_id?: string;
          service_type?: string;
          is_completed?: boolean;
          completed_at?: string | null;
          completed_by_name?: string | null;
          scheduled_month?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "daycare_completions_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daycare_completions_dog_id_fkey";
            columns: ["dog_id"];
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
        ];
      };
      daycare_service_completions: {
        Row: {
          id: string;
          org_id: string;
          dog_id: string;
          service_type: string;
          is_completed: boolean;
          completed_at: string | null;
          completed_by: string | null;
          completed_by_name: string | null;
          scheduled_month: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          dog_id: string;
          service_type: string;
          is_completed?: boolean;
          completed_at?: string | null;
          completed_by?: string | null;
          completed_by_name?: string | null;
          scheduled_month?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          dog_id?: string;
          service_type?: string;
          is_completed?: boolean;
          completed_at?: string | null;
          completed_by?: string | null;
          completed_by_name?: string | null;
          scheduled_month?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "daycare_service_completions_org_id_fkey";
            columns: ["org_id"];
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daycare_service_completions_dog_id_fkey";
            columns: ["dog_id"];
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [key: string]: never };
    Functions: {
      heal_user_missing_org: {
        Args: { p_user_id: string };
        Returns: {
          success: boolean;
          message: string;
          org_id?: string;
          created_new_org?: boolean;
          error?: string;
        };
      };
      register_subscription_start: {
        Args: { p_org_id: string; p_plan: string };
        Returns: { success: boolean; message: string };
      };
      calculate_yearly_refund: {
        Args: { p_org_id: string };
        Returns: {
          eligible: boolean;
          refund_amount: number;
          months_used: number;
          calculation: string;
        };
      };
      gdpr_delete_user_data: {
        Args: { p_user_id: string };
        Returns: {
          success: boolean;
          deleted: number;
          message: string;
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
