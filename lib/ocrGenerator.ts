/**
 * OCR-GENERATOR FÖR SVENSKA FAKTUROR
 * 
 * Genererar OCR-nummer (Optical Character Recognition) för automatisk
 * betalningskoppling i svenska banksystem (Bankgiro/Plusgiro).
 * 
 * Format: KKKKKKFFFFFFFFC
 * - K = Kundnummer (6 siffror)
 * - F = Fakturanummer (9 siffror)
 * - C = Kontrollsiffra (Luhn-algoritm)
 * 
 * Exempel:
 *   Kundnummer: 123
 *   Fakturanummer: "INV-2025-00001"
 *   → OCR: 0001232025000018
 */

/**
 * Beräknar Luhn-kontrollsiffra (MOD 10)
 * 
 * Luhn-algoritmen används av svenska banker för OCR-nummer och
 * även för kreditkortsnummer. Den upptäcker nästan alla enkla fel
 * i nummersekvenser.
 * 
 * @param number - Sträng med siffror (utan kontrollsiffra)
 * @returns Kontrollsiffran (0-9)
 */
function calculateLuhnCheckDigit(number: string): string {
  let sum = 0;
  let alternate = false;
  
  // Gå igenom från höger till vänster
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i]);
    
    if (alternate) {
      digit *= 2;
      // Om dubblering ger tvåsiffrig, subtrahera 9 (= summera siffrorna)
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    alternate = !alternate;
  }
  
  // Kontrollsiffran är det som behövs för att nå nästa 10-tal
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

/**
 * Validerar ett OCR-nummer med Luhn-algoritm
 * 
 * @param ocr - OCR-nummer att validera
 * @returns true om giltigt, annars false
 */
export function validateOCR(ocr: string): boolean {
  if (!ocr || ocr.length < 2) return false;
  
  // Ta bort mellanslag och bindestreck
  const cleanOCR = ocr.replace(/[\s-]/g, '');
  
  // Måste vara endast siffror
  if (!/^\d+$/.test(cleanOCR)) return false;
  
  // Kontrollera längd (2-25 siffror enligt svensk standard)
  if (cleanOCR.length < 2 || cleanOCR.length > 25) return false;
  
  // Extrahera bas och kontrollsiffra
  const base = cleanOCR.slice(0, -1);
  const checkDigit = cleanOCR.slice(-1);
  
  // Beräkna och jämför
  return calculateLuhnCheckDigit(base) === checkDigit;
}

/**
 * Extraherar numeriska siffror från fakturanummer
 * 
 * @param invoiceNumber - Fakturanummer (t.ex. "INV-2025-00001")
 * @returns Endast siffror (t.ex. "202500001")
 */
function extractInvoiceDigits(invoiceNumber: string): string {
  // Ta bort allt utom siffror
  const digits = invoiceNumber.replace(/\D/g, '');
  
  // Ta de 9 sista siffrorna (för att få plats i formatet)
  // Om färre än 9 siffror, padda med nollor
  return digits.slice(-9).padStart(9, '0');
}

/**
 * Genererar OCR-nummer för svensk faktura
 * 
 * @param customerNumber - Kundnummer (1-999999)
 * @param invoiceNumber - Fakturanummer (t.ex. "INV-2025-00001")
 * @returns OCR-nummer med kontrollsiffra (16 siffror)
 * 
 * @example
 * generateOCR(123, "INV-2025-00001")
 * // → "0001232025000018"
 * 
 * @example
 * generateOCR(456789, "DP-2025-00142")
 * // → "4567892025001427"
 */
export function generateOCR(
  customerNumber: number | string | undefined | null,
  invoiceNumber: string | undefined | null
): string {
  // Hantera null/undefined
  const custNum = customerNumber || 0;
  const invNum = invoiceNumber || '0';
  
  // Konvertera kundnummer till 6 siffror
  const customerPart = custNum.toString().padStart(6, '0').slice(-6);
  
  // Extrahera siffror från fakturanummer (9 siffror)
  const invoicePart = extractInvoiceDigits(invNum);
  
  // Kombinera: KKKKKK + FFFFFFFFF
  const baseOCR = customerPart + invoicePart;
  
  // Beräkna kontrolltecken
  const checkDigit = calculateLuhnCheckDigit(baseOCR);
  
  // Returnera fullständigt OCR-nummer (16 siffror)
  return baseOCR + checkDigit;
}

/**
 * Formaterar OCR-nummer med mellanslag för läsbarhet
 * 
 * @param ocr - OCR-nummer
 * @param groupSize - Antal siffror per grupp (default: 4)
 * @returns Formaterat OCR-nummer
 * 
 * @example
 * formatOCR("0001232025000018")
 * // → "0001 2320 2500 0018"
 */
export function formatOCR(ocr: string, groupSize: number = 4): string {
  // Ta bort befintliga mellanslag
  const clean = ocr.replace(/\s/g, '');
  
  // Dela upp i grupper
  const groups: string[] = [];
  for (let i = 0; i < clean.length; i += groupSize) {
    groups.push(clean.slice(i, i + groupSize));
  }
  
  return groups.join(' ');
}

/**
 * Genererar betalningsreferens (alternativ till OCR)
 * För banker som inte stödjer OCR eller för internationella betalningar.
 * 
 * @param invoiceNumber - Fakturanummer
 * @param orgName - Organisationsnamn (frivilligt)
 * @returns Betalningsreferens
 * 
 * @example
 * generatePaymentReference("INV-2025-00001", "DogPlanner AB")
 * // → "DP-INV-2025-00001"
 */
export function generatePaymentReference(
  invoiceNumber: string,
  orgName?: string
): string {
  if (!orgName) {
    return invoiceNumber;
  }
  
  // Ta första bokstäverna från organisationsnamnet
  const initials = orgName
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 4);
  
  return `${initials}-${invoiceNumber}`;
}

/**
 * Genererar Swish-URL med betalningsinformation
 * 
 * @param swishNumber - Swish-nummer
 * @param amount - Belopp i SEK
 * @param message - Meddelande (fakturanummer)
 * @returns Swish-URL för QR-kod eller deeplink
 */
export function generateSwishURL(
  swishNumber: string,
  amount: number,
  message: string
): string {
  // Ta bort mellanslag och bindestreck från Swish-nummer
  const cleanNumber = swishNumber.replace(/[\s-]/g, '');
  
  // Swish-URL format (för QR-kod)
  return `swish://payment?phone=${cleanNumber}&amount=${amount}&message=${encodeURIComponent(message)}`;
}

/**
 * Testar OCR-generatorn
 * Kan användas för att verifiera att algoritmen fungerar korrekt
 */
export function testOCRGenerator(): void {
  console.log('🧪 OCR Generator Test');
  console.log('====================\n');
  
  const testCases = [
    { customer: 123, invoice: 'INV-2025-00001' },
    { customer: 456789, invoice: 'DP-2025-00142' },
    { customer: 1, invoice: 'HUND-2025-99999' },
  ];
  
  testCases.forEach(({ customer, invoice }) => {
    const ocr = generateOCR(customer, invoice);
    const formatted = formatOCR(ocr);
    const isValid = validateOCR(ocr);
    
    console.log(`Kund: ${customer}`);
    console.log(`Faktura: ${invoice}`);
    console.log(`OCR: ${ocr}`);
    console.log(`Formaterat: ${formatted}`);
    console.log(`Giltigt: ${isValid ? '✅' : '❌'}\n`);
  });
}
