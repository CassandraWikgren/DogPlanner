/**
 * StandardInput - Följer DogPlanner stilguide exakt
 *
 * STILGUIDE:
 * - Vit bakgrund, grå ram (#D1D5DB)
 * - Rundning: 6px (rounded-md)
 * - Fokus: grön ram (#2c7a4c)
 * - Höjd: h-10 (40px)
 * - Text: 16px, #333333
 * - Label: 15px, grön (#2C7A4C), bold
 */

import React from "react";
import { cn } from "@/lib/utils";

interface StandardInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const StandardInput = React.forwardRef<
  HTMLInputElement,
  StandardInputProps
>(({ label, error, helperText, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[15px] font-bold text-[#2c7a4c] mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full h-10 px-3 py-2",
          "bg-white border border-gray-300 rounded-md",
          "text-base text-[#333333]",
          "focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent",
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          "transition-all",
          error && "border-[#D9534F] focus:ring-[#D9534F]",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-[#D9534F]">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

StandardInput.displayName = "StandardInput";

interface StandardTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const StandardTextarea = React.forwardRef<
  HTMLTextAreaElement,
  StandardTextareaProps
>(({ label, error, helperText, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[15px] font-bold text-[#2c7a4c] mb-2">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          "w-full px-3 py-2",
          "bg-white border border-gray-300 rounded-md",
          "text-base text-[#333333]",
          "focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent",
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          "transition-all min-h-[100px]",
          error && "border-[#D9534F] focus:ring-[#D9534F]",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-[#D9534F]">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

StandardTextarea.displayName = "StandardTextarea";

interface StandardSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const StandardSelect = React.forwardRef<
  HTMLSelectElement,
  StandardSelectProps
>(({ label, error, helperText, className, children, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[15px] font-bold text-[#2c7a4c] mb-2">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          "w-full h-10 px-3 py-2",
          "bg-white border border-gray-300 rounded-md",
          "text-base text-[#333333]",
          "focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent",
          "disabled:bg-gray-100 disabled:cursor-not-allowed",
          "transition-all",
          error && "border-[#D9534F] focus:ring-[#D9534F]",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-[#D9534F]">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

StandardSelect.displayName = "StandardSelect";
