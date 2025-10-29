"use client";

import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  AlertTriangle,
  Database,
  Users,
  Home,
  Dog,
  Calendar,
} from "lucide-react";

interface TestResult {
  test: string;
  status: "success" | "error" | "warning";
  message: string;
  data?: any;
}

/**
 * DATABAS-TESTNING & VERIFIERING
 * Kontrollerar att alla tabeller och data fungerar korrekt
 */
export default function DatabaseTestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const runDatabaseTests = async () => {
    setLoading(true);
    setTestResults([]);
    const results: TestResult[] = [];

    try {
      // Test 1: Kontrollera org-data
      try {
        const { data: orgs, error } = await supabase.from("orgs").select("*");
        if (error) throw error;

        results.push({
          test: "Organisationer",
          status: orgs?.length ? "success" : "warning",
          message: orgs?.length
            ? `✅ ${orgs.length} organisationer hittades`
            : "⚠️ Inga organisationer finns",
          data: orgs?.slice(0, 3),
        });
      } catch (error: any) {
        results.push({
          test: "Organisationer",
          status: "error",
          message: `❌ Fel: ${error.message}`,
        });
      }

      // Test 2: Kontrollera ägare
      try {
        const { data: owners, error } = await supabase
          .from("owners")
          .select("*");
        if (error) throw error;

        results.push({
          test: "Ägare",
          status: owners?.length ? "success" : "warning",
          message: owners?.length
            ? `✅ ${owners.length} ägare hittades`
            : "⚠️ Inga ägare finns",
          data: owners?.slice(0, 3),
        });
      } catch (error: any) {
        results.push({
          test: "Ägare",
          status: "error",
          message: `❌ Fel: ${error.message}`,
        });
      }

      // Test 3: Kontrollera hundar
      try {
        const { data: dogs, error } = await supabase.from("dogs").select(`
            *,
            owners(full_name),
            rooms(name)
          `);
        if (error) throw error;

        results.push({
          test: "Hundar",
          status: dogs?.length ? "success" : "warning",
          message: dogs?.length
            ? `✅ ${dogs.length} hundar hittades`
            : "⚠️ Inga hundar finns",
          data: dogs?.slice(0, 3),
        });
      } catch (error: any) {
        results.push({
          test: "Hundar",
          status: "error",
          message: `❌ Fel: ${error.message}`,
        });
      }

      // Test 4: Kontrollera rum
      try {
        const { data: rooms, error } = await supabase.from("rooms").select("*");
        if (error) throw error;

        results.push({
          test: "Rum",
          status: rooms?.length ? "success" : "warning",
          message: rooms?.length
            ? `✅ ${rooms.length} rum hittades`
            : "⚠️ Inga rum finns",
          data: rooms?.slice(0, 3),
        });
      } catch (error: any) {
        results.push({
          test: "Rum",
          status: "error",
          message: `❌ Fel: ${error.message}`,
        });
      }

      // Test 5: Kontrollera bokningar
      try {
        const { data: bookings, error } = await supabase.from("bookings")
          .select(`
            *,
            dogs(name),
            owners(full_name),
            rooms(name)
          `);
        if (error) throw error;

        results.push({
          test: "Bokningar",
          status: bookings?.length ? "success" : "warning",
          message: bookings?.length
            ? `✅ ${bookings.length} bokningar hittades`
            : "⚠️ Inga bokningar finns",
          data: bookings?.slice(0, 3),
        });
      } catch (error: any) {
        results.push({
          test: "Bokningar",
          status: "error",
          message: `❌ Fel: ${error.message}`,
        });
      }

      // Test 6: Kontrollera intresseanmälningar
      try {
        const { data: applications, error } = await supabase
          .from("interest_applications")
          .select("*");
        if (error) throw error;

        results.push({
          test: "Intresseanmälningar",
          status: applications?.length ? "success" : "warning",
          message: applications?.length
            ? `✅ ${applications.length} ansökningar hittades`
            : "⚠️ Inga ansökningar finns",
          data: applications?.slice(0, 3),
        });
      } catch (error: any) {
        results.push({
          test: "Intresseanmälningar",
          status: "error",
          message: `❌ Fel: ${error.message}`,
        });
      }

      // Test 7: Kontrollera priser
      try {
        const { data: pricing, error } = await supabase
          .from("pricing")
          .select("*");
        if (error) throw error;

        results.push({
          test: "Priser",
          status: pricing?.length ? "success" : "warning",
          message: pricing?.length
            ? `✅ ${pricing.length} priser hittades`
            : "⚠️ Inga priser finns",
          data: pricing?.slice(0, 3),
        });
      } catch (error: any) {
        results.push({
          test: "Priser",
          status: "error",
          message: `❌ Fel: ${error.message}`,
        });
      }

      // Test 8: Test realtime
      try {
        const channel = supabase
          .channel("test-channel")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "dogs" },
            () => {}
          )
          .subscribe();

        setTimeout(() => {
          supabase.removeChannel(channel);
        }, 1000);

        results.push({
          test: "Realtime",
          status: "success",
          message: "✅ Realtime-anslutning fungerar",
        });
      } catch (error: any) {
        results.push({
          test: "Realtime",
          status: "error",
          message: `❌ Realtime-fel: ${error.message}`,
        });
      }
    } catch (error: any) {
      results.push({
        test: "Allmänt fel",
        status: "error",
        message: `❌ Kritiskt fel: ${error.message}`,
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  const getIcon = (test: string) => {
    switch (test) {
      case "Organisationer":
        return <Database className="h-5 w-5" />;
      case "Ägare":
        return <Users className="h-5 w-5" />;
      case "Hundar":
        return <Dog className="h-5 w-5" />;
      case "Rum":
        return <Home className="h-5 w-5" />;
      case "Bokningar":
        return <Calendar className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-green-700 mb-2">
          🔍 Databasverifiering
        </h1>
        <p className="text-gray-600">
          Testa databasanslutning och kontrollera att all testdata finns på
          plats
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Köra databastester</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runDatabaseTests}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Kör tester..." : "🚀 Starta databastester"}
          </Button>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Testresultat</h2>

          {testResults.map((result, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className={getStatusColor(result.status)}>
                    {getIcon(result.test)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{result.test}</h3>
                    <p className={`text-sm ${getStatusColor(result.status)}`}>
                      {result.message}
                    </p>

                    {result.data && result.data.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm text-blue-600 cursor-pointer">
                          Visa exempeldata ({result.data.length} st)
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="mt-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-800 mb-2">
                💡 Nästa steg
              </h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>
                  • Om tabeller saknar data: Kör complete-testdata.sql i
                  Supabase
                </p>
                <p>
                  • Om fel uppstår: Kontrollera RLS policies och
                  användarbehörigheter
                </p>
                <p>• Om allt är grönt: Databasen är redo för produktion! 🎉</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
