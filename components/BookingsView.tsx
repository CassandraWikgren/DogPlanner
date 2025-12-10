"use client";

// BookingsView - FOR HUNDPENSIONAT (BOARDING) ONLY
// Shows active and historical pensionat bookings with status tracking

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  Home,
} from "lucide-react";

interface Booking {
  id: string;
  org_id: string | null;
  owner_id: string | null;
  dog_id: string | null;
  start_date: string;
  end_date: string;
  status: string | null;
  total_price: number | null;
  owners?: {
    full_name: string | null;
  } | null;
  dogs?: {
    name: string | null;
  } | null;
}

export default function BookingsView() {
  const supabase = createClient();
  const { currentOrgId } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentOrgId) {
      fetchBookings();
    }
  }, [currentOrgId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("bookings")
        .select(
          `
          id,
          org_id,
          owner_id,
          dog_id,
          start_date,
          end_date,
          status,
          total_price,
          owners (full_name),
          dogs (name)
        `
        )
        .eq("org_id", currentOrgId!)
        .order("start_date", { ascending: false });

      if (fetchError) throw fetchError;

      setBookings(data || []);
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError(err.message || "Kunde inte hämta bokningar");
    } finally {
      setLoading(false);
    }
  };

  // Filtrera bokningar
  const activeBookings = bookings.filter(
    (b) =>
      ["pending", "confirmed", "checked_in", "checked_out"].includes(
        b.status || "confirmed"
      ) && new Date(b.end_date) > new Date()
  );

  const historicalBookings = bookings.filter(
    (b) =>
      (b.status && ["completed", "cancelled", "no-show"].includes(b.status)) ||
      (b.status === "confirmed" && new Date(b.end_date) <= new Date())
  );

  // Format datum
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Status-badge
  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Väntande
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Bekräftad
          </span>
        );
      case "checked_in":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            <Home className="h-3 w-3 mr-1" />
            Incheckad
          </span>
        );
      case "checked_out":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Utcheckad
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Avslutad
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="h-3 w-3 mr-1" />
            Avbokad
          </span>
        );
      case "no-show":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Utebliven
          </span>
        );
      default:
        return null;
    }
  };

  // Booking-rad
  const renderBookingRow = (booking: Booking) => (
    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-900">
        {booking.owners?.full_name || "—"}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {booking.dogs?.name || "—"}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {formatDate(booking.start_date)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {formatDate(booking.end_date)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {booking.total_price
          ? `${booking.total_price.toLocaleString("sv-SE")} kr`
          : "—"}
      </td>
      <td className="px-4 py-3 text-sm">{getStatusBadge(booking.status)}</td>
    </tr>
  );

  if (!currentOrgId) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <p className="text-gray-600">Ingen organisation tilldelad.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
        <Loader2 className="h-8 w-8 text-[#2c7a4c] animate-spin mx-auto" />
        <p className="text-gray-600 mt-4">Hämtar bokningar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-center text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs defaultValue="aktiva" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger value="aktiva">
            Aktiva bokningar ({activeBookings.length})
          </TabsTrigger>
          <TabsTrigger value="historik">
            Tidigare bokningar ({historicalBookings.length})
          </TabsTrigger>
        </TabsList>

        {/* AKTIVA BOKNINGAR */}
        <TabsContent value="aktiva" className="mt-6">
          {activeBookings.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Inga aktiva bokningar</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-[#2c7a4c] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Hundsägare
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Hund
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Startdatum
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Slutdatum
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Pris
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {activeBookings.map((booking) => renderBookingRow(booking))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* TIDIGARE BOKNINGAR */}
        <TabsContent value="historik" className="mt-6">
          {historicalBookings.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Inga tidigare bokningar</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-[#2c7a4c] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Hundsägare
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Hund
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Startdatum
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Slutdatum
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Pris
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historicalBookings.map((booking) =>
                    renderBookingRow(booking)
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
