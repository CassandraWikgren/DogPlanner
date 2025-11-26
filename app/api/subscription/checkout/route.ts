import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// --- Stripe-priser (fyll i dina faktiska pris-ID:n från Stripe Dashboard) ---
const PRICE_IDS: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_ID_BASIC || "", // 149 kr/mån
  full: process.env.STRIPE_PRICE_ID_FULL || "", // 299 kr/mån
};

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

    // Skapa Supabase-klient utan cookies-objekt (endast URL och ANON_KEY)
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

    // --- 3. Hämta organisationsnamn ---
    const { data: org } = await supabase
      .from("orgs")
      .select("name")
      .eq("id", profile.org_id)
      .single();

    // --- 4. Läs in vald plan ---
    const body = await req.json();
    const { plan } = body;

    if (!plan || !PRICE_IDS[plan]) {
      return NextResponse.json(
        { error: "Ogiltig eller saknad plan." },
        { status: 400 }
      );
    }

    // --- 5. Skapa Stripe Checkout-session ---
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRICE_IDS[plan],
          quantity: 1,
        },
      ],
      customer_email: user.email!,
      metadata: {
        org_id: profile.org_id,
        plan: plan,
        user_id: user.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
    });

    // --- 6. Returnera Checkout-URL ---
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Serverfel vid betalning." },
      { status: 500 }
    );
  }
}
