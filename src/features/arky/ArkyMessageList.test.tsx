import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArkyMessageList } from "./ArkyMessageList";
import type { ArkyMessage, ArkyStreamEvent } from "./arky.types";

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

  it("shows only the active tool while streaming", () => {
    const events: ArkyStreamEvent[] = [
      {
        type: "tool_start",
        status: "chamando_tool",
        label: "Consultando obras",
        tool_name: "obras_list",
      },
      {
        type: "tool_end",
        status: "tool_concluida",
        label: "Obras consultadas",
        tool_name: "obras_list",
      },
      {
        type: "tool_start",
        status: "chamando_tool",
        label: "Consultando pagamentos",
        tool_name: "financeiro_pagamentos_overview",
      },
    ];

    const html = renderToStaticMarkup(
      <ArkyMessageList messages={[]} isLoading events={events} />
    );

    expect(html).toContain("Consultando pagamentos");
    expect(html).not.toContain("Consultando obras");
    expect(html).not.toContain("Obras consultadas");
  });
});
