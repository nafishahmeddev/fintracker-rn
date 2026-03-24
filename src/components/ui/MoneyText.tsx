import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { DEFAULT_CURRENCY, getCurrencySymbol } from '../../constants/currency';
import { useTheme } from '../../providers/ThemeProvider';
import { typography } from '../../theme/typography';

interface MoneyTextProps extends TextProps {
  amount: number;
  currency?: string;
  type?: 'CR' | 'DR' | 'NONE';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

export function MoneyText({ 
  amount, 
  currency = DEFAULT_CURRENCY, 
  type = 'NONE', 
  weight = 'bold',
  style, 
  ...props 
}: MoneyTextProps) {
  const { colors } = useTheme();
  
  const symbol = getCurrencySymbol(currency);
  const formattedAmount = `${symbol}${amount.toFixed(2)}`;
  
  let prefix = '';
  let color = colors.text;
  
  if (type === 'CR') {
    prefix = '+';
    color = colors.success;
  } else if (type === 'DR') {
    prefix = '-';
    color = colors.danger;
  }

  const fontFamily = weight === 'regular' || weight === 'medium'
    ? typography.fonts.amountRegular
    : typography.fonts.amountBold;

  return (
    <Text 
      style={[
        styles.base, 
        { color, fontFamily, fontWeight: typography.weights[weight] }, 
        style
      ]} 
      {...props}
    >
      {prefix}{formattedAmount}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: typography.sizes.md,
  }
});
