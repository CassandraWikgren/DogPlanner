"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

export type ServiceType = "daycare" | "boarding" | "grooming";

interface EnabledServicesReturn {
  services: ServiceType[];
  hasGrooming: boolean;
  hasDaycare: boolean;
  hasBoarding: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook för att kontrollera vilka tjänster organisationen har aktiverade
 * Används för att dölja/visa moduler baserat på vad företaget erbjuder
 * @returns Object med flags för varje tjänst + array med alla tjänster
 */
export function useEnabledServices(): EnabledServicesReturn {
  const { currentOrgId, loading: authLoading, isCustomer } = useAuth();

  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadServices = async () => {
    // Wait for auth to finish loading before deciding
    if (authLoading) {
      return; // Keep loading=true until auth is ready
    }

    // If user is a customer (no org_id), they don't need services
    if (isCustomer) {
      setServices([]);
      setLoading(false);
      return;
    }

    // For staff: wait for currentOrgId to be set
    // AuthContext sets currentOrgId BEFORE setting authLoading=false
    // So if authLoading=false and no currentOrgId, something is wrong
    if (!currentOrgId) {
      // Keep loading for a short time in case of race condition
      // This handles the edge case where useEffect runs before state updates
      console.warn("useEnabledServices: authLoading=false but no currentOrgId");
      setServices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orgs")
        .select("enabled_services")
        .eq("id", currentOrgId)
        .single();

      if (error) {
        console.error("❌ Fel vid hämtning av enabled_services:", error);
        // Fallback: alla tjänster om något går fel (säkerhet)
        setServices(["daycare", "boarding", "grooming"]);
      } else {
        const enabledServices = (data?.enabled_services as ServiceType[]) || [];
        // Om arrayen är tom, sätt default till alla tjänster (säkerhet)
        setServices(
          enabledServices.length > 0
            ? enabledServices
            : ["daycare", "boarding", "grooming"]
        );
      }
    } catch (err) {
      console.error("❌ Exception i useEnabledServices:", err);
      // Fallback: alla tjänster om något går fel
      setServices(["daycare", "boarding", "grooming"]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [currentOrgId, authLoading, isCustomer]);

  return {
    services,
    hasGrooming: services.includes("grooming"),
    hasDaycare: services.includes("daycare"),
    hasBoarding: services.includes("boarding"),
    loading,
    refresh: loadServices,
  };
}
