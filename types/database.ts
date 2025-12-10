export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      applications: {
        Row: {
          applied_at: string | null;
          created_at: string | null;
          dog_id: string;
          id: string;
          org_id: string;
          owner_id: string;
          responded_at: string | null;
          response_notes: string | null;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          applied_at?: string | null;
          created_at?: string | null;
          dog_id: string;
          id?: string;
          org_id: string;
          owner_id: string;
          responded_at?: string | null;
          response_notes?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Update: {
          applied_at?: string | null;
          created_at?: string | null;
          dog_id?: string;
          id?: string;
          org_id?: string;
          owner_id?: string;
          responded_at?: string | null;
          response_notes?: string | null;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "applications_dog_id_fkey";
            columns: ["dog_id"];
            isOneToOne: false;
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "applications_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "applications_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "owners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "pension_owner_summary_view";
            referencedColumns: ["owner_id"];
          },
        ];
      };
      attendance_logs: {
        Row: {
          check_in: string | null;
          check_out: string | null;
          created_at: string | null;
          date: string | null;
          dogs_id: string;
          id: string;
          notes: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          check_in?: string | null;
          check_out?: string | null;
          created_at?: string | null;
          date?: string | null;
          dogs_id: string;
          id?: string;
          notes?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          check_in?: string | null;
          check_out?: string | null;
          created_at?: string | null;
          date?: string | null;
          dogs_id?: string;
          id?: string;
          notes?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_logs_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "attendance_logs_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "attendance_logs_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_logs_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      boarding_prices: {
        Row: {
          base_price: number;
          created_at: string | null;
          dog_size: string;
          id: string;
          is_active: boolean | null;
          org_id: string;
          updated_at: string | null;
          weekend_surcharge: number | null;
        };
        Insert: {
          base_price: number;
          created_at?: string | null;
          dog_size: string;
          id?: string;
          is_active?: boolean | null;
          org_id: string;
          updated_at?: string | null;
          weekend_surcharge?: number | null;
        };
        Update: {
          base_price?: number;
          created_at?: string | null;
          dog_size?: string;
          id?: string;
          is_active?: boolean | null;
          org_id?: string;
          updated_at?: string | null;
          weekend_surcharge?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "boarding_prices_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "boarding_prices_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "boarding_prices_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "boarding_prices_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      boarding_seasons: {
        Row: {
          created_at: string | null;
          end_date: string | null;
          id: string;
          is_active: boolean | null;
          name: string | null;
          org_id: string | null;
          price_multiplier: number | null;
          start_date: string | null;
          type: string | null;
        };
        Insert: {
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string | null;
          org_id?: string | null;
          price_multiplier?: number | null;
          start_date?: string | null;
          type?: string | null;
        };
        Update: {
          created_at?: string | null;
          end_date?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string | null;
          org_id?: string | null;
          price_multiplier?: number | null;
          start_date?: string | null;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "boarding_seasons_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "boarding_seasons_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "boarding_seasons_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "boarding_seasons_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_events: {
        Row: {
          booking_id: string | null;
          created_at: string | null;
          event_type: string;
          id: string;
          metadata: Json | null;
          notes: string | null;
          org_id: string | null;
          performed_by_user_id: string | null;
        };
        Insert: {
          booking_id?: string | null;
          created_at?: string | null;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          org_id?: string | null;
          performed_by_user_id?: string | null;
        };
        Update: {
          booking_id?: string | null;
          created_at?: string | null;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          notes?: string | null;
          org_id?: string | null;
          performed_by_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "booking_events_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_events_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "booking_events_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "booking_events_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_events_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_services: {
        Row: {
          booking_id: string | null;
          created_at: string | null;
          id: string;
          price: number | null;
          quantity: number | null;
          service_id: string | null;
        };
        Insert: {
          booking_id?: string | null;
          created_at?: string | null;
          id?: string;
          price?: number | null;
          quantity?: number | null;
          service_id?: string | null;
        };
        Update: {
          booking_id?: string | null;
          created_at?: string | null;
          id?: string;
          price?: number | null;
          quantity?: number | null;
          service_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "booking_services_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          addons: Json | null;
          afterpayment_invoice_id: string | null;
          base_price: number | null;
          bed_location: string | null;
          belongings: string | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          cancelled_by_user_id: string | null;
          checkin_time: string | null;
          checkout_time: string | null;
          consent_pending_until: string | null;
          consent_required: boolean | null;
          created_at: string | null;
          deposit_amount: number | null;
          deposit_paid: boolean | null;
          discount_amount: number | null;
          dog_id: string | null;
          end_date: string;
          extra_service_ids: Json | null;
          id: string;
          is_active: boolean | null;
          notes: string | null;
          org_id: string | null;
          owner_id: string | null;
          prepayment_invoice_id: string | null;
          prepayment_status: string | null;
          room_id: string | null;
          start_date: string;
          status: string | null;
          total_price: number | null;
          updated_at: string | null;
        };
        Insert: {
          addons?: Json | null;
          afterpayment_invoice_id?: string | null;
          base_price?: number | null;
          bed_location?: string | null;
          belongings?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by_user_id?: string | null;
          checkin_time?: string | null;
          checkout_time?: string | null;
          consent_pending_until?: string | null;
          consent_required?: boolean | null;
          created_at?: string | null;
          deposit_amount?: number | null;
          deposit_paid?: boolean | null;
          discount_amount?: number | null;
          dog_id?: string | null;
          end_date: string;
          extra_service_ids?: Json | null;
          id?: string;
          is_active?: boolean | null;
          notes?: string | null;
          org_id?: string | null;
          owner_id?: string | null;
          prepayment_invoice_id?: string | null;
          prepayment_status?: string | null;
          room_id?: string | null;
          start_date: string;
          status?: string | null;
          total_price?: number | null;
          updated_at?: string | null;
        };
        Update: {
          addons?: Json | null;
          afterpayment_invoice_id?: string | null;
          base_price?: number | null;
          bed_location?: string | null;
          belongings?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by_user_id?: string | null;
          checkin_time?: string | null;
          checkout_time?: string | null;
          consent_pending_until?: string | null;
          consent_required?: boolean | null;
          created_at?: string | null;
          deposit_amount?: number | null;
          deposit_paid?: boolean | null;
          discount_amount?: number | null;
          dog_id?: string | null;
          end_date?: string;
          extra_service_ids?: Json | null;
          id?: string;
          is_active?: boolean | null;
          notes?: string | null;
          org_id?: string | null;
          owner_id?: string | null;
          prepayment_invoice_id?: string | null;
          prepayment_status?: string | null;
          room_id?: string | null;
          start_date?: string;
          status?: string | null;
          total_price?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_afterpayment_invoice_id_fkey";
            columns: ["afterpayment_invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_dog_id_fkey";
            columns: ["dog_id"];
            isOneToOne: false;
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "bookings_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "bookings_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "owners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "pension_owner_summary_view";
            referencedColumns: ["owner_id"];
          },
          {
            foreignKeyName: "bookings_prepayment_invoice_id_fkey";
            columns: ["prepayment_invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "pension_calendar_full_view";
            referencedColumns: ["room_id"];
          },
          {
            foreignKeyName: "bookings_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "pension_room_occupancy_view";
            referencedColumns: ["room_id"];
          },
          {
            foreignKeyName: "bookings_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      consent_logs: {
        Row: {
          consent_given: boolean;
          consent_text: string;
          consent_type: string;
          consent_version: string | null;
          created_at: string | null;
          created_by: string | null;
          expires_at: string | null;
          given_at: string;
          id: string;
          ip_address: unknown;
          org_id: string;
          owner_id: string | null;
          signed_document_url: string | null;
          updated_at: string | null;
          user_agent: string | null;
          withdrawn_at: string | null;
          witness_notes: string | null;
          witness_staff_id: string | null;
        };
        Insert: {
          consent_given: boolean;
          consent_text: string;
          consent_type: string;
          consent_version?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          given_at?: string;
          id?: string;
          ip_address?: unknown;
          org_id: string;
          owner_id?: string | null;
          signed_document_url?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          withdrawn_at?: string | null;
          witness_notes?: string | null;
          witness_staff_id?: string | null;
        };
        Update: {
          consent_given?: boolean;
          consent_text?: string;
          consent_type?: string;
          consent_version?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          given_at?: string;
          id?: string;
          ip_address?: unknown;
          org_id?: string;
          owner_id?: string | null;
          signed_document_url?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          withdrawn_at?: string | null;
          witness_notes?: string | null;
          witness_staff_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "consent_logs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "consent_logs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "consent_logs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "consent_logs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "consent_logs_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "owners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "consent_logs_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "pension_owner_summary_view";
            referencedColumns: ["owner_id"];
          },
        ];
      };
      daycare_pricing: {
        Row: {
          created_at: string;
          id: string;
          org_id: string;
          sibling_discount_percent: number;
          single_day_price: number;
          subscription_1day: number;
          subscription_2days: number;
          subscription_3days: number;
          subscription_4days: number;
          subscription_5days: number;
          trial_day_price: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          org_id: string;
          sibling_discount_percent?: number;
          single_day_price?: number;
          subscription_1day?: number;
          subscription_2days?: number;
          subscription_3days?: number;
          subscription_4days?: number;
          subscription_5days?: number;
          trial_day_price?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          org_id?: string;
          sibling_discount_percent?: number;
          single_day_price?: number;
          subscription_1day?: number;
          subscription_2days?: number;
          subscription_3days?: number;
          subscription_4days?: number;
          subscription_5days?: number;
          trial_day_price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daycare_pricing_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: true;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "daycare_pricing_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: true;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "daycare_pricing_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: true;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daycare_pricing_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: true;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      daycare_service_completions: {
        Row: {
          completed_at: string | null;
          completed_by: string | null;
          created_at: string | null;
          dog_id: string | null;
          id: string;
          notes: string | null;
          org_id: string | null;
          scheduled_date: string;
          service_type: string;
          updated_at: string | null;
        };
        Insert: {
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          dog_id?: string | null;
          id?: string;
          notes?: string | null;
          org_id?: string | null;
          scheduled_date: string;
          service_type: string;
          updated_at?: string | null;
        };
        Update: {
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          dog_id?: string | null;
          id?: string;
          notes?: string | null;
          org_id?: string | null;
          scheduled_date?: string;
          service_type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "daycare_service_completions_dog_id_fkey";
            columns: ["dog_id"];
            isOneToOne: false;
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daycare_service_completions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "daycare_service_completions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "daycare_service_completions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "daycare_service_completions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      dog_journal: {
        Row: {
          content: string;
          created_at: string | null;
          dog_id: string;
          entry_type: string | null;
          id: string;
          org_id: string | null;
          text: string | null;
          user_id: string | null;
        };
        Insert: {
          content?: string;
          created_at?: string | null;
          dog_id: string;
          entry_type?: string | null;
          id?: string;
          org_id?: string | null;
          text?: string | null;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          dog_id?: string;
          entry_type?: string | null;
          id?: string;
          org_id?: string | null;
          text?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dog_journal_dog_id_fkey";
            columns: ["dog_id"];
            isOneToOne: false;
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
        ];
      };
      dogs: {
        Row: {
          addons: Json | null;
          allergies: string | null;
          behavior_notes: string | null;
          birth: string | null;
          birth_date: string | null;
          breed: string | null;
          can_be_with_other_dogs: boolean | null;
          can_share_room: boolean | null;
          checked_in: boolean | null;
          checkin_date: string | null;
          checkout_date: string | null;
          created_at: string | null;
          days: string | null;
          deleted_at: string | null;
          deleted_reason: string | null;
          destroys_things: boolean | null;
          enddate: string | null;
          events: Json | null;
          food_amount: string | null;
          food_brand: string | null;
          food_info: string | null;
          food_times: string | null;
          food_type: string | null;
          gender: string | null;
          heat_start_date: string | null;
          heightcm: number | null;
          id: string;
          in_heat: boolean | null;
          insurance_company: string | null;
          insurance_number: string | null;
          is_active: boolean | null;
          is_castrated: boolean | null;
          is_deleted: boolean | null;
          is_escape_artist: boolean | null;
          is_house_trained: boolean | null;
          is_sterilized: boolean | null;
          last_updated: string | null;
          medical_notes: string | null;
          medications: string | null;
          name: string;
          note: string | null;
          notes: string | null;
          org_id: string | null;
          owner: Json | null;
          owner_id: string | null;
          personality_traits: string[] | null;
          photo_url: string | null;
          price: number | null;
          registered_at: string | null;
          room_id: string | null;
          roomid: string | null;
          special_needs: string | null;
          startdate: string | null;
          subscription: string | null;
          user_id: string | null;
          vaccdhp: string | null;
          vaccpi: string | null;
          waitlist: boolean | null;
          weight_kg: number | null;
        };
        Insert: {
          addons?: Json | null;
          allergies?: string | null;
          behavior_notes?: string | null;
          birth?: string | null;
          birth_date?: string | null;
          breed?: string | null;
          can_be_with_other_dogs?: boolean | null;
          can_share_room?: boolean | null;
          checked_in?: boolean | null;
          checkin_date?: string | null;
          checkout_date?: string | null;
          created_at?: string | null;
          days?: string | null;
          deleted_at?: string | null;
          deleted_reason?: string | null;
          destroys_things?: boolean | null;
          enddate?: string | null;
          events?: Json | null;
          food_amount?: string | null;
          food_brand?: string | null;
          food_info?: string | null;
          food_times?: string | null;
          food_type?: string | null;
          gender?: string | null;
          heat_start_date?: string | null;
          heightcm?: number | null;
          id?: string;
          in_heat?: boolean | null;
          insurance_company?: string | null;
          insurance_number?: string | null;
          is_active?: boolean | null;
          is_castrated?: boolean | null;
          is_deleted?: boolean | null;
          is_escape_artist?: boolean | null;
          is_house_trained?: boolean | null;
          is_sterilized?: boolean | null;
          last_updated?: string | null;
          medical_notes?: string | null;
          medications?: string | null;
          name: string;
          note?: string | null;
          notes?: string | null;
          org_id?: string | null;
          owner?: Json | null;
          owner_id?: string | null;
          personality_traits?: string[] | null;
          photo_url?: string | null;
          price?: number | null;
          registered_at?: string | null;
          room_id?: string | null;
          roomid?: string | null;
          special_needs?: string | null;
          startdate?: string | null;
          subscription?: string | null;
          user_id?: string | null;
          vaccdhp?: string | null;
          vaccpi?: string | null;
          waitlist?: boolean | null;
          weight_kg?: number | null;
        };
        Update: {
          addons?: Json | null;
          allergies?: string | null;
          behavior_notes?: string | null;
          birth?: string | null;
          birth_date?: string | null;
          breed?: string | null;
          can_be_with_other_dogs?: boolean | null;
          can_share_room?: boolean | null;
          checked_in?: boolean | null;
          checkin_date?: string | null;
          checkout_date?: string | null;
          created_at?: string | null;
          days?: string | null;
          deleted_at?: string | null;
          deleted_reason?: string | null;
          destroys_things?: boolean | null;
          enddate?: string | null;
          events?: Json | null;
          food_amount?: string | null;
          food_brand?: string | null;
          food_info?: string | null;
          food_times?: string | null;
          food_type?: string | null;
          gender?: string | null;
          heat_start_date?: string | null;
          heightcm?: number | null;
          id?: string;
          in_heat?: boolean | null;
          insurance_company?: string | null;
          insurance_number?: string | null;
          is_active?: boolean | null;
          is_castrated?: boolean | null;
          is_deleted?: boolean | null;
          is_escape_artist?: boolean | null;
          is_house_trained?: boolean | null;
          is_sterilized?: boolean | null;
          last_updated?: string | null;
          medical_notes?: string | null;
          medications?: string | null;
          name?: string;
          note?: string | null;
          notes?: string | null;
          org_id?: string | null;
          owner?: Json | null;
          owner_id?: string | null;
          personality_traits?: string[] | null;
          photo_url?: string | null;
          price?: number | null;
          registered_at?: string | null;
          room_id?: string | null;
          roomid?: string | null;
          special_needs?: string | null;
          startdate?: string | null;
          subscription?: string | null;
          user_id?: string | null;
          vaccdhp?: string | null;
          vaccpi?: string | null;
          waitlist?: boolean | null;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "dogs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "dogs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "dogs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dogs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dogs_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "owners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dogs_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "pension_owner_summary_view";
            referencedColumns: ["owner_id"];
          },
          {
            foreignKeyName: "dogs_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "pension_calendar_full_view";
            referencedColumns: ["room_id"];
          },
          {
            foreignKeyName: "dogs_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "pension_room_occupancy_view";
            referencedColumns: ["room_id"];
          },
          {
            foreignKeyName: "dogs_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      error_logs: {
        Row: {
          created_at: string | null;
          date: string | null;
          function: string | null;
          id: string;
          message: string | null;
        };
        Insert: {
          created_at?: string | null;
          date?: string | null;
          function?: string | null;
          id?: string;
          message?: string | null;
        };
        Update: {
          created_at?: string | null;
          date?: string | null;
          function?: string | null;
          id?: string;
          message?: string | null;
        };
        Relationships: [];
      };
      external_customers: {
        Row: {
          created_at: string | null;
          customer_name: string;
          customer_phone: string;
          dog_breed: string | null;
          dog_name: string;
          id: string;
          last_visit_date: string | null;
          notes: string | null;
          org_id: string;
          total_visits: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          customer_name: string;
          customer_phone: string;
          dog_breed?: string | null;
          dog_name: string;
          id?: string;
          last_visit_date?: string | null;
          notes?: string | null;
          org_id: string;
          total_visits?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          customer_name?: string;
          customer_phone?: string;
          dog_breed?: string | null;
          dog_name?: string;
          id?: string;
          last_visit_date?: string | null;
          notes?: string | null;
          org_id?: string;
          total_visits?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "external_customers_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "external_customers_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "external_customers_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "external_customers_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      extra_service: {
        Row: {
          created_at: string | null;
          dogs_id: string;
          end_date: string | null;
          id: string;
          is_active: boolean | null;
          notes: string | null;
          org_id: string | null;
          payment_type: string | null;
          performed_at: string;
          price: number | null;
          quantity: number | null;
          service_type: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          dogs_id: string;
          end_date?: string | null;
          id?: string;
          is_active?: boolean | null;
          notes?: string | null;
          org_id?: string | null;
          payment_type?: string | null;
          performed_at?: string;
          price?: number | null;
          quantity?: number | null;
          service_type?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          dogs_id?: string;
          end_date?: string | null;
          id?: string;
          is_active?: boolean | null;
          notes?: string | null;
          org_id?: string | null;
          payment_type?: string | null;
          performed_at?: string;
          price?: number | null;
          quantity?: number | null;
          service_type?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "extra_service_dogs_id_fkey";
            columns: ["dogs_id"];
            isOneToOne: false;
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "extra_service_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "extra_service_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "extra_service_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "extra_service_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      extra_services: {
        Row: {
          branch_id: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          label: string;
          org_id: string | null;
          price: number;
          service_type: string | null;
          unit: string;
          updated_at: string | null;
        };
        Insert: {
          branch_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          label: string;
          org_id?: string | null;
          price: number;
          service_type?: string | null;
          unit: string;
          updated_at?: string | null;
        };
        Update: {
          branch_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          label?: string;
          org_id?: string | null;
          price?: number;
          service_type?: string | null;
          unit?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "extra_services_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "extra_services_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "extra_services_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "extra_services_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      function_logs: {
        Row: {
          error: string | null;
          function_name: string;
          id: string;
          message: string | null;
          records_created: number | null;
          run_at: string | null;
          status: string | null;
        };
        Insert: {
          error?: string | null;
          function_name: string;
          id?: string;
          message?: string | null;
          records_created?: number | null;
          run_at?: string | null;
          status?: string | null;
        };
        Update: {
          error?: string | null;
          function_name?: string;
          id?: string;
          message?: string | null;
          records_created?: number | null;
          run_at?: string | null;
          status?: string | null;
        };
        Relationships: [];
      };
      gdpr_deletion_log: {
        Row: {
          booking_count: number | null;
          deleted_at: string | null;
          dog_count: number | null;
          id: string;
          invoice_count: number | null;
          owner_id: string | null;
          user_id: string;
        };
        Insert: {
          booking_count?: number | null;
          deleted_at?: string | null;
          dog_count?: number | null;
          id?: string;
          invoice_count?: number | null;
          owner_id?: string | null;
          user_id: string;
        };
        Update: {
          booking_count?: number | null;
          deleted_at?: string | null;
          dog_count?: number | null;
          id?: string;
          invoice_count?: number | null;
          owner_id?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      grooming_bookings: {
        Row: {
          appointment_date: string;
          appointment_time: string | null;
          clip_length: string | null;
          created_at: string | null;
          dog_id: string | null;
          estimated_price: number | null;
          external_customer_name: string | null;
          external_customer_phone: string | null;
          external_dog_breed: string | null;
          external_dog_name: string | null;
          id: string;
          notes: string | null;
          org_id: string | null;
          service_type: string;
          shampoo_type: string | null;
          status: string;
        };
        Insert: {
          appointment_date: string;
          appointment_time?: string | null;
          clip_length?: string | null;
          created_at?: string | null;
          dog_id?: string | null;
          estimated_price?: number | null;
          external_customer_name?: string | null;
          external_customer_phone?: string | null;
          external_dog_breed?: string | null;
          external_dog_name?: string | null;
          id?: string;
          notes?: string | null;
          org_id?: string | null;
          service_type: string;
          shampoo_type?: string | null;
          status?: string;
        };
        Update: {
          appointment_date?: string;
          appointment_time?: string | null;
          clip_length?: string | null;
          created_at?: string | null;
          dog_id?: string | null;
          estimated_price?: number | null;
          external_customer_name?: string | null;
          external_customer_phone?: string | null;
          external_dog_breed?: string | null;
          external_dog_name?: string | null;
          id?: string;
          notes?: string | null;
          org_id?: string | null;
          service_type?: string;
          shampoo_type?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grooming_bookings_dog_id_fkey";
            columns: ["dog_id"];
            isOneToOne: false;
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grooming_bookings_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "grooming_bookings_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "grooming_bookings_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grooming_bookings_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      grooming_journal: {
        Row: {
          after_photos: string[] | null;
          appointment_date: string;
          before_photos: string[] | null;
          booking_id: string | null;
          clip_length: string | null;
          created_at: string | null;
          dog_id: string | null;
          duration_minutes: number | null;
          external_customer_name: string | null;
          external_dog_breed: string | null;
          external_dog_name: string | null;
          final_price: number;
          id: string;
          next_appointment_recommended: string | null;
          notes: string | null;
          org_id: string | null;
          service_type: string;
          shampoo_type: string | null;
          special_treatments: string | null;
        };
        Insert: {
          after_photos?: string[] | null;
          appointment_date: string;
          before_photos?: string[] | null;
          booking_id?: string | null;
          clip_length?: string | null;
          created_at?: string | null;
          dog_id?: string | null;
          duration_minutes?: number | null;
          external_customer_name?: string | null;
          external_dog_breed?: string | null;
          external_dog_name?: string | null;
          final_price?: number;
          id?: string;
          next_appointment_recommended?: string | null;
          notes?: string | null;
          org_id?: string | null;
          service_type: string;
          shampoo_type?: string | null;
          special_treatments?: string | null;
        };
        Update: {
          after_photos?: string[] | null;
          appointment_date?: string;
          before_photos?: string[] | null;
          booking_id?: string | null;
          clip_length?: string | null;
          created_at?: string | null;
          dog_id?: string | null;
          duration_minutes?: number | null;
          external_customer_name?: string | null;
          external_dog_breed?: string | null;
          external_dog_name?: string | null;
          final_price?: number;
          id?: string;
          next_appointment_recommended?: string | null;
          notes?: string | null;
          org_id?: string | null;
          service_type?: string;
          shampoo_type?: string | null;
          special_treatments?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "grooming_journal_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "grooming_bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grooming_journal_dog_id_fkey";
            columns: ["dog_id"];
            isOneToOne: false;
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grooming_journal_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "grooming_journal_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "grooming_journal_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grooming_journal_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      grooming_logs: {
        Row: {
          clip_type: string | null;
          created_at: string | null;
          dog_id: string;
          id: string;
          notes: string | null;
          org_id: string | null;
          performed_at: string;
          price: number | null;
          products: string | null;
          stylist_name: string | null;
          updated_at: string | null;
        };
        Insert: {
          clip_type?: string | null;
          created_at?: string | null;
          dog_id: string;
          id?: string;
          notes?: string | null;
          org_id?: string | null;
          performed_at?: string;
          price?: number | null;
          products?: string | null;
          stylist_name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          clip_type?: string | null;
          created_at?: string | null;
          dog_id?: string;
          id?: string;
          notes?: string | null;
          org_id?: string | null;
          performed_at?: string;
          price?: number | null;
          products?: string | null;
          stylist_name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "grooming_logs_dog_id_fkey";
            columns: ["dog_id"];
            isOneToOne: false;
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grooming_logs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "grooming_logs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "grooming_logs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grooming_logs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      grooming_prices: {
        Row: {
          active: boolean | null;
          coat_type: string | null;
          created_at: string | null;
          description: string | null;
          dog_size: string | null;
          duration_minutes: number;
          id: string;
          org_id: string;
          price: number;
          service_name: string;
          service_type: string;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          coat_type?: string | null;
          created_at?: string | null;
          description?: string | null;
          dog_size?: string | null;
          duration_minutes?: number;
          id?: string;
          org_id: string;
          price?: number;
          service_name: string;
          service_type: string;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          coat_type?: string | null;
          created_at?: string | null;
          description?: string | null;
          dog_size?: string | null;
          duration_minutes?: number;
          id?: string;
          org_id?: string;
          price?: number;
          service_name?: string;
          service_type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "grooming_prices_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "grooming_prices_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "grooming_prices_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grooming_prices_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      grooming_services: {
        Row: {
          base_price: number;
          created_at: string;
          description: string | null;
          id: string;
          org_id: string;
          service_name: string;
          size_multiplier_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          base_price?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          org_id: string;
          service_name: string;
          size_multiplier_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          base_price?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          org_id?: string;
          service_name?: string;
          size_multiplier_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "grooming_services_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "grooming_services_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "grooming_services_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grooming_services_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      interest_applications: {
        Row: {
          contact_history: Json | null;
          created_at: string | null;
          destroys_things: boolean | null;
          dog_age: number | null;
          dog_birth: string | null;
          dog_breed: string | null;
          dog_gender: string | null;
          dog_height_cm: number | null;
          dog_name: string;
          dog_size: string | null;
          expected_start_month: string | null;
          first_contact_date: string | null;
          first_contact_notes: string | null;
          gdpr_consent: boolean | null;
          id: string;
          is_escape_artist: boolean | null;
          is_neutered: boolean | null;
          not_house_trained: boolean | null;
          notes: string | null;
          org_id: string | null;
          owner_address: string | null;
          owner_city: string | null;
          parent_email: string;
          parent_name: string;
          parent_phone: string;
          preferred_days: string[] | null;
          preferred_start_date: string | null;
          previous_daycare_experience: boolean | null;
          priority: number | null;
          special_care_needs: string | null;
          special_needs: string | null;
          status: string;
          subscription_type: string | null;
          updated_at: string | null;
          visit_booked_date: string | null;
          visit_booked_time: string | null;
          visit_completed_date: string | null;
          visit_result: string | null;
          visit_status: string | null;
        };
        Insert: {
          contact_history?: Json | null;
          created_at?: string | null;
          destroys_things?: boolean | null;
          dog_age?: number | null;
          dog_birth?: string | null;
          dog_breed?: string | null;
          dog_gender?: string | null;
          dog_height_cm?: number | null;
          dog_name: string;
          dog_size?: string | null;
          expected_start_month?: string | null;
          first_contact_date?: string | null;
          first_contact_notes?: string | null;
          gdpr_consent?: boolean | null;
          id?: string;
          is_escape_artist?: boolean | null;
          is_neutered?: boolean | null;
          not_house_trained?: boolean | null;
          notes?: string | null;
          org_id?: string | null;
          owner_address?: string | null;
          owner_city?: string | null;
          parent_email: string;
          parent_name: string;
          parent_phone: string;
          preferred_days?: string[] | null;
          preferred_start_date?: string | null;
          previous_daycare_experience?: boolean | null;
          priority?: number | null;
          special_care_needs?: string | null;
          special_needs?: string | null;
          status?: string;
          subscription_type?: string | null;
          updated_at?: string | null;
          visit_booked_date?: string | null;
          visit_booked_time?: string | null;
          visit_completed_date?: string | null;
          visit_result?: string | null;
          visit_status?: string | null;
        };
        Update: {
          contact_history?: Json | null;
          created_at?: string | null;
          destroys_things?: boolean | null;
          dog_age?: number | null;
          dog_birth?: string | null;
          dog_breed?: string | null;
          dog_gender?: string | null;
          dog_height_cm?: number | null;
          dog_name?: string;
          dog_size?: string | null;
          expected_start_month?: string | null;
          first_contact_date?: string | null;
          first_contact_notes?: string | null;
          gdpr_consent?: boolean | null;
          id?: string;
          is_escape_artist?: boolean | null;
          is_neutered?: boolean | null;
          not_house_trained?: boolean | null;
          notes?: string | null;
          org_id?: string | null;
          owner_address?: string | null;
          owner_city?: string | null;
          parent_email?: string;
          parent_name?: string;
          parent_phone?: string;
          preferred_days?: string[] | null;
          preferred_start_date?: string | null;
          previous_daycare_experience?: boolean | null;
          priority?: number | null;
          special_care_needs?: string | null;
          special_needs?: string | null;
          status?: string;
          subscription_type?: string | null;
          updated_at?: string | null;
          visit_booked_date?: string | null;
          visit_booked_time?: string | null;
          visit_completed_date?: string | null;
          visit_result?: string | null;
          visit_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "interest_applications_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "interest_applications_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "interest_applications_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interest_applications_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_counters: {
        Row: {
          counter: number;
          created_at: string | null;
          current_year: number;
          org_id: string;
          prefix: string | null;
          updated_at: string | null;
        };
        Insert: {
          counter?: number;
          created_at?: string | null;
          current_year: number;
          org_id: string;
          prefix?: string | null;
          updated_at?: string | null;
        };
        Update: {
          counter?: number;
          created_at?: string | null;
          current_year?: number;
          org_id?: string;
          prefix?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_counters_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "invoice_counters_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "invoice_counters_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_counters_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_items: {
        Row: {
          amount: number | null;
          booking_id: string | null;
          description: string | null;
          id: string;
          invoice_id: string;
          qty: number | null;
          unit_price: number | null;
        };
        Insert: {
          amount?: number | null;
          booking_id?: string | null;
          description?: string | null;
          id?: string;
          invoice_id: string;
          qty?: number | null;
          unit_price?: number | null;
        };
        Update: {
          amount?: number | null;
          booking_id?: string | null;
          description?: string | null;
          id?: string;
          invoice_id?: string;
          qty?: number | null;
          unit_price?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_runs: {
        Row: {
          error_message: string | null;
          id: string;
          invoices_created: number | null;
          metadata: Json | null;
          month_id: string;
          run_at: string | null;
          status: string;
        };
        Insert: {
          error_message?: string | null;
          id?: string;
          invoices_created?: number | null;
          metadata?: Json | null;
          month_id: string;
          run_at?: string | null;
          status: string;
        };
        Update: {
          error_message?: string | null;
          id?: string;
          invoices_created?: number | null;
          metadata?: Json | null;
          month_id?: string;
          run_at?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          billed_address: string | null;
          billed_email: string | null;
          billed_name: string | null;
          collection_fee: number | null;
          created_at: string | null;
          deleted_at: string | null;
          due_date: string | null;
          id: string;
          invoice_date: string;
          invoice_number: string | null;
          invoice_type: string | null;
          late_interest: number | null;
          ocr_number: string | null;
          org_id: string;
          owner_id: string | null;
          paid_at: string | null;
          payment_method: string | null;
          payment_reference: string | null;
          reminder_1_date: string | null;
          reminder_1_fee: number | null;
          reminder_2_date: string | null;
          reminder_2_fee: number | null;
          sent_at: string | null;
          status: string | null;
          total_amount: number | null;
        };
        Insert: {
          billed_address?: string | null;
          billed_email?: string | null;
          billed_name?: string | null;
          collection_fee?: number | null;
          created_at?: string | null;
          deleted_at?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_date?: string;
          invoice_number?: string | null;
          invoice_type?: string | null;
          late_interest?: number | null;
          ocr_number?: string | null;
          org_id: string;
          owner_id?: string | null;
          paid_at?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          reminder_1_date?: string | null;
          reminder_1_fee?: number | null;
          reminder_2_date?: string | null;
          reminder_2_fee?: number | null;
          sent_at?: string | null;
          status?: string | null;
          total_amount?: number | null;
        };
        Update: {
          billed_address?: string | null;
          billed_email?: string | null;
          billed_name?: string | null;
          collection_fee?: number | null;
          created_at?: string | null;
          deleted_at?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_date?: string;
          invoice_number?: string | null;
          invoice_type?: string | null;
          late_interest?: number | null;
          ocr_number?: string | null;
          org_id?: string;
          owner_id?: string | null;
          paid_at?: string | null;
          payment_method?: string | null;
          payment_reference?: string | null;
          reminder_1_date?: string | null;
          reminder_1_fee?: number | null;
          reminder_2_date?: string | null;
          reminder_2_fee?: number | null;
          sent_at?: string | null;
          status?: string | null;
          total_amount?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "invoices_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "invoices_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "owners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "pension_owner_summary_view";
            referencedColumns: ["owner_id"];
          },
        ];
      };
      migrations: {
        Row: {
          created_by: string | null;
          description: string | null;
          executed_at: string | null;
          execution_time_ms: number | null;
          id: number;
          version: string;
        };
        Insert: {
          created_by?: string | null;
          description?: string | null;
          executed_at?: string | null;
          execution_time_ms?: number | null;
          id?: number;
          version: string;
        };
        Update: {
          created_by?: string | null;
          description?: string | null;
          executed_at?: string | null;
          execution_time_ms?: number | null;
          id?: number;
          version?: string;
        };
        Relationships: [];
      };
      org_email_history: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          org_number: string;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          org_number: string;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          org_number?: string;
        };
        Relationships: [];
      };
      org_number_subscription_history: {
        Row: {
          first_subscription_at: string | null;
          has_had_subscription: boolean | null;
          last_checked_at: string | null;
          org_number: string;
        };
        Insert: {
          first_subscription_at?: string | null;
          has_had_subscription?: boolean | null;
          last_checked_at?: string | null;
          org_number: string;
        };
        Update: {
          first_subscription_at?: string | null;
          has_had_subscription?: boolean | null;
          last_checked_at?: string | null;
          org_number?: string;
        };
        Relationships: [];
      };
      org_subscriptions: {
        Row: {
          created_at: string | null;
          current_period_end: string | null;
          id: string;
          is_active: boolean;
          org_id: string;
          plan: string;
          status: string;
          trial_ends_at: string | null;
          trial_starts_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_period_end?: string | null;
          id?: string;
          is_active?: boolean;
          org_id: string;
          plan?: string;
          status?: string;
          trial_ends_at?: string | null;
          trial_starts_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_period_end?: string | null;
          id?: string;
          is_active?: boolean;
          org_id?: string;
          plan?: string;
          status?: string;
          trial_ends_at?: string | null;
          trial_starts_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "org_subscriptions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "org_subscriptions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "org_subscriptions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "org_subscriptions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      orgs: {
        Row: {
          accepting_applications: boolean | null;
          address: string | null;
          bank_name: string | null;
          bankgiro: string | null;
          bic_swift: string | null;
          billing_period: string | null;
          cancellation_policy: Json | null;
          contact_email: string | null;
          created_at: string | null;
          email: string | null;
          email_sender_name: string | null;
          enabled_services: string[] | null;
          has_had_subscription: boolean | null;
          iban: string | null;
          id: string;
          interest_rate: number | null;
          invoice_email: string | null;
          invoice_prefix: string | null;
          is_visible_to_customers: boolean | null;
          kommun: string | null;
          lan: string | null;
          late_fee_amount: number | null;
          name: string;
          org_number: string | null;
          payment_terms_days: number | null;
          pending_plan_change: string | null;
          phone: string | null;
          plusgiro: string | null;
          pricing_currency: string | null;
          reply_to_email: string | null;
          service_types: string[] | null;
          slug: string | null;
          status: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_cancelled_at: string | null;
          subscription_plan: string | null;
          subscription_start_date: string | null;
          subscription_status: string | null;
          swish_number: string | null;
          trial_ends_at: string | null;
          user_id: string | null;
          vat_included: boolean | null;
          vat_rate: number | null;
          warning_sent: boolean | null;
        };
        Insert: {
          accepting_applications?: boolean | null;
          address?: string | null;
          bank_name?: string | null;
          bankgiro?: string | null;
          bic_swift?: string | null;
          billing_period?: string | null;
          cancellation_policy?: Json | null;
          contact_email?: string | null;
          created_at?: string | null;
          email?: string | null;
          email_sender_name?: string | null;
          enabled_services?: string[] | null;
          has_had_subscription?: boolean | null;
          iban?: string | null;
          id?: string;
          interest_rate?: number | null;
          invoice_email?: string | null;
          invoice_prefix?: string | null;
          is_visible_to_customers?: boolean | null;
          kommun?: string | null;
          lan?: string | null;
          late_fee_amount?: number | null;
          name: string;
          org_number?: string | null;
          payment_terms_days?: number | null;
          pending_plan_change?: string | null;
          phone?: string | null;
          plusgiro?: string | null;
          pricing_currency?: string | null;
          reply_to_email?: string | null;
          service_types?: string[] | null;
          slug?: string | null;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_cancelled_at?: string | null;
          subscription_plan?: string | null;
          subscription_start_date?: string | null;
          subscription_status?: string | null;
          swish_number?: string | null;
          trial_ends_at?: string | null;
          user_id?: string | null;
          vat_included?: boolean | null;
          vat_rate?: number | null;
          warning_sent?: boolean | null;
        };
        Update: {
          accepting_applications?: boolean | null;
          address?: string | null;
          bank_name?: string | null;
          bankgiro?: string | null;
          bic_swift?: string | null;
          billing_period?: string | null;
          cancellation_policy?: Json | null;
          contact_email?: string | null;
          created_at?: string | null;
          email?: string | null;
          email_sender_name?: string | null;
          enabled_services?: string[] | null;
          has_had_subscription?: boolean | null;
          iban?: string | null;
          id?: string;
          interest_rate?: number | null;
          invoice_email?: string | null;
          invoice_prefix?: string | null;
          is_visible_to_customers?: boolean | null;
          kommun?: string | null;
          lan?: string | null;
          late_fee_amount?: number | null;
          name?: string;
          org_number?: string | null;
          payment_terms_days?: number | null;
          pending_plan_change?: string | null;
          phone?: string | null;
          plusgiro?: string | null;
          pricing_currency?: string | null;
          reply_to_email?: string | null;
          service_types?: string[] | null;
          slug?: string | null;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_cancelled_at?: string | null;
          subscription_plan?: string | null;
          subscription_start_date?: string | null;
          subscription_status?: string | null;
          swish_number?: string | null;
          trial_ends_at?: string | null;
          user_id?: string | null;
          vat_included?: boolean | null;
          vat_rate?: number | null;
          warning_sent?: boolean | null;
        };
        Relationships: [];
      };
      owner_discounts: {
        Row: {
          created_at: string | null;
          discount_type: string;
          discount_value: number;
          id: string;
          is_active: boolean | null;
          org_id: string;
          owner_id: string;
          reason: string | null;
          updated_at: string | null;
          valid_from: string | null;
          valid_until: string | null;
        };
        Insert: {
          created_at?: string | null;
          discount_type: string;
          discount_value: number;
          id?: string;
          is_active?: boolean | null;
          org_id: string;
          owner_id: string;
          reason?: string | null;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Update: {
          created_at?: string | null;
          discount_type?: string;
          discount_value?: number;
          id?: string;
          is_active?: boolean | null;
          org_id?: string;
          owner_id?: string;
          reason?: string | null;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "owner_discounts_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "owner_discounts_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "owner_discounts_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "owner_discounts_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "owner_discounts_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "owners";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "owner_discounts_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "pension_owner_summary_view";
            referencedColumns: ["owner_id"];
          },
        ];
      };
      owners: {
        Row: {
          address: string | null;
          anonymization_reason: string | null;
          anonymized_at: string | null;
          city: string | null;
          consent_status: string | null;
          consent_verified_at: string | null;
          contact_person_2: string | null;
          contact_phone_2: string | null;
          created_at: string | null;
          customer_number: number | null;
          data_retention_until: string | null;
          email: string | null;
          full_name: string | null;
          gdpr_consent: boolean | null;
          gdpr_marketing_consent: boolean | null;
          id: string;
          is_active: boolean | null;
          is_anonymized: boolean | null;
          marketing_consent: boolean | null;
          notes: string | null;
          org_id: string | null;
          personnummer: string | null;
          phone: string | null;
          photo_consent: boolean | null;
          postal_code: string | null;
          preferred_orgs: string[] | null;
          profile_id: string | null;
          registered_at: string | null;
          user_id: string | null;
        };
        Insert: {
          address?: string | null;
          anonymization_reason?: string | null;
          anonymized_at?: string | null;
          city?: string | null;
          consent_status?: string | null;
          consent_verified_at?: string | null;
          contact_person_2?: string | null;
          contact_phone_2?: string | null;
          created_at?: string | null;
          customer_number?: number | null;
          data_retention_until?: string | null;
          email?: string | null;
          full_name?: string | null;
          gdpr_consent?: boolean | null;
          gdpr_marketing_consent?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          is_anonymized?: boolean | null;
          marketing_consent?: boolean | null;
          notes?: string | null;
          org_id?: string | null;
          personnummer?: string | null;
          phone?: string | null;
          photo_consent?: boolean | null;
          postal_code?: string | null;
          preferred_orgs?: string[] | null;
          profile_id?: string | null;
          registered_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          address?: string | null;
          anonymization_reason?: string | null;
          anonymized_at?: string | null;
          city?: string | null;
          consent_status?: string | null;
          consent_verified_at?: string | null;
          contact_person_2?: string | null;
          contact_phone_2?: string | null;
          created_at?: string | null;
          customer_number?: number | null;
          data_retention_until?: string | null;
          email?: string | null;
          full_name?: string | null;
          gdpr_consent?: boolean | null;
          gdpr_marketing_consent?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          is_anonymized?: boolean | null;
          marketing_consent?: boolean | null;
          notes?: string | null;
          org_id?: string | null;
          personnummer?: string | null;
          phone?: string | null;
          photo_consent?: boolean | null;
          postal_code?: string | null;
          preferred_orgs?: string[] | null;
          profile_id?: string | null;
          registered_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "owners_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "owners_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "owners_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "owners_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      pension_stays: {
        Row: {
          addons: Json | null;
          base_price: number | null;
          created_at: string | null;
          dog_id: string;
          end_date: string;
          id: string;
          notes: string | null;
          org_id: string | null;
          room_id: string;
          start_date: string;
          status: string | null;
          total_amount: number | null;
          updated_at: string | null;
        };
        Insert: {
          addons?: Json | null;
          base_price?: number | null;
          created_at?: string | null;
          dog_id: string;
          end_date: string;
          id?: string;
          notes?: string | null;
          org_id?: string | null;
          room_id: string;
          start_date: string;
          status?: string | null;
          total_amount?: number | null;
          updated_at?: string | null;
        };
        Update: {
          addons?: Json | null;
          base_price?: number | null;
          created_at?: string | null;
          dog_id?: string;
          end_date?: string;
          id?: string;
          notes?: string | null;
          org_id?: string | null;
          room_id?: string;
          start_date?: string;
          status?: string | null;
          total_amount?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pension_stays_dog_fkey";
            columns: ["dog_id"];
            isOneToOne: false;
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pension_stays_org_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "pension_stays_org_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "pension_stays_org_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pension_stays_org_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pension_stays_room_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "pension_calendar_full_view";
            referencedColumns: ["room_id"];
          },
          {
            foreignKeyName: "pension_stays_room_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "pension_room_occupancy_view";
            referencedColumns: ["room_id"];
          },
          {
            foreignKeyName: "pension_stays_room_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      price_lists: {
        Row: {
          effective_from: string | null;
          id: string;
          items: Json | null;
          org_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          effective_from?: string | null;
          id?: string;
          items?: Json | null;
          org_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          effective_from?: string | null;
          id?: string;
          items?: Json | null;
          org_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "price_lists_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "price_lists_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "price_lists_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "price_lists_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      pricing: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          org_id: string | null;
          price_per_day: number | null;
          price_per_hour: number | null;
          service_type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          org_id?: string | null;
          price_per_day?: number | null;
          price_per_hour?: number | null;
          service_type: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          org_id?: string | null;
          price_per_day?: number | null;
          price_per_hour?: number | null;
          service_type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pricing_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "pricing_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "pricing_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pricing_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          last_sign_in_at: string | null;
          org_id: string;
          phone: string | null;
          role: string | null;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          last_sign_in_at?: string | null;
          org_id: string;
          phone?: string | null;
          role?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          last_sign_in_at?: string | null;
          org_id?: string;
          phone?: string | null;
          role?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "profiles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "profiles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      responsibilities: {
        Row: {
          done: boolean | null;
          id: string;
          org_id: string | null;
          staff_id: string;
          task: string | null;
        };
        Insert: {
          done?: boolean | null;
          id?: string;
          org_id?: string | null;
          staff_id?: string;
          task?: string | null;
        };
        Update: {
          done?: boolean | null;
          id?: string;
          org_id?: string | null;
          staff_id?: string;
          task?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "responsibilities_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "responsibilities_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "responsibilities_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "responsibilities_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          capacity: number | null;
          capacity_m2: number;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string | null;
          notes: string | null;
          org_id: string | null;
          room_type: string | null;
          updated_at: string | null;
        };
        Insert: {
          capacity?: number | null;
          capacity_m2?: number;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string | null;
          notes?: string | null;
          org_id?: string | null;
          room_type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          capacity?: number | null;
          capacity_m2?: number;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string | null;
          notes?: string | null;
          org_id?: string | null;
          room_type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey1";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey1";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey1";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey1";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          org_id: string | null;
          price: number;
          unit: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          org_id?: string | null;
          price: number;
          unit?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          org_id?: string | null;
          price?: number;
          unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "services_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "services_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "services_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "services_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      special_dates: {
        Row: {
          category: string | null;
          created_at: string | null;
          date: string;
          id: string;
          is_active: boolean | null;
          name: string;
          notes: string | null;
          org_id: string;
          price_surcharge: number;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          date: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          notes?: string | null;
          org_id: string;
          price_surcharge?: number;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          date?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          notes?: string | null;
          org_id?: string;
          price_surcharge?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "special_dates_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "special_dates_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "special_dates_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "special_dates_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_notes: {
        Row: {
          id: number;
          note: string;
          org_id: string | null;
        };
        Insert: {
          id?: number;
          note: string;
          org_id?: string | null;
        };
        Update: {
          id?: number;
          note?: string;
          org_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "staff_notes_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "staff_notes_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "staff_notes_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "staff_notes_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      subscription_types: {
        Row: {
          created_at: string | null;
          height_max: number;
          height_min: number;
          id: string;
          is_active: boolean | null;
          org_id: string | null;
          price: number;
          subscription_type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          height_max?: number;
          height_min?: number;
          id?: string;
          is_active?: boolean | null;
          org_id?: string | null;
          price: number;
          subscription_type: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          height_max?: number;
          height_min?: number;
          id?: string;
          is_active?: boolean | null;
          org_id?: string | null;
          price?: number;
          subscription_type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_types_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "subscription_types_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "subscription_types_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscription_types_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          abon_type: string | null;
          created_at: string | null;
          customer_number: string | null;
          dog_id: string | null;
          end_date: string | null;
          id: string;
          is_active: boolean | null;
          next_billing_at: string | null;
          org_id: string | null;
          plan_name: string | null;
          price: number | null;
          price_per_month: number | null;
          renews_at: string | null;
          start_date: string | null;
          status: string | null;
          trial_ends_at: string | null;
          updated_at: string | null;
          weekdays: Json | null;
        };
        Insert: {
          abon_type?: string | null;
          created_at?: string | null;
          customer_number?: string | null;
          dog_id?: string | null;
          end_date?: string | null;
          id?: string;
          is_active?: boolean | null;
          next_billing_at?: string | null;
          org_id?: string | null;
          plan_name?: string | null;
          price?: number | null;
          price_per_month?: number | null;
          renews_at?: string | null;
          start_date?: string | null;
          status?: string | null;
          trial_ends_at?: string | null;
          updated_at?: string | null;
          weekdays?: Json | null;
        };
        Update: {
          abon_type?: string | null;
          created_at?: string | null;
          customer_number?: string | null;
          dog_id?: string | null;
          end_date?: string | null;
          id?: string;
          is_active?: boolean | null;
          next_billing_at?: string | null;
          org_id?: string | null;
          plan_name?: string | null;
          price?: number | null;
          price_per_month?: number | null;
          renews_at?: string | null;
          start_date?: string | null;
          status?: string | null;
          trial_ends_at?: string | null;
          updated_at?: string | null;
          weekdays?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: true;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "subscriptions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: true;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "subscriptions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: true;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscriptions_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: true;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      system_config: {
        Row: {
          config_key: string;
          config_value: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          config_key: string;
          config_value?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          config_key?: string;
          config_value?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      trigger_execution_log: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          executed_at: string | null;
          execution_time_ms: number | null;
          id: string;
          new_data: Json | null;
          old_data: Json | null;
          operation: string;
          row_id: string | null;
          success: boolean;
          table_name: string;
          trigger_name: string;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          executed_at?: string | null;
          execution_time_ms?: number | null;
          id?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          operation: string;
          row_id?: string | null;
          success?: boolean;
          table_name: string;
          trigger_name: string;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          executed_at?: string | null;
          execution_time_ms?: number | null;
          id?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          operation?: string;
          row_id?: string | null;
          success?: boolean;
          table_name?: string;
          trigger_name?: string;
        };
        Relationships: [];
      };
      user_org_roles: {
        Row: {
          created_at: string | null;
          id: string;
          org_id: string | null;
          role: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          org_id?: string | null;
          role?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          org_id?: string | null;
          role?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_org_roles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "user_org_roles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "user_org_roles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_org_roles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      analytics_conversion_rate: {
        Row: {
          conversion_rate_percent: number | null;
          converted_applications: number | null;
          org_id: string | null;
          org_name: string | null;
          subscription_type: string | null;
          total_applications: number | null;
        };
        Relationships: [];
      };
      grooming_with_invoice: {
        Row: {
          dog_id: string | null;
          dog_name: string | null;
          extra_service_id: string | null;
          grooming_id: string | null;
          invoiced_at: string | null;
          performed_at: string | null;
          price: number | null;
          service_type: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "grooming_logs_dog_id_fkey";
            columns: ["dog_id"];
            isOneToOne: false;
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_runs_summary: {
        Row: {
          failed_runs: number | null;
          last_run_at: string | null;
          month_id: string | null;
          successful_runs: number | null;
          total_invoices_created: number | null;
          total_runs: number | null;
        };
        Relationships: [];
      };
      latest_function_logs: {
        Row: {
          error: string | null;
          function_name: string | null;
          message: string | null;
          records_created: number | null;
          run_at: string | null;
          status: string | null;
        };
        Relationships: [];
      };
      org_status_view: {
        Row: {
          days_left: number | null;
          name: string | null;
          org_id: string | null;
          readable_status: string | null;
          status: string | null;
          trial_ends_at: string | null;
        };
        Insert: {
          days_left?: never;
          name?: string | null;
          org_id?: string | null;
          readable_status?: never;
          status?: string | null;
          trial_ends_at?: string | null;
        };
        Update: {
          days_left?: never;
          name?: string | null;
          org_id?: string | null;
          readable_status?: never;
          status?: string | null;
          trial_ends_at?: string | null;
        };
        Relationships: [];
      };
      organization_subscription_overview: {
        Row: {
          id: string | null;
          name: string | null;
          status: string | null;
          subscription_plan: string | null;
          trial_ends_at: string | null;
          trial_status: string | null;
          user_count: number | null;
        };
        Insert: {
          id?: string | null;
          name?: string | null;
          status?: string | null;
          subscription_plan?: string | null;
          trial_ends_at?: string | null;
          trial_status?: never;
          user_count?: never;
        };
        Update: {
          id?: string | null;
          name?: string | null;
          status?: string | null;
          subscription_plan?: string | null;
          trial_ends_at?: string | null;
          trial_status?: never;
          user_count?: never;
        };
        Relationships: [];
      };
      pension_calendar_full_view: {
        Row: {
          addons: Json | null;
          base_price: number | null;
          breed: string | null;
          created_at: string | null;
          dog_id: string | null;
          dog_name: string | null;
          end_date: string | null;
          heightcm: number | null;
          notes: string | null;
          org_id: string | null;
          owner_email: string | null;
          owner_name: string | null;
          room_id: string | null;
          room_name: string | null;
          start_date: string | null;
          status: string | null;
          stay_id: string | null;
          subscription: string | null;
          total_amount: number | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pension_stays_dog_fkey";
            columns: ["dog_id"];
            isOneToOne: false;
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pension_stays_org_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "pension_stays_org_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "pension_stays_org_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pension_stays_org_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      pension_calendar_view: {
        Row: {
          addons: Json | null;
          base_price: number | null;
          breed: string | null;
          capacity: number | null;
          created_at: string | null;
          dog_id: string | null;
          dog_name: string | null;
          end_date: string | null;
          height_cm: number | null;
          notes: string | null;
          org_id: string | null;
          owner_email: string | null;
          owner_name: string | null;
          room_id: string | null;
          room_name: string | null;
          start_date: string | null;
          status: string | null;
          stay_id: string | null;
          total_amount: number | null;
          updated_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pension_stays_dog_fkey";
            columns: ["dog_id"];
            isOneToOne: false;
            referencedRelation: "dogs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pension_stays_org_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "pension_stays_org_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "pension_stays_org_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pension_stays_org_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pension_stays_room_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "pension_calendar_full_view";
            referencedColumns: ["room_id"];
          },
          {
            foreignKeyName: "pension_stays_room_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "pension_room_occupancy_view";
            referencedColumns: ["room_id"];
          },
          {
            foreignKeyName: "pension_stays_room_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      pension_owner_summary_view: {
        Row: {
          city: string | null;
          month_period: string | null;
          org_id: string | null;
          owner_email: string | null;
          owner_id: string | null;
          owner_name: string | null;
          owner_phone: string | null;
          postal_code: string | null;
          total_dogs: number | null;
          total_spent: number | null;
          total_stays: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "dogs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "dogs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "dogs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dogs_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      pension_room_occupancy_view: {
        Row: {
          capacity: number | null;
          dog_org_id: string | null;
          dogs_booked: number | null;
          end_date: string | null;
          org_id: string | null;
          remaining_area: number | null;
          room_id: string | null;
          room_name: string | null;
          start_date: string | null;
          status: string | null;
          total_area_used: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "dogs_org_id_fkey";
            columns: ["dog_org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "dogs_org_id_fkey";
            columns: ["dog_org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "dogs_org_id_fkey";
            columns: ["dog_org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dogs_org_id_fkey";
            columns: ["dog_org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey1";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "analytics_conversion_rate";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey1";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "org_status_view";
            referencedColumns: ["org_id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey1";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organization_subscription_overview";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rooms_org_id_fkey1";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "orgs";
            referencedColumns: ["id"];
          },
        ];
      };
      recent_trigger_failures: {
        Row: {
          error_message: string | null;
          executed_at: string | null;
          id: string | null;
          new_data: Json | null;
          operation: string | null;
          row_id: string | null;
          table_name: string | null;
          trigger_name: string | null;
        };
        Relationships: [];
      };
      trigger_health_summary: {
        Row: {
          avg_execution_ms: number | null;
          failed: number | null;
          last_execution: string | null;
          successful: number | null;
          table_name: string | null;
          total_executions: number | null;
          trigger_name: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      activate_paid_subscription: {
        Args: { org_id: string };
        Returns: undefined;
      };
      add_staff_member: {
        Args: { staff_email: string; staff_name: string };
        Returns: string;
      };
      anonymize_owner: {
        Args: { p_owner_id: string; p_reason?: string };
        Returns: boolean;
      };
      approve_application: {
        Args: { p_application_id: string; p_org_id: string };
        Returns: Json;
      };
      auto_checkout_dogs: { Args: never; Returns: undefined };
      calculate_cancellation_fee: {
        Args: { p_booking_id: string; p_cancellation_date?: string };
        Returns: {
          cancellation_fee: number;
          days_until_start: number;
          policy_applied: string;
          refund_amount: number;
        }[];
      };
      calculate_data_retention_date: {
        Args: { p_owner_id: string };
        Returns: string;
      };
      calculate_late_interest: {
        Args: { p_invoice_id: string };
        Returns: number;
      };
      calculate_yearly_refund: { Args: { p_org_id: string }; Returns: Json };
      check_trial_eligibility: {
        Args: { p_email: string; p_org_number: string };
        Returns: Json;
      };
      cleanup_old_trigger_logs: { Args: never; Returns: undefined };
      complete_past_bookings: {
        Args: never;
        Returns: {
          updated_count: number;
        }[];
      };
      create_org_and_admin: { Args: { org_name: string }; Returns: string };
      current_org_id: { Args: never; Returns: string };
      gdpr_delete_user_data: { Args: { p_user_id: string }; Returns: Json };
      generate_invoice_number: { Args: { p_org_id: string }; Returns: string };
      get_user_org_id: { Args: never; Returns: string };
      has_valid_consent: { Args: { p_owner_id: string }; Returns: boolean };
      heal_all_users_missing_org: { Args: never; Returns: Json };
      heal_user_missing_org: { Args: { p_user_id: string }; Returns: Json };
      json_text: { Args: { j: Json; key: string }; Returns: string };
      lock_expired_trials: { Args: never; Returns: undefined };
      log_invoice_cron_run: { Args: never; Returns: undefined };
      log_trigger_execution: {
        Args: {
          p_error_message?: string;
          p_execution_time_ms?: number;
          p_new_data?: Json;
          p_old_data?: Json;
          p_operation: string;
          p_row_id?: string;
          p_success?: boolean;
          p_table_name: string;
          p_trigger_name: string;
        };
        Returns: string;
      };
      match_owners_to_dogs: { Args: never; Returns: undefined };
      register_subscription_start: {
        Args: { p_email: string; p_org_id: string; p_org_number: string };
        Returns: undefined;
      };
      reject_application: {
        Args: {
          p_application_id: string;
          p_org_id: string;
          p_response_notes?: string;
        };
        Returns: Json;
      };
      remove_staff_member: { Args: { staff_id: string }; Returns: undefined };
      send_invoice_email: { Args: { p_invoice_id: string }; Returns: Json };
      send_trial_warning_emails: { Args: never; Returns: undefined };
      trigger_invoice_generation: { Args: { p_month?: string }; Returns: Json };
      update_invoice_with_fees: {
        Args: { p_invoice_id: string; p_reminder_level: number };
        Returns: undefined;
      };
      update_waitlist_status: {
        Args: never;
        Returns: {
          updated_to_active: number;
          updated_to_ended: number;
          updated_to_waitlist: number;
        }[];
      };
      verify_customer_account: {
        Args: { p_user_id: string };
        Returns: {
          customer_number: number;
          email: string;
          full_name: string;
          org_id: string;
          owner_id: string;
        }[];
      };
      withdraw_consent: { Args: { p_owner_id: string }; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

// ============================================================================
// SIMPLIFIED HELPER ALIASES - Enklare än Supabase's genererade Tables<>
// ============================================================================

// Orgs (Företag)
export type OrgRow = Database["public"]["Tables"]["orgs"]["Row"];
export type OrgInsert = Database["public"]["Tables"]["orgs"]["Insert"];
export type OrgUpdate = Database["public"]["Tables"]["orgs"]["Update"];

// Bookings (Pensionatsbokning)
export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
export type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

// Owners (Hundägare)
export type OwnerRow = Database["public"]["Tables"]["owners"]["Row"];
export type OwnerInsert = Database["public"]["Tables"]["owners"]["Insert"];
export type OwnerUpdate = Database["public"]["Tables"]["owners"]["Update"];

// Dogs (Hundar)
export type DogRow = Database["public"]["Tables"]["dogs"]["Row"];
export type DogInsert = Database["public"]["Tables"]["dogs"]["Insert"];
export type DogUpdate = Database["public"]["Tables"]["dogs"]["Update"];

// Profiles (Auth users)
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// Rooms (Pensionatsrum)
export type RoomRow = Database["public"]["Tables"]["rooms"]["Row"];
export type RoomInsert = Database["public"]["Tables"]["rooms"]["Insert"];
export type RoomUpdate = Database["public"]["Tables"]["rooms"]["Update"];

// Invoices & Invoice Items (Fakturering)
export type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
export type InvoiceUpdate = Database["public"]["Tables"]["invoices"]["Update"];

export type InvoiceItemRow =
  Database["public"]["Tables"]["invoice_items"]["Row"];
export type InvoiceItemInsert =
  Database["public"]["Tables"]["invoice_items"]["Insert"];
