export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', 
  EUR: '€', 
  GBP: '£', 
  AUD: 'A$', 
  CAD: 'C$', 
  JPY: '¥', 
  INR: '₹', 
  BGN: 'лв'
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCY_SYMBOLS[currencyCode?.toUpperCase()] || '$';
};

export const DEFAULT_CURRENCY = 'USD';
