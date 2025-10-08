import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async () => {
  const { error } = await supabase
    .from("dogs")
    .update({ checked_in: false })
    .lt("checkout_date", new Date().toISOString().split("T")[0])
    .eq("checked_in", true);

  if (error) {
    console.error(error);
    return new Response("Fel vid automatisk utcheckning", { status: 500 });
  }

  return new Response("Utcheckning klar ✅", { status: 200 });
});
