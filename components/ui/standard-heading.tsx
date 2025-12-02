/**
 * StandardHeading - Följer DogPlanner stilguide exakt
 *
 * STILGUIDE:
 * - H1: 32px, bold, #2C7A4C
 * - H2: 24px, semibold, #2C7A4C
 * - H3: 18px, medium, #2C7A4C
 * - Linjehöjd: 1.6
 * - Hero-rubriker: centrerade, vita (#FFF) med textskugga
 */

import React from "react";
import { cn } from "@/lib/utils";

interface StandardHeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  level: 1 | 2 | 3;
  hero?: boolean;
  children: React.ReactNode;
}

export function StandardHeading({
  level,
  hero = false,
  className,
  children,
  ...props
}: StandardHeadingProps) {
  const baseStyles = "leading-relaxed";

  const levelStyles = {
    1: hero
      ? "text-4xl font-bold text-white text-center"
      : "text-[32px] font-bold text-slate-700",
    2: hero
      ? "text-2xl font-semibold text-white text-center opacity-90"
      : "text-2xl font-semibold text-slate-700",
    3: "text-lg font-medium text-slate-700",
  };

  const heroShadow = hero ? "drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]" : "";

  const combinedClassName = cn(
    baseStyles,
    levelStyles[level],
    heroShadow,
    className
  );

  if (level === 1) {
    return (
      <h1 className={combinedClassName} {...props}>
        {children}
      </h1>
    );
  }
  if (level === 2) {
    return (
      <h2 className={combinedClassName} {...props}>
        {children}
      </h2>
    );
  }
  return (
    <h3 className={combinedClassName} {...props}>
      {children}
    </h3>
  );
}

// Convenience components
export function H1(props: Omit<StandardHeadingProps, "level">) {
  return <StandardHeading level={1} {...props} />;
}

export function H2(props: Omit<StandardHeadingProps, "level">) {
  return <StandardHeading level={2} {...props} />;
}

export function H3(props: Omit<StandardHeadingProps, "level">) {
  return <StandardHeading level={3} {...props} />;
}

// Hero variants
export function HeroH1(props: Omit<StandardHeadingProps, "level" | "hero">) {
  return <StandardHeading level={1} hero {...props} />;
}

export function HeroH2(props: Omit<StandardHeadingProps, "level" | "hero">) {
  return <StandardHeading level={2} hero {...props} />;
}
