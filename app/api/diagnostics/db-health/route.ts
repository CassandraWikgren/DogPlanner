import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Read-only DB health endpoint
// Safety gates:
// - Requires process.env.ENABLE_DB_HEALTH === 'true'
// - Requires a valid user token AND that user's profile.role === 'admin'
// - Counts are scoped to the caller's org_id

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    if (process.env.ENABLE_DB_HEALTH !== "true") {
      return NextResponse.json({ disabled: true }, { status: 404 });
    }

    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Ingen token" }, { status: 401 });
    }

    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Ogiltig användare" }, { status: 401 });
    }

    const userId = userData.user.id;
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("org_id, role")
      .eq("id", userId)
      .maybeSingle();

    const profile = profileRow as {
      org_id: string | null;
      role?: string | null;
    } | null;
    if (!profile?.org_id) {
      return NextResponse.json(
        { error: "Profil saknar org_id" },
        { status: 400 }
      );
    }
    if (profile.role && profile.role !== "admin") {
      return NextResponse.json({ error: "Endast admin" }, { status: 403 });
    }

    // Helper: check table exists by probing HEAD select
    async function tableExists(name: string) {
      try {
        const { count, error } = await (supabase
          .from(name as any)
          .select("id", { head: true, count: "exact" }) as any);
        if (error) {
          const msg = (error as any)?.message || "";
          if (msg.includes("relation") && msg.includes("does not exist"))
            return false;
          // Unknown error → treat as exists unknown, but don't fail endpoint
          return false;
        }
        return true;
      } catch {
        return false;
      }
    }

    async function columnsExist(tbl: string, cols: string[]) {
      try {
        const { data, error } = await supabase
          .from("information_schema.columns" as any)
          .select("column_name")
          .eq("table_schema", "public")
          .eq("table_name", tbl);
        if (error || !data) {
          return {
            ok: null as any,
            missing: cols,
            error: (error as any)?.message || "no-access",
          };
        }
        const present = new Set((data || []).map((r: any) => r.column_name));
        const missing = cols.filter((c) => !present.has(c));
        return { ok: missing.length === 0, missing } as any;
      } catch (e: any) {
        return {
          ok: null as any,
          missing: cols,
          error: e?.message || "unknown",
        };
      }
    }

    const orgId = profile.org_id;

    // Existence checks
    const exists = {
      profiles: await tableExists("profiles"),
      org_subscriptions: await tableExists("org_subscriptions"),
      grooming_bookings: await tableExists("grooming_bookings"),
      grooming_journal: await tableExists("grooming_journal"),
      subscriptions: await tableExists("subscriptions"), // dog-level
    };

    // Column checks (minimal, non-invasive)
    const columns = {
      profiles: await columnsExist("profiles", ["id", "org_id"]),
      org_subscriptions: await columnsExist("org_subscriptions", [
        "org_id",
        "status",
        "trial_ends_at",
        "is_active",
      ]),
      subscriptions: await columnsExist("subscriptions", [
        "org_id",
        "dog_id",
        "subscription_type",
        "is_active",
      ]),
    };

    // Scoped counts (per org)
    const counts: Record<string, number | null> = {};
    async function countOf(tbl: string, where: Record<string, any>) {
      const query = (supabase.from(tbl as any) as any).select("id", {
        count: "exact",
        head: true,
      });
      Object.entries(where).forEach(([k, v]) => query.eq(k, v));
      const { count } = await query;
      return typeof count === "number" ? count : null;
    }
    counts.owners = await countOf("owners", { org_id: orgId });
    counts.dogs = await countOf("dogs", { org_id: orgId });
    counts.rooms = await countOf("rooms", { org_id: orgId });
    counts.bookings = await countOf("bookings", { org_id: orgId });
    counts.org_subscriptions_active = await countOf("org_subscriptions", {
      org_id: orgId,
      is_active: true,
    });

    return NextResponse.json({
      ok: true,
      exists,
      columns,
      counts,
      org_id: orgId,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Serverfel" },
      { status: 500 }
    );
  }
}
