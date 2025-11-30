import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = cookies();

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json(
      { error: "Stripe miljövariabel saknas" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2025-09-30.clover" as any,
  });

  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const org_id = session.metadata?.org_id;
      const plan = session.metadata?.plan;
      const enabled_services = session.metadata?.enabled_services;

      if (org_id) {
        // 🔒 REGISTRERA PRENUMERATIONSSTART (för missbruksskydd)
        // Hämta org-info för att få org_number
        const { data: org } = await supabase
          .from("orgs")
          .select("org_number")
          .eq("id", org_id)
          .single();

        if (org?.org_number && session.customer_email) {
          const { error: regErr } = await supabase.rpc(
            "register_subscription_start",
            {
              p_org_id: org_id,
              p_org_number: org.org_number,
              p_email: session.customer_email,
            }
          );

          if (regErr) {
            console.error(
              "⚠️ Kunde inte registrera prenumerationsstart:",
              regErr
            );
          } else {
            console.log("🔒 Prenumerationshistorik registrerad via webhook");
          }
        }

        // Uppdatera org med has_had_subscription
        await supabase
          .from("orgs")
          .update({ has_had_subscription: true })
          .eq("id", org_id);

        // Uppdatera abonnemanget i Supabase
        await supabase
          .from("subscriptions")
          .update({
            status: "active",
            plan_name: plan,
            next_billing_at: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .eq("org_id", org_id);

        console.log(`✅ Prenumeration aktiverad för org ${org_id} (${plan})`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
