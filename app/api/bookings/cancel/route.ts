import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  calculateCancellationFee,
  parsePolicyFromOrganisation,
} from "@/lib/cancellationPolicy";

/**
 * POST /api/bookings/cancel
 *
 * Avbokar en bokning och beräknar återbetalning enligt policy
 *
 * Body:
 * {
 *   bookingId: string,
 *   reason: string (frivillig)
 * }
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verifiera authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { bookingId, reason } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId krävs" }, { status: 400 });
    }

    // Hämta bokningen med all relaterad data
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        org_id,
        dog_id,
        owner_id,
        start_date,
        end_date,
        status,
        total_price,
        dogs (
          id,
          name,
          owner_id,
          owners (
            id,
            user_id
          )
        )
      `
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Bokning hittades inte" },
        { status: 404 }
      );
    }

    // Verifiera att användaren äger bokningen
    // @ts-ignore - Supabase typing
    const ownerUserId = booking.dogs?.owners?.user_id;

    if (ownerUserId !== user.id) {
      // Kolla om användaren är personal för organisationen
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id, role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.org_id !== booking.org_id) {
        return NextResponse.json(
          { error: "Du har inte behörighet att avboka denna bokning" },
          { status: 403 }
        );
      }
    }

    // Kontrollera att bokningen kan avbokas
    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Bokningen är redan avbokad" },
        { status: 400 }
      );
    }

    if (booking.status === "checked_in" || booking.status === "checked_out") {
      return NextResponse.json(
        {
          error:
            "Bokningen kan inte avbokas efter incheckning. Kontakta pensionatet.",
        },
        { status: 400 }
      );
    }

    // Hämta organisationens avbokningspolicy
    const { data: organisation } = await supabase
      .from("orgs")
      .select("cancellation_policy")
      .eq("id", booking.org_id)
      .single();

    const policy = parsePolicyFromOrganisation(
      (organisation as any)?.cancellation_policy
    );

    // Beräkna avbokningsavgift
    const calculation = calculateCancellationFee(
      booking.start_date,
      booking.total_price || 0,
      policy
    );

    if (!calculation.canCancel) {
      return NextResponse.json(
        {
          error: calculation.reason || "Bokningen kan inte avbokas",
          calculation,
        },
        { status: 400 }
      );
    }

    // Uppdatera bokning till cancelled
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "cancelled" as const,
        cancellation_reason:
          reason || `Avbokad av kund (${calculation.policyApplied})`,
        cancelled_at: new Date().toISOString(),
        cancelled_by_user_id: user.id,
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Fel vid uppdatering av bokning:", updateError);
      return NextResponse.json(
        { error: "Kunde inte avboka bokningen" },
        { status: 500 }
      );
    }

    // TODO: Hantera återbetalning om det finns en förskottsfaktura
    // Kolumnen prepayment_invoice_id finns inte ännu i bookings-tabellen
    /*
    if (booking.prepayment_invoice_id && calculation.refundAmount > 0) {
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({
          status: "refunded",
          refund_amount: calculation.refundAmount,
          refund_date: new Date().toISOString(),
          notes: `Återbetalning vid avbokning: ${calculation.policyApplied}`,
        })
        .eq("id", booking.prepayment_invoice_id);

      if (invoiceError) {
        console.error("Fel vid uppdatering av faktura:", invoiceError);
      }
    }
    */

    // TODO: Skicka avbokningsbekräftelse via email
    // await sendCancellationEmail(booking, calculation);

    return NextResponse.json({
      success: true,
      message: "Bokningen har avbokats",
      booking: {
        id: booking.id,
        status: "cancelled" as const,
        // @ts-ignore
        dogName: booking.dogs?.name,
        startDate: booking.start_date,
        endDate: booking.end_date,
      },
      calculation: {
        cancellationFee: calculation.cancellationFee,
        refundAmount: calculation.refundAmount,
        daysUntilStart: calculation.daysUntilStart,
        policyApplied: calculation.policyApplied,
      },
    });
  } catch (error) {
    console.error("Fel i cancel API:", error);
    return NextResponse.json(
      { error: "Ett oväntat fel uppstod" },
      { status: 500 }
    );
  }
}
