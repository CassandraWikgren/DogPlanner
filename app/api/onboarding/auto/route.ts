// app/api/onboarding/auto/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const supabase = createRouteHandlerClient({ cookies });

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token)
      return NextResponse.json(
        { error: "Ingen token angiven." },
        { status: 401 }
      );

    // Hämta användaren
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      token
    );
    if (userErr || !userData?.user)
      return NextResponse.json(
        { error: "Ogiltig användare." },
        { status: 401 }
      );

    const user = userData.user;
    const userId = user.id;

    // Kolla om användaren redan är kopplad till en org (då är den klar)
    const { data: existingProfile } = await supabase
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

    // Läs in data som skickades vid signUp (finns i user.user_metadata)
    const fullName = user.user_metadata?.full_name || null;
    const orgName = user.user_metadata?.org_name || "Mitt Hunddagis";
    const orgNumber = user.user_metadata?.org_number || null;

    // Skapa organisationen
    const { data: org, error: orgErr } = await supabase
      .from("orgs")
      .insert([{ name: orgName, org_number: orgNumber }])
      .select("id")
      .single();
    if (orgErr)
      return NextResponse.json({ error: orgErr.message }, { status: 400 });

    // Uppdatera profil
    const { error: profErr } = await supabase
      .from("profiles")
      .update({ org_id: org.id, role: "admin", full_name: fullName })
      .eq("id", userId);
    if (profErr)
      return NextResponse.json({ error: profErr.message }, { status: 400 });

    // Skapa 3 månader gratis prenumeration
    const trialEnds = new Date();
    trialEnds.setMonth(trialEnds.getMonth() + 3);
    await supabase.from("subscriptions").insert([
      {
        org_id: org.id,
        plan: "basic",
        status: "trialing",
        trial_starts_at: new Date().toISOString(),
        trial_ends_at: trialEnds.toISOString(),
      },
    ]);

    return NextResponse.json({
      ok: true,
      msg: "Organisation skapad automatiskt.",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Serverfel" },
      { status: 500 }
    );
  }
}
