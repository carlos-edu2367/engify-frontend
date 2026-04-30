import { describe, expect, it } from "vitest";
import { inviteSchema } from "./team.schemas";

describe("inviteSchema", () => {
  it("accepts common employee users for Meu RH access", () => {
    const result = inviteSchema.safeParse({
      email: "funcionario@example.com",
      role: "funcionario",
    });

    expect(result.success).toBe(true);
  });
});
