import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArkyMessageList } from "./ArkyMessageList";
import type { ArkyMessage } from "./arky.types";

describe("ArkyMessageList markdown rendering", () => {
  it("renders assistant markdown with react-markdown styling", () => {
    const messages: ArkyMessage[] = [
      {
        id: "assistant-1",
        role: "assistant",
        content: [
          "## Financeiro",
          "Use **filtros** e veja `pagamentos`.",
          "",
          "- Entradas",
          "- Saidas",
          "",
          "```",
          "saldo = entradas - saidas",
          "```",
        ].join("\n"),
        timestamp: new Date("2026-06-03T12:00:00Z"),
      },
    ];

    const html = renderToStaticMarkup(
      <ArkyMessageList messages={messages} isLoading={false} />
    );

    expect(html).toContain("<h2");
    expect(html).toContain("<strong");
    expect(html).toContain("<ul");
    expect(html).toContain("<pre");
    expect(html).toContain("pagamentos");
  });

  it("does not render raw html from model output", () => {
    const messages: ArkyMessage[] = [
      {
        id: "assistant-1",
        role: "assistant",
        content: "<script>alert('x')</script>\n\n[unsafe](javascript:alert(1))",
        timestamp: new Date("2026-06-03T12:00:00Z"),
      },
    ];

    const html = renderToStaticMarkup(
      <ArkyMessageList messages={messages} isLoading={false} />
    );

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain("&lt;script&gt;");
  });
});
