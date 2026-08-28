/** Canonical field name assigned whenever a note has no explicit field. */
export const defaultFieldName = "inbox";

/**
 * Resolves a user-provided field name to the canonical default when it is blank.
 *
 * @param fieldName - Optional field name received from an editor or API caller.
 * @returns A non-empty field name suitable for note persistence.
 */
export function resolveRequiredFieldName(
  fieldName: string | null | undefined,
): string {
  return fieldName?.trim() || defaultFieldName;
}
