// app/api/onboarding/complete/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return NextResponse.json(
        { error: "Saknar Authorization Bearer token." },
        { status: 401 }
      );
    }

    // Skapa Supabase-klient (service role key för admin-operationer)
    const supabase = await createClient();

    // 1) Verifiera vem som anropar
    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "Ogiltig användare." },
        { status: 401 }
      );
    }
    const userId = userData.user.id;

    // 2) Läs body
    const { orgName, fullName } = await req.json();
    if (!orgName || typeof orgName !== "string") {
      return NextResponse.json({ error: "Ogiltigt orgName." }, { status: 400 });
    }

    // 🔒 RACE CONDITION CHECK: Kolla om användaren redan har en org
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", userId)
      .single();

    if (existingProfile?.org_id) {
      console.log(
        "✅ Användare redan kopplad till org:",
        existingProfile.org_id
      );
      return NextResponse.json({
        ok: true,
        msg: "Användaren har redan en organisation.",
        org_id: existingProfile.org_id,
      });
    }

    // 🔒 DUPLICATE CHECK: Kolla om org med samma email redan finns
    const userEmail = userData.user.email || "";
    let existingOrg = null;

    if (userEmail) {
      const { data } = await supabase
        .from("orgs")
        .select("id")
        .eq("email", userEmail)
        .maybeSingle();
      existingOrg = data;
    }

    if (existingOrg) {
      console.log(
        "🔄 Org finns redan för email, kopplar till befintlig:",
        existingOrg.id
      );

      // Koppla användaren till befintlig org
      const patch: Record<string, any> = {
        org_id: existingOrg.id,
        role: "admin",
      };
      if (fullName && typeof fullName === "string") patch.full_name = fullName;

      const { error: profErr } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", userId);

      if (profErr) {
        return NextResponse.json({ error: profErr.message }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        msg: "Kopplad till befintlig organisation.",
        org_id: existingOrg.id,
      });
    }

    // 3) Skapa organisation
    const { data: org, error: orgErr } = await supabase
      .from("orgs")
      .insert([{ name: orgName }])
      .select("id, name, created_at")
      .single();
    if (orgErr) {
      return NextResponse.json({ error: orgErr.message }, { status: 400 });
    }

    // 4) Uppdatera profil: koppla org + roll=admin + ev. full_name
    const patch: Record<string, any> = { org_id: org.id, role: "admin" };
    if (fullName && typeof fullName === "string") patch.full_name = fullName;

    const { error: profErr } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId);
    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 400 });
    }

    // 5) Skapa prenumeration: 2 månader (60 dagar) gratis
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 60); // 2 MÅNADER (60 dagar)

    const { error: subErr } = await supabase.from("subscriptions").insert([
      {
        org_id: org.id,
        status: "trialing", // 'trialing' | 'active' | 'past_due' | 'canceled'
        plan: "basic", // byt till 'pro' om du vill
        trial_starts_at: new Date().toISOString(),
        trial_ends_at: trialEndsAt.toISOString(),
        // next_billing_at: trialEndsAt.toISOString(), // om du vill följa upp när trial tar slut
      },
    ]);
    if (subErr) {
      return NextResponse.json({ error: subErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, org_id: org.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Serverfel" },
      { status: 500 }
    );
  }
}
