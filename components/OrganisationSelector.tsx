"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MapPin, Building2, ChevronDown } from "lucide-react";

interface Organisation {
  id: string;
  name: string;
  kommun: string;
  lan: string;
  service_types: string[];
  address?: string;
  phone?: string;
  email?: string;
}

interface OrganisationSelectorProps {
  serviceType: "hunddagis" | "hundpensionat" | "hundfrisor";
  selectedOrgId: string | null;
  onSelect: (orgId: string, orgName: string) => void;
  required?: boolean;
}

export default function OrganisationSelector({
  serviceType,
  selectedOrgId,
  onSelect,
  required = true,
}: OrganisationSelectorProps) {
  const supabase = createClient();
  const [lan, setLan] = useState<string>("");
  const [kommun, setKommun] = useState<string>("");
  const [availableLan, setAvailableLan] = useState<string[]>([]);
  const [availableKommuner, setAvailableKommuner] = useState<string[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hämta alla organisationer som erbjuder denna tjänst
  useEffect(() => {
    async function fetchOrganisations() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("orgs")
          .select("id, name, address, phone, email, lan, kommun, service_types")
          .eq("is_visible_to_customers", true)
          .eq("accepting_applications", true) // 🟢 Endast företag som tar emot nya ansökningar
          .eq("subscription_status", "active") // 🟢 Endast betalande kunder
          .contains("service_types", [serviceType])
          .order("name");

        if (fetchError) throw fetchError;

        const orgs = (data || []) as any as Organisation[];
        setOrganisations(orgs);

        // Extrahera unika län
        const uniqueLan = Array.from(
          new Set(orgs.map((org) => org.lan).filter(Boolean))
        ).sort();
        setAvailableLan(uniqueLan);

        // Om bara ett län finns, välj det automatiskt
        if (uniqueLan.length === 1) {
          setLan(uniqueLan[0]);
        }
      } catch (err) {
        console.error("Error fetching organisations:", err);
        setError("Kunde inte ladda organisationer. Försök igen senare.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrganisations();
  }, [supabase, serviceType]);

  // Uppdatera tillgängliga kommuner baserat på valt län
  useEffect(() => {
    if (lan) {
      const kommuner = Array.from(
        new Set(
          organisations
            .filter((org) => org.lan === lan)
            .map((org) => org.kommun)
            .filter(Boolean)
        )
      ).sort();
      setAvailableKommuner(kommuner);

      // Återställ kommun om den inte finns i det nya länet
      if (kommun && !kommuner.includes(kommun)) {
        setKommun("");
      }
    } else {
      setAvailableKommuner([]);
      setKommun("");
    }
  }, [lan, organisations, kommun]);

  // Filtrera organisationer baserat på län och kommun
  useEffect(() => {
    let filtered = organisations;

    if (lan) {
      filtered = filtered.filter((org) => org.lan === lan);
    }

    if (kommun) {
      filtered = filtered.filter((org) => org.kommun === kommun);
    }

    setFilteredOrgs(filtered);
  }, [lan, kommun, organisations]);

  const serviceTypeLabel = {
    hunddagis: "Hunddagis",
    hundpensionat: "Hundpensionat",
    hundfrisor: "Hundfrisör",
  };

  if (loading) {
    return (
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-blue-700">Laddar tillgängliga företag...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (organisations.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Det finns för närvarande inga anslutna{" "}
          {serviceTypeLabel[serviceType].toLowerCase()} i vårt system. Kom
          tillbaka snart!
        </p>
      </div>
    );
  }

  const selectedOrg = organisations.find((org) => org.id === selectedOrgId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b">
        <Building2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-gray-800">
          Välj {serviceTypeLabel[serviceType]}
        </h3>
      </div>

      {/* Län selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Län {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <select
            value={lan}
            onChange={(e) => setLan(e.target.value)}
            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none bg-white"
            required={required}
          >
            <option value="">Välj län...</option>
            {availableLan.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Kommun selector */}
      {lan && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kommun {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <select
              value={kommun}
              onChange={(e) => setKommun(e.target.value)}
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none bg-white"
              required={required}
            >
              <option value="">Välj kommun...</option>
              {availableKommuner.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Organisation selector */}
      {kommun && filteredOrgs.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Välj företag {required && <span className="text-red-500">*</span>}
          </label>
          <div className="space-y-2">
            {filteredOrgs.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => onSelect(org.id, org.name)}
                className={`w-full p-4 border rounded-lg text-left transition-all ${
                  selectedOrgId === org.id
                    ? "border-[#2c7a4c] bg-white shadow-sm ring-1 ring-[#2c7a4c]"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{org.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>
                        {org.kommun}, {org.lan}
                      </span>
                    </div>
                    {org.address && (
                      <p className="text-sm text-gray-500 mt-1">
                        {org.address}
                      </p>
                    )}
                    {org.phone && (
                      <p className="text-sm text-gray-500 mt-1">
                        📞 {org.phone}
                      </p>
                    )}
                  </div>
                  {selectedOrgId === org.id && (
                    <div className="ml-3 flex-shrink-0">
                      <div className="w-5 h-5 bg-[#2c7a4c] rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {kommun && filteredOrgs.length === 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            Tyvärr finns det inget {serviceTypeLabel[serviceType].toLowerCase()}{" "}
            i {kommun}. Försök välja en annan kommun.
          </p>
        </div>
      )}

      {/* Selected organisation display */}
      {selectedOrg && (
        <div className="mt-4 p-3 bg-[#f0f9f4] border border-[#c6e7d4] rounded-lg">
          <p className="text-sm text-[#2c7a4c]">
            ✓ Du har valt:{" "}
            <span className="font-medium">{selectedOrg.name}</span>
          </p>
        </div>
      )}
    </div>
  );
}
