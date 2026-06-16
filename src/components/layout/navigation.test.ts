import { describe, expect, it } from "vitest";
import { getVisibleNavItems } from "./navigation";

describe("getVisibleNavItems", () => {
  it("shows admin RH and Meu RH when an admin is linked to an employee", () => {
    const items = getVisibleNavItems({ role: "admin", hasEmployeeLink: true });

    expect(items.map((item) => item.label)).toContain("RH");
    expect(items.map((item) => item.label)).toContain("Meu RH");
  });

  it("shows only Meu RH for a funcionario user", () => {
    const items = getVisibleNavItems({ role: "funcionario", hasEmployeeLink: true });
    expect(items.map((item) => item.label)).toEqual(["Meu RH"]);
  });

  it("hides Meu RH when the user is not linked to an employee", () => {
    const items = getVisibleNavItems({ role: "admin", hasEmployeeLink: false });

    expect(items.map((item) => item.label)).not.toContain("Meu RH");
  });
});
