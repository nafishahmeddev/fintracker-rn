/**
 * Design Tokens - Luno Design System
 * 
 * Editorial Brutalist Design Language
 * - Clean, minimal aesthetics with precise spacing
 * - No arbitrary values - everything uses the token system
 * - Consistent 4px base grid
 */

// ============================================
// SPACING SCALE (4px base)
// ============================================
export const SPACING = {
  // Base units (4px grid)
  '0': 0,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '3.5': 14,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 32,
  '8': 40,
  '9': 48,
  '10': 64,
  '11': 80,
  '12': 96,
} as const;

export type SpacingToken = keyof typeof SPACING;

// ============================================
// BORDER RADIUS SCALE
// Editorial Brutalist: 12px-20px for most elements
// Avoid 999px pill shapes except for micro-badges
// ============================================
export const RADIUS = {
  'none': 0,
  'xs': 4,
  'sm': 8,
  'md': 12,
  'lg': 16,
  'xl': 20,
  '2xl': 24,
  'full': 999, // Use sparingly - only for micro-badges
} as const;

export type RadiusToken = keyof typeof RADIUS;

// ============================================
// LAYOUT GRID
// ============================================
export const LAYOUT = {
  // Screen margins
  screenPadding: 24,
  
  // Content max widths for readability
  maxContentWidth: 400,
  
  // Component gaps
  sectionGap: 24,
  cardGap: 12,
  elementGap: 8,
  
  // Touch targets
  minTouchTarget: 44,
  
  // Icon sizes
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  iconXl: 28,
} as const;

// ============================================
// COMPONENT SIZE VARIANTS
// ============================================
export const COMPONENT_SIZES = {
  button: {
    sm: {
      height: 36,
      paddingHorizontal: SPACING['3'],
      borderRadius: RADIUS.md,
      fontSize: 14,
    },
    md: {
      height: 48,
      paddingHorizontal: SPACING['4'],
      borderRadius: RADIUS.lg,
      fontSize: 16,
    },
    lg: {
      height: 56,
      paddingHorizontal: SPACING['5'],
      borderRadius: RADIUS.xl,
      fontSize: 16,
    },
  },
  
  input: {
    sm: {
      height: 40,
      paddingHorizontal: SPACING['3'],
      borderRadius: RADIUS.md,
    },
    md: {
      height: 56,
      paddingHorizontal: SPACING['4'],
      borderRadius: RADIUS.lg,
    },
    lg: {
      height: 64,
      paddingHorizontal: SPACING['4'],
      borderRadius: RADIUS.xl,
    },
  },
  
  card: {
    sm: {
      padding: SPACING['3'],
      borderRadius: RADIUS.lg,
    },
    md: {
      padding: SPACING['4'],
      borderRadius: RADIUS.xl,
    },
    lg: {
      padding: SPACING['5'],
      borderRadius: RADIUS['2xl'],
    },
  },
  
  iconButton: {
    sm: 32,
    md: 40,
    lg: 44,
  },
} as const;

// ============================================
// OPACITY SCALE
// ============================================
export const OPACITY = {
  '0': 0,
  '10': 0.1,
  '20': 0.2,
  '30': 0.3,
  '40': 0.4,
  '50': 0.5,
  '60': 0.6,
  '70': 0.7,
  '80': 0.8,
  '90': 0.9,
  '100': 1,
} as const;

// ============================================
// ELEVATION / SHADOWS
// Editorial Brutalist: Subtle, never harsh
// ============================================
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

export type ShadowToken = keyof typeof SHADOWS;

// ============================================
// Z-INDEX SCALE
// ============================================
export const Z_INDEX = {
  '0': 0,
  '10': 10,
  '20': 20,
  '30': 30,
  '40': 40,
  '50': 50,
  'auto': 'auto',
} as const;

// ============================================
// TRANSITIONS / ANIMATION
// ============================================
export const ANIMATION = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const;

// ============================================
// TYPOGRAPHY LINE HEIGHT SCALE
// ============================================
export const LINE_HEIGHT = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// ============================================
// LETTER SPACING
// ============================================
export const LETTER_SPACING = {
  tight: -1,
  snug: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get spacing value from token
 */
export function spacing(token: SpacingToken): number {
  return SPACING[token];
}

/**
 * Get border radius value from token
 */
export function radius(token: RadiusToken): number {
  return RADIUS[token];
}

/**
 * Get shadow style object
 */
export function shadow(token: ShadowToken) {
  return SHADOWS[token];
}

/**
 * Create a spacing object for StyleSheet
 * Usage: spacingStyle('margin', 4) => { margin: 16 }
 */
export function spacingStyle(
  property: 'margin' | 'marginHorizontal' | 'marginVertical' | 'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight' | 'padding' | 'paddingHorizontal' | 'paddingVertical' | 'paddingTop' | 'paddingBottom' | 'paddingLeft' | 'paddingRight' | 'gap',
  token: SpacingToken
) {
  return { [property]: SPACING[token] };
}
