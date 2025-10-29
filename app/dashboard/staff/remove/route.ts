// app/api/staff/remove/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { cookies: { get: () => "" } }
);

export async function DELETE(req: Request) {
  try {
    const { user_id } = await req.json();
    if (!user_id) {
      return NextResponse.json({ error: "user_id krävs." }, { status: 400 });
    }

    // 1) Radera profil först (ifall RLS/policyer kräver det separat)
    const { error: delProfileErr } = await supabase
      .from("profiles")
      .delete()
      .eq("id", user_id);

    if (delProfileErr) {
      // Inte blockerande i alla miljöer men vi returnerar fel om det händer
      return NextResponse.json(
        { error: delProfileErr.message },
        { status: 400 }
      );
    }

    // 2) Radera auth-användaren
    const { error: delAuthErr } = await supabase.auth.admin.deleteUser(user_id);
    if (delAuthErr) {
      return NextResponse.json({ error: delAuthErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Serverfel" },
      { status: 500 }
    );
  }
}
