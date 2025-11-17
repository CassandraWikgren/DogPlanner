"use client";

import React, { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import { PawPrint, User, Phone, AlertCircle, Home } from "lucide-react";
import Link from "next/link";

type CheckedInDog = {
  id: string;
  name: string;
  breed: string | null;
  room_id: string | null;
  special_needs: string | null;
  behavior_notes: string | null;
  rooms: {
    name: string;
  } | null;
  owners: {
    full_name: string;
    phone: string;
  } | null;
};

export default function DagensHundarWidget() {
  const { currentOrgId } = useAuth();
  const [dogs, setDogs] = useState<CheckedInDog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (currentOrgId) {
      loadCheckedInDogs();
    }
  }, [currentOrgId]);

  const loadCheckedInDogs = async () => {
    try {
      const { data, error } = await supabase
        .from("dogs")
        .select(
          `
          id,
          name,
          breed,
          room_id,
          special_needs,
          behavior_notes,
          rooms(name),
          owners(full_name, phone)
        `
        )
        .eq("org_id", currentOrgId)
        .eq("checked_in", true)
        .order("name");

      if (error) throw error;
      setDogs(data || []);
    } catch (error) {
      console.error("Fel vid hämtning av incheckade hundar:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentOrgId) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <PawPrint className="h-5 w-5 text-[#2c7a4c]" />
          Dagens hundar
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <PawPrint className="h-5 w-5 text-[#2c7a4c]" />
          Dagens hundar
        </h2>
        <span className="px-3 py-1 bg-[#2c7a4c]/10 text-[#2c7a4c] rounded-full text-sm font-semibold">
          {dogs.length} {dogs.length === 1 ? "hund" : "hundar"}
        </span>
      </div>

      {dogs.length === 0 ? (
        <div className="text-center py-8">
          <PawPrint className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Inga hundar incheckade idag</p>
          <Link
            href="/hundpensionat"
            className="inline-block mt-3 text-[#2c7a4c] hover:underline text-sm font-medium"
          >
            Visa alla bokningar →
          </Link>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {dogs.map((dog) => (
            <div
              key={dog.id}
              className="p-3 border border-gray-200 rounded-lg hover:border-[#2c7a4c] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Hundnamn och ras */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {dog.name}
                    </h3>
                    {dog.breed && (
                      <span className="text-xs text-gray-500 truncate">
                        ({dog.breed})
                      </span>
                    )}
                  </div>

                  {/* Rum */}
                  {dog.rooms && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                      <Home className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{dog.rooms.name}</span>
                    </div>
                  )}

                  {/* Ägare och telefon */}
                  {dog.owners && (
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <User className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{dog.owners.full_name}</span>
                      </div>
                      {dog.owners.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          <a
                            href={`tel:${dog.owners.phone}`}
                            className="hover:text-[#2c7a4c] truncate"
                          >
                            {dog.owners.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Special notes */}
                  {(dog.special_needs || dog.behavior_notes) && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded p-2">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {dog.special_needs || dog.behavior_notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {dogs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link
            href="/hundpensionat"
            className="block text-center text-[#2c7a4c] hover:underline text-sm font-medium"
          >
            Visa alla bokningar →
          </Link>
        </div>
      )}
    </div>
  );
}
