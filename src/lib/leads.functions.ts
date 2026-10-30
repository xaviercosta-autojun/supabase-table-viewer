import { createServerFn } from "@tanstack/react-start";

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
