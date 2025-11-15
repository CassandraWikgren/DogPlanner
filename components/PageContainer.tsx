import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: "4xl" | "5xl" | "6xl" | "7xl" | "full";
  className?: string;
}

/**
 * Standardiserad sidcontainer för enhetlig padding och max-width
 * Default: max-w-6xl mx-auto p-6
 */
export default function PageContainer({
  children,
  maxWidth = "6xl",
  className = "",
}: PageContainerProps) {
  const maxWidthClass = {
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  }[maxWidth];

  return (
    <div className={`${maxWidthClass} mx-auto p-6 ${className}`}>
      {children}
    </div>
  );
}
