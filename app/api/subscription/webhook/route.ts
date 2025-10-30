import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover" as any,
});

export async function POST(req: Request) {
  const cookieStore = await cookies();
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

      if (org_id) {
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
