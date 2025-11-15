/**
 * StandardCard - Följer DogPlanner stilguide exakt
 *
 * STILGUIDE:
 * - Vit bakgrund (#FFFFFF)
 * - Rundning: 8-12px (rounded-lg till rounded-xl)
 * - Skugga: shadow-sm (0 4 10 rgba(0, 0, 0, 0.05))
 * - Padding: 24px (p-6)
 * - Border: border-gray-200
 */

import React from "react";
import { cn } from "@/lib/utils";

interface StandardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg" | "none";
  rounded?: "md" | "lg" | "xl";
  shadow?: boolean;
  border?: boolean;
  children: React.ReactNode;
}

export function StandardCard({
  padding = "md",
  rounded = "lg",
  shadow = true,
  border = true,
  className,
  children,
  ...props
}: StandardCardProps) {
  const baseStyles = "bg-white";

  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const roundedStyles = {
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
  };

  return (
    <div
      className={cn(
        baseStyles,
        paddingStyles[padding],
        roundedStyles[rounded],
        shadow && "shadow-sm",
        border && "border border-gray-200",
        "transition-shadow hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface StandardCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function StandardCardHeader({
  className,
  children,
  ...props
}: StandardCardHeaderProps) {
  return (
    <div className={cn("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

interface StandardCardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function StandardCardTitle({
  className,
  children,
  ...props
}: StandardCardTitleProps) {
  return (
    <h3
      className={cn("text-lg font-semibold text-[#2c7a4c]", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

interface StandardCardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function StandardCardContent({
  className,
  children,
  ...props
}: StandardCardContentProps) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}
