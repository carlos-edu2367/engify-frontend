import { describe, expect, it } from "vitest";
import { parseHumanCurrencyToDecimalString } from "./money-input";

describe("parseHumanCurrencyToDecimalString", () => {
  it.each([
    ["190,50", "190.50"],
    ["190.50", "190.50"],
    ["1.900,50", "1900.50"],
    ["1900,50", "1900.50"],
    ["  R$ 1.900,50  ", "1900.50"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(parseHumanCurrencyToDecimalString(input)).toBe(expected);
  });

  it.each(["", "abc", "1,234.56", "1.900.50", "10,123", "0", "-10,00"])(
    "rejects invalid or ambiguous value %s",
    (input) => {
      expect(() => parseHumanCurrencyToDecimalString(input)).toThrow(
        "Informe um valor valido, ex: 190,50"
      );
    }
  );
});
