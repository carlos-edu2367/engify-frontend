import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../");

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("frontend source text encoding", () => {
  it("keeps visible strings free from mojibake in the affected screens", () => {
    const files = [
      "components/layout/navigation.ts",
      "pages/app/MembrosPage.tsx",
      "pages/public/LandingPage.tsx",
    ];
    const mojibakePattern = /ConfiguraÃ|CalendÃ|DiÃ|UsuÃ|MÃ|AtÃ|JosÃ|Ã§|Ã£|Ã¡|Ã©|Ãª|Ã­|Ã³|Ãº|Ãµ|âœ|Â©/;

    for (const file of files) {
      const source = read(file);
      expect(source).not.toMatch(mojibakePattern);
    }
  });
});
