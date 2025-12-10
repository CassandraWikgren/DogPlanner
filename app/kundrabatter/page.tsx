"use client";

// ⚠️ VARNING: Tabellen 'customer_discounts' finns INTE i databasen!
// Denna sida kommer inte att fungera förrän tabellen skapas.
// Se types/database.ts för tillgängliga tabeller.

// Förhindra prerendering för att undvika build-fel
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Percent, User, Calendar, Trash2, Edit, Plus } from "lucide-react";

interface Owner {
  id: string;
  full_name: string | null; // ✅ Fixed: kan vara null från DB
  phone?: string | null;
  email?: string | null;
}

interface CustomerDiscount {
  id: string;
  owner_id: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  description: string;
  is_permanent: boolean;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active: boolean;
  created_at: string;
  owners?: Owner;
}

export default function CustomerDiscountsPage() {
  // ⚠️ CRITICAL: Tabellen 'customer_discounts' finns INTE i databasen!
  // Returnera placeholder tills tabellen skapas
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Percent className="h-8 w-8 text-orange-500" />
            Kundrabatter - Ej tillgänglig
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
            <h3 className="font-bold text-yellow-900 mb-2 text-lg">
              ⚠️ Funktionen är inte aktiverad
            </h3>
            <p className="text-yellow-800 mb-4">
              Tabellen <code className="bg-yellow-100 px-2 py-1 rounded">customer_discounts</code> finns inte i databasen.
            </p>
            <p className="text-yellow-800 mb-4">
              För att aktivera kundrabatter behöver följande migration köras i Supabase:
            </p>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`CREATE TABLE customer_discounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES owners(id) ON DELETE CASCADE,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL,
  description TEXT,
  is_permanent BOOLEAN DEFAULT false,
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`}
            </pre>
          </div>
          <p className="text-sm text-gray-600">
            Kontakta systemadministratör för att aktivera denna funktion.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
