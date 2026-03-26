import * as Localization from 'expo-localization';

/**
 * Normalizes and parses a string amount into a finite number.
 * Defaults to 0 if the input is blank or invalid.
 */
export const parseAmount = (value: string | undefined | null): number => {
  if (!value || !value.trim()) return 0;
  
  const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Converts a hex color string to a numeric value for database storage.
 */
export const toDbColor = (value: string): number => {
  return Number.parseInt(value.replace('#', ''), 16);
};

/**
 * Formats a numeric amount into a currency string using the Intl library.
 * If no currency code is provided, it formats the number as a localized decimal.
 */
export const formatCurrency = (amount: number, currencyCode?: string): string => {
  const locale = Localization.getLocales()?.[0]?.languageTag ?? 'en-US';
  
  if (!currencyCode) {
    return new Intl.NumberFormat(locale, {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
    }).format(amount);
  } catch {
    // Fallback if the currency code is invalid or Intl fails
    return `${currencyCode.toUpperCase()} ${amount.toFixed(2)}`;
  }
};
