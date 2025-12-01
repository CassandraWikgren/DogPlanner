"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Lock, CheckCircle, AlertCircle } from "lucide-react";

interface CreateAccountOfferProps {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  dogName: string;
  dogBreed: string;
  dogBirth: string;
  dogGender: string;
  dogHeightCm: string;
}

export default function CreateAccountOffer({
  ownerName,
  ownerEmail,
  ownerPhone,
  dogName,
  dogBreed,
  dogBirth,
  dogGender,
  dogHeightCm,
}: CreateAccountOfferProps) {
  const { currentOrgId } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Lösenordet måste vara minst 6 tecken");
      return;
    }

    if (password !== confirmPassword) {
      setError("Lösenorden matchar inte");
      return;
    }

    setCreating(true);

    try {
      const supabase = createClient();

      // Dela upp namn i för- och efternamn
      const nameParts = ownerName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Skapa Supabase Auth användare
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: ownerEmail,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/kundportal/login?verified=true`,
          data: {
            full_name: ownerName,
            phone: ownerPhone,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Kunde inte skapa användare");
      }

      // Skapa ägare i owners-tabellen
      const { data: ownerData, error: ownerError } = await supabase
        .from("owners")
        .insert([
          {
            id: authData.user.id,
            org_id: currentOrgId, // Använd currentOrgId från context
            full_name: ownerName,
            email: ownerEmail,
            phone: ownerPhone,
            created_at: new Date().toISOString(),
          } as any,
        ])
        .select()
        .single();

      if (ownerError) {
        console.error("Owner creation error:", ownerError);
        throw new Error("Kunde inte skapa ägaruppgifter");
      }

      // Skapa hund i dogs-tabellen
      const { error: dogError } = await supabase.from("dogs").insert([
        {
          org_id: currentOrgId, // Använd currentOrgId från context
          owner_id: authData.user.id,
          name: dogName,
          breed: dogBreed,
          birth: dogBirth,
          heightcm: parseInt(dogHeightCm) || null,
          created_at: new Date().toISOString(),
        } as any,
      ]);

      if (dogError) {
        console.error("Dog creation error:", dogError);
        // Fortsätt ändå - användaren kan lägga till hund senare
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Account creation error:", err);
      setError(err.message || "Ett oväntat fel inträffade");
    } finally {
      setCreating(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-bold text-green-900 mb-2">
              Kontot har skapats!
            </h3>
            <p className="text-sm text-green-800 mb-4">
              Kolla din e-post för att verifiera ditt konto. Du kan nu logga in
              och boka snabbare nästa gång!
            </p>
            <Button
              onClick={() => (window.location.href = "/kundportal/login")}
              className="bg-green-600 hover:bg-green-700"
            >
              Gå till inloggning
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!showPasswordForm) {
    return (
      <Card className="border-[#2c7a4c] bg-gradient-to-br from-green-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#2c7a4c]/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-[#2c7a4c]" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-2">
                Vill du spara dina uppgifter?
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                Skapa ett gratis konto och få:
              </p>
              <ul className="text-sm text-gray-700 space-y-1 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#2c7a4c]" />
                  Boka snabbare nästa gång
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#2c7a4c]" />
                  Se alla dina bokningar
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#2c7a4c]" />
                  Uppdatera hunduppgifter enkelt
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[#2c7a4c]" />
                  Få ett unikt kundnummer som gäller överallt
                </li>
              </ul>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowPasswordForm(true)}
                  className="bg-[#2c7a4c] hover:bg-[#245a3e]"
                >
                  Ja, skapa konto!
                </Button>
                <Button variant="outline" onClick={() => {}}>
                  Nej tack
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#2c7a4c]">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-[#2c7a4c]/10 rounded-lg">
            <Lock className="h-6 w-6 text-[#2c7a4c]" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Välj ett lösenord</h3>
            <p className="text-sm text-gray-600">
              Vi skapar ditt konto med uppgifterna du redan fyllt i
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Lösenord (minst 6 tecken)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
              placeholder="Välj ett säkert lösenord"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Bekräfta lösenord
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
              placeholder="Skriv lösenordet igen"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={creating}
              className="flex-1 bg-[#2c7a4c] hover:bg-[#245a3e]"
            >
              {creating ? "Skapar konto..." : "Skapa konto"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPasswordForm(false)}
            >
              Avbryt
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
