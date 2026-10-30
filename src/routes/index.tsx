import { createFileRoute, useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getLeads } from "@/lib/leads.functions";

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
      <p className="text-destructive">Erro ao carregar leads: {error.message}</p>
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
