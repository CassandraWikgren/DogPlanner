"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Registrering lyckades!
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Din användare har skapats framgångsrikt.
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900">
                Vad händer nu?
              </h2>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>✅ Ditt konto är nu aktiverat</p>
                <p>✅ Du har fått 3 månaders gratis provperiod</p>
                <p>✅ Du kan börja använda alla funktioner direkt</p>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Logga in nu
              </Link>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Har du frågor? Kontakta oss på{" "}
                <a href="mailto:support@dogplanner.se" className="text-emerald-600 hover:text-emerald-500">
                  support@dogplanner.se
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}