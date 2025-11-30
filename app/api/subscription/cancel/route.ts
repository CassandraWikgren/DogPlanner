import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

/**
 * POST /api/subscription/cancel
 *
 * Avbryter abonnemang med automatisk pro-rata återbetalning för årsabonnemang.
 *
 * Logik:
 * - Månadsabonnemang: Avbryt direkt, ingen återbetalning
 * - Årsabonnemang: Beräkna använd tid × månadspris, återbetala resten automatiskt via Stripe
 */
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Autentisera användare
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
    }

    // Hämta användarens profil för att få org_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.org_id) {
      return NextResponse.json(
        { error: "Ingen organisation hittades" },
        { status: 404 }
      );
    }

    const orgId = profile.org_id;

    // Hämta organisation med subscription-data
    const { data: org, error: orgError } = await supabase
      .from("orgs")
      .select("*")
      .eq("id", orgId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: "Organisation hittades inte" },
        { status: 404 }
      );
    }

    // Kolla att det finns en aktiv subscription
    if (!org.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Ingen aktiv subscription hittades" },
        { status: 400 }
      );
    }

    let refundAmount = 0;
    let refundDetails = null;

    // Beräkna återbetalning för årsabonnemang
    if (org.billing_period === "yearly") {
      const { data: refundCalc, error: refundError } = await supabase.rpc(
        "calculate_yearly_refund",
        { p_org_id: orgId }
      );

      if (refundError) {
        console.error("Refund calculation error:", refundError);
      } else if (
        refundCalc &&
        refundCalc.eligible &&
        refundCalc.refund_amount > 0
      ) {
        refundAmount = refundCalc.refund_amount;
        refundDetails = refundCalc;
      }
    }

    // Avbryt subscription i Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(
      org.stripe_subscription_id,
      {
        prorate: false, // Vi hanterar återbetalning manuellt
      }
    );

    // Skapa återbetalning om det finns belopp att återbetala
    let refund = null;
    if (refundAmount > 0 && org.stripe_customer_id) {
      try {
        // Konvertera till öre (Stripe använder lägsta valutaenhet)
        const refundAmountInOre = Math.round(refundAmount * 100);

        refund = await stripe.refunds.create({
          customer: org.stripe_customer_id,
          amount: refundAmountInOre,
          reason: "requested_by_customer",
          metadata: {
            org_id: orgId,
            calculation: refundDetails?.calculation || "",
            months_used: refundDetails?.months_used?.toString() || "",
          },
        });

        console.log(
          `✅ Återbetalning skapad: ${refundAmount} kr till kund ${org.stripe_customer_id}`
        );
      } catch (refundError: any) {
        console.error("Stripe refund error:", refundError);
        // Fortsätt ändå med avbokningen även om återbetalningen misslyckades
      }
    }

    // Uppdatera organisation i databasen
    const { error: updateError } = await supabase
      .from("orgs")
      .update({
        subscription_status: "canceled",
        subscription_cancelled_at: new Date().toISOString(),
        status: "canceled",
      })
      .eq("id", orgId);

    if (updateError) {
      console.error("Database update error:", updateError);
    }

    return NextResponse.json({
      success: true,
      message: "Abonnemang avslutat",
      canceledAt: canceledSubscription.canceled_at,
      refund: refund
        ? {
            amount: refundAmount,
            currency: "SEK",
            details: refundDetails,
            stripeRefundId: refund.id,
            status: refund.status,
          }
        : null,
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      {
        error: error.message || "Kunde inte avsluta abonnemang",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/subscription/cancel?preview=true
 *
 * Hämta förhandsvisning av vad avbokning skulle kosta/återbetala
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const preview = searchParams.get("preview") === "true";

    if (!preview) {
      return NextResponse.json(
        { error: "Använd POST för att faktiskt avbryta" },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Ej autentiserad" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json(
        { error: "Ingen organisation hittades" },
        { status: 404 }
      );
    }

    // Hämta organisation
    const { data: org } = await supabase
      .from("orgs")
      .select("*")
      .eq("id", profile.org_id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: "Organisation hittades inte" },
        { status: 404 }
      );
    }

    // Beräkna eventuell återbetalning
    let refundPreview = null;
    if (org.billing_period === "yearly") {
      const { data: refundCalc } = await supabase.rpc(
        "calculate_yearly_refund",
        { p_org_id: profile.org_id }
      );

      refundPreview = refundCalc;
    }

    return NextResponse.json({
      billingPeriod: org.billing_period,
      subscriptionStatus: org.subscription_status,
      hasActiveSubscription: !!org.stripe_subscription_id,
      refundPreview,
    });
  } catch (error: any) {
    console.error("Cancel preview error:", error);
    return NextResponse.json(
      { error: error.message || "Kunde inte hämta förhandsvisning" },
      { status: 500 }
    );
  }
}
