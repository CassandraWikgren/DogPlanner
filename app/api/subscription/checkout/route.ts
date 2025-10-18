import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// --- Stripe-klient ---
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

// --- Supabase Admin-klient ---
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// --- Stripe-priser (fyll i dina faktiska pris-ID:n från Stripe Dashboard) ---
const PRICE_IDS: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_ID_BASIC!, // 99 kr/mån
  dual: process.env.STRIPE_PRICE_ID_DUAL!, // 199 kr/mån
  full: process.env.STRIPE_PRICE_ID_FULL!, // 299 kr/mån
};

export async function POST(req: Request) {
  try {
    // --- 1. Hämta och verifiera användar-token ---
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return NextResponse.json(
        { error: "Ingen token angiven." },
        { status: 401 }
      );
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(
      token
    );
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "Ogiltig användare." },
        { status: 401 }
      );
    }

    const user = userData.user;

    // --- 2. Hämta profil och org kopplad till användaren ---
    const { data: profile, error: profileErr } = await supabaseAdmin
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
    const { data: org } = await supabaseAdmin
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
