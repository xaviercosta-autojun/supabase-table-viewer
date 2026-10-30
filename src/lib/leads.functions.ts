import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type Lead = {
  id: number;
  created_at: string;
  Nome: string | null;
  empresa: string | null;
  Valor: number | null;
  Etapa: string | null;
};

export const getLeads = createServerFn({ method: "GET" }).handler(async (): Promise<Lead[]> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("Leads")
    .select("id, created_at, Nome, empresa, Valor, Etapa")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ ...r, Valor: r.Valor == null ? null : Number(r.Valor) }));
});


export const newLeadSchema = z.object({
  Nome: z.string().trim().min(1, "Informe o nome").max(200),
  empresa: z.string().trim().max(200).optional().default(""),
  Valor: z.number().min(0).max(1e12).nullable(),
  Etapa: z.string().trim().max(100).optional().default(""),
});

export const addLead = createServerFn({ method: "POST" })
  .validator((d: unknown) => newLeadSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("Leads").insert({
      Nome: data.Nome,
      empresa: data.empresa || null,
      Valor: data.Valor,
      Etapa: data.Etapa || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const STAGES = ["Novo", "Em contato", "Fechado"] as const;

export const updateLeadStage = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ id: z.number().int().positive(), Etapa: z.enum(STAGES) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("Leads").update({ Etapa: data.Etapa }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
