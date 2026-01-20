// Card code generation utilities

/**
 * Generates a card code from expansion, type, and number
 * Format: EXPANSION-TYPE-NUMBER (e.g., CORE-CHEF-001)
 */
export function generateCardCode(expansion: string, cardType: string, cardNumber: number): string {
  return `${expansion}-${cardType}-${cardNumber.toString().padStart(3, '0')}`;
}

/**
 * Parses a card code into its components
 */
export function parseCardCode(code: string): { expansion: string; cardType: string; cardNumber: number } | null {
  const parts = code.split('-');
  if (parts.length !== 3) return null;
  
  const cardNumber = parseInt(parts[2], 10);
  if (isNaN(cardNumber)) return null;
  
  return {
    expansion: parts[0],
    cardType: parts[1],
    cardNumber
  };
}

