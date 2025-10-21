// app/api/subscription/upgrade/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

    // 🧩 Verifiera användaren
    const { data: userData } = await supabaseAdmin.auth.getUser(token);
    const user = userData?.user;
    if (!user)
      return NextResponse.json({ error: "Ingen användare." }, { status: 401 });

    // 🧩 Hämta org_id
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();
    if (!profile?.org_id)
      return NextResponse.json(
        { error: "Ingen organisation kopplad." },
        { status: 400 }
      );

    // 💳 Uppdatera status till active
    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "active",
        next_billing_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // nästa månad
      })
      .eq("org_id", profile.org_id);

    if (error) throw error;

    return NextResponse.json({ ok: true, msg: "Prenumerationen aktiverad" });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Serverfel" },
      { status: 500 }
    );
  }
}
