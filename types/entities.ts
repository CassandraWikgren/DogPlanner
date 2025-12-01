/**
 * ENTITY TYPES - Centrala typdefinitioner för business entities
 *
 * Dessa typer är baserade på Supabase schema men utökade med
 * praktiska utility types och relationer.
 *
 * Skapad: 2025-12-01
 */

import { Database } from "./database";

// =====================================================
// BASE TYPES från Database
// =====================================================

export type DbDog = Database["public"]["Tables"]["dogs"]["Row"];
export type DbOwner = Database["public"]["Tables"]["owners"]["Row"];
export type DbRoom = Database["public"]["Tables"]["rooms"]["Row"];
export type DbBooking = Database["public"]["Tables"]["bookings"]["Row"];
export type DbInvoice = Database["public"]["Tables"]["invoices"]["Row"];
export type DbOrganisation = Database["public"]["Tables"]["orgs"]["Row"];

// =====================================================
// EXTENDED TYPES med Relationer
// =====================================================

/**
 * Hund med ägarinformation
 * Används i listor och detaljer
 */
export interface DogWithOwner extends DbDog {
  owners: DbOwner | null;
}

/**
 * Hund med alla relationer
 * Används i EditDogModal och detaljvyer
 */
export interface DogComplete extends DbDog {
  owners: DbOwner | null;
  room?: DbRoom | null;
  subscriptions?: Subscription[];
  extra_services?: ExtraService[];
}

/**
 * Ägare med hundar
 * Används i kundregister
 */
export interface OwnerWithDogs extends DbOwner {
  dogs: DbDog[];
}

/**
 * Rum med hundar
 * Används i rumsöversikt
 */
export interface RoomWithDogs extends DbRoom {
  dogs: DogWithOwner[];
  occupied_m2: number;
  available_m2: number;
}

/**
 * Faktura med relationer
 * Används i ekonomivy
 */
export interface InvoiceWithDetails extends DbInvoice {
  owners: DbOwner | null;
  orgs: DbOrganisation | null;
  invoice_items?: InvoiceItem[];
}

// =====================================================
// SUBSCRIPTION TYPES
// =====================================================

export type SubscriptionType = "heltid" | "deltid_2" | "deltid_3" | "dagshund";

export interface Subscription {
  id: string;
  dog_id: string;
  org_id: string;
  subscription_type: SubscriptionType;
  days: string | null; // JSON eller kommaseparerad sträng
  start_date: string;
  end_date: string | null;
  price: number;
  is_active: boolean;
  created_at: string;
}

// =====================================================
// EXTRA SERVICE TYPES
// =====================================================

/**
 * Tilläggstjänst kopplad till hund (faktisk användning)
 */
export interface ExtraService {
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
}

/**
 * Tilläggstjänst i prislista (katalog)
 */
export interface ExtraServiceCatalog {
  id: string;
  org_id: string;
  branch_id: string | null;
  label: string;
  price: number;
  unit: "per dag" | "per gång" | "fast pris";
  service_type: "boarding" | "daycare" | "both" | null;
  is_active: boolean | null;
  created_at: string | null;
}

// =====================================================
// INVOICE TYPES
// =====================================================

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  qty: number;
  amount: number;
  created_at: string | null;
}

// =====================================================
// BOOKING TYPES (Hundpensionat)
// =====================================================

export interface Booking {
  id: string;
  org_id: string;
  dog_id: string;
  room_id: string | null;
  check_in_date: string;
  check_out_date: string;
  status: "confirmed" | "checked_in" | "checked_out" | "cancelled";
  base_price: number | null;
  total_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

// =====================================================
// PRICE TYPES
// =====================================================

/**
 * Hundstorlek baserat på mankhöjd
 */
export type DogSize = "small" | "medium" | "large";

/**
 * Prisberäkning för pensionat
 */
export interface BoardingPriceCalculation {
  basePrice: number;
  sizeMultiplier: number;
  weekendSurcharge: number;
  seasonMultiplier: number;
  specialDateSurcharge: number;
  totalPerNight: number;
  totalCost: number;
  nights: number;
  breakdown: {
    base: number;
    weekend: number;
    season: number;
    special: number;
  };
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Beräkna hundstorlek från mankhöjd
 */
export function getDogSize(heightCm: number | null | undefined): DogSize {
  if (!heightCm) return "medium";
  if (heightCm < 35) return "small";
  if (heightCm <= 54) return "medium";
  return "large";
}

/**
 * Validera subscription type
 */
export function isValidSubscriptionType(
  type: string
): type is SubscriptionType {
  return ["heltid", "deltid_2", "deltid_3", "dagshund"].includes(type);
}

/**
 * Validera invoice status
 */
export function isValidInvoiceStatus(status: string): status is InvoiceStatus {
  return ["draft", "sent", "paid", "overdue", "cancelled"].includes(status);
}

/**
 * Formatera veckodagar från array till läsbar sträng
 */
export function formatWeekdays(days: string | null): string {
  if (!days) return "Inga dagar valda";

  const dayArray = typeof days === "string" ? days.split(",") : [];
  const dayNames: Record<string, string> = {
    monday: "Mån",
    tuesday: "Tis",
    wednesday: "Ons",
    thursday: "Tor",
    friday: "Fre",
    saturday: "Lör",
    sunday: "Sön",
  };

  return dayArray.map((d) => dayNames[d.trim()] || d).join(", ");
}

/**
 * Beräkna ålder från födelsedatum
 */
export function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}
