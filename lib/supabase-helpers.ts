// /lib/supabase-helpers.ts
// Hjälpfunktioner för att standardisera datahantering med Supabase

import { Database, Tables } from "@/types/database";
import { SupabaseClient } from "@supabase/supabase-js";

// === STANDARDISERADE FETCH-FUNKTIONER ===

/**
 * Hämtar hundar med alla relationer på ett konsistent sätt
 */
export async function fetchDogsWithRelations(
  supabase: SupabaseClient<Database>,
  orgId: string,
  options?: {
    includeCheckedOut?: boolean;
    roomId?: string;
  }
) {
  let query = supabase
    .from("dogs")
    .select(
      `
      id, name, breed, birth, heightcm, subscription, startdate, enddate,
      days, room_id, owner_id, vaccdhp, vaccpi, photo_url, events, 
      checked_in, checkin_date, checkout_date, notes, created_at, updated_at,
      owners(id, full_name, phone, email, customer_number, contact_person_2, contact_phone_2),
      rooms(id, name, capacity_m2, room_type),
      dog_journal(id, text, journal_type, created_at),
      extra_service_performed(
        id, quantity, performed_at, notes,
        extra_service_id,
        extra_services(label, price, unit)
      )
    `
    )
    .eq("org_id", orgId);

  if (options?.roomId) {
    query = query.eq("room_id", options.roomId);
  }

  if (!options?.includeCheckedOut) {
    query = query.or("checked_in.is.null,checked_in.eq.true");
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) {
    console.error("Fel vid hämtning av hundar:", error);
    throw new Error(`Kunde inte hämta hundar: ${error.message}`);
  }

  // Normalisera data så relationer är objekt istället för arrayer
  return (data || []).map(normalizeDogRelations);
}

/**
 * Hämtar bokningar med alla relationer
 */
export async function fetchBookingsWithRelations(
  supabase: SupabaseClient<Database>,
  orgId: string,
  options?: {
    status?: Array<Database["public"]["Tables"]["bookings"]["Row"]["status"]>;
    startDate?: string;
    endDate?: string;
  }
) {
  let query = supabase
    .from("bookings")
    .select(
      `
      id, start_date, end_date, status, total_price, discount_amount,
      extra_service_ids, notes, created_at, updated_at,
      dogs(id, name, breed, heightcm, owner_id),
      owners(id, full_name, phone, email),
      rooms(id, name, capacity_m2, room_type)
    `
    )
    .eq("org_id", orgId);

  if (options?.status?.length) {
    query = query.in("status", options.status);
  }

  if (options?.startDate) {
    query = query.gte("start_date", options.startDate);
  }

  if (options?.endDate) {
    query = query.lte("end_date", options.endDate);
  }

  const { data, error } = await query.order("start_date", { ascending: false });

  if (error) {
    console.error("Fel vid hämtning av bokningar:", error);
    throw new Error(`Kunde inte hämta bokningar: ${error.message}`);
  }

  return (data || []).map(normalizeBookingRelations);
}

/**
 * Hämtar rum med information om beläggning
 */
export async function fetchRoomsWithOccupancy(
  supabase: SupabaseClient<Database>,
  orgId: string,
  date?: string
) {
  const { data: rooms, error: roomError } = await supabase
    .from("rooms")
    .select("id, name, capacity_m2, room_type, notes")
    .eq("org_id", orgId)
    .order("name");

  if (roomError) {
    throw new Error(`Kunde inte hämta rum: ${roomError.message}`);
  }

  // Hämta hundar som är i rummen
  let dogQuery = supabase
    .from("dogs")
    .select("id, name, room_id, heightcm, subscription, checked_in")
    .eq("org_id", orgId)
    .not("room_id", "is", null);

  if (date) {
    // Filtrera baserat på datum och schema
    dogQuery = dogQuery.or("checked_in.eq.true,checkin_date.eq." + date);
  }

  const { data: dogs, error: dogError } = await dogQuery;

  if (dogError) {
    throw new Error(`Kunde inte hämta hundar i rum: ${dogError.message}`);
  }

  // Kombinera data
  return (rooms || []).map((room: any) => ({
    ...room,
    dogs: (dogs || []).filter((dog: any) => dog.room_id === room.id),
    occupancy: calculateRoomOccupancy(
      room,
      (dogs || []).filter((dog: any) => dog.room_id === room.id)
    ),
  }));
}

// === NORMALISERING ===

/**
 * Normaliserar hundrelationer från array till objekt
 */
function normalizeDogRelations(dog: any) {
  return {
    ...dog,
    owners: Array.isArray(dog.owners) ? dog.owners[0] : dog.owners,
    rooms: Array.isArray(dog.rooms) ? dog.rooms[0] : dog.rooms,
    dog_journal: dog.dog_journal || [],
    extra_service_performed: (dog.extra_service_performed || []).map(
      (esp: any) => ({
        ...esp,
        extra_services: Array.isArray(esp.extra_services)
          ? esp.extra_services[0]
          : esp.extra_services,
      })
    ),
  };
}

/**
 * Normaliserar bokningsrelationer
 */
function normalizeBookingRelations(booking: any) {
  return {
    ...booking,
    dogs: Array.isArray(booking.dogs) ? booking.dogs[0] : booking.dogs,
    owners: Array.isArray(booking.owners) ? booking.owners[0] : booking.owners,
    rooms: Array.isArray(booking.rooms) ? booking.rooms[0] : booking.rooms,
  };
}

// === BERÄKNINGAR ===

/**
 * Beräknar rumsbeläggning baserat på hundars storlek
 */
function calculateRoomOccupancy(room: any, dogs: any[]) {
  const totalCapacity = room.capacity_m2;
  const usedSpace = dogs.reduce((sum, dog) => {
    return sum + calculateDogSpaceRequirement(dog.heightcm || 40);
  }, 0);

  return {
    total_capacity: totalCapacity,
    used_space: parseFloat(usedSpace.toFixed(1)),
    available_space: parseFloat((totalCapacity - usedSpace).toFixed(1)),
    occupancy_percent: parseFloat(
      ((usedSpace / totalCapacity) * 100).toFixed(1)
    ),
    dogs_count: dogs.length,
  };
}

/**
 * Beräknar hur mycket plats en hund behöver baserat på mankhöjd
 */
function calculateDogSpaceRequirement(heightcm: number): number {
  if (heightcm <= 34) return 2.0; // Små hundar
  if (heightcm <= 49) return 2.5; // Mellanstora hundar
  if (heightcm <= 65) return 3.5; // Stora hundar
  return 4.5; // Jättestora hundar
}

/**
 * Mappar hundstorlek till kategori för prisberäkning
 */
export function getDogSizeCategory(heightcm: number | null): string {
  const height = heightcm || 40;
  if (height <= 34) return "small";
  if (height <= 49) return "medium";
  if (height <= 65) return "large";
  return "xlarge";
}

// === VALIDERING ===

/**
 * Validerar att alla nödvändiga fält finns för en bokning
 */
export function validateBookingData(booking: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!booking.dog_id) errors.push("Hund måste väljas");
  if (!booking.room_id) errors.push("Rum måste väljas");
  if (!booking.start_date) errors.push("Startdatum måste anges");
  if (!booking.end_date) errors.push("Slutdatum måste anges");

  if (booking.start_date && booking.end_date) {
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    if (end <= start) {
      errors.push("Slutdatum måste vara efter startdatum");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Kontrollerar om ett rum är tillgängligt för angivna datum
 */
export async function checkRoomAvailability(
  supabase: SupabaseClient<Database>,
  roomId: string,
  startDate: string,
  endDate: string,
  excludeBookingId?: string
): Promise<{ available: boolean; conflictingBookings: any[] }> {
  let query = supabase
    .from("bookings")
    .select("id, start_date, end_date, dogs(name)")
    .eq("room_id", roomId)
    .neq("status", "cancelled")
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

  if (excludeBookingId) {
    query = query.neq("id", excludeBookingId);
  }

  const { data: conflictingBookings, error } = await query;

  if (error) {
    throw new Error(
      `Kunde inte kontrollera rumstillgänglighet: ${error.message}`
    );
  }

  return {
    available: (conflictingBookings || []).length === 0,
    conflictingBookings: conflictingBookings || [],
  };
}
