/**
 * StandardTable - Följer DogPlanner stilguide exakt
 *
 * STILGUIDE:
 * - Vit bakgrund, rundade hörn 8px
 * - Rubrikrad: #2C7A4C, vit text, höjd 44px
 * - Växlande radrutor: vit / #F9FAFB
 * - Hover: #F3F4F6
 * - Ingen linje mellan rader
 * - Vänsterställd text
 * - Tabellrubriker: 14px, semibold
 */

import React from "react";
import { cn } from "@/lib/utils";

interface StandardTableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export function StandardTable({
  className,
  children,
  ...props
}: StandardTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-lg shadow-sm">
      <table className={cn("w-full bg-white", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

interface StandardTableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export function StandardTableHeader({
  className,
  children,
  ...props
}: StandardTableHeaderProps) {
  return (
    <thead className={cn("bg-slate-700 text-white", className)} {...props}>
      {children}
    </thead>
  );
}

interface StandardTableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export function StandardTableBody({
  className,
  children,
  ...props
}: StandardTableBodyProps) {
  return (
    <tbody className={cn("divide-y-0", className)} {...props}>
      {children}
    </tbody>
  );
}

interface StandardTableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  striped?: boolean;
  index?: number;
}

export function StandardTableRow({
  className,
  children,
  striped = true,
  index,
  ...props
}: StandardTableRowProps) {
  const isEven = index !== undefined ? index % 2 === 0 : false;

  return (
    <tr
      className={cn(
        "transition-colors hover:bg-gray-100",
        striped && isEven && "bg-white",
        striped && !isEven && "bg-gray-50",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

interface StandardTableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export function StandardTableHead({
  className,
  children,
  ...props
}: StandardTableHeadProps) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left text-sm font-semibold",
        "first:pl-6 last:pr-6",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

interface StandardTableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
}

export function StandardTableCell({
  className,
  children,
  ...props
}: StandardTableCellProps) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-base text-[#333333]",
        "first:pl-6 last:pr-6",
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

// Empty state component
interface StandardTableEmptyProps {
  message?: string;
  colSpan?: number;
}

export function StandardTableEmpty({
  message = "Inga resultat hittades",
  colSpan = 1,
}: StandardTableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center">
        <p className="text-gray-400 text-base">{message}</p>
      </td>
    </tr>
  );
}
