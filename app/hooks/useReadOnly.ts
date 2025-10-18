"use client";
import { useAuth } from "@/app/context/AuthContext";

export function useReadOnly() {
  const { subscription } = useAuth();
  const readOnly =
    !!subscription?.expired || subscription?.status === "past_due";
  return { readOnly };
}
