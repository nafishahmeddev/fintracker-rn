import React, { useMemo } from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { formatCurrency } from '../../utils/format';
import { useTheme } from '../../providers/ThemeProvider';
import { TYPOGRAPHY } from '../../theme/typography';
import { TransactionType } from '../../types';

interface MoneyTextProps extends TextProps {
  amount: number;
  currency?: string;
  type?: TransactionType | 'NONE';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

export const MoneyText = React.memo(function MoneyText({
  amount,
  currency,
  type = 'NONE',
  weight = 'bold',
  style,
  ...props
}: MoneyTextProps) {
  const { colors } = useTheme();

  const { prefix, color, formattedAmount, fontFamily } = useMemo(() => {
    const isCustomSign = type === 'CR' || type === 'DR';
    const valToFormat = isCustomSign ? Math.abs(amount) : amount;
    const formatted = formatCurrency(valToFormat, currency);

    let p = '';
    let c = colors.text;

    if (type === 'CR') {
      p = '+';
      c = colors.success;
    } else if (type === 'DR') {
      p = '-';
      c = colors.danger;
    }

    const ff = weight === 'regular' || weight === 'medium'
      ? TYPOGRAPHY.fonts.amountRegular
      : TYPOGRAPHY.fonts.amountBold;

    return { prefix: p, color: c, formattedAmount: formatted, fontFamily: ff };
  }, [amount, currency, type, weight, colors.text, colors.success, colors.danger]);

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
});

const styles = StyleSheet.create({
  base: {
    fontSize: TYPOGRAPHY.sizes.md,
    flexShrink: 1,
  }
});
