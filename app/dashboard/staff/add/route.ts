// app/api/staff/add/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const { email, full_name, role = "staff", org_id } = await req.json();

    if (!email || !org_id) {
      return NextResponse.json(
        { error: "email och org_id krävs." },
        { status: 400 }
      );
    }

    // 1) Skicka invite (om användaren redan finns, skapas ingen ny — vi hanterar det med upsert nedan)
    const { data: invite, error: inviteErr } =
      await supabase.auth.admin.inviteUserByEmail(email, {
        // valfritt: redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
      });

    if (
      inviteErr &&
      inviteErr.message?.toLowerCase().includes("user already registered") ===
        false
    ) {
      // Om felet är något annat än "finns redan"
      return NextResponse.json({ error: inviteErr.message }, { status: 400 });
    }

    const userId = invite?.user?.id;

    // 2) Upsert profil (koppla till org och roll)
    //    Om trigger redan skapar profil: on conflict på id säkerställer att vi uppdaterar rätt.
    const { error: upsertErr } = await supabase.from("profiles").upsert(
      {
        id: userId as string, // Type assertion för att fixa TypeScript-fel
        email,
        full_name: full_name || null,
        role: role || "staff",
        org_id,
      },
      { onConflict: "id" }
    );

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user_id: userId ?? null });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Serverfel" },
      { status: 500 }
    );
  }
}
