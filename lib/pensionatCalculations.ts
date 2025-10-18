// Prisberäknings-logik för hundpensionat
// Frontend-hjälpfunktioner för priskalkyler

import { supabase } from "./supabase";
import {
  getSizeCategory,
  getRequiredArea,
  ERROR_CODES,
} from "../types/hundpensionat";
import type {
  ExtendedDog,
  PriceCalculationInput,
  PriceBreakdown,
  PensionatPrice,
  PricingSeason,
  SpecialDate,
  PensionatService,
  CustomerDiscount,
} from "../types/hundpensionat";

/**
 * Beräknar totalpris för pensionatsvistelse
 * [ERR-1001] Databaskoppling, [ERR-7001] Beräkning, [ERR-5001] Okänt fel
 */
export async function calculatePensionatPrice(
  input: PriceCalculationInput
): Promise<PriceBreakdown> {
  try {
    // Hämta hundens information för storlekskategorisering
    const { data: dog, error: dogError } = await (supabase as any)
      .from("dogs")
      .select("height_cm, owner_id")
      .eq("id", input.dog_id)
      .single();

    if (dogError) {
      throw new Error(
        `${ERROR_CODES.DATABASE} Kunde inte hämta hundinformation: ${dogError.message}`
      );
    }

    if (!dog) {
      throw new Error(
        `${ERROR_CODES.VALIDATION} Hund med ID ${input.dog_id} hittades inte`
      );
    }

    // Bestäm hundens storlekskategori
    const dogSize = getSizeCategory(dog.height_cm);

    // Beräkna antal nätter
    const checkinDate = new Date(input.checkin_date);
    const checkoutDate = new Date(input.checkout_date);
    const totalNights = Math.ceil(
      (checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (totalNights <= 0) {
      throw new Error(`${ERROR_CODES.VALIDATION} Ogiltigt datumintervall`);
    }

    // Hämta grundpriser
    const { data: prices, error: pricesError } = await (supabase as any)
      .from("pensionat_prices")
      .select("*")
      .eq("org_id", input.org_id)
      .eq("dog_size", dogSize)
      .eq("active", true);

    if (pricesError) {
      throw new Error(
        `${ERROR_CODES.DATABASE} Kunde inte hämta priser: ${pricesError.message}`
      );
    }

    // Hämta säsongspriser
    const { data: seasons, error: seasonsError } = await (supabase as any)
      .from("pricing_seasons")
      .select("*")
      .eq("org_id", input.org_id)
      .eq("active", true);

    if (seasonsError) {
      throw new Error(
        `${ERROR_CODES.DATABASE} Kunde inte hämta säsongspriser: ${seasonsError.message}`
      );
    }

    // Hämta specialdagar
    const { data: specialDates, error: specialError } = await (supabase as any)
      .from("special_dates")
      .select("*")
      .eq("org_id", input.org_id)
      .eq("active", true);

    if (specialError) {
      throw new Error(
        `${ERROR_CODES.DATABASE} Kunde inte hämta specialdagar: ${specialError.message}`
      );
    }

    // Beräkna pris per natt
    let totalAccommodationPrice = 0;
    const nightDetails = [];

    for (let i = 0; i < totalNights; i++) {
      const currentDate = new Date(checkinDate);
      currentDate.setDate(currentDate.getDate() + i);

      // Bestäm pristyp baserat på veckodag
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      let priceType: "weekday" | "weekend" | "holiday" = isWeekend
        ? "weekend"
        : "weekday";

      // Kolla om det är en specialdag
      const isSpecialDate = specialDates?.some((special: any) => {
        const specialDate = new Date(special.date_value);
        return (
          specialDate.toDateString() === currentDate.toDateString() ||
          (special.recurring_yearly &&
            specialDate.getMonth() === currentDate.getMonth() &&
            specialDate.getDate() === currentDate.getDate())
        );
      });

      if (isSpecialDate) {
        priceType = "holiday";
      }

      // Hämta grundpris
      const basePrice =
        prices?.find((p: any) => p.price_type === priceType)?.price_per_night ||
        0;

      // Beräkna säsongstillägg
      let seasonMultiplier = 1.0;
      let seasonAddition = 0;

      const applicableSeason = seasons?.find((season: any) => {
        const seasonStart = new Date(season.start_date);
        const seasonEnd = new Date(season.end_date);
        return currentDate >= seasonStart && currentDate <= seasonEnd;
      });

      if (applicableSeason) {
        seasonMultiplier = applicableSeason.price_multiplier;
        seasonAddition = applicableSeason.price_addition;
      }

      // Beräkna specialdagstillägg
      let specialMultiplier = 1.0;
      let specialAddition = 0;

      if (isSpecialDate) {
        const specialDay = specialDates?.find((special: any) => {
          const specialDate = new Date(special.date_value);
          return (
            specialDate.toDateString() === currentDate.toDateString() ||
            (special.recurring_yearly &&
              specialDate.getMonth() === currentDate.getMonth() &&
              specialDate.getDate() === currentDate.getDate())
          );
        });

        if (specialDay) {
          specialMultiplier = specialDay.price_multiplier;
          specialAddition = specialDay.price_addition;
        }
      }

      // Beräkna slutpris för natten
      const nightPrice =
        basePrice * seasonMultiplier * specialMultiplier +
        seasonAddition +
        specialAddition;
      totalAccommodationPrice += nightPrice;

      nightDetails.push({
        date: currentDate.toISOString().split("T")[0],
        base_price: basePrice,
        season_multiplier: seasonMultiplier,
        season_addition: seasonAddition,
        special_multiplier: specialMultiplier,
        special_addition: specialAddition,
        final_price: nightPrice,
      });
    }

    // Beräkna tillvalstjänster om angivna
    let servicesPrice = 0;
    if (input.service_ids && input.service_ids.length > 0) {
      const { data: services, error: servicesError } = await (supabase as any)
        .from("pensionat_services")
        .select("*")
        .in("id", input.service_ids)
        .eq("org_id", input.org_id)
        .eq("active", true);

      if (servicesError) {
        throw new Error(
          `${ERROR_CODES.DATABASE} Kunde inte hämta tillvalstjänster: ${servicesError.message}`
        );
      }

      servicesPrice =
        services?.reduce((total: number, service: any) => {
          let servicePrice = 0;

          if (service.price_flat) {
            servicePrice = service.price_flat;
          } else {
            switch (dogSize) {
              case "small":
                servicePrice = service.price_small || 0;
                break;
              case "medium":
                servicePrice = service.price_medium || 0;
                break;
              case "large":
                servicePrice = service.price_large || 0;
                break;
            }
          }

          return total + servicePrice;
        }, 0) || 0;
    }

    // Beräkna rabatter
    const { data: discounts, error: discountsError } = await (supabase as any)
      .from("customer_discounts")
      .select("*")
      .eq("owner_id", dog.owner_id)
      .eq("org_id", input.org_id)
      .eq("active", true);

    if (discountsError) {
      console.warn("Kunde inte hämta rabatter:", discountsError);
    }

    let discountTotal = 0;
    const applicableDiscounts =
      discounts?.filter((discount: any) => {
        const now = new Date();
        const validFrom = discount.valid_from
          ? new Date(discount.valid_from)
          : null;
        const validUntil = discount.valid_until
          ? new Date(discount.valid_until)
          : null;

        // Kontrollera giltighetstid
        if (validFrom && now < validFrom) return false;
        if (validUntil && now > validUntil) return false;

        // Kontrollera minimum antal nätter
        if (discount.min_nights && totalNights < discount.min_nights)
          return false;

        // TODO: Kontrollera minimum antal hundar för flerhundsrabatt
        // Detta kräver ytterligare logik för att räkna antal hundar per ägare

        return true;
      }) || [];

    const subtotal = totalAccommodationPrice + servicesPrice;

    for (const discount of applicableDiscounts) {
      if (discount.discount_percentage) {
        discountTotal += subtotal * (discount.discount_percentage / 100);
      } else if (discount.discount_amount) {
        discountTotal += discount.discount_amount;
      }
    }

    const finalPrice = Math.max(0, subtotal - discountTotal);

    return {
      dog_size: dogSize,
      total_nights: totalNights,
      accommodation_price: totalAccommodationPrice,
      services_price: servicesPrice,
      discount_total: discountTotal,
      final_price: finalPrice,
      night_details: nightDetails,
      calculation_date: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Error calculating pensionat price:", error);
    throw new Error(
      error.message || `${ERROR_CODES.CALCULATION} Okänt fel vid prisberäkning`
    );
  }
}

/**
 * Kontrollera rumskapacitet för given period
 * [ERR-8001] Kapacitet, [ERR-1001] Databaskoppling
 */
export async function checkRoomCapacity(
  orgId: string,
  roomId: string,
  checkinDate: string,
  checkoutDate: string,
  dogHeight: number,
  excludeBookingId?: string
): Promise<{
  available: boolean;
  requiredArea: number;
  availableArea: number;
  message: string;
}> {
  if (!supabase) {
    throw new Error(`${ERROR_CODES.DATABASE} Supabase client is not available`);
  }

  try {
    // Hämta rumsinformation
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("area_sqm, max_dogs_override, capacity")
      .eq("id", roomId)
      .single();

    if (roomError) {
      throw new Error(
        `${ERROR_CODES.DATABASE} Kunde inte hämta rumsinformation: ${roomError.message}`
      );
    }

    if (!room) {
      throw new Error(
        `${ERROR_CODES.VALIDATION} Rum med ID ${roomId} hittades inte`
      );
    }

    // Type assertion för att hantera Supabase-typer
    const roomData = room as {
      area_sqm?: number;
      capacity?: number;
      max_dogs_override?: number;
    };
    const roomArea = roomData.area_sqm || roomData.capacity || 10; // Fallback till capacity eller 10 m²
    const requiredArea = getRequiredArea(dogHeight);

    // Hämta befintliga bokningar som överlappar med den önskade perioden
    let query = supabase
      .from("bookings")
      .select(
        `
        id,
        dogs!inner(height_cm)
      `
      )
      .eq("room_id", roomId)
      .eq("status", "confirmed")
      .or(`and(start_date.lte.${checkoutDate},end_date.gte.${checkinDate})`);

    if (excludeBookingId) {
      query = query.neq("id", excludeBookingId);
    }

    const { data: overlappingBookings, error: bookingsError } = await query;

    if (bookingsError) {
      throw new Error(
        `${ERROR_CODES.DATABASE} Kunde inte hämta bokningar: ${bookingsError.message}`
      );
    }

    // Beräkna använd yta från befintliga bokningar
    const usedArea = (overlappingBookings || []).reduce((total, booking) => {
      // Type assertion för booking med dogs relation
      const bookingWithDogs = booking as any; // Eftersom Supabase joins kan vara komplexa
      const dogHeight = bookingWithDogs.dogs?.height_cm || 40; // Fallback till mediumstorlek
      return total + getRequiredArea(dogHeight);
    }, 0);

    const availableArea = roomArea - usedArea;
    const canFit = availableArea >= requiredArea;

    // Kontrollera max antal hundar om satt
    const currentDogCount = overlappingBookings?.length || 0;
    const maxDogs = roomData.max_dogs_override || 999; // Ingen gräns om inte satt
    const exceedsMaxDogs = currentDogCount >= maxDogs;

    let message = "";
    if (!canFit) {
      message = `Rummet har inte tillräckligt utrymme. Behövs: ${requiredArea}m², Tillgängligt: ${availableArea.toFixed(
        1
      )}m²`;
    } else if (exceedsMaxDogs) {
      message = `Rummet har nått maxgräns för antal hundar (${maxDogs})`;
    } else {
      message = `Rummet har plats. Kvarvarande yta: ${(
        availableArea - requiredArea
      ).toFixed(1)}m²`;
    }

    return {
      available: canFit && !exceedsMaxDogs,
      requiredArea,
      availableArea,
      message,
    };
  } catch (error: any) {
    console.error("Error checking room capacity:", error);
    throw new Error(
      error.message ||
        `${ERROR_CODES.CAPACITY} Okänt fel vid kapacitetskontroll`
    );
  }
}

/**
 * Formatera pris till svensk valuta
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
  }).format(amount);
}

/**
 * Formatera datum till svenskt format
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formatera kortare datum
 */
export function formatShortDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("sv-SE");
}

/**
 * Kontrollera om vaccination är giltig
 */
export function isVaccinationValid(
  vaccinationDate: string | null,
  validityYears: number
): boolean {
  if (!vaccinationDate) return false;

  const vaccDate = new Date(vaccinationDate);
  const now = new Date();
  const validUntil = new Date(vaccDate);
  validUntil.setFullYear(validUntil.getFullYear() + validityYears);

  return now <= validUntil;
}

/**
 * Få vaccination status
 */
export function getVaccinationStatus(
  vaccinationDate: string | null,
  validityYears: number
): {
  valid: boolean;
  status: "valid" | "expiring" | "expired" | "missing";
  message: string;
} {
  if (!vaccinationDate) {
    return {
      valid: false,
      status: "missing",
      message: "Ingen vaccination registrerad",
    };
  }

  const vaccDate = new Date(vaccinationDate);
  const now = new Date();
  const validUntil = new Date(vaccDate);
  validUntil.setFullYear(validUntil.getFullYear() + validityYears);

  const daysUntilExpiry = Math.ceil(
    (validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 0) {
    return {
      valid: false,
      status: "expired",
      message: `Vaccination gick ut ${formatShortDate(validUntil)}`,
    };
  } else if (daysUntilExpiry <= 30) {
    return {
      valid: true,
      status: "expiring",
      message: `Vaccination går ut om ${daysUntilExpiry} dagar`,
    };
  } else {
    return {
      valid: true,
      status: "valid",
      message: `Vaccination giltig till ${formatShortDate(validUntil)}`,
    };
  }
}

// Re-export helper-funktioner från types
export {
  getSizeCategory,
  getRequiredArea,
  AREA_REQUIREMENTS,
  MODULE_COLORS,
  ERROR_CODES,
} from "../types/hundpensionat";
