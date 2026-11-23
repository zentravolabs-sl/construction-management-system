import Link from "next/link";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatCompactLKR,
  formatDateDDMMYYYY,
  formatLKR,
  toNumber,
} from "@/lib/utils";
import { Plus, MapPin, Calendar, ArrowUpRight, Edit } from "lucide-react";

export default async function ProjectsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await requireModuleAccess("PROJECTS", "READ");
  const params = await searchParams;
  const query = (params.q || "").trim();
  const statusFilter = (params.status || "").trim();

  const projects = await prisma.project.findMany({
    where: {
      organizationId: session.organizationId,
      deletedAt: null,
      ...(statusFilter ? { status: statusFilter as never } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { code: { contains: query, mode: "insensitive" } },
              { location: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      client: true,
      projectManager: true,
      tasks: true,
      milestones: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Construction Projects Portfolio ({projects.length})
            </h1>
            <p className="text-xs text-slate-500">
              Manage residential, commercial, industrial, road & infrastructure construction
              projects
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form method="GET" className="flex flex-wrap gap-2">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search code, project or site..."
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
              <select
                name="status"
                defaultValue={statusFilter}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="PLANNING">PLANNING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="ONGOING">ONGOING</option>
                <option value="ON_HOLD">ON_HOLD</option>
                <option value="DELAYED">DELAYED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
              <button
                type="submit"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              >
                Filter
              </button>
            </form>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Plus className="h-3.5 w-3.5" /> New Project
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {projects.map((p) => {
            const contractVal = toNumber(p.contractValue);
            const budgetVal = toNumber(p.revisedBudget ?? p.estimatedBudget);
            const prog = toNumber(p.calculatedProgress);

            return (
              <div
                key={p.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-blue-500/40 dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {p.code}
                      </span>
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {p.projectType.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          p.status === "COMPLETED"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : p.status === "DELAYED"
                            ? "bg-red-500/15 text-red-600"
                            : "bg-blue-500/15 text-blue-600"
                        }`}
                      >
                        {p.status}
                      </span>
                      <Link
                        href={`/projects/${p.id}/edit`}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:text-slate-900 dark:border-slate-700 dark:hover:text-white"
                        title="Edit Project"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>

                  <Link
                    href={`/projects/${p.id}`}
                    className="mt-3 block text-base font-bold text-slate-900 hover:text-blue-600 dark:text-white"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {p.description || "Construction engineering & site execution project."}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-500" />
                      {p.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-amber-500" />
                      {formatDateDDMMYYYY(p.startDate)} →{" "}
                      {formatDateDDMMYYYY(p.expectedCompletionDate)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        Calculated Milestone & Task Progress
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{prog}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${Math.min(100, prog)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                      <div className="text-[10px] text-slate-500">Client</div>
                      <div className="truncate font-bold">{p.client.name}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                      <div className="text-[10px] text-slate-500">Contract Value</div>
                      <div className="font-bold text-blue-600">{formatCompactLKR(contractVal)}</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                      <div className="text-[10px] text-slate-500">Revised Budget</div>
                      <div className="font-bold">{formatCompactLKR(budgetVal)}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap gap-1.5">
                      <Link
                        href={`/projects/${p.id}/boq`}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        BOQ
                      </Link>
                      <Link
                        href={`/projects/${p.id}/tasks`}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        Tasks ({p.tasks.length})
                      </Link>
                      <Link
                        href={`/projects/${p.id}/finance`}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        P&L
                      </Link>
                    </div>
                    <Link
                      href={`/projects/${p.id}`}
                      className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Open 12-Tab Workspace <ArrowUpRight className="h-3.5 w-3.5" />
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

