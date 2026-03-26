export type TypographyScale = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
};

export type TypographyWeight = {
  regular: '400';
  medium: '500';
  semibold: '600';
  bold: '700';
};

export type TypographyFonts = {
  heading: 'BricolageGrotesque_700Bold';
  headingRegular: 'BricolageGrotesque_400Regular';
  regular: 'BricolageGrotesque_400Regular';
  medium: 'BricolageGrotesque_500Medium';
  semibold: 'BricolageGrotesque_600SemiBold';
  bold: 'BricolageGrotesque_700Bold';
  amountRegular: 'JetBrainsMono_400Regular';
  amountBold: 'JetBrainsMono_700Bold';
};

export type TypographyTheme = {
  sizes: TypographyScale;
  weights: TypographyWeight;
  fonts: TypographyFonts;
};

export const TYPOGRAPHY: TypographyTheme = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  fonts: {
    heading: 'BricolageGrotesque_700Bold',
    headingRegular: 'BricolageGrotesque_400Regular',
    regular: 'BricolageGrotesque_400Regular',
    medium: 'BricolageGrotesque_500Medium',
    semibold: 'BricolageGrotesque_600SemiBold',
    bold: 'BricolageGrotesque_700Bold',
    amountRegular: 'JetBrainsMono_400Regular',
    amountBold: 'JetBrainsMono_700Bold',
  },
};
