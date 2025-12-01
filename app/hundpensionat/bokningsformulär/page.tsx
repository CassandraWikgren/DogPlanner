"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { calculatePrice } from "@/lib/pricing";
import { AlertTriangle } from "lucide-react";

// Enklare typer för denna komponent
interface SimpleDog {
  id: string;
  name: string;
  owner_id: string;
  heightcm: number | null;
  owners?: { full_name: string } | null;
}

interface SimpleRoom {
  id: string;
  name: string;
  capacity_m2: number | null;
}

interface SimpleExtraService {
  id: string;
  label: string;
  price: number;
  unit: string;
}

// Formulär för bokning/incheckning hundpensionat
export default function BokningsForm() {
  const supabase = createClient();

  const [hundar, setHundar] = useState<SimpleDog[]>([]);
  const [rum, setRum] = useState<SimpleRoom[]>([]);
  const [tillval, setTillval] = useState<SimpleExtraService[]>([]);
  const [selectedHund, setSelectedHund] = useState<SimpleDog | null>(null);
  const [selectedRum, setSelectedRum] = useState<SimpleRoom | null>(null);
  const [selectedTillval, setSelectedTillval] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pris, setPris] = useState<any>(null);
  const [rabatt, setRabatt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulerad org/branch data för nu
  const org = { id: "default-org-uuid", vat_included: true, vat_rate: 0.25 };
  const branch = { id: "default-branch-uuid" };

  // Hämta hundar, rum, tillval vid mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Hämta hundar med ägarinfo
        const { data: dogs } = await supabase
          .from("dogs")
          .select(
            `
            id,
            name,
            owner_id,
            heightcm,
            owners!dogs_owner_id_fkey(full_name)
          `
          )
          .eq("org_id", org.id);

        if (dogs) {
          setHundar(
            dogs.map((dog: any) => ({
              ...dog,
              owners: dog.owners,
            }))
          );
        }

        // Hämta rum för pensionat
        const { data: rooms } = await supabase
          .from("rooms")
          .select("id, name, capacity_m2")
          .eq("org_id", org.id);

        if (rooms) {
          setRum(rooms);
        }

        // Hämta tillgängliga extra tjänster för pensionat
        const { data: extras } = await supabase
          .from("extra_services")
          .select("id, label, price, unit")
          .eq("org_id", org.id)
          .eq("service_type", "boarding")
          .eq("is_active", true);

        if (extras) {
          setTillval(extras);
        }
      } catch (error) {
        console.error("BOOKING_FETCH_ERROR:", error);
        setError(
          `Fel vid hämtning av data (BOOKING_FETCH_ERROR): ${
            error instanceof Error ? error.message : "Okänt fel"
          }`
        );
      }
    }
    fetchData();
  }, [org, branch, supabase]);

  // Prisberäkning
  async function handleCalculatePrice() {
    if (!selectedHund || !startDate || !endDate || !selectedRum) return;
    setLoading(true);
    try {
      const booking = {
        id: "temp", // Tillfällig
        start_date: startDate,
        end_date: endDate,
      };
      const priceResult = await calculatePrice({
        supabase: supabase as any,
        dog: selectedHund,
        booking,
        org,
      });
      setPris(priceResult);
    } catch (err: any) {
      console.error("BOOKING_PRICE_ERROR:", err);
      setError(`Fel vid prisberäkning (BOOKING_PRICE_ERROR): ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Spara bokning
  async function handleSubmit() {
    if (!selectedHund || !startDate || !endDate || !selectedRum) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("bookings").insert({
        dog_id: selectedHund.id,
        owner_id: selectedHund.owner_id,
        org_id: org.id,
        branch_id: branch.id,
        room_id: selectedRum.id,
        start_date: startDate,
        end_date: endDate,
        extra_service_ids: selectedTillval,
        total_price: pris?.total_incl_vat || 0,
        discount_amount: rabatt,
        status: "pending",
      });
      if (error) throw error;
      setError(null); // Rensa tidigare fel
      console.log("BOOKING_SAVE_SUCCESS: Bokning sparad!");
    } catch (err: any) {
      console.error("BOOKING_SAVE_ERROR:", err);
      setError(`Fel vid sparande (BOOKING_SAVE_ERROR): ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>📝 Ny bokning</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <h2 className="text-lg font-semibold mb-4">
          Ny bokning – Hundpensionat
        </h2>

        {/* Felmeddelande */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium text-sm">Systemfel</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Välj hund */}
          <div>
            <label className="block text-sm font-medium mb-1">Välj hund</label>
            <select
              value={selectedHund?.id || ""}
              onChange={(e) => {
                const hund = hundar.find((h) => h.id === e.target.value);
                setSelectedHund(hund || null);
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Välj hund --</option>
              {hundar.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.owners?.full_name || "Okänd ägare"})
                </option>
              ))}
            </select>
          </div>

          {/* Välj rum */}
          <div>
            <label className="block text-sm font-medium mb-1">Välj rum</label>
            <select
              value={selectedRum?.id || ""}
              onChange={(e) => {
                const rumObj = rum.find((r) => r.id === e.target.value);
                setSelectedRum(rumObj || null);
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Välj rum --</option>
              {rum.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.capacity_m2} m²)
                </option>
              ))}
            </select>
          </div>

          {/* Datum */}
          <div>
            <label className="block text-sm font-medium mb-1">Från datum</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Till datum</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Tillvalstjänster */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Välj tillvalstjänster:
            </label>
            <div className="flex flex-wrap gap-2">
              {tillval.map((t) => (
                <label key={t.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTillval.includes(t.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTillval([...selectedTillval, t.id]);
                      } else {
                        setSelectedTillval(
                          selectedTillval.filter((id) => id !== t.id)
                        );
                      }
                    }}
                  />
                  <span className="text-sm">
                    {t.label} ({t.price} kr/{t.unit})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Rabatt */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Rabatt (kr)
            </label>
            <Input
              type="number"
              value={rabatt}
              onChange={(e) => setRabatt(Number(e.target.value))}
              min={0}
            />
          </div>

          {/* Beräkna pris */}
          <Button
            variant="outline"
            onClick={handleCalculatePrice}
            disabled={
              loading || !selectedHund || !startDate || !endDate || !selectedRum
            }
          >
            {loading ? "Beräknar..." : "Beräkna pris"}
          </Button>

          {/* Prisvisning */}
          {pris && (
            <div className="bg-blue-50 rounded p-3 mt-2">
              <h3 className="font-semibold mb-2">Prisberäkning</h3>
              <ul className="text-sm space-y-1">
                {pris.breakdown?.map((b: any, idx: number) => (
                  <li key={idx} className="flex justify-between">
                    <span>{b.label}:</span>
                    <span className="font-bold">{b.amount} kr</span>
                  </li>
                ))}
                <li className="mt-2 pt-2 border-t flex justify-between font-bold text-blue-700">
                  <span>Totalt inkl. moms:</span>
                  <span>{pris.total_incl_vat} kr</span>
                </li>
              </ul>
            </div>
          )}

          {/* Spara bokning */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !pris}
            className="w-full"
          >
            {loading ? "Sparar..." : "Spara bokning"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
