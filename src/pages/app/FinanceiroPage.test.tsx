import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PaymentCreatorMeta } from "./FinanceiroPage";

describe("PaymentCreatorMeta", () => {
  it("shows the payment creation time in the local timezone", () => {
    const markup = renderToStaticMarkup(
      <PaymentCreatorMeta
        payment={{
          id: "payment-1",
          title: "Pagamento",
          valor: "100.00",
          classe: "servico",
          status: "aguardando",
          created_by_engineer: false,
          created_by_name: "Carlos",
          created_at: "2026-07-18T15:45:00Z",
        }}
      />,
    );

    expect(markup).toContain("Criado em: 18/07/2026 às 12:45");
  });
});
