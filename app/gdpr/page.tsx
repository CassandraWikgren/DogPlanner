"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";

export default function GDPRBanner() {
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function acceptConsent() {
    try {
      const user = (await supabase.auth.getUser()).data.user;

      if (!user) {
        console.error("❌ Ingen användare inloggad");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          gdpr_consent: true,
          gdpr_consent_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      console.log("✅ GDPR-godkännande sparat för:", user.id);
      router.push("/dashboard");
    } catch (err) {
      console.error("⚠️ Fel vid GDPR-sparning:", err);
    }
  }

  return (
    <div className="p-4 bg-gray-100 rounded-md text-center mt-4">
      <p className="text-gray-700 mb-2">
        Vi värnar om din integritet. Läs mer om hur vi hanterar data i vår{" "}
        <a href="/gdpr" className="text-emerald-700 underline">
          integritetspolicy
        </a>
        .
      </p>
      <Button
        onClick={acceptConsent}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded"
      >
        Jag godkänner
      </Button>
    </div>
  );
}
