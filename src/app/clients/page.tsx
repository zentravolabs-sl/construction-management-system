import Link from "next/link";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCompactLKR, formatLKR, toNumber } from "@/lib/utils";
import { Users, Plus, Phone, Mail, Building2, ArrowUpRight } from "lucide-react";

export default async function ClientsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireModuleAccess("CLIENTS", "READ");
  const params = await searchParams;
  const query = (params.q || "").trim();

  const clients = await prisma.client.findMany({
    where: {
      organizationId: session.organizationId,
      deletedAt: null,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { clientCode: { contains: query, mode: "insensitive" } },
              { city: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      projects: true,
      invoices: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Client Registry & Account Balances
            </h1>
            <p className="text-xs text-slate-500">
              Manage property developers, government agencies, commercial clients, and client portal
              access
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <form method="GET" className="flex gap-2">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search client name, code or city..."
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
              <button
                type="submit"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              >
                Search
              </button>
            </form>
            <Link
              href="/clients/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Plus className="h-3.5 w-3.5" /> Register Client
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => {
            const totalContract = c.projects.reduce(
              (s, p) => s + toNumber(p.contractValue),
              0
            );
            const totalBilled = c.invoices.reduce((s, i) => s + toNumber(i.totalAmount), 0);
            const totalOutstanding = c.invoices.reduce(
              (s, i) => s + toNumber(i.outstandingAmount),
              0
            );

            return (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-500/40 dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {c.clientCode}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {c.clientType}
                    </span>
                  </div>
                  <Link
                    href={`/clients/${c.id}`}
                    className="mt-3 block text-base font-bold text-slate-900 hover:text-blue-600 dark:text-white"
                  >
                    {c.name}
                  </Link>
                  <div className="mt-1 text-xs text-slate-500">
                    Contact: {c.contactPerson || "Primary Representative"} • {c.city || "Colombo"}
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{c.phone}</span>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{c.email}</span>
                      </div>
                    )}
                    {c.nicOrBrn && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>BRN/NIC: {c.nicOrBrn}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
                      <div className="text-[10px] text-slate-500">Projects</div>
                      <div className="text-xs font-bold">{c.projects.length}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2 dark:bg-slate-800/60">
                      <div className="text-[10px] text-slate-500">Contracts</div>
                      <div className="text-xs font-bold">{formatCompactLKR(totalContract)}</div>
                    </div>
                    <div className="rounded-xl bg-amber-500/10 p-2">
                      <div className="text-[10px] text-amber-600 dark:text-amber-400">
                        Outstanding
                      </div>
                      <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
                        {formatCompactLKR(totalOutstanding)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Billed: {formatLKR(totalBilled)}</span>
                    <Link
                      href={`/clients/${c.id}`}
                      className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Client Profile <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ErpPageWrapper>
  );
}

