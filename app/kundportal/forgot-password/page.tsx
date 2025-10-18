"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PawPrint, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email) {
        throw new Error("E-postadress krävs");
      }

      // Här skulle vi anropa reset password API:et
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSent(true);
    } catch (err: any) {
      setError(err.message || "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">E-post skickad!</h2>
                <p className="text-gray-600 mb-6">
                  Vi har skickat instruktioner för att återställa ditt lösenord
                  till <strong>{email}</strong>.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Kontrollera din inkorg och spam-mapp. Länken är giltig i 1
                  timme.
                </p>
                <Link href="/kundportal/login">
                  <Button className="w-full bg-[#2c7a4c] hover:bg-[#245a3e]">
                    Tillbaka till inloggning
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/kundportal/login">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka till inloggning
            </Button>
          </Link>

          <div className="flex items-center justify-center mb-4">
            <PawPrint className="h-8 w-8 text-[#2c7a4c] mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">
              Glömt lösenord?
            </h1>
          </div>

          <p className="text-gray-600">
            Ange din e-postadress så skickar vi dig instruktioner för att
            återställa ditt lösenord.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Återställ lösenord</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Mail className="inline h-4 w-4 mr-1" />
                  E-postadress
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                  placeholder="din@epost.se"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Vi skickar aldrig spam och delar inte din e-postadress.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2c7a4c] hover:bg-[#245a3e]"
              >
                {loading ? "Skickar..." : "Skicka återställningslänk"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/kundportal/login"
                className="text-[#2c7a4c] hover:underline text-sm"
              >
                Kommer du ihåg ditt lösenord? Logga in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Hjälp */}
        <Card className="mt-4 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-blue-800 mb-2">
              Behöver du hjälp?
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Om du inte får något e-postmeddelande inom några minuter:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Kontrollera din spam-mapp</li>
              <li>• Försök med en annan e-postadress</li>
              <li>• Kontakta oss på support@dogplanner.se</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
