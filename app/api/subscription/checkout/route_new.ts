import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// =====================================================
// STRIPE CHECKOUT - MODULÄRA TJÄNSTER
// =====================================================
// Månads priser:
// - 1 tjänst (Frisör): 199 kr/mån
// - 1 tjänst (Dagis/Pensionat): 399 kr/mån
// - 2 tjänster: 599 kr/mån
// - 3 tjänster: 799 kr/mån
//
// Årspriser (50 kr/mån rabatt = 600 kr/år):
// - 1 tjänst (Frisör): 1788 kr/år (149 kr/mån)
// - 1 tjänst (Dagis/Pensionat): 4188 kr/år (349 kr/mån)
// - 2 tjänster: 6588 kr/år (549 kr/mån)
// - 3 tjänster: 8988 kr/år (749 kr/mån)

const PRICE_IDS: Record<string, { monthly: string; yearly: string }> = {
  grooming_only: {
    monthly: process.env.STRIPE_PRICE_ID_GROOMING || "",
    yearly: process.env.STRIPE_PRICE_ID_GROOMING_YEARLY || "",
  },
  daycare_only: {
    monthly: process.env.STRIPE_PRICE_ID_DAYCARE || "",
    yearly: process.env.STRIPE_PRICE_ID_DAYCARE_YEARLY || "",
  },
  boarding_only: {
    monthly: process.env.STRIPE_PRICE_ID_BOARDING || "",
    yearly: process.env.STRIPE_PRICE_ID_BOARDING_YEARLY || "",
  },
  two_services: {
    monthly: process.env.STRIPE_PRICE_ID_TWO_SERVICES || "",
    yearly: process.env.STRIPE_PRICE_ID_TWO_SERVICES_YEARLY || "",
  },
  all_services: {
    monthly: process.env.STRIPE_PRICE_ID_ALL_SERVICES || "",
    yearly: process.env.STRIPE_PRICE_ID_ALL_SERVICES_YEARLY || "",
  },
};

function getPriceIdFromServices(
  services: string[],
  billingPeriod: "monthly" | "yearly" = "monthly"
): {
  priceId: string;
  planName: string;
} {
  const count = services.length;

  if (count === 0) {
    throw new Error("Ingen tjänst vald");
  }

  if (count === 1) {
    const service = services[0];
    if (service === "grooming") {
      return {
        priceId: PRICE_IDS.grooming_only[billingPeriod],
        planName: "Hundfrisör",
      };
    } else if (service === "daycare") {
      return {
        priceId: PRICE_IDS.daycare_only[billingPeriod],
        planName: "Hunddagis",
      };
    } else if (service === "boarding") {
      return {
        priceId: PRICE_IDS.boarding_only[billingPeriod],
        planName: "Hundpensionat",
      };
    }
  }

  if (count === 2) {
    return {
      priceId: PRICE_IDS.two_services[billingPeriod],
      planName: "2 Tjänster",
    };
  }

  if (count === 3) {
    return {
      priceId: PRICE_IDS.all_services[billingPeriod],
      planName: "Alla 3 Tjänster",
    };
  }

  throw new Error("Ogiltig tjänstekombination");
}

export async function POST(req: Request) {
  try {
    // --- 0. Kontrollera miljövariabler ---
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!url || !anonKey) {
      return NextResponse.json(
        { error: "Supabase miljövariabler saknas" },
        { status: 500 }
      );
    }

    if (!stripeKey) {
      return NextResponse.json(
        { error: "Stripe miljövariabler saknas" },
        { status: 500 }
      );
    }

    // --- Skapa Stripe-klient ---
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-06-20" as any,
    });

    // --- 1. Hämta och verifiera användar-token ---
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return NextResponse.json(
        { error: "Ingen token angiven." },
        { status: 401 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "Ogiltig användare." },
        { status: 401 }
      );
    }

    const user = userData.user;

    // --- 2. Hämta profil och org kopplad till användaren ---
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("org_id, full_name")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile?.org_id) {
      return NextResponse.json(
        { error: "Ingen organisation kopplad till profilen." },
        { status: 400 }
      );
    }

    // --- 3. Hämta organisationsnamn och nuvarande tjänster ---
    const { data: org } = await supabase
      .from("orgs")
      .select("name, enabled_services, has_had_subscription")
      .eq("id", profile.org_id)
      .single();

    // --- 4. Läs in valda tjänster och billing period från body ---
    const body = await req.json();
    const { services, billingPeriod = "monthly" } = body;
    // services: Array: ['daycare', 'boarding', 'grooming']
    // billingPeriod: 'monthly' | 'yearly'

    if (!services || !Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: "Inga tjänster valda." },
        { status: 400 }
      );
    }

    if (!["monthly", "yearly"].includes(billingPeriod)) {
      return NextResponse.json(
        {
          error: "Ogiltig billing period. Måste vara 'monthly' eller 'yearly'.",
        },
        { status: 400 }
      );
    }

    // --- 5. Få rätt price ID baserat på tjänster OCH billing period ---
    const { priceId, planName } = getPriceIdFromServices(
      services,
      billingPeriod
    );

    if (!priceId) {
      return NextResponse.json(
        { error: "Inget pris-ID konfigurerat för denna kombination." },
        { status: 500 }
      );
    }

    // --- 6. Skapa Stripe Checkout-session ---
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email!,
      metadata: {
        org_id: profile.org_id,
        user_id: user.id,
        enabled_services: JSON.stringify(services), // Spara valda tjänster
        plan_name: planName,
        billing_period: billingPeriod, // Spara billing period
      },
      subscription_data: {
        // 🎁 2 MÅNADERS GRATIS TRIAL (endast om första prenumerationen)
        trial_period_days: org?.has_had_subscription ? 0 : 60,
        metadata: {
          org_id: profile.org_id,
          enabled_services: JSON.stringify(services),
          billing_period: billingPeriod,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/abonnemang?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/abonnemang?cancelled=true`,
    });

    // --- 7. Returnera Checkout-URL ---
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error("❌ Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Serverfel vid betalning." },
      { status: 500 }
    );
  }
}
