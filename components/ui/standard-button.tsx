/**
 * StandardButton - Följer DogPlanner stilguide exakt
 *
 * STILGUIDE:
 * - 15px semibold, vit text på grön bakgrund
 * - Höjd: py-2.5 (40px total med border)
 * - Rundning: 6-8px (rounded-md)
 * - Hover: ljusare grön
 * - Primärfärg: #2C7A4C
 */

import React from "react";
import { cn } from "@/lib/utils";

interface StandardButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function StandardButton({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  ...props
}: StandardButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: "bg-[#2c7a4c] text-white hover:bg-[#236139] shadow-sm",
    secondary: "bg-gray-500 text-white hover:bg-gray-600 shadow-sm",
    outline:
      "bg-white text-[#2c7a4c] border border-[#2c7a4c] hover:bg-[#E6F4EA]",
    ghost: "bg-transparent text-[#2c7a4c] hover:bg-[#E6F4EA]",
    danger: "bg-[#D9534F] text-white hover:bg-[#c9302c] shadow-sm",
  };

  const sizeStyles = {
    sm: "text-sm px-3 py-1.5 h-8",
    md: "text-[15px] px-4 py-2.5 h-10",
    lg: "text-base px-6 py-3 h-12",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
