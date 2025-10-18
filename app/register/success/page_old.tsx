// app/api/onboarding/auto/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ endast server-sida
);

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token)
      return NextResponse.json(
        { error: "Ingen token angiven." },
        { status: 401 }
      );

    // 🔍 Verifiera användaren
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(
      token
    );
    if (userErr || !userData?.user)
      return NextResponse.json(
        { error: "Ogiltig användare." },
        { status: 401 }
      );

    const user = userData.user;
    const userId = user.id;

    // 🧩 Kolla om användaren redan är kopplad till en organisation
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("org_id")
      .eq("id", userId)
      .single();

    if (existingProfile?.org_id) {
      return NextResponse.json({
        ok: true,
        msg: "Profilen är redan kopplad till en organisation.",
      });
    }

    // 📦 Läs in metadata från registreringen
    const fullName = user.user_metadata?.full_name || null;
    const orgName = user.user_metadata?.org_name || "Mitt Hunddagis";
    const orgNumber = user.user_metadata?.org_number || null;

    // 🏢 Skapa ny organisation
    const { data: org, error: orgErr } = await supabaseAdmin
      .from("orgs")
      .insert([{ name: orgName, org_number: orgNumber }])
      .select("id, name")
      .single();
    if (orgErr)
      return NextResponse.json({ error: orgErr.message }, { status: 400 });

    // 👤 Uppdatera profil
    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .update({
        org_id: org.id,
        role: "admin",
        full_name: fullName,
      })
      .eq("id", userId);
    if (profErr)
      return NextResponse.json({ error: profErr.message }, { status: 400 });

    // 💸 Skapa 3 månader gratis prenumeration
    const trialEnds = new Date();
    trialEnds.setMonth(trialEnds.getMonth() + 3);
    const { error: subErr } = await supabaseAdmin.from("subscriptions").insert([
      {
        org_id: org.id,
        plan: "basic",
        status: "trialing",
        trial_starts_at: new Date().toISOString(),
        trial_ends_at: trialEnds.toISOString(),
      },
    ]);
    if (subErr)
      return NextResponse.json({ error: subErr.message }, { status: 400 });

    return NextResponse.json({
      ok: true,
      msg: "Organisation skapad automatiskt.",
    });
  } catch (e: any) {
    console.error("❌ Auto-onboarding error:", e);
    return NextResponse.json(
      { error: e?.message || "Serverfel" },
      { status: 500 }
    );
  }
}
