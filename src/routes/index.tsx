import { createFileRoute, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getLeads, addLead } from "@/lib/leads.functions";

const leadsQuery = queryOptions({ queryKey: ["leads"], queryFn: () => getLeads() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Leads" },
      { name: "description", content: "Lista de leads do funil de vendas." },
      { property: "og:title", content: "Leads" },
      { property: "og:description", content: "Lista de leads do funil de vendas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(leadsQuery),
  component: LeadsPage,
  errorComponent: ErrorView,
  notFoundComponent: () => <p className="p-8">Nada encontrado.</p>,
});

function ErrorView({ error }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <div className="p-8">
      <p className="text-destructive">Erro ao carregar leads: {error instanceof Error ? error.message : String(error)}</p>
      <button className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={() => router.invalidate()}>
        Tentar novamente
      </button>
    </div>
  );
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function LeadsPage() {
  const { data: leads } = useSuspenseQuery(leadsQuery);
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6 flex items-end justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <span className="text-sm text-muted-foreground">{leads.length} registros</span>
      </header>
      <NewLeadForm />
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground">
            <tr>
              {["ID", "Nome", "Empresa", "Valor", "Etapa", "Criado em"].map((h) => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhum lead ainda.</td></tr>
            ) : (
              leads.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="px-4 py-3 text-muted-foreground">{l.id}</td>
                  <td className="px-4 py-3 font-medium">{l.Nome ?? "—"}</td>
                  <td className="px-4 py-3">{l.empresa ?? "—"}</td>
                  <td className="px-4 py-3">{l.Valor == null ? "—" : brl.format(l.Valor)}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-1 text-xs">{l.Etapa ?? "—"}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function NewLeadForm() {
  const qc = useQueryClient();
  const add = useServerFn(addLead);
  const [form, setForm] = useState({ Nome: "", empresa: "", Valor: "", Etapa: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form.Nome.trim()) return setErr("Informe o nome");
    const valor = form.Valor.trim() === "" ? null : Number(form.Valor.replace(",", "."));
    if (valor !== null && (Number.isNaN(valor) || valor < 0)) return setErr("Valor inválido");
    setSaving(true);
    setErr(null);
    try {
      await add({ data: { Nome: form.Nome, empresa: form.empresa, Valor: valor, Etapa: form.Etapa } });
      setForm({ Nome: "", empresa: "", Valor: "", Etapa: "" });
      await qc.invalidateQueries({ queryKey: ["leads"] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const field = "rounded-md border bg-background px-3 py-2 text-sm";
  return (
    <form onSubmit={submit} className="mb-6 rounded-lg border bg-card p-4">
      <h2 className="mb-3 font-semibold">Novo lead</h2>
      <div className="grid gap-3 sm:grid-cols-5">
        <input className={field} placeholder="Nome *" maxLength={200} value={form.Nome} onChange={(e) => setForm({ ...form, Nome: e.target.value })} />
        <input className={field} placeholder="Empresa" maxLength={200} value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
        <input className={field} placeholder="Valor (R$)" inputMode="decimal" value={form.Valor} onChange={(e) => setForm({ ...form, Valor: e.target.value })} />
        <input className={field} placeholder="Etapa" maxLength={100} value={form.Etapa} onChange={(e) => setForm({ ...form, Etapa: e.target.value })} />
        <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {saving ? "Salvando..." : "Adicionar"}
        </button>
      </div>
      {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
    </form>
  );
}
