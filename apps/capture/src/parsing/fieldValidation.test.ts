import { describe, expect, it } from "vitest";
import { parseNumericField } from "./fieldValidation";

describe("parseNumericField", () => {
  it("extracts a plausible value with normalized confidence", () => {
    expect(parseNumericField("10", "pts", 87)).toEqual({ value: 10, confidence: 0.87 });
  });

  it("extracts digits from noisy OCR text (e.g. trailing %)", () => {
    expect(parseNumericField("50%", "fgPct", 90)).toEqual({ value: 50, confidence: 0.9 });
  });

  it("returns null when no digits are found", () => {
    expect(parseNumericField("PTS", "pts", 90)).toBeNull();
  });

  it("rejects an implausible value even if it parsed cleanly", () => {
    expect(parseNumericField("2448", "pts", 95)).toBeNull();
  });

  it("rejects a value below the field's minimum", () => {
    expect(parseNumericField("-", "pts", 95)).toBeNull(); // no digits at all
  });

  it("clamps confidence into [0,1]", () => {
    expect(parseNumericField("5", "reb", 150)?.confidence).toBe(1);
    expect(parseNumericField("5", "reb", -10)?.confidence).toBe(0);
  });

  it("passes through fields with no configured bounds", () => {
    expect(parseNumericField("123456", "unbounded_field", 80)).toEqual({ value: 123456, confidence: 0.8 });
  });
});
