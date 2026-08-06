import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PaymentCreatorMeta, getMonthBounds, getMonthFromRange } from "./FinanceiroPage";

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

describe("getMonthBounds", () => {
  it("cobre o mês inteiro", () => {
    expect(getMonthBounds("2026-03")).toEqual({ start: "2026-03-01", end: "2026-03-31" });
  });

  it("respeita meses de 30 dias", () => {
    expect(getMonthBounds("2026-04")).toEqual({ start: "2026-04-01", end: "2026-04-30" });
  });

  it("respeita fevereiro em ano bissexto", () => {
    expect(getMonthBounds("2028-02")).toEqual({ start: "2028-02-01", end: "2028-02-29" });
  });

  it("respeita fevereiro em ano nao bissexto", () => {
    expect(getMonthBounds("2026-02")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
  });
});

describe("getMonthFromRange", () => {
  it("reconhece um mês cheio", () => {
    expect(getMonthFromRange("2026-03-01", "2026-03-31")).toBe("2026-03");
  });

  it("fica vazio quando o intervalo nao cobre o mês inteiro", () => {
    expect(getMonthFromRange("2026-03-05", "2026-03-31")).toBe("");
    expect(getMonthFromRange("2026-03-01", "2026-03-20")).toBe("");
  });

  it("fica vazio quando o intervalo cruza meses", () => {
    expect(getMonthFromRange("2026-03-01", "2026-04-30")).toBe("");
  });

  it("fica vazio quando o período está incompleto", () => {
    expect(getMonthFromRange("", "")).toBe("");
    expect(getMonthFromRange("2026-03-01", "")).toBe("");
  });
});
