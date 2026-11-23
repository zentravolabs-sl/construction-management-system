import Link from "next/link";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";
import { HardHat, Plus, CalendarCheck, Calculator, Wallet } from "lucide-react";

export default async function LabourDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const session = await requireModuleAccess("LABOUR", "READ");
  const sp = await searchParams;
  const catFilter = (sp.category || "").trim();
  const query = (sp.q || "").trim();

  const labours = await prisma.labour.findMany({
    where: {
      organizationId: session.organizationId,
      deletedAt: null,
      ...(catFilter ? { categoryType: catFilter as never } : {}),
      ...(query
        ? {
            OR: [
              { fullName: { contains: query, mode: "insensitive" } },
              { labourCode: { contains: query, mode: "insensitive" } },
              { nicNumber: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      assignments: { where: { isCurrent: true }, include: { project: true } },
      attendances: true,
    },
    orderBy: { labourCode: "asc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Workforce & Labour Management ({labours.length} Workers)
            </h1>
            <p className="text-xs text-slate-500">
              Manage masons, carpenters, electricians, welders, operators, daily wages, attendance &
              monthly payroll
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/labour/attendance"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
            >
              <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" /> Attendance
            </Link>
            <Link
              href="/labour/payroll"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
            >
              <Calculator className="h-3.5 w-3.5 text-blue-600" /> Payroll & Payslips
            </Link>
            <Link
              href="/labour/advances"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
            >
              <Wallet className="h-3.5 w-3.5 text-amber-600" /> Advances
            </Link>
            <Link
              href="/labour/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Plus className="h-3.5 w-3.5" /> Register Worker
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <form method="GET" className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search worker name, ID or NIC..."
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
          />
          <select
            name="category"
            defaultValue={catFilter}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">All Trade Categories</option>
            <option value="MASON">Mason</option>
            <option value="CARPENTER">Carpenter</option>
            <option value="ELECTRICIAN">Electrician</option>
            <option value="PLUMBER">Plumber</option>
            <option value="PAINTER">Painter</option>
            <option value="WELDER">Welder</option>
            <option value="HELPER">Helper</option>
            <option value="MACHINE_OPERATOR">Machine Operator</option>
            <option value="SITE_SUPERVISOR">Site Supervisor</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white dark:bg-blue-600"
          >
            Filter
          </button>
        </form>

        {/* Workforce Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2.5 font-semibold">Labour ID</th>
                  <th className="pb-2.5 font-semibold">Full Name & NIC</th>
                  <th className="pb-2.5 font-semibold">Category / Trade</th>
                  <th className="pb-2.5 font-semibold">Employment Type</th>
                  <th className="pb-2.5 font-semibold">Daily Wage / Salary</th>
                  <th className="pb-2.5 font-semibold">OT Rate / Hr</th>
                  <th className="pb-2.5 font-semibold">Assigned Project</th>
                  <th className="pb-2.5 font-semibold">Shifts Logged</th>
                  <th className="pb-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {labours.map((l) => (
                  <tr key={l.id}>
                    <td className="py-3 pr-3 font-mono font-bold text-blue-600">{l.labourCode}</td>
                    <td className="py-3 pr-3">
                      <div className="font-bold text-slate-900 dark:text-white">{l.fullName}</div>
                      <div className="text-slate-500">
                        NIC: {l.nicNumber} • {l.phone}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 font-semibold text-blue-600 dark:text-blue-400">
                        {l.categoryType}
                      </span>
                    </td>
                    <td className="py-3 pr-3">{l.employmentType.replace(/_/g, " ")}</td>
                    <td className="py-3 pr-3 font-semibold">
                      {l.employmentType === "MONTHLY_SALARY"
                        ? `${formatLKR(toNumber(l.monthlySalary))}/mo`
                        : `${formatLKR(toNumber(l.dailyWage))}/day`}
                    </td>
                    <td className="py-3 pr-3">{formatLKR(toNumber(l.overtimeHourlyRate))}</td>
                    <td className="py-3 pr-3 text-slate-600 dark:text-slate-300">
                      {l.assignments[0]?.project.code || "Unassigned"}
                    </td>
                    <td className="py-3 pr-3 font-bold">{l.attendances.length} days</td>
                    <td className="py-3">
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

