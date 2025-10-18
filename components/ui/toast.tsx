"use client";

import { useCallback } from "react";

/**
 * Visar ett stilrent toast-meddelande i hörnet.
 * Stödjer både:
 *  toast("Sparat!", "success")
 *  toast({ title: "Fel", description: "Serverfel", variant: "destructive" })
 */

export function toast(
  message:
    | string
    | {
        title?: string;
        description?: string;
        variant?: "success" | "error" | "info" | "destructive";
      },
  type: "success" | "error" | "info" = "success"
) {
  if (typeof window === "undefined") return;

  // Hantera objektformat (fakturasidan)
  let text = "";
  let variant: "success" | "error" | "info" = type;

  if (typeof message === "object") {
    text = `${message.title || ""}${
      message.description ? " — " + message.description : ""
    }`;
    if (message.variant === "destructive") variant = "error";
    if (message.variant === "info") variant = "info";
  } else {
    text = message;
  }

  // Färg beroende på variant
  const background =
    variant === "error"
      ? "linear-gradient(135deg, #ef4444, #dc2626)"
      : variant === "info"
      ? "linear-gradient(135deg, #3b82f6, #2563eb)"
      : "linear-gradient(135deg, #22c55e, #16a34a)";

  // Skapa toast-elementet
  const toast = document.createElement("div");
  toast.textContent = text;
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

  // Fade in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  // Fade out & ta bort
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
    (
      message:
        | string
        | {
            title?: string;
            description?: string;
            variant?: "success" | "error" | "info" | "destructive";
          },
      type: "success" | "error" | "info" = "success"
    ) => toast(message, type),
    []
  );
}
