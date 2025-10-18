"use client";

import { useCallback } from "react";

/**
 * Visar ett stilrent toast-meddelande i hörnet.
 * Används överallt i projektet via: toast("Sparat!") eller toast("Fel inträffade", "error").
 */

export function toast(
  message: string,
  type: "success" | "error" | "info" = "success"
) {
  if (typeof window === "undefined") return;

  const toast = document.createElement("div");
  toast.textContent = message;

  // --- Färg och layout beroende på typ ---
  const background =
    type === "error"
      ? "linear-gradient(135deg, #ef4444, #dc2626)" // röd
      : type === "info"
      ? "linear-gradient(135deg, #3b82f6, #2563eb)" // blå
      : "linear-gradient(135deg, #22c55e, #16a34a)"; // grön (success)

  // --- Stil ---
  Object.assign(toast.style, {
    position: "fixed",
    right: "24px",
    bottom: "24px",
    padding: "12px 18px",
    borderRadius: "10px",
    background,
    color: "white",
    fontSize: "15px",
    fontWeight: "500",
    fontFamily: "Inter, system-ui, sans-serif",
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
    opacity: "0",
    transform: "translateY(20px)",
    transition: "opacity 0.3s ease, transform 0.3s ease",
    zIndex: "9999",
    pointerEvents: "none",
  });

  document.body.appendChild(toast);

  // --- Fade in ---
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  // --- Fade out och ta bort ---
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * Hook-version: useToast()
 */
export function useToast() {
  return useCallback(
    (message: string, type: "success" | "error" | "info" = "success") =>
      toast(message, type),
    []
  );
}
