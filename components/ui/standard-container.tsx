/**
 * StandardContainer - Följer DogPlanner stilguide exakt
 * 
 * STILGUIDE:
 * - Maxbredd: 1200px (max-w-7xl)
 * - Sidmarginal: 24px (px-6)
 * - Vertikal spacing: 32px (py-8)
 * - Bakgrund: #FDFDFD (bg-gray-50 för page, white för content)
 */

import React from "react";
import { cn } from "@/lib/utils";

interface StandardContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function StandardContainer({
  size = "lg",
  padding = "md",
  className,
  children,
  ...props
}: StandardContainerProps) {
  const sizeStyles = {
    sm: "max-w-2xl",    // ~672px
    md: "max-w-4xl",    // ~896px
    lg: "max-w-6xl",    // ~1152px
    xl: "max-w-7xl",    // ~1280px (1200px enligt stilguide)
    full: "max-w-full"
  };
  
  const paddingStyles = {
    none: "",
    sm: "px-4 py-4",
    md: "px-6 py-8",
    lg: "px-8 py-12"
  };

  return (
    <div
      className={cn(
        "mx-auto w-full",
        sizeStyles[size],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface StandardPageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function StandardPage({ className, children, ...props }: StandardPageProps) {
  return (
    <div className={cn("min-h-screen bg-gray-50", className)} {...props}>
      {children}
    </div>
  );
}

interface StandardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function StandardContent({ className, children, ...props }: StandardContentProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm p-6", className)} {...props}>
      {children}
    </div>
  );
}
