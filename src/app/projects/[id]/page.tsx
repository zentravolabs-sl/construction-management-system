import Link from "next/link";
import { notFound } from "next/navigation";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculateProjectProfitAndLoss,
  calculateProjectProgress,
} from "@/lib/calculations";
import {
  formatCompactLKR,
  formatDateDDMMYYYY,
  formatLKR,
  toNumber,
} from "@/lib/utils";
import {
  createBoqItemAction,
  createClientInvoiceAction,
  createDailySiteReportAction,
  createDocumentAction,
  createExpenseAction,
  createMilestoneAction,
  createProjectTaskAction,
  updateTaskStatusAction,
} from "@/actions/erp";
import {
  ArrowLeft,
  Calendar,
  Edit,
  MapPin,
  Plus,
  TrendingUp,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "1. Overview" },
  { id: "boq", label: "2. BOQ" },
  { id: "tasks", label: "3. Tasks & Milestones" },
  { id: "labour", label: "4. Labour" },
  { id: "materials", label: "5. Materials" },
  { id: "contractors", label: "6. Contractors" },
  { id: "expenses", label: "7. Expenses" },
  { id: "invoices", label: "8. Invoices" },
  { id: "payments", label: "9. Payments" },
  { id: "documents", label: "10. Documents" },
  { id: "site-reports", label: "11. Site Reports" },
  { id: "profit-loss", label: "12. Profit & Loss" },
];

export default async function ProjectDetailWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireModuleAccess("PROJECTS", "READ");
  const { id } = await params;
  const sp = await searchParams;
  const activeTab = sp.tab || "overview";

  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      client: true,
      branch: true,
      projectManager: true,
      milestones: { orderBy: { dueDate: "asc" } },
      tasks: { orderBy: { startDate: "asc" } },
      variations: { orderBy: { createdAt: "desc" } },
      boqs: {
        include: {
          categories: { include: { items: true }, orderBy: { sortOrder: "asc" } },
          items: true,
          revisions: { orderBy: { versionNumber: "desc" } },
        },
      },
      labourAssignments: { include: { labour: true } },
      attendances: { include: { labour: true }, orderBy: { workDate: "desc" }, take: 30 },
      stockIssues: {
        include: { items: { include: { material: true } }, warehouse: true },
        orderBy: { issueDate: "desc" },
      },
      contractorAgreements: {
        include: { contractor: true, payments: true },
      },
      contractorPayments: {
        include: { contractor: true, agreement: true },
        orderBy: { paymentDate: "desc" },
      },
      expenses: { orderBy: { expenseDate: "desc" } },
      invoices: {
        include: { allocations: { include: { payment: true } } },
        orderBy: { invoiceDate: "desc" },
      },
      documents: { orderBy: { createdAt: "desc" } },
      dailySiteReports: { orderBy: { reportDate: "desc" } },
      equipmentAssignments: { include: { equipment: true } },
    },
  });

  if (!project) notFound();

  const liveProgress = calculateProjectProgress(
    project.milestones.map((m) => ({
      weightPct: toNumber(m.weightPct),
      progressPct: toNumber(m.progressPct),
      isCompleted: m.isCompleted,
    })),
    project.tasks.map((t) => ({
      weight: t.weight,
      progressPct: toNumber(t.progressPct),
      status: t.status,
    }))
  );

  // Calculate Live Project Profit & Loss without double counting
  const approvedVariations = project.variations
    .filter((v) => v.status === "APPROVED")
    .reduce((s, v) => s + toNumber(v.amount), 0);

  const materialConsumptionCost = project.stockIssues
    .filter((si) => si.status === "APPROVED")
    .reduce((s, si) => s + toNumber(si.totalValue), 0);

  const labourCost = project.attendances.reduce((s, a) => s + toNumber(a.totalEarned), 0);

  const contractorCost = project.contractorPayments
    .filter((cp) => cp.status === "APPROVED")
    .reduce((s, cp) => s + toNumber(cp.netPayable), 0);

  const approvedExpenses = project.expenses.filter((e) => e.status === "APPROVED");

  const equipmentCost =
    approvedExpenses
      .filter((e) => e.category === "EQUIPMENT_RENTAL" || e.category === "MACHINERY_REPAIR")
      .reduce((s, e) => s + toNumber(e.amount), 0) +
    project.equipmentAssignments.reduce((s, ea) => s + toNumber(ea.rentalCostIncurred), 0);

  const transportCost = approvedExpenses
    .filter((e) => e.category === "TRANSPORT_EXPENSES" || e.category === "FUEL_EXPENSES")
    .reduce((s, e) => s + toNumber(e.amount), 0);

  // Exclude MATERIAL_EXPENSES and LABOUR_EXPENSES already counted via StockIssue / Attendance
  const otherDirectCost = approvedExpenses
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

  const indirectExpenses =
    toNumber(project.allocatedIndirectCost) +
    approvedExpenses
      .filter((e) => !e.isDirectCost || e.category === "ADMINISTRATIVE_EXPENSES")
      .reduce((s, e) => s + toNumber(e.amount), 0);

  const pnl = calculateProjectProfitAndLoss({
    contractRevenue: toNumber(project.contractValue),
    approvedVariationRevenue: approvedVariations,
    otherIncome: 0,
    materialConsumptionCost,
    labourCost,
    contractorCost,
    equipmentCost,
    transportCost,
    otherDirectCost,
    allocatedIndirectCost: indirectExpenses,
    originalBudget: toNumber(project.estimatedBudget),
    revisedBudget: toNumber(project.revisedBudget ?? project.estimatedBudget),
  });

  const activeBoq = project.boqs[0];

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        {/* Project Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                  {project.code}
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                  {project.status}
                </span>
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-600">
                  Priority: {project.priority}
                </span>
                <span className="text-xs text-slate-500">
                  Client:{" "}
                  <Link
                    href={`/clients/${project.clientId}`}
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    {project.client.name}
                  </Link>
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {project.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" />
                  {project.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  {formatDateDDMMYYYY(project.startDate)} →{" "}
                  {formatDateDDMMYYYY(project.expectedCompletionDate)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/projects/${project.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <Edit className="h-3.5 w-3.5" /> Edit Project
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> All Projects
              </Link>
            </div>
          </div>

          {/* Top Financial & Progress Bar */}
          <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-5 dark:border-slate-800">
            <div>
              <div className="text-xs text-slate-500">Total Revenue (Inc. Variations)</div>
              <div className="mt-0.5 text-base font-extrabold text-slate-900 dark:text-white">
                {formatCompactLKR(pnl.totalProjectRevenue)}
              </div>
              <div className="text-[11px] text-slate-400">
                {formatLKR(pnl.totalProjectRevenue)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Revised Budget</div>
              <div className="mt-0.5 text-base font-extrabold text-blue-600">
                {formatCompactLKR(pnl.effectiveBudget)}
              </div>
              <div className="text-[11px] text-slate-400">
                Utilized: {pnl.budgetUtilizationPct}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Actual Cost Incurred</div>
              <div className="mt-0.5 text-base font-extrabold text-amber-600">
                {formatCompactLKR(pnl.totalProjectCost)}
              </div>
              <div className="text-[11px] text-slate-400">
                Variance: {formatCompactLKR(pnl.budgetVariance)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Projected Net Profit</div>
              <div className="mt-0.5 text-base font-extrabold text-emerald-600">
                {formatCompactLKR(pnl.projectNetProfit)}
              </div>
              <div className="text-[11px] text-emerald-600">
                Net Margin: {pnl.profitMarginPct}%
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Calculated Progress</span>
                <span className="font-bold text-blue-600">{liveProgress}%</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${Math.min(100, liveProgress)}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                Weighted Milestones ({project.milestones.length}) & Tasks ({project.tasks.length})
              </div>
            </div>
          </div>

          {/* 12 Tabs Navigation */}
          <div className="mt-6 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4 dark:border-slate-800">
            {TABS.map((t) => {
              const isAct = activeTab === t.id;
              return (
                <Link
                  key={t.id}
                  href={`/projects/${project.id}?tab=${t.id}`}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    isAct
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-sm font-bold">Project Summary & Engineering Scope</h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {project.description || "Full civil, structural, and MEP execution scope."}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800">
                    <div className="text-slate-500">Project Manager</div>
                    <div className="mt-0.5 font-bold">
                      {project.projectManager?.fullName || "Eng. Chaminda Rajapaksha"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800">
                    <div className="text-slate-500">Regional Branch</div>
                    <div className="mt-0.5 font-bold">
                      {project.branch?.name || "Colombo Head Office"}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800">
                    <div className="text-slate-500">Approved Variation Orders</div>
                    <div className="mt-0.5 font-bold text-emerald-600">
                      {formatLKR(approvedVariations)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Milestones */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="mb-3 text-sm font-bold">
                  Project Milestones ({project.milestones.length})
                </h2>
                <div className="space-y-3">
                  {project.milestones.map((ms) => (
                    <div
                      key={ms.id}
                      className="rounded-xl border border-slate-200 p-3.5 text-xs dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{ms.title}</span>
                        <span className="font-semibold text-blue-600">
                          Weight: {toNumber(ms.weightPct)}% • Progress: {toNumber(ms.progressPct)}%
                        </span>
                      </div>
                      <p className="mt-1 text-slate-500">{ms.description}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Due: {formatDateDDMMYYYY(ms.dueDate)}</span>
                        <span>Milestone Billing: {formatLKR(toNumber(ms.billingAmount))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dedicated Quick Sub-Route Links */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-3 text-sm font-bold">Dedicated Project Sub-Pages</h3>
                <div className="grid gap-2 text-xs">
                  {[
                    { label: "Full BOQ & Revisions Manager", href: `/projects/${project.id}/boq` },
                    { label: "Tasks & Gantt Schedule", href: `/projects/${project.id}/tasks` },
                    { label: "Assigned Labour & Attendance", href: `/projects/${project.id}/labour` },
                    { label: "Material Stock Issues", href: `/projects/${project.id}/materials` },
                    { label: "Direct & Indirect Expenses", href: `/projects/${project.id}/expenses` },
                    { label: "Subcontractors & IPCs", href: `/projects/${project.id}/contractors` },
                    { label: "Project Finance & P&L", href: `/projects/${project.id}/finance` },
                    { label: "Project Reports & Exports", href: `/projects/${project.id}/reports` },
                  ].map((lnk) => (
                    <Link
                      key={lnk.href}
                      href={lnk.href}
                      className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 font-semibold hover:border-blue-500 hover:text-blue-600 dark:border-slate-800"
                    >
                      <span>{lnk.label}</span>
                      <span>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BOQ */}
        {activeTab === "boq" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold">
                    Bill of Quantities (BOQ) • {activeBoq?.boqCode || "Baseline"} (Rev{" "}
                    {activeBoq?.versionNumber || 1})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Total Unit Rate = Material Rate + Labour Rate + Equipment Rate + Other Cost
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">BOQ Total Estimate</div>
                  <div className="text-lg font-extrabold text-blue-600">
                    {formatLKR(toNumber(activeBoq?.totalAmount))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                      <th className="pb-2 font-semibold">Item Code</th>
                      <th className="pb-2 font-semibold">Description</th>
                      <th className="pb-2 font-semibold">Unit</th>
                      <th className="pb-2 font-semibold">Qty</th>
                      <th className="pb-2 font-semibold">Material</th>
                      <th className="pb-2 font-semibold">Labour</th>
                      <th className="pb-2 font-semibold">Equipment</th>
                      <th className="pb-2 font-semibold">Other</th>
                      <th className="pb-2 font-semibold">Unit Rate</th>
                      <th className="pb-2 font-semibold">Line Total (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeBoq?.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 pr-2 font-mono font-bold">{item.itemCode}</td>
                        <td className="py-2.5 pr-2">{item.description}</td>
                        <td className="py-2.5 pr-2">{item.unit}</td>
                        <td className="py-2.5 pr-2 font-semibold">{toNumber(item.quantity)}</td>
                        <td className="py-2.5 pr-2">{formatLKR(toNumber(item.materialRate))}</td>
                        <td className="py-2.5 pr-2">{formatLKR(toNumber(item.labourRate))}</td>
                        <td className="py-2.5 pr-2">{formatLKR(toNumber(item.equipmentRate))}</td>
                        <td className="py-2.5 pr-2">{formatLKR(toNumber(item.otherCost))}</td>
                        <td className="py-2.5 pr-2 font-bold text-blue-600">
                          {formatLKR(toNumber(item.totalUnitRate))}
                        </td>
                        <td className="py-2.5 font-extrabold">
                          {formatLKR(toNumber(item.totalAmount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add BOQ Item Form */}
              <form
                action={async (formData) => {
                  "use server";
                  await createBoqItemAction(formData);
                }}
                className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-800"
              >
                <input type="hidden" name="projectId" value={project.id} />
                <div className="mb-3 text-xs font-bold uppercase text-slate-500">
                  Add New BOQ Line Item
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <input
                    name="categoryName"
                    required
                    placeholder="Category (e.g., Concrete Work)"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    name="itemCode"
                    required
                    placeholder="Code (e.g., B.3)"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    name="description"
                    required
                    placeholder="Item Description"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:col-span-2 dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-6">
                  <input
                    name="unit"
                    required
                    placeholder="Unit (m3, m2, MT)"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    name="quantity"
                    type="number"
                    step="0.001"
                    required
                    placeholder="Quantity"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    name="materialRate"
                    type="number"
                    step="0.01"
                    required
                    placeholder="Material Rate"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    name="labourRate"
                    type="number"
                    step="0.01"
                    required
                    placeholder="Labour Rate"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    name="equipmentRate"
                    type="number"
                    step="0.01"
                    defaultValue={0}
                    placeholder="Equip Rate"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    name="otherCost"
                    type="number"
                    step="0.01"
                    defaultValue={0}
                    placeholder="Other Cost"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  <Plus className="h-3.5 w-3.5" /> Add & Calculate BOQ Item
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: TASKS & MILESTONES */}
        {activeTab === "tasks" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 text-sm font-bold">
                Project Schedule & Tasks ({project.tasks.length})
              </h2>
              <div className="space-y-3">
                {project.tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-3.5 text-xs sm:flex-row sm:items-center dark:border-slate-800"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600">{t.code}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{t.title}</span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] dark:bg-slate-800">
                          {t.category}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-500">
                        {formatDateDDMMYYYY(t.startDate)} → {formatDateDDMMYYYY(t.endDate)} •
                        Weight: {t.weight} • Progress: {toNumber(t.progressPct)}%
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-bold text-blue-600">
                        {t.status}
                      </span>
                      {t.status !== "COMPLETED" && (
                        <form
                          action={async () => {
                            "use server";
                            await updateTaskStatusAction(t.id, "COMPLETED", 100);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500"
                          >
                            Mark 100% Done
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-3 text-sm font-bold">Add Project Task</h3>
                <form
                  action={async (formData) => {
                    "use server";
                    await createProjectTaskAction(formData);
                  }}
                  className="space-y-3"
                >
                  <input type="hidden" name="projectId" value={project.id} />
                  <input
                    name="title"
                    required
                    placeholder="Task Title"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    name="category"
                    defaultValue="Structural"
                    placeholder="Category"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      name="startDate"
                      type="date"
                      defaultValue="2026-11-20"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                    <input
                      name="endDate"
                      type="date"
                      defaultValue="2026-12-20"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      name="status"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="TO_DO">TO_DO</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="REVIEW">REVIEW</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                    <input
                      name="progressPct"
                      type="number"
                      defaultValue={25}
                      placeholder="Progress %"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white"
                  >
                    Create Task & Recalculate Progress
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="mb-3 text-sm font-bold">Add Project Milestone</h3>
                <form
                  action={async (formData) => {
                    "use server";
                    await createMilestoneAction(formData);
                  }}
                  className="space-y-3"
                >
                  <input type="hidden" name="projectId" value={project.id} />
                  <input
                    name="title"
                    required
                    placeholder="Milestone Title"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      name="weightPct"
                      type="number"
                      defaultValue={20}
                      placeholder="Weight %"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                    <input
                      name="progressPct"
                      type="number"
                      defaultValue={50}
                      placeholder="Completion %"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white dark:bg-blue-600"
                  >
                    Add Milestone
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LABOUR */}
        {activeTab === "labour" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold">
                Project Labour Attendance & Wage Costs ({formatLKR(labourCost)})
              </h2>
              <Link
                href="/labour/attendance"
                className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white"
              >
                Log Site Attendance
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Worker</th>
                    <th className="pb-2">Trade</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">OT Hours</th>
                    <th className="pb-2">Total Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {project.attendances.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2.5">{formatDateDDMMYYYY(a.workDate)}</td>
                      <td className="py-2.5 font-bold">{a.labour.fullName}</td>
                      <td className="py-2.5">{a.labour.categoryType}</td>
                      <td className="py-2.5">{a.status}</td>
                      <td className="py-2.5">{toNumber(a.overtimeHours)} hrs</td>
                      <td className="py-2.5 font-bold">{formatLKR(toNumber(a.totalEarned))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: MATERIALS */}
        {activeTab === "materials" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold">
                Material Issues to Project ({formatLKR(materialConsumptionCost)})
              </h2>
              <Link
                href="/inventory/stock-issue"
                className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white"
              >
                Issue Material from Store
              </Link>
            </div>
            <div className="space-y-3">
              {project.stockIssues.map((si) => (
                <div
                  key={si.id}
                  className="rounded-xl border border-slate-200 p-4 text-xs dark:border-slate-800"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      {si.issueNumber} • Warehouse: {si.warehouse.name}
                    </span>
                    <span className="text-blue-600">{formatLKR(toNumber(si.totalValue))}</span>
                  </div>
                  <div className="mt-1 text-slate-500">
                    Issued To: {si.issuedTo} on {formatDateDDMMYYYY(si.issueDate)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CONTRACTORS */}
        {activeTab === "contractors" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold">
                Subcontractor Agreements & Certified IPCs ({formatLKR(contractorCost)})
              </h2>
              <Link
                href="/contractors/payments"
                className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white"
              >
                Certify IPC Payment
              </Link>
            </div>
            <div className="space-y-3">
              {project.contractorAgreements.map((ag) => (
                <div
                  key={ag.id}
                  className="rounded-xl border border-slate-200 p-4 text-xs dark:border-slate-800"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      {ag.agreementNumber} - {ag.contractor.name}
                    </span>
                    <span>Contract: {formatLKR(toNumber(ag.contractAmount))}</span>
                  </div>
                  <p className="mt-1 text-slate-500">{ag.scopeOfWork}</p>
                  <div className="mt-2 flex flex-wrap gap-4 text-[11px] font-semibold">
                    <span className="text-blue-600">
                      Certified Work: {formatLKR(toNumber(ag.certifiedWorkValue))}
                    </span>
                    <span className="text-amber-600">
                      Retention Held ({toNumber(ag.retentionPct)}%):{" "}
                      {formatLKR(toNumber(ag.retentionHeld))}
                    </span>
                    <span className="text-emerald-600">
                      Net Paid: {formatLKR(toNumber(ag.totalPaid))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: EXPENSES */}
        {activeTab === "expenses" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-bold">Project Direct & Operational Expenses</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                      <th className="pb-2">Voucher #</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Description</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {project.expenses.map((e) => (
                      <tr key={e.id}>
                        <td className="py-2.5 font-mono font-bold">{e.expenseNumber}</td>
                        <td className="py-2.5">{formatDateDDMMYYYY(e.expenseDate)}</td>
                        <td className="py-2.5">{e.category.replace(/_/g, " ")}</td>
                        <td className="py-2.5">{e.description}</td>
                        <td className="py-2.5 font-bold">{formatLKR(toNumber(e.amount))}</td>
                        <td className="py-2.5">
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-bold">Record Project Expense</h3>
              <form
                action={async (formData) => {
                  "use server";
                  await createExpenseAction(formData);
                }}
                className="space-y-3"
              >
                <input type="hidden" name="projectId" value={project.id} />
                <select
                  name="category"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="TRANSPORT_EXPENSES">Transport Expenses</option>
                  <option value="FUEL_EXPENSES">Fuel Expenses</option>
                  <option value="EQUIPMENT_RENTAL">Equipment Rental</option>
                  <option value="MACHINERY_REPAIR">Machinery Repair</option>
                  <option value="UTILITY_EXPENSES">Utility Expenses</option>
                  <option value="ACCOMMODATION">Accommodation</option>
                  <option value="FOOD">Food & Site Welfare</option>
                  <option value="ADMINISTRATIVE_EXPENSES">Administrative (Indirect)</option>
                  <option value="OTHER_EXPENSES">Other Direct Expenses</option>
                </select>
                <input
                  name="description"
                  required
                  placeholder="Expense Description"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="Amount (LKR)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white"
                >
                  Save & Approve Expense
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 8 & 9: INVOICES & PAYMENTS */}
        {(activeTab === "invoices" || activeTab === "payments") && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-bold">Client Progress Invoices & Receipts</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                      <th className="pb-2">Invoice #</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Total (Inc Tax)</th>
                      <th className="pb-2">Paid</th>
                      <th className="pb-2">Outstanding</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {project.invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-2.5 font-mono font-bold">{inv.invoiceNumber}</td>
                        <td className="py-2.5">{formatDateDDMMYYYY(inv.invoiceDate)}</td>
                        <td className="py-2.5 font-bold">{formatLKR(toNumber(inv.totalAmount))}</td>
                        <td className="py-2.5 text-emerald-600">
                          {formatLKR(toNumber(inv.paidAmount))}
                        </td>
                        <td className="py-2.5 text-amber-600">
                          {formatLKR(toNumber(inv.outstandingAmount))}
                        </td>
                        <td className="py-2.5 font-semibold">{inv.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-bold">Issue Client IPC Invoice</h3>
              <form
                action={async (formData) => {
                  "use server";
                  await createClientInvoiceAction(formData);
                }}
                className="space-y-3"
              >
                <input type="hidden" name="projectId" value={project.id} />
                <input
                  name="description"
                  required
                  placeholder="IPC Description"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  name="rate"
                  type="number"
                  step="0.01"
                  required
                  placeholder="Subtotal Amount (LKR)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  name="taxRate"
                  type="number"
                  step="0.01"
                  defaultValue={18}
                  placeholder="VAT %"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white"
                >
                  Generate Client Invoice
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 10: DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-bold">
                Project Drawings, Contracts & Certificates ({project.documents.length})
              </h2>
              <div className="space-y-2.5">
                {project.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800"
                  >
                    <div>
                      <div className="font-bold">{doc.title}</div>
                      <div className="text-slate-500">
                        {doc.category} • {doc.fileName} (v{doc.version})
                      </div>
                    </div>
                    <span className="rounded bg-blue-500/10 px-2.5 py-1 font-semibold text-blue-600">
                      {doc.isClientVisible ? "Client Portal Visible" : "Internal"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-bold">Upload Project Document</h3>
              <form
                action={async (formData) => {
                  "use server";
                  await createDocumentAction(formData);
                }}
                className="space-y-3"
              >
                <input type="hidden" name="projectId" value={project.id} />
                <input
                  name="title"
                  required
                  placeholder="Document Title"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <select
                  name="category"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="STRUCTURAL_DRAWING">Structural Drawing</option>
                  <option value="ARCHITECTURAL_DRAWING">Architectural Drawing</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="BOQ_DOCUMENT">BOQ Document</option>
                  <option value="INSPECTION_REPORT">Inspection Report</option>
                  <option value="COMPLETION_CERTIFICATE">Completion Certificate</option>
                </select>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white"
                >
                  Attach Document
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 11: SITE REPORTS */}
        {activeTab === "site-reports" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-bold">Daily Site Operations Reports</h2>
              <div className="space-y-3">
                {project.dailySiteReports.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-slate-200 p-4 text-xs dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>
                        {r.reportNumber} • {formatDateDDMMYYYY(r.reportDate)}
                      </span>
                      <span className="text-blue-600">
                        {r.weatherCondition} • {r.labourCount} Workers
                      </span>
                    </div>
                    <p className="mt-1.5 font-medium">{r.workCompleted}</p>
                    <p className="mt-1 text-slate-500">Materials: {r.materialsUsedNote || "—"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-bold">Submit Daily Site Report</h3>
              <form
                action={async (formData) => {
                  "use server";
                  await createDailySiteReportAction(formData);
                }}
                className="space-y-3"
              >
                <input type="hidden" name="projectId" value={project.id} />
                <input
                  name="weatherCondition"
                  defaultValue="Sunny & Clear"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  name="labourCount"
                  type="number"
                  defaultValue={45}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <textarea
                  name="workActivities"
                  required
                  placeholder="Activities executed today..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <textarea
                  name="workCompleted"
                  required
                  placeholder="Measured output completed..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white"
                >
                  Log Daily Site Report
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 12: PROFIT & LOSS */}
        {activeTab === "profit-loss" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Real-Time Project Profit & Loss Statement
                </h2>
                <p className="text-xs text-slate-500">
                  Recognizes actual material consumption (Stock Issues), certified contractor IPCs,
                  attendance payroll, and approved expenses without double counting
                </p>
              </div>
              <Link
                href="/finance/profit-loss"
                className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white"
              >
                Company-Wide P&L
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-slate-200 p-4 text-xs dark:border-slate-800">
                <div className="font-bold uppercase text-blue-600">Project Revenue</div>
                <div className="flex justify-between">
                  <span>Base Contract Revenue</span>
                  <span className="font-semibold">{formatLKR(toNumber(project.contractValue))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Approved Variation Orders</span>
                  <span className="font-semibold">{formatLKR(approvedVariations)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold dark:border-slate-700">
                  <span>Total Project Revenue</span>
                  <span>{formatLKR(pnl.totalProjectRevenue)}</span>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 p-4 text-xs dark:border-slate-800">
                <div className="font-bold uppercase text-amber-600">Project Direct & Indirect Costs</div>
                <div className="flex justify-between">
                  <span>Material Consumption Cost (Stock Issues)</span>
                  <span className="font-semibold">{formatLKR(materialConsumptionCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Workforce & Labour Cost</span>
                  <span className="font-semibold">{formatLKR(labourCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subcontractor Certified IPC Cost</span>
                  <span className="font-semibold">{formatLKR(contractorCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Equipment & Machinery Cost</span>
                  <span className="font-semibold">{formatLKR(equipmentCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport & Fuel Cost</span>
                  <span className="font-semibold">{formatLKR(transportCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Other Direct Site Costs</span>
                  <span className="font-semibold">{formatLKR(otherDirectCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Allocated Indirect & Admin Costs</span>
                  <span className="font-semibold">{formatLKR(indirectExpenses)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold dark:border-slate-700">
                  <span>Total Project Cost</span>
                  <span>{formatLKR(pnl.totalProjectCost)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-emerald-500/10 p-4">
                <div className="text-xs text-emerald-700 dark:text-emerald-300">
                  Project Gross Profit
                </div>
                <div className="mt-1 text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                  {formatLKR(pnl.projectGrossProfit)}
                </div>
                <div className="text-[11px] text-emerald-600">
                  Gross Margin: {pnl.grossMarginPct}%
                </div>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-4">
                <div className="text-xs text-blue-700 dark:text-blue-300">Project Net Profit</div>
                <div className="mt-1 text-lg font-extrabold text-blue-700 dark:text-blue-300">
                  {formatLKR(pnl.projectNetProfit)}
                </div>
                <div className="text-[11px] text-blue-600">
                  Net Margin: {pnl.profitMarginPct}%
                </div>
              </div>
              <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                <div className="text-xs text-slate-500">Budget Variance</div>
                <div className="mt-1 text-lg font-extrabold">{formatLKR(pnl.budgetVariance)}</div>
                <div className="text-[11px] text-slate-500">
                  vs Revised Budget {formatCompactLKR(pnl.effectiveBudget)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                <div className="text-xs text-slate-500">Expected Final Profit</div>
                <div className="mt-1 text-lg font-extrabold">{formatLKR(pnl.expectedProfit)}</div>
                <div className="text-[11px] text-slate-500">
                  Est. Final Cost: {formatCompactLKR(pnl.expectedFinalCost)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErpPageWrapper>
  );
}

