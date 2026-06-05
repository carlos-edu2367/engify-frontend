import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ArkyActionCard } from "./ArkyActionCard";
import type { ArkyCardResponse } from "./arky.types";

function renderCard(card: ArkyCardResponse) {
  const queryClient = new QueryClient();

  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ArkyActionCard card={card} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("ArkyActionCard", () => {
  it("renders payment code in scheduled payment review items", () => {
    const card: ArkyCardResponse = {
      type: "action_preview",
      title: "Pagamentos a agendar",
      summary: "Agendar 1 pagamento",
      risk: "preparacao",
      requires_confirmation: true,
      action_preview_id: "preview-1",
      data: {
        total: 120,
        quantidade: 1,
        itens: [
          {
            title: "Material obra X",
            valor: 120,
            classe: "material",
            data_agendada: "2026-06-05T12:00:00Z",
            tem_codigo_pagamento: true,
            payment_cod: "pix-1",
          },
        ],
      },
    };

    const html = renderCard(card);

    expect(html).toContain("Código Pix");
    expect(html).toContain("pix-1");
  });
});
