export interface FieldBounds {
  min: number;
  max: number;
}

/**
 * Plausibility bounds per field (brief Section 15 Layer 6): a parse of PTS=2448 should be
 * rejected rather than blindly stored, even though "2448" might be a technically valid
 * OCR read of some other digits. Deliberately generous - these exist to catch gross OCR
 * garbage, not to second-guess plausible-but-unusual box scores.
 */
export const FIELD_BOUNDS: Record<string, FieldBounds> = {
  pts: { min: 0, max: 99 },
  reb: { min: 0, max: 30 },
  ast: { min: 0, max: 30 },
  fgPct: { min: 0, max: 100 },
  score: { min: 0, max: 99 },
  shotClock: { min: 0, max: 24 },
};

export interface ParsedField {
  value: number;
  /** 0-1, derived from the OCR engine's own confidence for this read. */
  confidence: number;
}

/**
 * Extracts the first run of digits from raw OCR text and validates it against the
 * field's plausibility bounds. Returns null (not a wrong value) when the text doesn't
 * parse or the number is out of bounds - see brief Section 32: "unknown/low confidence"
 * beats "incorrect but apparently valid".
 */
export function parseNumericField(rawText: string, field: string, ocrConfidence: number): ParsedField | null {
  const match = rawText.match(/\d+/);
  if (!match) return null;

  const value = Number.parseInt(match[0], 10);
  const bounds = FIELD_BOUNDS[field];
  if (bounds && (value < bounds.min || value > bounds.max)) return null;

  return { value, confidence: Math.max(0, Math.min(1, ocrConfidence / 100)) };
}
