// /lib/pricing.ts
import { createClient } from "@supabase/supabase-js";

// ====================================
// Typdefinitioner
// ====================================
export interface Dog {
  id: string;
  owner_id: string;
  heightcm: number | null;
}

export interface Booking {
  id: string;
  start_date: string;
  end_date: string;
}

export interface Org {
  id: string;
  vat_included: boolean;
  vat_rate: number;
}

export interface PriceBreakdown {
  label: string;
  amount: number;
}

export interface PriceResult {
  total_excl_vat: number;
  vat_amount: number;
  total_incl_vat: number;
  breakdown: PriceBreakdown[];
}

// ====================================
// Supabase-tabeller
// ====================================
type BoardingPrice = {
  id: string;
  org_id: string;
  size_category: string | null;
  base_price: number;
  weekend_multiplier: number;
  holiday_multiplier: number;
  high_season_multiplier: number;
  created_at: string;
};

type BoardingSeason = {
  id: string;
  org_id: string;
  name: string | null;
  start_date: string | null;
  end_date: string | null;
  type: "high" | "low" | "holiday" | null;
};

type OwnerDiscount = {
  id: string;
  org_id: string;
  owner_id: string;
  discount_name: string;
  discount_percent: number;
};

// ====================================
// 🧮 Beräknar pris för en bokning
// Tar hänsyn till:
// - Grundpris per storlek (boarding_prices)
// - Helg / högtid / säsongstillägg (boarding_seasons)
// - Rabatter (owner_discounts)
// - Moms (orgs.vat_included)
// ====================================
export async function calculatePrice({
  supabase,
  dog,
  booking,
  org,
}: {
  supabase: ReturnType<typeof createClient>;
  dog: Dog;
  booking: Booking;
  org: Org;
}): Promise<PriceResult> {
  const breakdown: PriceBreakdown[] = [];
  let total = 0;

  // 1️⃣ Grundpris baserat på hundens mankhöjd
  const { data: boardingPrice, error: priceError } = await supabase
    .from("boarding_prices")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
    .returns<BoardingPrice>();

  if (priceError || !boardingPrice) {
    console.error("❌ Fel vid hämtning av boarding_prices:", priceError);
    throw new Error("Kunde inte hämta prislista för pensionatet.");
  }

  const h = dog.heightcm || 0;
  let sizeMultiplier = 1.0;
  if (h <= 34) sizeMultiplier = 1.0;
  else if (h <= 49) sizeMultiplier = 1.2;
  else if (h <= 65) sizeMultiplier = 1.4;
  else sizeMultiplier = 1.6;

  const basePrice = boardingPrice.base_price * sizeMultiplier;
  breakdown.push({
    label: `Grundpris (${sizeMultiplier}x)`,
    amount: basePrice,
  });

  // 2️⃣ Hämta säsonger
  const { data: seasons, error: seasonError } = await supabase
    .from("boarding_seasons")
    .select("*")
    .eq("org_id", org.id)
    .returns<BoardingSeason[]>();

  if (seasonError) {
    console.error("⚠️ Kunde inte hämta boarding_seasons:", seasonError);
  }

  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);
  const nights = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  total = basePrice * nights;
  breakdown.push({ label: `Logi ${nights} nätter`, amount: total });

  // 3️⃣ Helg-, högtids- och säsongstillägg
  let weekendCount = 0;
  let holidayCount = 0;
  let highSeasonCount = 0;

  for (let i = 0; i < nights; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const day = date.getDay(); // 0 = söndag, 6 = lördag
    if (day === 0 || day === 6) weekendCount++;

    const match = seasons?.find(
      (s) =>
        s.start_date &&
        s.end_date &&
        new Date(s.start_date) <= date &&
        date <= new Date(s.end_date)
    );

    if (match?.type === "holiday") holidayCount++;
    if (match?.type === "high") highSeasonCount++;
  }

  const weekendFee =
    basePrice * (boardingPrice.weekend_multiplier - 1) * weekendCount;
  const holidayFee =
    basePrice * (boardingPrice.holiday_multiplier - 1) * holidayCount;
  const highSeasonFee =
    basePrice * (boardingPrice.high_season_multiplier - 1) * highSeasonCount;

  if (weekendFee)
    breakdown.push({
      label: `Helgtillägg (${weekendCount} nätter)`,
      amount: weekendFee,
    });
  if (holidayFee)
    breakdown.push({
      label: `Högtidstillägg (${holidayCount} nätter)`,
      amount: holidayFee,
    });
  if (highSeasonFee)
    breakdown.push({
      label: `Högsäsongstillägg (${highSeasonCount} nätter)`,
      amount: highSeasonFee,
    });

  total += weekendFee + holidayFee + highSeasonFee;

  // 4️⃣ Rabatter (owner_discounts)
  const { data: discounts, error: discountError } = await supabase
    .from("owner_discounts")
    .select("*")
    .eq("owner_id", dog.owner_id)
    .eq("org_id", org.id)
    .returns<OwnerDiscount[]>();

  if (discountError) {
    console.warn("⚠️ Kunde inte hämta rabatter:", discountError);
  }

  discounts?.forEach((d) => {
    const amount = (total * (d.discount_percent || 0)) / 100;
    breakdown.push({
      label: `Rabatt: ${d.discount_name} (${d.discount_percent}%)`,
      amount: -amount,
    });
    total -= amount;
  });

  // 5️⃣ Moms
  const vatRate = org.vat_rate ?? 25;
  const vatAmount = org.vat_included
    ? (total * vatRate) / (100 + vatRate)
    : (total * vatRate) / 100;

  const totalExclVat = org.vat_included ? total - vatAmount : total;
  const totalInclVat = org.vat_included ? total : total + vatAmount;

  breakdown.push({ label: `Moms (${vatRate}%)`, amount: vatAmount });

  // ✅ Felsökningslogg
  console.table({
    basePrice,
    weekendCount,
    holidayCount,
    highSeasonCount,
    totalExclVat,
    totalInclVat,
  });

  return {
    total_excl_vat: parseFloat(totalExclVat.toFixed(2)),
    vat_amount: parseFloat(vatAmount.toFixed(2)),
    total_incl_vat: parseFloat(totalInclVat.toFixed(2)),
    breakdown,
  };
}
