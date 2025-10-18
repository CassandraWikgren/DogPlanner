"use client";
import { useAuth } from "@/app/context/AuthContext";

export default function TrialBanner() {
  const { subscription } = useAuth();
  if (!subscription) return null;

  const expired = subscription.expired;
  const endDate = subscription.trial_ends_at
    ? new Date(subscription.trial_ends_at).toLocaleDateString("sv-SE")
    : null;

  return (
    <div
      className={`mb-4 rounded-lg px-4 py-3 text-sm ${
        expired
          ? "bg-red-50 text-red-700 border border-red-200"
          : "bg-amber-50 text-amber-800 border border-amber-200"
      }`}
    >
      {expired ? (
        <>
          Din testperiod har löpt ut.{" "}
          <a className="underline font-semibold" href="/subscription">
            Aktivera ditt konto
          </a>{" "}
          för att få full tillgång igen.
        </>
      ) : (
        <>
          Du har full tillgång under testperioden. Går ut {endDate}.{" "}
          <a className="underline font-semibold" href="/subscription">
            Uppgradera när du vill
          </a>
          .
        </>
      )}
    </div>
  );
}
