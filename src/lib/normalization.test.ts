import { describe, expect, it } from "vitest";

import { cleanSurrogates, normalizeDate, sanitizeText } from "./normalization";

describe("normalizeDate", () => {
  it("rejects impossible calendar dates", () => {
    expect(normalizeDate("99/99/9999")).toBe("");
    expect(normalizeDate("31/02/2024")).toBe("");
  });

  it("normalizes valid BR dates", () => {
    expect(normalizeDate("21/03/2024")).toBe("2024-03-21 00:00:00");
  });

  it("normalizes valid ISO dates", () => {
    expect(normalizeDate("2024-03-21")).toBe("2024-03-21 00:00:00");
  });

  it("rejects invalid time values", () => {
    expect(normalizeDate("21/03/2024 25:00:00")).toBe("");
  });

  it("returns empty string for unrecognized values", () => {
    expect(normalizeDate("lixo")).toBe("");
  });
});

describe("sanitizeText", () => {
  it("removes emojis and preserves accents", () => {
    expect(sanitizeText("Lead 🔥")).toBe("Lead");
    expect(sanitizeText("Lead Quente 🔥")).toBe("Lead Quente");
    expect(sanitizeText("João Ávila 🔥")).toBe("João Ávila");
  });

  it("removes BOM and collapses whitespace", () => {
    expect(sanitizeText("\uFEFFLead")).toBe("Lead");
    expect(sanitizeText(" A\tB\nC ")).toBe("A B C");
  });

  it("removes flag emoji", () => {
    expect(sanitizeText("Brasil 🇧🇷")).toBe("Brasil");
  });

  it("keeps non-string values unchanged", () => {
    expect(sanitizeText(123)).toBe(123);
    expect(sanitizeText(null)).toBeNull();
  });
});

describe("cleanSurrogates", () => {
  it("remains compatible with sanitizeText behavior", () => {
    expect(cleanSurrogates("Lead 🔥")).toBe("Lead");
  });
});
