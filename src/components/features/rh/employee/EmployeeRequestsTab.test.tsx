import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { EmployeeRequestsTab } from "./EmployeeRequestsTab";

// A aba abre com o formulario vazio e monta o payload do ajuste a cada render.
// Se esse calculo lancar, a excecao sobe ate o errorElement da rota e o
// funcionario perde a aplicacao inteira em vez de ver a aba.
describe("EmployeeRequestsTab", () => {
  it("abre com o formulario vazio sem derrubar a rota", () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    expect(() =>
      renderToStaticMarkup(
        <QueryClientProvider client={queryClient}>
          <EmployeeRequestsTab />
        </QueryClientProvider>,
      ),
    ).not.toThrow();
  });
});
