import { z } from "zod";
import type { Region } from "../detection/pixelSampling";
import type { DecodedImage } from "../detection/types";
import { cropImage } from "./crop";
import { parseNumericField } from "./fieldValidation";
import { recognizeDigits } from "./ocr";
import { grayscaleAndThreshold, upscaleImage } from "./preprocess";
import { PLAYER_BOX_FIELD_REGIONS, SCOREBOARD_FIELD_REGIONS } from "./regions";

const UPSCALE_FACTOR = 4;
const THRESHOLD_CUTOFF = 150;

/** Mirrors GamedayBetTrackerr's ParsedSlipDraftSchema pattern: every extracted field carries its own confidence. */
export const ParsedFieldSchema = z.object({
  value: z.number(),
  confidence: z.number().min(0).max(1),
});

export const ParsedScoreboardSchema = z.object({
  pts: ParsedFieldSchema.nullable(),
  reb: ParsedFieldSchema.nullable(),
  ast: ParsedFieldSchema.nullable(),
  /**
   * KNOWN WEAK SPOT: real testing found this consistently misreads "50" as "0" (a
   * systematic digit confusion, not flakiness - confidence even looks reasonable, 63-66%,
   * so the confidence gate alone won't catch it). Also see regions.ts - this slot isn't
   * always FG%, sometimes it's TO (turnovers). Needs the same revisit as the score fields.
   */
  fgPct: ParsedFieldSchema.nullable(),
  /**
   * KNOWN WEAK SPOT (Phase 4 first pass): the score bar's bold outlined pill-style
   * numerals aren't well represented in Tesseract's default English model. Real testing
   * found no single threshold cutoff reliably reads both scores at once - confidence
   * stayed low (16-34%) even on correct reads. These two fields will frequently come
   * back null; that's the confidence gate working as intended (Section 32: unknown beats
   * wrong), not a bug. Revisit with more preprocessing experiments, a per-digit template
   * matcher (a small fixed glyph set may outperform general OCR here), or a vision-model
   * fallback once this needs to be solved for real.
   */
  opponentScore: ParsedFieldSchema.nullable(),
  myScore: ParsedFieldSchema.nullable(),
  shotClock: ParsedFieldSchema.nullable(),
});
export type ParsedScoreboard = z.infer<typeof ParsedScoreboardSchema>;

async function parseField(image: DecodedImage, region: Region, field: string) {
  const cropped = cropImage(image, region);
  const upscaled = upscaleImage(cropped, UPSCALE_FACTOR);
  const processed = grayscaleAndThreshold(upscaled, THRESHOLD_CUTOFF);
  const { text, confidence } = await recognizeDigits(processed);
  return parseNumericField(text, field, confidence);
}

/**
 * Parses the player-box and scoreboard ROIs out of a frame the onCourtHud detector has
 * already fired on (brief Phase 4 - "the first complete end-to-end parser"). Each field
 * is independently cropped, preprocessed, OCR'd, and validated - a bad read in one field
 * doesn't affect the others.
 */
export async function parseScoreboard(image: DecodedImage): Promise<ParsedScoreboard> {
  const [pts, reb, ast, fgPct, opponentScore, myScore, shotClock] = await Promise.all([
    parseField(image, PLAYER_BOX_FIELD_REGIONS.pts, "pts"),
    parseField(image, PLAYER_BOX_FIELD_REGIONS.reb, "reb"),
    parseField(image, PLAYER_BOX_FIELD_REGIONS.ast, "ast"),
    parseField(image, PLAYER_BOX_FIELD_REGIONS.fgPct, "fgPct"),
    parseField(image, SCOREBOARD_FIELD_REGIONS.opponentScore, "score"),
    parseField(image, SCOREBOARD_FIELD_REGIONS.myScore, "score"),
    parseField(image, SCOREBOARD_FIELD_REGIONS.shotClock, "shotClock"),
  ]);
  return { pts, reb, ast, fgPct, opponentScore, myScore, shotClock };
}
