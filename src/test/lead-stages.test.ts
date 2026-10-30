import { describe, it, expect } from "vitest";
import { STAGES } from "@/lib/leads.functions";

describe("lead stages", () => {
  it("are exactly Novo, Em contato, Fechado", () => {
    expect([...STAGES]).toEqual(["Novo", "Em contato", "Fechado"]);
  });
});
