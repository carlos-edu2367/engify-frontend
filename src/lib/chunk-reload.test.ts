import { describe, expect, it } from "vitest";
import { isDynamicImportFetchError } from "./chunk-reload";

describe("chunk reload helpers", () => {
  it("detects dynamic import fetch failures from stale vite chunks", () => {
    expect(
      isDynamicImportFetchError(
        new TypeError(
          "Failed to fetch dynamically imported module: https://engify.arcaikaengenharia.com/assets/RhDashboardPage-DVQ_tkTh.js"
        )
      )
    ).toBe(true);
  });

  it("does not classify ordinary application errors as chunk failures", () => {
    expect(isDynamicImportFetchError(new Error("Permissao negada"))).toBe(false);
  });
});
