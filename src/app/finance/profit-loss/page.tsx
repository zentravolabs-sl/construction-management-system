import Link from "next/link";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateProjectProfitAndLoss } from "@/lib/calculations";
import { formatCompactLKR, formatLKR, round2, toNumber } from "@/lib/utils";
import { TrendingUp, ShieldCheck } from "lucide-react";

export default async function ProjectProfitAndLossPage() {
  const session = await requireModuleAccess("FINANCE", "READ");

  const projects = await prisma.project.findMany({
    where: { organizationId: session.organizationId, deletedAt: null },
    include: {
      client: true,
      variations: { where: { status: "APPROVED" } },
      stockIssues: { where: { status: "APPROVED" } },
      attendances: true,
      contractorPayments: { where: { status: "APPROVED" } },
      expenses: { where: { status: "APPROVED" } },
      equipmentAssignments: true,
    },
    orderBy: { code: "asc" },
  });

  const projectPnLs = projects.map((p) => {
    const contractRevenue = toNumber(p.contractValue);
    const approvedVariationRevenue = p.variations.reduce((s, v) => s + toNumber(v.amount), 0);
    const materialConsumptionCost = p.stockIssues.reduce((s, si) => s + toNumber(si.totalValue), 0);
    const labourCost = p.attendances.reduce((s, a) => s + toNumber(a.totalEarned), 0);
    const contractorCost = p.contractorPayments.reduce((s, cp) => s + toNumber(cp.netPayable), 0);

    const equipmentCost =
      p.expenses
        .filter((e) => e.category === "EQUIPMENT_RENTAL" || e.category === "MACHINERY_REPAIR")
        .reduce((s, e) => s + toNumber(e.amount), 0) +
      p.equipmentAssignments.reduce((s, ea) => s + toNumber(ea.rentalCostIncurred), 0);

    const transportCost = p.expenses
      .filter((e) => e.category === "TRANSPORT_EXPENSES" || e.category === "FUEL_EXPENSES")
      .reduce((s, e) => s + toNumber(e.amount), 0);

    const otherDirectCost = p.expenses
      .filter(
        (e) =>
          e.isDirectCost &&
          ![
            "MATERIAL_EXPENSES",
            "LABOUR_EXPENSES",
            "EQUIPMENT_RENTAL",
            "MACHINERY_REPAIR",
            "TRANSPORT_EXPENSES",
            "FUEL_EXPENSES",
            "ADMINISTRATIVE_EXPENSES",
          ].includes(e.category)
      )
      .reduce((s, e) => s + toNumber(e.amount), 0);

    const allocatedIndirectCost =
      toNumber(p.allocatedIndirectCost) +
      p.expenses
        .filter((e) => !e.isDirectCost || e.category === "ADMINISTRATIVE_EXPENSES")
        .reduce((s, e) => s + toNumber(e.amount), 0);

    const calc = calculateProjectProfitAndLoss({
      contractRevenue,
      approvedVariationRevenue,
      otherIncome: 0,
      materialConsumptionCost,
      labourCost,
      contractorCost,
      equipmentCost,
      transportCost,
      otherDirectCost,
      allocatedIndirectCost,
      originalBudget: toNumber(p.estimatedBudget),
      revisedBudget: toNumber(p.revisedBudget ?? p.estimatedBudget),
    });

    return {
      project: p,
      materialConsumptionCost,
      labourCost,
      contractorCost,
      equipmentCost,
      transportCost,
      otherDirectCost,
      allocatedIndirectCost,
      calc,
    };
  });

  const companyRevenue = projectPnLs.reduce((s, x) => s + x.calc.totalProjectRevenue, 0);
  const companyDirectCost = projectPnLs.reduce((s, x) => s + x.calc.totalDirectCosts, 0);
  const companyTotalCost = projectPnLs.reduce((s, x) => s + x.calc.totalProjectCost, 0);
  const companyGrossProfit = round2(companyRevenue - companyDirectCost);
  const companyNetProfit = round2(companyRevenue - companyTotalCost);
  const companyNetMargin =
    companyRevenue > 0 ? round2((companyNetProfit / companyRevenue) * 100) : 0;

  const exportRows = projectPnLs.map((item) => ({
    code: item.project.code,
    name: item.project.name,
    revenue: item.calc.totalProjectRevenue,
    budget: item.calc.effectiveBudget,
    materialCost: item.materialConsumptionCost,
    labourCost: item.labourCost,
    contractorCost: item.contractorCost,
    equipmentAndTransport: item.equipmentCost + item.transportCost + item.otherDirectCost,
    indirectCost: item.allocatedIndirectCost,
    totalCost: item.calc.totalProjectCost,
    grossProfit: item.calc.projectGrossProfit,
    netProfit: item.calc.projectNetProfit,
    marginPct: `${item.calc.profitMarginPct}%`,
    variance: item.calc.budgetVariance,
  }));

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Real-Time Project & Company Profit & Loss (P&L) Dashboard
            </h1>
            <p className="text-xs text-slate-500">
              Accrual-based revenue & cost recognition with zero-revenue protection and
              anti-double-counting architecture
            </p>
          </div>
          <ExportButtons
            title="Project & Company Profit and Loss Statement"
            filename="BuildMaster-Project-PnL-LKR"
            columns={[
              { header: "Project Code", key: "code" },
              { header: "Project Name", key: "name" },
              { header: "Total Revenue", key: "revenue" },
              { header: "Revised Budget", key: "budget" },
              { header: "Material Cost", key: "materialCost" },
              { header: "Labour Cost", key: "labourCost" },
              { header: "Contractor Cost", key: "contractorCost" },
              { header: "Equip & Transport", key: "equipmentAndTransport" },
              { header: "Indirect Cost", key: "indirectCost" },
              { header: "Total Cost", key: "totalCost" },
              { header: "Gross Profit", key: "grossProfit" },
              { header: "Net Profit", key: "netProfit" },
              { header: "Net Margin", key: "marginPct" },
              { header: "Budget Variance", key: "variance" },
            ]}
            rows={exportRows}
          />
        </div>

        {/* Company-Wide Summary Banner */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Company Total Project Revenue</div>
            <div className="mt-1 text-xl font-extrabold text-blue-600">
              {formatCompactLKR(companyRevenue)}
            </div>
            <div className="text-[11px] text-slate-400">{formatLKR(companyRevenue)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Total Direct Costs</div>
            <div className="mt-1 text-xl font-extrabold text-amber-600">
              {formatCompactLKR(companyDirectCost)}
            </div>
            <div className="text-[11px] text-slate-400">{formatLKR(companyDirectCost)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Company Gross Profit</div>
            <div className="mt-1 text-xl font-extrabold text-emerald-600">
              {formatCompactLKR(companyGrossProfit)}
            </div>
            <div className="text-[11px] text-slate-400">{formatLKR(companyGrossProfit)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Company Net Profit</div>
            <div className="mt-1 text-xl font-extrabold text-emerald-600">
              {formatCompactLKR(companyNetProfit)}
            </div>
            <div className="text-[11px] text-slate-400">{formatLKR(companyNetProfit)}</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Portfolio Net Margin
            </div>
            <div className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {companyNetMargin}%
            </div>
            <div className="text-[11px] text-emerald-600">
              (Net Profit / Total Revenue) × 100
            </div>
          </div>
        </div>

        {/* Project-by-Project Breakdown Cards */}
        <div className="space-y-4">
          {projectPnLs.map((item) => {
            const { project, calc } = item;
            return (
              <div
                key={project.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/projects/${project.id}?tab=profit-loss`}
                        className="font-mono text-xs font-bold text-blue-600 hover:underline"
                      >
                        {project.code}
                      </Link>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {project.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Client: {project.client.name} • Original Budget:{" "}
                      {formatLKR(toNumber(project.estimatedBudget))} • Revised Budget:{" "}
                      {formatLKR(calc.effectiveBudget)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs font-extrabold text-emerald-600">
                      Net Margin: {calc.profitMarginPct}%
                    </span>
                    <span className="rounded-xl bg-blue-500/15 px-3 py-1.5 text-xs font-bold text-blue-600">
                      Gross Margin: {calc.grossMarginPct}%
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                    <div className="text-slate-500">Total Revenue (Contract + VO)</div>
                    <div className="mt-1 text-sm font-extrabold text-blue-600">
                      {formatLKR(calc.totalProjectRevenue)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                    <div className="text-slate-500">Actual Cost Incurred</div>
                    <div className="mt-1 text-sm font-extrabold text-amber-600">
                      {formatLKR(calc.totalProjectCost)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                    <div className="text-slate-500">Actual Net Profit</div>
                    <div className="mt-1 text-sm font-extrabold text-emerald-600">
                      {formatLKR(calc.projectNetProfit)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                    <div className="text-slate-500">Budget Variance & Expected Final Cost</div>
                    <div className="mt-1 text-sm font-extrabold">
                      Var: {formatCompactLKR(calc.budgetVariance)} (Est. Final:{" "}
                      {formatCompactLKR(calc.expectedFinalCost)})
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500 sm:grid-cols-6">
                  <div>Materials: {formatCompactLKR(item.materialConsumptionCost)}</div>
                  <div>Labour: {formatCompactLKR(item.labourCost)}</div>
                  <div>Contractors: {formatCompactLKR(item.contractorCost)}</div>
                  <div>Equipment: {formatCompactLKR(item.equipmentCost)}</div>
                  <div>Transport/Fuel: {formatCompactLKR(item.transportCost)}</div>
                  <div>Indirect: {formatCompactLKR(item.allocatedIndirectCost)}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
            <ShieldCheck className="h-4 w-4" />
            Cost Recognition & Anti-Double-Counting Architecture
          </div>
          <p className="mt-1">
            Warehouse purchases (GRNs/POs) capitalize into Inventory Asset (GL 1200). Project
            Material Cost is recognized strictly upon Stock Issue to the project. Payroll expenses
            are recognized from verified Attendance/Payroll records without duplicating direct
            expense vouchers.
          </p>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

