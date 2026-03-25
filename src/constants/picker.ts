// ── Account ──────────────────────────────────────────────────────────────────

export const ACCOUNT_ICONS = [
  'wallet-outline',
  'card-outline',
  'cash-outline',
  'business-outline',
  'server-outline',
  'diamond-outline',
  'home-outline',
  'phone-portrait-outline',
  'globe-outline',
  'briefcase-outline',
  'trending-up-outline',
  'layers-outline',
] as const;

export type AccountIconName = (typeof ACCOUNT_ICONS)[number];

export const ACCOUNT_COLORS = [
  '#86d204',
  '#00F0FF',
  '#8B5CF6',
  '#EC4899',
  '#F43F5E',
  '#EAB308',
  '#F97316',
  '#10B981',
  '#3B82F6',
  '#64748B',
  '#14B8A6',
  '#F59E0B',
] as const;

// ── Category ─────────────────────────────────────────────────────────────────

export const CATEGORY_ICONS = [
  // Finance & Money
  'cash-outline',
  'wallet-outline',
  'card-outline',
  'briefcase-outline',
  'trending-up-outline',
  'refresh-outline',
  'receipt-outline',
  'document-text-outline',
  // Food & Drink
  'fast-food-outline',
  'restaurant-outline',
  'cafe-outline',
  'pizza-outline',
  'wine-outline',
  'beer-outline',
  'ice-cream-outline',
  'basket-outline',
  // Transport
  'car-outline',
  'bus-outline',
  'airplane-outline',
  'train-outline',
  'bicycle-outline',
  'boat-outline',
  'speedometer-outline',
  'locate-outline',
  // Home & Utilities
  'home-outline',
  'business-outline',
  'flash-outline',
  'wifi-outline',
  'build-outline',
  'bed-outline',
  'leaf-outline',
  // Health & Fitness
  'medkit-outline',
  'bandage-outline',
  'barbell-outline',
  'fitness-outline',
  // Tech & Communication
  'phone-portrait-outline',
  'hardware-chip-outline',
  'globe-outline',
  // Shopping & Lifestyle
  'bag-outline',
  'cart-outline',
  'repeat-outline',
  'cut-outline',
  'shield-checkmark-outline',
  'umbrella-outline',
  // Entertainment & Hobbies
  'film-outline',
  'game-controller-outline',
  'musical-notes-outline',
  'camera-outline',
  'color-palette-outline',
  'book-outline',
  // Education
  'school-outline',
  // Personal & Social
  'person-outline',
  'people-outline',
  'happy-outline',
  'paw-outline',
  'heart-outline',
  'gift-outline',
  'ribbon-outline',
  'trophy-outline',
  // Misc
  'sparkles-outline',
  'star-outline',
  'bulb-outline',
  'grid-outline',
  'ellipsis-horizontal-outline',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICONS)[number];

export const CATEGORY_COLORS = [
  // Greens & Teals
  '#6BD498', '#34D399', '#4ADE80', '#86EFAC', '#6EE7B7', '#A3E635',
  // Blues & Indigos
  '#63A4FF', '#60A5FA', '#38BDF8', '#818CF8', '#A5B4FC', '#0EA5E9',
  // Purples & Pinks
  '#A78BFA', '#8B5CF6', '#7C3AED', '#C084FC', '#C4B5FD', '#F9A8D4',
  // Hot Pinks & Reds
  '#F472B6', '#EC4899', '#FB7185', '#EF4444', '#F87171', '#FCA5A5',
  // Oranges & Warm
  '#FF8A65', '#FB923C', '#FBBF24', '#F5C451', '#FCD34D', '#D97706',
  // Browns & Neutrals
  '#C4A35A', '#B8D641', '#94A3B8', '#9CA3AF', '#6B7280', '#64748B',
] as const;
