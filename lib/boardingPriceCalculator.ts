/**
 * PRISBERÄKNING FÖR HUNDPENSIONAT
 * Skapad: 2025-11-13
 *
 * Denna modul hanterar prisberäkning för pensionatsbokningar med stöd för:
 * - Grundpriser per hundstorlek
 * - Helgtillägg (fredag-söndag)
 * - Specialdatum (röda dagar, event, högtider)
 * - Säsonger (sommar, vinter, sportlov, etc)
 *
 * PRIORITETSORDNING:
 * 1. Specialdatum (högsta prioritet)
 * 2. Helgtillägg
 * 3. Säsong (multiplikator)
 */

import { supabase } from "./supabase";

export interface BoardingPrice {
  dog_size: "small" | "medium" | "large";
  base_price: number;
  weekend_surcharge: number;
}

export interface SpecialDate {
  date: string;
  name: string;
  category: "red_day" | "holiday" | "event" | "custom";
  price_surcharge: number;
  is_active: boolean;
}

export interface BoardingSeason {
  name: string;
  start_date: string;
  end_date: string;
  price_multiplier: number;
  is_active: boolean;
}

/**
 * Bestämmer hundstorlek baserat på mankhöjd
 */
export function getDogSize(heightCm: number): "small" | "medium" | "large" {
  if (heightCm < 35) return "small";
  if (heightCm <= 54) return "medium";
  return "large";
}

/**
 * Kontrollerar om ett datum är helg (fredag-söndag)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 5 || day === 6 || day === 0; // Fre, Lör, Sön
}

/**
 * Formatera datum till YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Hämta grundpris för hundstorlek
 */
export async function getBasePrice(
  dogSize: "small" | "medium" | "large",
  orgId: string
): Promise<BoardingPrice | null> {
  const { data, error } = await supabase
    .from("boarding_prices")
    .select("dog_size, base_price, weekend_surcharge")
    .eq("org_id", orgId)
    .eq("dog_size", dogSize)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("Fel vid hämtning av grundpris:", error);
    return null;
  }

  return data;
}

/**
 * Hämta specialdatum för ett specifikt datum
 */
export async function getSpecialDate(
  date: Date,
  orgId: string
): Promise<SpecialDate | null> {
  const dateStr = formatDate(date);

  const { data, error } = await supabase
    .from("special_dates")
    .select("date, name, category, price_surcharge, is_active")
    .eq("org_id", orgId)
    .eq("date", dateStr)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned (ok)
    console.error("Fel vid hämtning av specialdatum:", error);
  }

  return data || null;
}

/**
 * Hämta aktiv säsong för ett specifikt datum
 */
export async function getActiveSeason(
  date: Date,
  orgId: string
): Promise<BoardingSeason | null> {
  const dateStr = formatDate(date);

  const { data, error } = await supabase
    .from("boarding_seasons")
    .select("name, start_date, end_date, price_multiplier, is_active")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .lte("start_date", dateStr)
    .gte("end_date", dateStr)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Fel vid hämtning av säsong:", error);
  }

  return data || null;
}

/**
 * Beräkna pris för en enskild natt
 *
 * LOGIK:
 * 1. Börja med grundpris
 * 2. Kolla specialdatum (HÖGSTA PRIO) → lägg till surcharge
 * 3. Om inget specialdatum, kolla helg → lägg till weekend_surcharge
 * 4. Applicera säsongsmultiplikator (alltid)
 */
export async function calculateNightPrice(
  date: Date,
  dogSize: "small" | "medium" | "large",
  orgId: string
): Promise<{ price: number; breakdown: string[] }> {
  const breakdown: string[] = [];

  // Steg 1: Hämta grundpris
  const basePrice = await getBasePrice(dogSize, orgId);
  if (!basePrice) {
    throw new Error(`Inget grundpris hittat för hundstorlek: ${dogSize}`);
  }

  let nightPrice = basePrice.base_price;
  breakdown.push(`Grundpris: ${nightPrice} kr`);

  // Steg 2: Kolla specialdatum (HÖGSTA PRIORITET)
  const specialDate = await getSpecialDate(date, orgId);
  if (specialDate && specialDate.is_active) {
    nightPrice += specialDate.price_surcharge;
    breakdown.push(`${specialDate.name}: +${specialDate.price_surcharge} kr`);
  }
  // Steg 3: Om inget specialdatum, kolla helg
  else if (isWeekend(date)) {
    nightPrice += basePrice.weekend_surcharge;
    breakdown.push(`Helgtillägg: +${basePrice.weekend_surcharge} kr`);
  }

  // Steg 4: Applicera säsong (ALLTID, även på specialdatum)
  const season = await getActiveSeason(date, orgId);
  if (season && season.is_active) {
    const multiplier = season.price_multiplier;
    const beforeSeason = nightPrice;
    nightPrice = nightPrice * multiplier;
    breakdown.push(
      `${season.name}: ×${multiplier} (${beforeSeason} kr → ${Math.round(nightPrice)} kr)`
    );
  }

  return {
    price: Math.round(nightPrice),
    breakdown,
  };
}

/**
 * Beräkna totalpris för en bokning (flera nätter)
 *
 * @param startDate - Startdatum för bokning
 * @param endDate - Slutdatum för bokning (exklusive)
 * @param dogHeightCm - Hundens mankhöjd i cm
 * @param orgId - Organisationens ID
 * @returns Totalpris och detaljerad breakdown per natt
 */
export async function calculateBookingPrice(
  startDate: Date,
  endDate: Date,
  dogHeightCm: number,
  orgId: string
): Promise<{
  totalPrice: number;
  nights: number;
  dogSize: string;
  nightlyBreakdown: Array<{
    date: string;
    price: number;
    breakdown: string[];
  }>;
}> {
  const dogSize = getDogSize(dogHeightCm);
  const nightlyBreakdown: Array<{
    date: string;
    price: number;
    breakdown: string[];
  }> = [];

  let totalPrice = 0;
  let currentDate = new Date(startDate);
  const end = new Date(endDate);

  // Loopa genom varje natt
  while (currentDate < end) {
    const { price, breakdown } = await calculateNightPrice(
      currentDate,
      dogSize,
      orgId
    );

    totalPrice += price;
    nightlyBreakdown.push({
      date: formatDate(currentDate),
      price,
      breakdown,
    });

    // Nästa dag
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const nights = nightlyBreakdown.length;

  return {
    totalPrice,
    nights,
    dogSize,
    nightlyBreakdown,
  };
}

/**
 * Exempel på användning:
 *
 * const result = await calculateBookingPrice(
 *   new Date('2025-06-19'),  // Torsdag före midsommar
 *   new Date('2025-06-22'),  // Söndag efter midsommar
 *   45,                      // Mellan hund
 *   'org-uuid-here'
 * );
 *
 * console.log(`Totalpris: ${result.totalPrice} kr för ${result.nights} nätter`);
 * console.log('Breakdown:', result.nightlyBreakdown);
 *
 * OUTPUT:
 * Totalpris: 2340 kr för 3 nätter
 * Breakdown:
 * [
 *   {
 *     date: '2025-06-19',
 *     price: 585,
 *     breakdown: [
 *       'Grundpris: 450 kr',
 *       'Sommar: ×1.3 (450 kr → 585 kr)'
 *     ]
 *   },
 *   {
 *     date: '2025-06-20',
 *     price: 1105,
 *     breakdown: [
 *       'Grundpris: 450 kr',
 *       'Midsommarafton: +400 kr',
 *       'Sommar: ×1.3 (850 kr → 1105 kr)'
 *     ]
 *   },
 *   {
 *     date: '2025-06-21',
 *     price: 650,
 *     breakdown: [
 *       'Grundpris: 450 kr',
 *       'Helgtillägg: +50 kr',
 *       'Sommar: ×1.3 (500 kr → 650 kr)'
 *     ]
 *   }
 * ]
 */
