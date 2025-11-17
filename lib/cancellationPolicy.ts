/**
 * Cancellation Policy Calculator
 *
 * Beräknar avbokningsavgift baserat på organisationens policy
 * och antal dagar kvar till bokningens startdatum.
 *
 * Standard policy (kan konfigureras per organisation):
 * - 7+ dagar: Ingen avgift (0%)
 * - 3-7 dagar: 50% avgift
 * - Under 3 dagar: Full avgift (100%)
 */

import { differenceInDays } from "date-fns";

export interface CancellationPolicy {
  days_7_plus: number; // 0 = ingen avgift, 1 = full avgift
  days_3_to_7: number;
  days_under_3: number;
  description?: string;
}

export interface CancellationCalculation {
  cancellationFee: number;
  refundAmount: number;
  daysUntilStart: number;
  feePercentage: number;
  policyApplied: string;
  canCancel: boolean;
  reason?: string;
}

/**
 * Standard avbokningspolicy
 */
export const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = {
  days_7_plus: 0, // Ingen avgift
  days_3_to_7: 0.5, // 50% avgift
  days_under_3: 1.0, // 100% avgift
  description:
    "7+ dagar: Ingen avgift, 3-7 dagar: 50% avgift, Under 3 dagar: 100% avgift",
};

/**
 * Beräknar avbokningsavgift baserat på policy
 *
 * @param startDate - Bokningens startdatum
 * @param totalPrice - Totalpris för bokningen
 * @param policy - Organisationens avbokningspolicy (använder default om ej angiven)
 * @param cancellationDate - Datum för avbokning (default: idag)
 * @returns Beräkning med avgift, återbetalning och policy-info
 */
export function calculateCancellationFee(
  startDate: Date | string,
  totalPrice: number,
  policy: CancellationPolicy = DEFAULT_CANCELLATION_POLICY,
  cancellationDate: Date = new Date()
): CancellationCalculation {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const daysUntilStart = differenceInDays(start, cancellationDate);

  // Kolla om bokningen redan har startat
  if (daysUntilStart < 0) {
    return {
      cancellationFee: totalPrice,
      refundAmount: 0,
      daysUntilStart,
      feePercentage: 1.0,
      policyApplied: "Bokningen har redan startat",
      canCancel: false,
      reason:
        "Bokningen har redan startat och kan inte avbokas. Kontakta pensionatet för hjälp.",
    };
  }

  // Bestäm vilken policy-regel som ska användas
  let feePercentage: number;
  let policyApplied: string;

  if (daysUntilStart >= 7) {
    feePercentage = policy.days_7_plus;
    policyApplied = `7+ dagar kvar: ${feePercentage * 100}% avgift`;
  } else if (daysUntilStart >= 3) {
    feePercentage = policy.days_3_to_7;
    policyApplied = `3-7 dagar kvar: ${feePercentage * 100}% avgift`;
  } else {
    feePercentage = policy.days_under_3;
    policyApplied = `Under 3 dagar kvar: ${feePercentage * 100}% avgift`;
  }

  // Beräkna avgift och återbetalning
  const cancellationFee = Math.round(totalPrice * feePercentage * 100) / 100;
  const refundAmount = Math.round((totalPrice - cancellationFee) * 100) / 100;

  return {
    cancellationFee,
    refundAmount,
    daysUntilStart,
    feePercentage,
    policyApplied,
    canCancel: true,
  };
}

/**
 * Formaterar avbokningsinformation för visning till kund
 */
export function formatCancellationInfo(
  calculation: CancellationCalculation
): string {
  if (!calculation.canCancel) {
    return calculation.reason || "Bokningen kan inte avbokas.";
  }

  const { daysUntilStart, cancellationFee, refundAmount, policyApplied } =
    calculation;

  if (cancellationFee === 0) {
    return `Du kan avboka utan kostnad (${daysUntilStart} dagar kvar). Full återbetalning: ${refundAmount} kr`;
  }

  return `
Avbokningsavgift: ${cancellationFee} kr (${policyApplied})
Återbetalning: ${refundAmount} kr
Dagar kvar till incheckning: ${daysUntilStart}
  `.trim();
}

/**
 * Kontrollerar om en bokning kan avbokas av kunden
 *
 * @param status - Bokningens nuvarande status
 * @param startDate - Startdatum
 * @returns true om kunden kan avboka själv
 */
export function canCustomerCancel(
  status: string,
  startDate: Date | string
): boolean {
  // Kund kan inte avboka om status är checked_in eller checked_out
  if (
    status === "checked_in" ||
    status === "checked_out" ||
    status === "cancelled"
  ) {
    return false;
  }

  // Kund kan inte avboka om bokningen redan har startat
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const daysUntilStart = differenceInDays(start, new Date());

  if (daysUntilStart < 0) {
    return false;
  }

  // pending och confirmed kan avbokas
  return true;
}

/**
 * Hämtar avbokningspolicy från organisation (från jsonb-kolumn)
 */
export function parsePolicyFromOrganisation(
  policyJson: any
): CancellationPolicy {
  if (!policyJson) {
    return DEFAULT_CANCELLATION_POLICY;
  }

  return {
    days_7_plus:
      policyJson.days_7_plus ?? DEFAULT_CANCELLATION_POLICY.days_7_plus,
    days_3_to_7:
      policyJson.days_3_to_7 ?? DEFAULT_CANCELLATION_POLICY.days_3_to_7,
    days_under_3:
      policyJson.days_under_3 ?? DEFAULT_CANCELLATION_POLICY.days_under_3,
    description:
      policyJson.description ?? DEFAULT_CANCELLATION_POLICY.description,
  };
}

/**
 * Genererar avbokningsbekräftelse-meddelande
 */
export function generateCancellationMessage(
  bookingId: string,
  dogName: string,
  startDate: string,
  endDate: string,
  calculation: CancellationCalculation
): string {
  return `
Din bokning har avbokats

Bokningsnummer: ${bookingId.substring(0, 8)}
Hund: ${dogName}
Period: ${startDate} - ${endDate}

${formatCancellationInfo(calculation)}

Vi beklagar att du inte kan komma. Välkommen åter en annan gång!
  `.trim();
}
