import { describe, expect, it } from "vitest";

import { makeUniqueHeaders } from "./headers";

describe("makeUniqueHeaders", () => {
  it("suffixes duplicate headers", () => {
    expect(makeUniqueHeaders(["Email", "Email"])).toEqual(["Email", "Email_2"]);
    expect(makeUniqueHeaders(["Email", "Email", "Email"])).toEqual([
      "Email",
      "Email_2",
      "Email_3",
    ]);
  });

  it("uses fallback names for blank headers", () => {
    expect(makeUniqueHeaders(["", "Email"])).toEqual(["Coluna_1", "Email"]);
    expect(makeUniqueHeaders([null, "Nome"])).toEqual(["Coluna_1", "Nome"]);
  });

  it("trims before checking duplicates", () => {
    expect(makeUniqueHeaders([" Email ", "Email"])).toEqual(["Email", "Email_2"]);
  });
});
