"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Tag,
  Sparkles,
  Info,
} from "lucide-react";

interface BoardingPrice {
  id: string;
  dog_size: string;
  base_price: number;
  weekend_surcharge: number | null;
  is_active: boolean | null;
}

interface BoardingSeason {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  price_multiplier: number;
  is_active: boolean | null;
}

interface SpecialDate {
  id: string;
  date: string;
  name: string;
  category: string;
  price_surcharge: number;
  is_active: boolean | null;
}

interface ExtraService {
  id: string;
  label: string;
  price: number;
  unit: string;
  is_active: boolean | null;
}

type SizeCategory = "small" | "medium" | "large";

const SIZE_LABELS: Record<string, string> = {
  small: "Liten",
  medium: "Mellan",
  large: "Stor",
};

const SIZE_RANGES: Record<string, string> = {
  small: "< 35 cm",
  medium: "35-54 cm",
  large: "> 54 cm",
};

const CATEGORY_LABELS: Record<string, string> = {
  red_day: "Röd dag",
  holiday: "Högtid",
  event: "Event",
  custom: "Anpassad",
};

export default function PriserVisningPage() {
  const supabase = createClient();
  const { currentOrgId, loading: authLoading } = useAuth();
  const [prices, setPrices] = useState<BoardingPrice[]>([]);
  const [seasons, setSeasons] = useState<BoardingSeason[]>([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && currentOrgId) {
      loadData();
    } else if (!authLoading && !currentOrgId) {
      setLoading(false);
    }
  }, [authLoading, currentOrgId]);

  const loadData = async () => {
    if (!currentOrgId) return;

    try {
      const { data: pricesData } = await supabase
        .from("boarding_prices")
        .select("*")
        .eq("org_id", currentOrgId)
        .eq("is_active", true)
        .order("dog_size");

      const { data: seasonsData } = await supabase
        .from("boarding_seasons")
        .select("*")
        .eq("org_id", currentOrgId)
        .eq("is_active", true)
        .order("start_date");

      const today = new Date().toISOString().split("T")[0];
      const { data: specialDatesData } = await supabase
        .from("special_dates")
        .select("*")
        .eq("org_id", currentOrgId)
        .eq("is_active", true)
        .gte("date", today)
        .order("date")
        .limit(10);

      const { data: servicesData } = await supabase
        .from("extra_services")
        .select("*")
        .eq("org_id", currentOrgId)
        .eq("is_active", true)
        .order("label");

      setPrices(pricesData || []);
      setSeasons(seasonsData || []);
      setSpecialDates(specialDatesData || []);
      setExtraServices(servicesData || []);
    } catch (err) {
      console.error("Fel vid laddning av priser:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "short",
    });
  };

  const formatDateRange = (start: string, end: string) => {
    return formatDate(start) + " - " + formatDate(end);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c7a4c]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/hundpensionat"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka till Hundpensionat
          </Link>
          <h1 className="text-3xl font-bold text-[#2c7a4c]">Prislista</h1>
          <p className="text-gray-600 mt-1">
            Aktuella priser för hundpensionatet
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Grundpriser per natt
              </h2>
              <p className="text-sm text-gray-500">
                Pris baserat på hundens mankhöjd
              </p>
            </div>
          </div>

          {prices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Inga priser har lagts till ännu.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {prices.map((price) => (
                <div
                  key={price.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🐕</span>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {SIZE_LABELS[price.dog_size]}
                      </p>
                      <p className="text-xs text-gray-500">
                        {SIZE_RANGES[price.dog_size]}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vardagar:</span>
                      <span className="font-bold text-green-700">
                        {price.base_price} kr
                      </span>
                    </div>
                    {(price.weekend_surcharge ?? 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Helg:</span>
                        <span className="font-bold text-green-700">
                          {price.base_price + (price.weekend_surcharge ?? 0)} kr
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {seasons.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Säsonger
                </h2>
                <p className="text-sm text-gray-500">
                  Prisjusteringar under vissa perioder
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {seasons.map((season) => (
                <div
                  key={season.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{season.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatDateRange(season.start_date, season.end_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={
                        "inline-block px-3 py-1 rounded-full text-sm font-medium " +
                        (season.price_multiplier > 1
                          ? "bg-orange-100 text-orange-700"
                          : "bg-green-100 text-green-700")
                      }
                    >
                      {season.price_multiplier > 1 ? "+" : ""}
                      {Math.round((season.price_multiplier - 1) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {specialDates.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <Tag className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Kommande specialdatum
                </h2>
                <p className="text-sm text-gray-500">
                  Högtider och röda dagar med pristillägg
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {specialDates.map((sd) => (
                <div
                  key={sd.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 w-16">
                      {formatDate(sd.date)}
                    </span>
                    <span className="font-medium text-gray-900">{sd.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                      {CATEGORY_LABELS[sd.category]}
                    </span>
                  </div>
                  <span className="font-semibold text-orange-600">
                    +{sd.price_surcharge} kr
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {extraServices.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Tilläggstjänster
                </h2>
                <p className="text-sm text-gray-500">
                  Extra tjänster som kan bokas
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {extraServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{service.label}</p>
                    <p className="text-sm text-gray-500">{service.unit}</p>
                  </div>
                  <span className="font-bold text-green-700">
                    {service.price} kr
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Så beräknas priset</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Grundpris väljs baserat på hundens mankhöjd</li>
                <li>Helgtillägg läggs på för fredag, lördag och söndag</li>
                <li>
                  Säsongstillägg multiplicerar priset under vissa perioder
                </li>
                <li>Specialdatum har ett fast pristillägg</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
