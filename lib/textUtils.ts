/**
 * Text Utilities - Hjälpfunktioner för textformatering
 */

/**
 * Kapitaliserar första bokstaven i varje ord
 * @example capitalize("malin olsson") => "Malin Olsson"
 * @example capitalize("bonnie") => "Bonnie"
 */
export function capitalize(text: string | null | undefined): string {
  if (!text) return "";

  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Kapitaliserar ENDAST första bokstaven i hela strängen
 * @example capitalizeFirst("malin olsson") => "Malin olsson"
 */
export function capitalizeFirst(text: string | null | undefined): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
