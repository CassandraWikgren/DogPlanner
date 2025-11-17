"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import {
  ArrowLeft,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Calendar,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Inserts } from "@/types/database";
import { useAuth } from "@/app/context/AuthContext";

interface SubscriptionData {
  id: string;
  org_id: string;
  plan: string;
  status: string;
  trial_starts_at?: string;
  trial_ends_at?: string;
  created_at: string;
}

/**
 * Admin Abonnemang - Hantera DogPlanner-prenumeration
 * [ERR-1001] Databaskoppling, [ERR-4001] Uppdatering, [ERR-5001] Okänt fel
 */
export default function AdminAbonnemangPage() {
  const { currentOrgId } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  // Skapa ny prenumeration
  const createSubscription = async () => {
    if (!currentOrgId) return;
    setCreating(true);
    setError(null);
    try {
      const { data, error } = await (supabase as any)
        .from("subscriptions")
        .insert([
          {
            org_id: currentOrgId,
            plan: "standard", // eller välj plan dynamiskt
            status: "active",
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error || !data || data.length === 0) {
        throw new Error(
          `[ERR-4001] Skapa prenumeration: ${error?.message || "No data returned"}`
        );
      }
      await loadSubscription();
      alert("Prenumerationen har skapats!");
    } catch (err: any) {
      console.error("Error creating subscription:", err);
      setError(
        err.message || "[ERR-5001] Okänt fel vid skapande av prenumeration"
      );
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (currentOrgId) {
      loadSubscription();
    } else {
      setLoading(false);
    }
  }, [currentOrgId]);

  const loadSubscription = async () => {
    if (!currentOrgId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("org_id", currentOrgId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new Error(`[ERR-1001] Databaskoppling: ${error.message}`);
      }

      setSubscription(data);
    } catch (err: any) {
      console.error("Error loading subscription:", err);
      setError(
        err.message || "[ERR-5001] Okänt fel vid laddning av prenumeration"
      );
    } finally {
      setLoading(false);
    }
  };

  const pauseSubscription = async () => {
    if (!subscription) return;

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("subscriptions")
        .update({ status: "paused" })
        .eq("id", subscription.id);

      if (error) {
        throw new Error(`[ERR-4001] Uppdatering: ${error.message}`);
      }

      await loadSubscription();
      alert("Prenumerationen har pausats");
    } catch (err: any) {
      console.error("Error pausing subscription:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid pausning");
    } finally {
      setSaving(false);
    }
  };

  const resumeSubscription = async () => {
    if (!subscription) return;

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("subscriptions")
        .update({ status: "active" })
        .eq("id", subscription.id);

      if (error) {
        throw new Error(`[ERR-4001] Uppdatering: ${error.message}`);
      }

      await loadSubscription();
      alert("Prenumerationen har återaktiverats");
    } catch (err: any) {
      console.error("Error resuming subscription:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid återaktivering");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-700 bg-green-100";
      case "trialing":
        return "text-blue-700 bg-blue-100";
      case "paused":
        return "text-yellow-700 bg-yellow-100";
      case "canceled":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktiv";
      case "trialing":
        return "Gratis period";
      case "paused":
        return "Pausad";
      case "canceled":
        return "Avslutad";
      default:
        return "Okänd";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p>Laddar prenumerationsinfo...</p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer maxWidth="4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/admin" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              📋 Mitt abonnemang
            </h1>
            <p className="text-gray-600 mt-1">
              Hantera din DogPlanner-prenumeration
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="h-6 w-6 text-purple-600" />
            <span>Prenumerationsstatus</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Plan
                  </label>
                  <p className="text-lg font-semibold capitalize">
                    {subscription.plan}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Status
                  </label>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      subscription.status
                    )}`}
                  >
                    {getStatusText(subscription.status)}
                  </span>
                </div>

                {subscription.trial_ends_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Gratis period slutar
                    </label>
                    <p className="text-lg">
                      {new Date(subscription.trial_ends_at).toLocaleDateString(
                        "sv-SE"
                      )}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Prenumeration startad
                  </label>
                  <p className="text-lg">
                    {new Date(subscription.created_at).toLocaleDateString(
                      "sv-SE"
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                {subscription.status === "active" ||
                subscription.status === "trialing" ? (
                  <Button
                    onClick={pauseSubscription}
                    disabled={saving}
                    variant="outline"
                    className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                  >
                    {saving ? "Pausar..." : "Pausa prenumeration"}
                  </Button>
                ) : subscription.status === "paused" ? (
                  <Button
                    onClick={resumeSubscription}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {saving ? "Återaktiverar..." : "Återaktivera prenumeration"}
                  </Button>
                ) : null}

                <Button
                  variant="outline"
                  className="border-red-500 text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (
                      confirm(
                        "Är du säker på att du vill avsluta prenumerationen? Detta kan inte ångras."
                      )
                    ) {
                      // Implementera avsluta-funktionalitet
                      alert("Kontakta support för att avsluta prenumerationen");
                    }
                  }}
                >
                  Avsluta prenumeration
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600">
                Ingen aktiv prenumeration hittades
              </p>
              <Button
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={createSubscription}
                disabled={creating}
              >
                {creating ? "Skapar..." : "Skapa ny prenumeration"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-6 w-6 text-blue-600" />
            <span>Faktureringsinformation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-700 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Information</span>
              </div>
              <p className="text-blue-600 text-sm">
                Faktureringsinformation och betalningsmetoder hanteras via vår
                betalningspartner. Kontakta support om du behöver ändra
                betalningsuppgifter.
              </p>
            </div>

            <Button variant="outline">Kontakta support</Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
