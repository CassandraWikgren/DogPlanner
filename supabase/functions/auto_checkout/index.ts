// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async () => {
  const today = new Date().toISOString().split("T")[0];
  console.log("✅ Auto-checkin & checkout körs:", today);

  try {
    // 1️⃣ Utcheckning
    const { error: checkoutError } = await supabase
      .from("dogs")
      .update({ checked_in: false })
      .lt("checkout_date", today)
      .eq("checked_in", true);

    if (checkoutError)
      throw new Error(`Utcheckning misslyckades: ${checkoutError.message}`);

    // 2️⃣ Incheckning
    const { error: checkinError } = await supabase
      .from("dogs")
      .update({ checked_in: true })
      .eq("checkin_date", today)
      .eq("checked_in", false);

    if (checkinError)
      throw new Error(`Incheckning misslyckades: ${checkinError.message}`);

    console.log("🐾 Auto-checkin & checkout klar:", today);
    return new Response("✅ Auto-checkin & checkout klar", { status: 200 });
  } catch (err) {
    console.error("🚨 Fel i nattlig körning:", err.message);

    // Spara fel i en separat loggtabell i databasen
    await supabase
      .from("error_logs")
      .insert([
        { date: today, message: err.message, function: "auto_checkout" },
      ]);

    return new Response(`Fel vid automatisk körning: ${err.message}`, {
      status: 500,
    });
  }
});
