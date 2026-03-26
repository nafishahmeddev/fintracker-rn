import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { formatCurrency } from '../../utils/format';
import { useTheme } from '../../providers/ThemeProvider';
import { TYPOGRAPHY } from '../../theme/typography';

interface MoneyTextProps extends TextProps {
  amount: number;
  currency?: string;
  type?: 'CR' | 'DR' | 'NONE';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

export function MoneyText({ 
  amount, 
  currency, 
  type = 'NONE', 
  weight = 'bold',
  style, 
  ...props 
}: MoneyTextProps) {
  const { colors } = useTheme();
  
  const formattedAmount = formatCurrency(amount, currency);
  
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
    ? TYPOGRAPHY.fonts.amountRegular
    : TYPOGRAPHY.fonts.amountBold;

  return (
    <Text 
      style={[
        styles.base, 
        { color, fontFamily }, 
        style
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.72}
      ellipsizeMode="tail"
      {...props}
    >
      {prefix}{formattedAmount}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: TYPOGRAPHY.sizes.md,
    flexShrink: 1,
  }
});
