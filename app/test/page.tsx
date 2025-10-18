"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Database,
  Upload,
  Search,
  CheckCircle2,
  FileText,
  Server,
  ArrowRight,
  Play,
} from "lucide-react";

/**
 * STEG 1: DATABAS & INNEHÅLL - ÖVERSIKT
 * Central hub för all databashantering och testdata
 */
export default function DatabaseOverviewPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-green-700 mb-3">
          🗃️ STEG 1: Databas & Innehåll
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Komplett databasuppsättning för fungerande hundpensionat-system
        </p>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <p className="text-blue-800">
            <strong>Mål:</strong> Verifiera att databasen är korrekt uppsatt och
            ladda testdata för alla moduler
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Databasverifiering */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Verifiera databas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Testa databasanslutning och kontrollera att alla tabeller fungerar
              korrekt
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-xs text-gray-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Organisationer & Ägare
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Hundar & Rum
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Bokningar & Realtime
              </div>
            </div>
            <Link href="/test/database">
              <Button className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Kör verifiering
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Ladda testdata */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-600" />
              Ladda testdata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Ladda komplett testdata direkt från applikationen
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-xs text-gray-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />3 ägare + 3 hundar
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />3 rum + 2 bokningar
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Ansökningar + Priser
              </div>
            </div>
            <Link href="/test/load-data">
              <Button className="w-full" variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Ladda data
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* SQL-skript */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              SQL-skript
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Färdiga SQL-skript för manuell körning i Supabase
            </p>
            <div className="space-y-2 mb-4 text-xs">
              <div className="flex items-center text-gray-500">
                <FileText className="h-3 w-3 mr-1" />
                verify-database.sql
              </div>
              <div className="flex items-center text-gray-500">
                <FileText className="h-3 w-3 mr-1" />
                complete-testdata.sql
              </div>
              <div className="flex items-center text-gray-500">
                <FileText className="h-3 w-3 mr-1" />
                setup-testdata.sql
              </div>
            </div>
            <Button className="w-full" variant="outline" disabled>
              <FileText className="mr-2 h-4 w-4" />
              Finns i workspace
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instruktioner */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Genomförande STEG 1
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 text-green-700">
                🎯 Via applikation (Rekommenderat)
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Klicka på <strong>"Verifiera databas"</strong> ovan
                </li>
                <li>Kör databasverifiering för att se status</li>
                <li>
                  Klicka på <strong>"Ladda testdata"</strong> ovan
                </li>
                <li>Ladda all testdata med en knapptryckning</li>
                <li>Verifiera att allt laddades korrekt</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-blue-700">
                ⚙️ Via Supabase Dashboard
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Öppna Supabase Dashboard</li>
                <li>Gå till SQL Editor</li>
                <li>
                  Kör <code>verify-database.sql</code>
                </li>
                <li>
                  Kör <code>complete-testdata.sql</code>
                </li>
                <li>Kontrollera att data laddades i Table Editor</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status & Nästa steg */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">
              ✅ När STEG 1 är klart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Databasverifiering visar grönt</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>All testdata är laddad</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Alla moduler kan visa data</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Realtime-funktioner fungerar</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">
              🚀 STEG 2: Komplettera sidor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 mb-4">
              När databas är klar fortsätter vi med:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3 text-blue-600" />
                <span>Ekonomi & Fakturering</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3 text-blue-600" />
                <span>Admin & Priser</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3 text-blue-600" />
                <span>Frisor & Trimning</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-3 w-3 text-blue-600" />
                <span>Komplett funktionalitet</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Snabbstart */}
      <Card className="mt-8 border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Play className="h-8 w-8 text-yellow-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 mb-1">
                🏃‍♂️ Snabbstart
              </h3>
              <p className="text-sm text-yellow-700">
                För att komma igång snabbt: Kör först{" "}
                <strong>databasverifiering</strong>, sedan{" "}
                <strong>ladda testdata</strong>, och testa därefter att besöka
                hunddagis- och pensionatsidorna för att se att data visas
                korrekt.
              </p>
            </div>
            <div className="space-y-2">
              <Link href="/test/database">
                <Button size="sm" className="w-24">
                  <Search className="mr-1 h-3 w-3" />
                  Test
                </Button>
              </Link>
              <Link href="/test/load-data">
                <Button size="sm" variant="outline" className="w-24">
                  <Upload className="mr-1 h-3 w-3" />
                  Ladda
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
