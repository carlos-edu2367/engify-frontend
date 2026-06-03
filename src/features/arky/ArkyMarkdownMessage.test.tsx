import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArkyMarkdownMessage, parseMarkdownBlocks } from "./ArkyMarkdownMessage";

describe("ArkyMarkdownMessage", () => {
  it("parses headings, lists and code blocks", () => {
    const blocks = parseMarkdownBlocks([
      "## Resumo",
      "",
      "- Obra **A**",
      "- Pagamento `pendente`",
      "",
      "```",
      "total = 10",
      "```",
    ].join("\n"));

    expect(blocks).toEqual([
      { type: "heading", level: 3, text: "Resumo" },
      { type: "unordered-list", items: ["Obra **A**", "Pagamento `pendente`"] },
      { type: "code", text: "total = 10" },
    ]);
  });

  it("renders markdown without trusting raw html", () => {
    const html = renderToStaticMarkup(
      <ArkyMarkdownMessage
        content={[
          "### Financeiro",
          "Use **filtros** e veja `pagamentos`.",
          "",
          "1. Abra [Financeiro](/financeiro)",
          "2. Nao abra [script](javascript:alert(1))",
          "",
          "<script>alert('x')</script>",
        ].join("\n")}
      />
    );

    expect(html).toContain("<h3");
    expect(html).toContain("<strong");
    expect(html).toContain("<code");
    expect(html).toContain('href="/financeiro"');
    expect(html).not.toContain("javascript:alert");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
