import Link from "next/link";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { ExportButtons, type ExportColumn } from "@/components/ui/ExportButtons";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateDDMMYYYY, formatLKR, round2, toNumber } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

const REPORT_TYPES = [
  { id: "1", name: "1. Project Summary Report" },
  { id: "2", name: "2. Project Progress & Milestones" },
  { id: "3", name: "3. Project Profit & Loss Statement" },
  { id: "4", name: "4. Project Budget vs Actual Variance" },
  { id: "5", name: "5. BOQ Master Cost Report" },
  { id: "6", name: "6. Labour Daily Attendance Register" },
  { id: "7", name: "7. Labour Monthly Salary & Payslips" },
  { id: "8", name: "8. Labour Cost Analysis by Trade" },
  { id: "9", name: "9. Material Stock Valuation Report" },
  { id: "10", name: "10. Material Consumption by Project" },
  { id: "11", name: "11. Stock Movement Ledger" },
  { id: "12", name: "12. Supplier Purchase Orders Report" },
  { id: "13", name: "13. Subcontractor IPC Payment Report" },
  { id: "14", name: "14. Project Expense Vouchers Report" },
  { id: "15", name: "15. Client Outstanding Receivables (AR)" },
  { id: "16", name: "16. Supplier Outstanding Payables (AP)" },
  { id: "17", name: "17. Treasury Cash Flow Statement" },
  { id: "18", name: "18. Income & Expenses Summary" },
  { id: "19", name: "19. Equipment Usage & Fuel Report" },
  { id: "20", name: "20. Project Completion & Handover" },
];

export default async function ReportsCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string; projectId?: string; q?: string }>;
}) {
  const session = await requireModuleAccess("REPORTS", "READ");
  const sp = await searchParams;
  const activeReportId = sp.report || "1";
  const projectFilterId = sp.projectId || "";
  const search = (sp.q || "").trim().toLowerCase();
  const orgId = session.organizationId;

  const [
    projects,
    boqItems,
    attendances,
    labours,
    materials,
    stockIssues,
    stockMovements,
    purchaseOrders,
    contractorPayments,
    expenses,
    invoices,
    suppliers,
    equipments,
  ] = await Promise.all([
    prisma.project.findMany({
      where: {
        organizationId: orgId,
        deletedAt: null,
        ...(projectFilterId ? { id: projectFilterId } : {}),
      },
      include: { client: true },
    }),
    prisma.bOQItem.findMany({
      where: { boq: { organizationId: orgId } },
      include: { boq: { include: { project: true } }, category: true },
    }),
    prisma.attendance.findMany({
      where: {
        organizationId: orgId,
        ...(projectFilterId ? { projectId: projectFilterId } : {}),
      },
      include: { labour: true, project: true },
      orderBy: { workDate: "desc" },
    }),
    prisma.labour.findMany({
      where: { organizationId: orgId, deletedAt: null },
    }),
    prisma.material.findMany({
      where: { organizationId: orgId },
    }),
    prisma.stockIssue.findMany({
      where: {
        organizationId: orgId,
        ...(projectFilterId ? { projectId: projectFilterId } : {}),
      },
      include: { project: true, warehouse: true },
    }),
    prisma.stockMovement.findMany({
      where: { organizationId: orgId },
      include: { material: true, warehouse: true },
      orderBy: { movementDate: "desc" },
    }),
    prisma.purchaseOrder.findMany({
      where: { organizationId: orgId },
      include: { supplier: true },
    }),
    prisma.contractorPayment.findMany({
      where: {
        organizationId: orgId,
        ...(projectFilterId ? { projectId: projectFilterId } : {}),
      },
      include: { contractor: true, project: true },
    }),
    prisma.expense.findMany({
      where: {
        organizationId: orgId,
        ...(projectFilterId ? { projectId: projectFilterId } : {}),
      },
      include: { project: true },
    }),
    prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        ...(projectFilterId ? { projectId: projectFilterId } : {}),
      },
      include: { client: true, project: true },
    }),
    prisma.supplier.findMany({
      where: { organizationId: orgId },
    }),
    prisma.equipment.findMany({
      where: { organizationId: orgId },
    }),
  ]);

  const activeReportMeta =
    REPORT_TYPES.find((r) => r.id === activeReportId) || REPORT_TYPES[0];

  let columns: ExportColumn[] = [];
  let rows: Record<string, string | number>[] = [];

  switch (activeReportId) {
    case "1":
    case "2":
    case "20":
      columns = [
        { header: "Project Code", key: "code" },
        { header: "Project Name", key: "name" },
        { header: "Client", key: "client" },
        { header: "Status", key: "status" },
        { header: "Progress %", key: "progress" },
        { header: "Contract Value (LKR)", key: "contract" },
        { header: "Target Completion", key: "deadline" },
      ];
      rows = projects.map((p) => ({
        code: p.code,
        name: p.name,
        client: p.client.name,
        status: p.status,
        progress: `${toNumber(p.calculatedProgress)}%`,
        contract: formatLKR(toNumber(p.contractValue)),
        deadline: formatDateDDMMYYYY(p.expectedCompletionDate),
      }));
      break;

    case "3":
    case "4":
    case "18":
      columns = [
        { header: "Project Code", key: "code" },
        { header: "Project Name", key: "name" },
        { header: "Contract Value", key: "revenue" },
        { header: "Revised Budget", key: "budget" },
        { header: "Actual Direct Cost", key: "actualCost" },
        { header: "Net Profit", key: "profit" },
        { header: "Budget Variance", key: "variance" },
      ];
      rows = projects.map((p) => {
        const rev = toNumber(p.contractValue);
        const bud = toNumber(p.revisedBudget ?? p.estimatedBudget);
        const mat = stockIssues
          .filter((s) => s.projectId === p.id)
          .reduce((a, b) => a + toNumber(b.totalValue), 0);
        const con = contractorPayments
          .filter((c) => c.projectId === p.id)
          .reduce((a, b) => a + toNumber(b.netPayable), 0);
        const exp = expenses
          .filter((e) => e.projectId === p.id)
          .reduce((a, b) => a + toNumber(b.amount), 0);
        const cost = round2(mat + con + exp);
        return {
          code: p.code,
          name: p.name,
          revenue: formatLKR(rev),
          budget: formatLKR(bud),
          actualCost: formatLKR(cost),
          profit: formatLKR(rev - cost),
          variance: formatLKR(bud - cost),
        };
      });
      break;

    case "5":
      columns = [
        { header: "Project", key: "project" },
        { header: "Category", key: "category" },
        { header: "Item Code", key: "code" },
        { header: "Description", key: "description" },
        { header: "Qty", key: "qty" },
        { header: "Unit Rate", key: "unitRate" },
        { header: "Line Total (LKR)", key: "total" },
      ];
      rows = boqItems.map((i) => ({
        project: i.boq.project.code,
        category: i.category.name,
        code: i.itemCode,
        description: i.description,
        qty: `${toNumber(i.quantity)} ${i.unit}`,
        unitRate: formatLKR(toNumber(i.totalUnitRate)),
        total: formatLKR(toNumber(i.totalAmount)),
      }));
      break;

    case "6":
    case "7":
    case "8":
      columns = [
        { header: "Date", key: "date" },
        { header: "Labour Code", key: "code" },
        { header: "Worker Name", key: "worker" },
        { header: "Trade Category", key: "trade" },
        { header: "Project", key: "project" },
        { header: "Status", key: "status" },
        { header: "Total Earned (LKR)", key: "earned" },
      ];
      rows = attendances.map((a) => ({
        date: formatDateDDMMYYYY(a.workDate),
        code: a.labour.labourCode,
        worker: a.labour.fullName,
        trade: a.labour.categoryType,
        project: a.project.code,
        status: a.status,
        earned: formatLKR(toNumber(a.totalEarned)),
      }));
      break;

    case "9":
      columns = [
        { header: "Material Code", key: "code" },
        { header: "Material Name", key: "name" },
        { header: "Category", key: "category" },
        { header: "Available Stock", key: "stock" },
        { header: "Min Stock", key: "min" },
        { header: "Unit Cost", key: "rate" },
        { header: "Valuation (LKR)", key: "valuation" },
      ];
      rows = materials.map((m) => ({
        code: m.code,
        name: m.name,
        category: m.categoryType,
        stock: `${toNumber(m.currentStock)} ${m.unit}`,
        min: `${toNumber(m.minimumStockLevel)} ${m.unit}`,
        rate: formatLKR(toNumber(m.defaultPurchasePrice)),
        valuation: formatLKR(toNumber(m.currentStock) * toNumber(m.defaultPurchasePrice)),
      }));
      break;

    case "10":
    case "11":
      columns = [
        { header: "Movement #", key: "code" },
        { header: "Date", key: "date" },
        { header: "Operation", key: "type" },
        { header: "Material", key: "material" },
        { header: "Warehouse", key: "warehouse" },
        { header: "Quantity", key: "qty" },
        { header: "Value (LKR)", key: "total" },
      ];
      rows = stockMovements.map((m) => ({
        code: m.movementCode,
        date: formatDateDDMMYYYY(m.movementDate),
        type: m.movementType,
        material: m.material.name,
        warehouse: m.warehouse.name,
        qty: `${toNumber(m.quantity)} ${m.material.unit}`,
        total: formatLKR(toNumber(m.totalCost)),
      }));
      break;

    case "12":
    case "16":
      columns = [
        { header: "Supplier Code", key: "code" },
        { header: "Supplier Name", key: "name" },
        { header: "Category", key: "category" },
        { header: "Credit Terms", key: "terms" },
        { header: "PO Count", key: "poCount" },
        { header: "Outstanding Payable (LKR)", key: "outstanding" },
      ];
      rows = suppliers.map((s) => ({
        code: s.supplierCode,
        name: s.name,
        category: s.category,
        terms: `${s.paymentTermsDays} Days`,
        poCount: purchaseOrders.filter((p) => p.supplierId === s.id).length,
        outstanding: formatLKR(toNumber(s.outstandingBalance)),
      }));
      break;

    case "13":
      columns = [
        { header: "Voucher #", key: "voucher" },
        { header: "Date", key: "date" },
        { header: "Subcontractor", key: "contractor" },
        { header: "Project", key: "project" },
        { header: "Approved Work", key: "approved" },
        { header: "Retention Held", key: "retention" },
        { header: "Net Payable (LKR)", key: "net" },
      ];
      rows = contractorPayments.map((cp) => ({
        voucher: cp.voucherNumber,
        date: formatDateDDMMYYYY(cp.paymentDate),
        contractor: cp.contractor.name,
        project: cp.project.code,
        approved: formatLKR(toNumber(cp.approvedWorkValue)),
        retention: formatLKR(toNumber(cp.retentionAmount)),
        net: formatLKR(toNumber(cp.netPayable)),
      }));
      break;

    case "14":
      columns = [
        { header: "Expense #", key: "code" },
        { header: "Date", key: "date" },
        { header: "Project", key: "project" },
        { header: "Category", key: "category" },
        { header: "Description", key: "description" },
        { header: "Amount (LKR)", key: "amount" },
        { header: "Status", key: "status" },
      ];
      rows = expenses.map((e) => ({
        code: e.expenseNumber,
        date: formatDateDDMMYYYY(e.expenseDate),
        project: e.project.code,
        category: e.category,
        description: e.description,
        amount: formatLKR(toNumber(e.amount)),
        status: e.status,
      }));
      break;

    case "15":
    case "17":
      columns = [
        { header: "Invoice #", key: "invoice" },
        { header: "Date", key: "date" },
        { header: "Client", key: "client" },
        { header: "Project", key: "project" },
        { header: "Total Billed", key: "total" },
        { header: "Paid Received", key: "paid" },
        { header: "Outstanding Receivable", key: "outstanding" },
      ];
      rows = invoices.map((inv) => ({
        invoice: inv.invoiceNumber,
        date: formatDateDDMMYYYY(inv.invoiceDate),
        client: inv.client.name,
        project: inv.project.code,
        total: formatLKR(toNumber(inv.totalAmount)),
        paid: formatLKR(toNumber(inv.paidAmount)),
        outstanding: formatLKR(toNumber(inv.outstandingAmount)),
      }));
      break;

    case "19":
    default:
      columns = [
        { header: "Equipment Code", key: "code" },
        { header: "Machinery Name", key: "name" },
        { header: "Category", key: "category" },
        { header: "Ownership", key: "ownership" },
        { header: "Operating Hours", key: "hours" },
        { header: "Fuel Consumed (L)", key: "fuel" },
        { header: "Status", key: "status" },
      ];
      rows = equipments.map((eq) => ({
        code: eq.equipmentCode,
        name: eq.name,
        category: eq.category,
        ownership: eq.ownership,
        hours: `${toNumber(eq.operatingHours)} hrs`,
        fuel: `${toNumber(eq.fuelConsumedLiters)} L`,
        status: eq.status,
      }));
      break;
  }

  if (search) {
    rows = rows.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(search))
    );
  }

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Enterprise Construction Reports & Analytics Center (20 Standard Reports)
            </h1>
            <p className="text-xs text-slate-500">
              Live database reporting with PDF, Excel (.xlsx), and Print exports
            </p>
          </div>
          <ExportButtons
            title={activeReportMeta.name}
            filename={`BuildMaster-Report-${activeReportId}`}
            columns={columns}
            rows={rows}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* 20 Reports Sidebar Selector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 px-2 text-xs font-bold uppercase text-slate-500">
              Select Report (1–20)
            </div>
            <div className="space-y-1">
              {REPORT_TYPES.map((rep) => {
                const isAct = rep.id === activeReportId;
                return (
                  <Link
                    key={rep.id}
                    href={`/reports?report=${rep.id}${
                      projectFilterId ? `&projectId=${projectFilterId}` : ""
                    }`}
                    className={`block rounded-xl px-3 py-2 text-xs font-medium transition ${
                      isAct
                        ? "bg-blue-600 font-bold text-white"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {rep.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Active Report Table */}
          <div className="space-y-4 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h2 className="text-base font-bold">{activeReportMeta.name}</h2>
              </div>

              <form method="GET" className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="report" value={activeReportId} />
                <input
                  name="q"
                  defaultValue={sp.q || ""}
                  placeholder="Search within report..."
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Filter
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                      {columns.map((c) => (
                        <th key={c.key} className="pb-2.5 pr-3 font-semibold">
                          {c.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rows.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        {columns.map((c) => (
                          <td key={c.key} className="py-3 pr-3 font-medium">
                            {r[c.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

