import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import type { Database } from "@/types/database";
export async function POST(req: Request) {
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

  const supabase = await createClient();

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // ============================================================================
    // CHECKOUT COMPLETED - Ny prenumeration startad
    // ============================================================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const org_id = session.metadata?.org_id;
      const plan = session.metadata?.plan;
      const enabled_services = session.metadata?.enabled_services;
      const billing_period = session.metadata?.billing_period || "monthly";

      if (org_id) {
        // Hämta Stripe subscription för att få customer_id och subscription_id
        let stripeSubscriptionId = null;
        let stripeCustomerId = null;

        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          stripeSubscriptionId = subscription.id;
          stripeCustomerId = subscription.customer as string;
        }

        // 🔒 REGISTRERA PRENUMERATIONSSTART (för missbruksskydd)
        // Hämta org-info för att få org_number
        const { data: org } = (await supabase
          .from("orgs")
          .select("org_number")
          .eq("id", org_id)
          .single()) as { data: { org_number: string | null } | null };

        if (org?.org_number && session.customer_email) {
          const { error: regErr } = await supabase.rpc(
            "register_subscription_start" as any,
            {
              p_org_id: org_id,
              p_plan: plan || "basic",
            } as any
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

        // Uppdatera org med subscription details
        await supabase
          .from("orgs")
          // @ts-ignore - Supabase type issue
          .update({
            has_had_subscription: true,
            subscription_start_date: new Date().toISOString(),
            billing_period: billing_period,
            stripe_subscription_id: stripeSubscriptionId,
            stripe_customer_id: stripeCustomerId,
            subscription_status: "active",
            accepting_applications: true, // 🟢 Aktivera - visas i kundlistor
          })
          .eq("id", org_id);

        // Uppdatera abonnemanget i Supabase
        await supabase
          .from("subscriptions")
          // @ts-ignore - Supabase type issue
          .update({
            status: "active",
            plan_name: plan,
            next_billing_at: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .eq("org_id", org_id);

        console.log(
          `✅ Prenumeration aktiverad för org ${org_id} (${plan}, ${billing_period})`
        );
      }
    }

    // ============================================================================
    // PAYMENT SUCCEEDED - Betalning lyckades (återaktivering)
    // ============================================================================
    else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      // @ts-ignore - Stripe Invoice includes subscription field
      const subscriptionId = invoice.subscription as string | undefined;

      if (subscriptionId) {
        // Hitta org via stripe_subscription_id
        const { data: org } = (await supabase
          .from("orgs")
          .select("id, name")
          .eq("stripe_subscription_id", subscriptionId)
          .single()) as { data: { id: string; name: string | null } | null };

        if (org) {
          await supabase
            .from("orgs")
            // @ts-ignore - Supabase type issue
            .update({
              subscription_status: "active",
              accepting_applications: true, // 🟢 Återaktivera - syns i kundlistor igen
            })
            .eq("id", org.id);

          console.log(
            `✅ Betalning lyckades - ${org.name} återaktiverad och synlig för kunder`
          );
        }
      }
    }

    // ============================================================================
    // PAYMENT FAILED - Betalning misslyckades
    // ============================================================================
    else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      // @ts-ignore - Stripe Invoice includes subscription field
      const subscriptionId = invoice.subscription as string | undefined;

      if (subscriptionId) {
        // Hitta org via stripe_subscription_id
        const { data: org } = (await supabase
          .from("orgs")
          .select("id, name")
          .eq("stripe_subscription_id", subscriptionId)
          .single()) as { data: { id: string; name: string | null } | null };

        if (org) {
          await supabase
            .from("orgs")
            // @ts-ignore - Supabase type issue
            .update({
              subscription_status: "past_due",
              accepting_applications: false, // 🔴 Dölj från kundlistor
            })
            .eq("id", org.id);

          console.log(
            `⚠️ Betalning misslyckades - ${org.name} dold från kunder (past_due)`
          );
        }
      }
    }

    // ============================================================================
    // SUBSCRIPTION DELETED/CANCELED - Prenumeration avslutad
    // ============================================================================
    else if (
      event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.updated"
    ) {
      const subscription = event.data.object as Stripe.Subscription;

      if (
        subscription.status === "canceled" ||
        subscription.status === "unpaid"
      ) {
        // Hitta org via stripe_subscription_id
        const { data: org } = (await supabase
          .from("orgs")
          .select("id, name")
          .eq("stripe_subscription_id", subscription.id)
          .single()) as { data: { id: string; name: string | null } | null };

        if (org) {
          await supabase
            .from("orgs")
            // @ts-ignore - Supabase type issue
            .update({
              subscription_status: "canceled",
              accepting_applications: false, // 🔴 Dölj från kundlistor
            })
            .eq("id", org.id);

          console.log(
            `❌ Prenumeration avslutad - ${org.name} dold från kunder (canceled)`
          );
        }
      } else if (subscription.status === "active") {
        // Prenumeration återaktiverad (t.ex. efter betalning)
        const { data: org } = (await supabase
          .from("orgs")
          .select("id, name")
          .eq("stripe_subscription_id", subscription.id)
          .single()) as { data: { id: string; name: string | null } | null };

        if (org) {
          await supabase
            .from("orgs")
            // @ts-ignore - Supabase type issue
            .update({
              subscription_status: "active",
              accepting_applications: true, // 🟢 Återaktivera
            })
            .eq("id", org.id);

          console.log(
            `✅ Prenumeration återaktiverad - ${org.name} synlig för kunder igen`
          );
        }
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
