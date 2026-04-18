import { Ionicons } from '@expo/vector-icons';

export type IoniconName = keyof typeof Ionicons.glyphMap;

/**
 * Safely resolve a string (e.g. from the database) to a valid IoniconName.
 * Returns the fallback when the stored value is not a recognised icon key.
 */
export function resolveIcon(
  icon: string | null | undefined,
  fallback: IoniconName,
): IoniconName {
  if (icon && icon in Ionicons.glyphMap) return icon as IoniconName;
  return fallback;
}
