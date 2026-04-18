/**
 * Extract a human-readable message from an unknown caught value.
 *
 * Usage:
 *   catch (err) {
 *     Alert.alert('Error', toErrorMessage(err));
 *   }
 */
export function toErrorMessage(
  err: unknown,
  fallback = 'An unexpected error occurred',
): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}
