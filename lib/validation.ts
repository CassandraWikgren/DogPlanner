/**
 * VALIDATION UTILITIES - Centraliserad validering
 *
 * Dessa funktioner säkerställer dataintegritet genom hela applikationen
 * och ger konsekventa felmeddelanden.
 *
 * Skapad: 2025-12-01
 */

// =====================================================
// UUID VALIDATION
// =====================================================

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validerar UUID format
 */
export function isValidUUID(uuid: string | null | undefined): boolean {
  if (!uuid) return false;
  return UUID_REGEX.test(uuid);
}

/**
 * Validerar UUID och kastar fel om ogiltigt
 */
export function validateUUID(
  uuid: string | null | undefined,
  fieldName: string = "ID"
): void {
  if (!uuid) {
    throw new ValidationError(`${fieldName} saknas`, "[ERR-4001]");
  }
  if (!UUID_REGEX.test(uuid)) {
    throw new ValidationError(`Ogiltigt ${fieldName} format`, "[ERR-4006]");
  }
}

// =====================================================
// EMAIL VALIDATION
// =====================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validerar email format
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email);
}

/**
 * Validerar email och kastar fel om ogiltigt
 */
export function validateEmail(email: string | null | undefined): void {
  if (!email) {
    throw new ValidationError("Email saknas", "[ERR-4001]");
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new ValidationError("Ogiltigt emailformat", "[ERR-4002]");
  }
}

// =====================================================
// PHONE VALIDATION
// =====================================================

const PHONE_REGEX = /^(\+46|0)?[1-9]\d{1,2}[-\s]?\d{5,8}$/;

/**
 * Validerar svenskt telefonnummer
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-]/g, "");
  return PHONE_REGEX.test(cleaned);
}

/**
 * Validerar telefonnummer och kastar fel om ogiltigt
 */
export function validatePhone(phone: string | null | undefined): void {
  if (!phone) {
    throw new ValidationError("Telefonnummer saknas", "[ERR-4001]");
  }
  if (!isValidPhone(phone)) {
    throw new ValidationError("Ogiltigt telefonnummer", "[ERR-4003]");
  }
}

// =====================================================
// DATE VALIDATION
// =====================================================

/**
 * Validerar datum string (YYYY-MM-DD)
 */
export function isValidDateString(
  dateString: string | null | undefined
): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validerar att datum är i framtiden
 */
export function isFutureDate(dateString: string): boolean {
  if (!isValidDateString(dateString)) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

/**
 * Validerar datumrange (start < end)
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    return false;
  }
  return new Date(startDate) < new Date(endDate);
}

// =====================================================
// NUMBER VALIDATION
// =====================================================

/**
 * Validerar positivt nummer
 */
export function isPositiveNumber(value: number | null | undefined): boolean {
  return typeof value === "number" && value > 0 && !isNaN(value);
}

/**
 * Validerar nummer inom range
 */
export function isNumberInRange(
  value: number | null | undefined,
  min: number,
  max: number
): boolean {
  if (typeof value !== "number" || isNaN(value)) return false;
  return value >= min && value <= max;
}

// =====================================================
// STRING VALIDATION
// =====================================================

/**
 * Validerar att sträng inte är tom
 */
export function isNonEmptyString(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validerar sträng längd
 */
export function isValidStringLength(
  value: string | null | undefined,
  minLength: number,
  maxLength: number
): boolean {
  if (!isNonEmptyString(value)) return false;
  const length = value!.trim().length;
  return length >= minLength && length <= maxLength;
}

// =====================================================
// SWEDISH ORG NUMBER VALIDATION
// =====================================================

/**
 * Validerar svenskt organisationsnummer (XXXXXX-XXXX)
 */
export function isValidOrgNumber(
  orgNumber: string | null | undefined
): boolean {
  if (!orgNumber) return false;

  // Ta bort mellanslag och bindestreck
  const cleaned = orgNumber.replace(/[\s\-]/g, "");

  // Måste vara 10 siffror
  if (!/^\d{10}$/.test(cleaned)) return false;

  // Luhn-algoritm för checksiffra
  const digits = cleaned.split("").map(Number);
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let digit = digits[i];
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  const checksum = (10 - (sum % 10)) % 10;
  return checksum === digits[9];
}

// =====================================================
// DOG SIZE VALIDATION
// =====================================================

export type DogSize = "small" | "medium" | "large";

/**
 * Validerar hundstorlek
 */
export function isValidDogSize(
  size: string | null | undefined
): size is DogSize {
  return size === "small" || size === "medium" || size === "large";
}

/**
 * Beräkna hundstorlek från mankhöjd med validering
 */
export function getDogSizeFromHeight(
  heightCm: number | null | undefined
): DogSize {
  if (!isPositiveNumber(heightCm)) {
    console.warn("[WARN] Ogiltig mankhöjd, använder default 'medium'");
    return "medium";
  }

  if (heightCm! < 35) return "small";
  if (heightCm! <= 54) return "medium";
  return "large";
}

// =====================================================
// ERROR CLASSES
// =====================================================

/**
 * Valideringsfel med felkod
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string = "[ERR-4001]"
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Databasfel med felkod
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string = "[ERR-1001]"
  ) {
    super(message);
    this.name = "DatabaseError";
  }
}

/**
 * Autentiseringsfel med felkod
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string = "[ERR-5001]"
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

// =====================================================
// BATCH VALIDATION
// =====================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validera flera fält samtidigt
 */
export function validateFields(
  validations: Record<string, () => boolean>
): ValidationResult {
  const errors: string[] = [];

  for (const [field, validator] of Object.entries(validations)) {
    try {
      if (!validator()) {
        errors.push(`Fältet '${field}' är ogiltigt`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(`${field}: ${error.message}`);
      } else {
        errors.push(`${field}: Okänt valideringsfel`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
