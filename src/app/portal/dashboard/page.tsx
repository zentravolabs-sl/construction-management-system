import Link from "next/link";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCompactLKR, formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";
import { Globe, FolderKanban, FileText, Landmark, ShieldCheck } from "lucide-react";

export default async function ClientPortalDashboardPage() {
  const session = await requireSession();

  // Strict Client Isolation: If logged in user is a CLIENT with clientId, restrict strictly to that client's records!
  const clientFilter = session.clientId ? { clientId: session.clientId } : {};

  const [projects, invoices, documents] = await Promise.all([
    prisma.project.findMany({
      where: {
        organizationId: session.organizationId,
        deletedAt: null,
        ...clientFilter,
      },
      include: { milestones: true, client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: {
        organizationId: session.organizationId,
        ...clientFilter,
      },
      orderBy: { invoiceDate: "desc" },
    }),
    prisma.document.findMany({
      where: {
        organizationId: session.organizationId,
        isClientVisible: true,
        ...(session.clientId ? { project: { clientId: session.clientId } } : {}),
      },
      include: { project: true },
    }),
  ]);

  const totalContract = projects.reduce((s, p) => s + toNumber(p.contractValue), 0);
  const totalPaid = invoices.reduce((s, i) => s + toNumber(i.paidAmount), 0);
  const totalOutstanding = invoices.reduce((s, i) => s + toNumber(i.outstandingAmount), 0);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-500/30 bg-blue-600/5 p-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-blue-600 dark:text-blue-400">
              <Globe className="h-4 w-4" />
              Dedicated Client Project Portal
            </div>
            <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              Welcome, {projects[0]?.client.name || session.fullName}
            </h1>
            <p className="text-xs text-slate-500">
              Track live construction progress, milestone completions, progress invoices, and
              approved engineering documents
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/portal/projects"
              className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white"
            >
              My Projects ({projects.length})
            </Link>
            <Link
              href="/portal/invoices"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
            >
              Invoices ({invoices.length})
            </Link>
            <Link
              href="/portal/documents"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
            >
              Documents ({documents.length})
            </Link>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Your Active Contracts</div>
            <div className="mt-1 text-xl font-extrabold">{formatCompactLKR(totalContract)}</div>
            <div className="text-[11px] text-slate-400">{projects.length} Construction Projects</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Payments Settled</div>
            <div className="mt-1 text-xl font-extrabold text-emerald-600">
              {formatCompactLKR(totalPaid)}
            </div>
            <div className="text-[11px] text-slate-400">{formatLKR(totalPaid)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Outstanding IPC Balance</div>
            <div className="mt-1 text-xl font-extrabold text-amber-600">
              {formatCompactLKR(totalOutstanding)}
            </div>
            <div className="text-[11px] text-slate-400">{formatLKR(totalOutstanding)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Shared Engineering Files</div>
            <div className="mt-1 text-xl font-extrabold">{documents.length} Files</div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600">
              <ShieldCheck className="h-3.5 w-3.5" /> Strict Client Isolation
            </div>
          </div>
        </div>

        {/* Client Projects & Milestones */}
        <div className="space-y-4">
          {projects.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-600">{p.code}</span>
                  <h2 className="text-base font-bold">{p.name}</h2>
                  <p className="text-xs text-slate-500">
                    Location: {p.location} • Target Completion:{" "}
                    {formatDateDDMMYYYY(p.expectedCompletionDate)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Physical Completion</div>
                  <div className="text-xl font-extrabold text-blue-600">
                    {toNumber(p.calculatedProgress)}%
                  </div>
                </div>
              </div>

              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${Math.min(100, toNumber(p.calculatedProgress))}%` }}
                />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {p.milestones.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800"
                  >
                    <div className="font-bold">{m.title}</div>
                    <div className="mt-1 flex justify-between text-slate-500">
                      <span>Progress: {toNumber(m.progressPct)}%</span>
                      <span>Due: {formatDateDDMMYYYY(m.dueDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ErpPageWrapper>
  );
}

