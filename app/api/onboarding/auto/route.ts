// app/api/onboarding/auto/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  // Använd service role client för att undvika cookies-problem i Next.js 15
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    console.log("🔵 Auto-onboarding startad...");

    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      console.warn("⚠️ Ingen token angiven vid auto-onboarding");
      return NextResponse.json(
        { error: "Ingen token angiven." },
        { status: 401 }
      );
    }

    // Hämta användaren
    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      console.error("❌ Fel vid hämtning av användare:", userErr);
      return NextResponse.json(
        { error: "Ogiltig användare." },
        { status: 401 }
      );
    }

    const user = userData.user;
    const userId = user.id;

    console.log("👤 Användare hämtad:", userId, user.email);

    // Kolla om användaren redan är kopplad till en org (då är den klar)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", userId)
      .single();

    if (existingProfile?.org_id) {
      console.log("✅ Profil redan kopplad till org:", existingProfile.org_id);
      return NextResponse.json({
        ok: true,
        msg: "Profilen är redan kopplad till en organisation.",
      });
    }

    console.log("🆕 Ingen profil/org hittades, skapar ny...");

    // Läs in data som skickades vid signUp (finns i user.user_metadata)
    const fullName = user.user_metadata?.full_name || null;
    const phone = user.user_metadata?.phone || null;
    const orgName = user.user_metadata?.org_name || "Mitt Hunddagis";
    const orgNumber = user.user_metadata?.org_number || null;
    const userEmail = user.email || null;

    console.log("📋 Metadata:", {
      fullName,
      orgName,
      orgNumber,
      phone,
      userEmail,
    });

    // Skapa organisationen
    const { data: org, error: orgErr } = await supabase
      .from("orgs")
      .insert([
        {
          name: orgName,
          org_number: orgNumber,
          email: userEmail,
          vat_included: true,
          vat_rate: 25,
        },
      ])
      .select("id")
      .single();
    if (orgErr) {
      console.error("Fel vid skapande av organisation:", orgErr);
      return NextResponse.json({ error: orgErr.message }, { status: 400 });
    }

    console.log("Organisation skapad:", org.id);

    // Skapa eller uppdatera profil (upsert för säkerhets skull)
    const { error: profErr } = await supabase.from("profiles").upsert(
      {
        id: userId,
        org_id: org.id,
        role: "admin",
        full_name: fullName,
        email: userEmail,
        phone: phone,
      },
      {
        onConflict: "id",
      }
    );
    if (profErr) {
      console.error("Fel vid skapande av profil:", profErr);
      return NextResponse.json({ error: profErr.message }, { status: 400 });
    }

    console.log("Profil skapad/uppdaterad för användare:", userId);

    // Skapa 3 månader gratis prenumeration
    const trialEnds = new Date();
    trialEnds.setMonth(trialEnds.getMonth() + 3);

    const { error: subErr } = await supabase.from("subscriptions").insert([
      {
        org_id: org.id,
        plan: "basic",
        status: "trialing",
        trial_starts_at: new Date().toISOString(),
        trial_ends_at: trialEnds.toISOString(),
      },
    ]);

    if (subErr) {
      console.error("⚠️ Fel vid skapande av prenumeration:", subErr);
      // Fortsätt ändå - profil och org är viktigast
    } else {
      console.log("💳 Prenumeration skapad med 3 månaders trial");
    }

    console.log("✅ Auto-onboarding klar!");

    return NextResponse.json({
      ok: true,
      msg: "Organisation, profil och prenumeration skapade automatiskt.",
      org_id: org.id,
    });
  } catch (e: any) {
    console.error("❌ Oväntat fel i auto-onboarding:", e);
    return NextResponse.json(
      { error: e?.message || "Serverfel" },
      { status: 500 }
    );
  }
}
