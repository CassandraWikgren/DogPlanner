// Utökade TypeScript-typer för hundpensionat
// Uppdaterade typer baserat på ny databasstruktur

// Import grundtyper från database.ts
import type { Database } from "./database";

// Typ-alias för enklare användning
export type Owner = Database["public"]["Tables"]["owners"]["Row"];
export type Room = Database["public"]["Tables"]["rooms"]["Row"];
export type BaseDog = Database["public"]["Tables"]["dogs"]["Row"];

// Utökad hundprofil med alla nya fält
export interface ExtendedDog {
  id: string;
  name: string;
  breed?: string;
  age?: number;
  weight?: number;
  height_cm?: number; // Mankhöjd för storlekskategorisering
  gender?: "male" | "female";
  owner_id: string;
  org_id: string;
  active: boolean;

  // Allergi och hälsoinformation
  allergies?: string;
  medication?: string;
  special_needs?: string;

  // Matinformation
  food_type?: string; // 'own' | 'facility' | 'special'
  food_amount_per_day?: number;
  feeding_times_per_day?: number;
  feeding_instructions?: string;

  // Beteendeinformation
  behavior_notes?: string;
  destroys_things?: boolean;
  can_be_with_other_dogs?: boolean;
  previous_stays?: string;

  // Vaccinationer
  vaccination_dhp?: string; // Datum för DHP (3 år)
  vaccination_pi?: string; // Datum för PI/kennelhosta (1 år)

  // Specialinställningar
  is_in_heat?: boolean;
  is_afraid_of_noise?: boolean;
  can_play_with_friends?: boolean;
  photo_consent?: boolean;
  photo_url?: string;

  // Metadata
  created_at: string;
  updated_at: string;

  // Relationer
  owner?: Owner;
}

// Säsongspriser
export interface PricingSeason {
  id: string;
  org_id: string;
  season_name: string;
  season_type: "high" | "low" | "normal";
  start_date: string;
  end_date: string;
  price_multiplier: number;
  price_addition: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Specialdagar och högtider
export interface SpecialDate {
  id: string;
  org_id: string;
  date_name: string;
  date_value: string;
  date_type: "holiday" | "weekend" | "special";
  price_multiplier: number;
  price_addition: number;
  recurring_yearly: boolean;
  active: boolean;
  created_at: string;
}

// Pensionatspriser
export interface PensionatPrice {
  id: string;
  org_id: string;
  dog_size: "small" | "medium" | "large";
  price_type: "weekday" | "weekend" | "holiday";
  price_per_night: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Tillvalstjänster
export interface PensionatService {
  id: string;
  org_id: string;
  service_name: string;
  service_category: "grooming" | "care" | "exercise" | "food" | "special";
  description?: string;
  price_small?: number;
  price_medium?: number;
  price_large?: number;
  price_flat?: number;
  is_per_day: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Kundrabatter
export interface CustomerDiscount {
  id: string;
  org_id: string;
  owner_id: string;
  discount_type: "loyalty" | "multi_dog" | "long_stay" | "custom";
  discount_name: string;
  discount_percentage?: number;
  discount_amount?: number;
  is_permanent: boolean;
  valid_from?: string;
  valid_until?: string;
  min_nights?: number;
  min_dogs?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Utökad bokning för pensionat
export interface ExtendedBooking {
  id: string;
  org_id: string;
  dog_id: string;
  owner_id: string;
  room_id?: string;
  service_type: "hunddagis" | "hundpensionat" | "hundfrisor";
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";

  // Pensionat-specifika datum och tider
  start_date: string;
  end_date: string;
  checkin_time?: string;
  checkout_time?: string;

  // Prisinfo
  total_calculated_price?: number;
  deposit_amount?: number;
  deposit_paid?: boolean;
  deposit_paid_date?: string;
  price_breakdown?: PriceBreakdown;

  // Anteckningar
  special_requests?: string;
  staff_notes?: string;

  // Metadata
  created_at: string;
  updated_at: string;

  // Relationer
  dog?: ExtendedDog;
  owner?: Owner;
  room?: ExtendedRoom;
  booking_services?: BookingService[];
}

// Detaljerad prisuppdelning
export interface PriceBreakdown {
  dog_size: "small" | "medium" | "large";
  total_nights: number;
  accommodation_price: number;
  services_price: number;
  discount_total: number;
  final_price: number;
  night_details: NightDetail[];
  calculation_date: string;
}

// Detaljer per natt
export interface NightDetail {
  date: string;
  base_price: number;
  season_multiplier: number;
  season_addition: number;
  special_multiplier: number;
  special_addition: number;
  final_price: number;
}

// Bokning-tillval koppling
export interface BookingService {
  id: string;
  booking_id: string;
  service_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  completed: boolean;
  completed_date?: string;
  staff_notes?: string;
  created_at: string;

  // Relation
  service?: PensionatService;
}

// Utökat rum
export interface ExtendedRoom {
  id: string;
  org_id: string;
  room_number: string;
  room_type: "standard" | "premium" | "suite";
  capacity: number;
  price_per_night?: number;
  area_sqm?: number; // Yta i kvadratmeter
  max_dogs_override?: number; // Manuell gräns för antal hundar
  room_amenities?: string[];
  room_notes?: string;
  description?: string;
  amenities?: string[];
  active: boolean;
  floor?: number;
  size_sqm?: number;
  created_at: string;
  updated_at: string;
}

// Journalanteckningar
export interface StayJournal {
  id: string;
  org_id: string;
  booking_id: string;
  dog_id: string;
  entry_date: string;
  entry_time: string;
  staff_member?: string;
  journal_type:
    | "checkin"
    | "checkout"
    | "feeding"
    | "exercise"
    | "behavior"
    | "health"
    | "service"
    | "general";
  title?: string;
  content: string;
  is_important: boolean;
  created_at: string;

  // Relationer
  dog?: ExtendedDog;
  booking?: ExtendedBooking;
}

// Kalenderdata för beläggningsvy
export interface CalendarDay {
  date: string;
  day_of_week: number;
  bookings: CalendarBooking[];
  total_dogs: number;
  checkins: number;
  checkouts: number;
  capacity_used: number;
  capacity_total: number;
  is_weekend: boolean;
  is_holiday: boolean;
  season_type?: "high" | "low" | "normal";
}

export interface CalendarBooking {
  id: string;
  dog_name: string;
  owner_name: string;
  room_number?: string;
  status: "checked_in" | "checking_in" | "checking_out" | "confirmed";
  checkin_date: string;
  checkout_date: string;
  dog_size: "small" | "medium" | "large";
  required_area: number;
}

// Kapacitetsberäkning
export interface RoomCapacity {
  room_id: string;
  room_number: string;
  total_area: number;
  used_area: number;
  available_area: number;
  max_dogs: number;
  current_dogs: number;
  utilization_percentage: number;
  dogs_in_room: CalendarBooking[];
}

// Prisberäkning input
export interface PriceCalculationInput {
  org_id: string;
  dog_id: string;
  checkin_date: string;
  checkout_date: string;
  service_ids?: string[];
  room_id?: string;
}

// Jordbruksverkets areanormer
export const AREA_REQUIREMENTS = {
  height_ranges: [
    { min: 0, max: 24, area: 2.0 },
    { min: 25, max: 35, area: 2.0 },
    { min: 36, max: 45, area: 2.5 },
    { min: 46, max: 55, area: 3.5 },
    { min: 56, max: 65, area: 4.5 },
    { min: 66, max: 999, area: 5.5 },
  ],
};

// Helper-funktioner
export const getSizeCategory = (
  height_cm: number | null | undefined
): "small" | "medium" | "large" => {
  if (!height_cm) return "medium";
  if (height_cm <= 35) return "small";
  if (height_cm <= 55) return "medium";
  return "large";
};

export const getRequiredArea = (
  height_cm: number | null | undefined
): number => {
  if (!height_cm) return 2.0;

  for (const range of AREA_REQUIREMENTS.height_ranges) {
    if (height_cm >= range.min && height_cm <= range.max) {
      return range.area;
    }
  }
  return 2.0; // Fallback
};

// Färgteman för moduler
export const MODULE_COLORS = {
  hunddagis: {
    primary: "emerald",
    secondary: "green",
    background: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-800",
    button: "bg-emerald-600 hover:bg-emerald-700",
  },
  hundpensionat: {
    primary: "blue",
    secondary: "indigo",
    background: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  hundfrisor: {
    primary: "purple",
    secondary: "violet",
    background: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-800",
    button: "bg-purple-600 hover:bg-purple-700",
  },
  admin: {
    primary: "gray",
    secondary: "slate",
    background: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-800",
    button: "bg-gray-600 hover:bg-gray-700",
  },
};

// Status-definitioner för bookings
export const BOOKING_STATUS = {
  pending: { label: "Väntande", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Bekräftad", color: "bg-blue-100 text-blue-800" },
  checked_in: { label: "Incheckad", color: "bg-green-100 text-green-800" },
  checked_out: { label: "Utcheckad", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Avbokad", color: "bg-red-100 text-red-800" },
};

// Felkoder enligt systemets struktur
export const ERROR_CODES = {
  DATABASE: "ERR-1001",
  PDF_EXPORT: "ERR-2001",
  REALTIME: "ERR-3001",
  UPDATE: "ERR-4001",
  UNKNOWN: "ERR-5001",
  VALIDATION: "ERR-6001",
  CALCULATION: "ERR-7001",
  CAPACITY: "ERR-8001",
};
