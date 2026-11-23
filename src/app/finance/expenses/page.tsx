import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createExpenseAction } from "@/actions/erp";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function FinanceExpensesPage() {
  const session = await requireModuleAccess("FINANCE", "READ");
  const [expenses, projects] = await Promise.all([
    prisma.expense.findMany({
      where: { organizationId: session.organizationId },
      include: { project: true },
      orderBy: { expenseDate: "desc" },
    }),
    prisma.project.findMany({
      where: { organizationId: session.organizationId, deletedAt: null },
      orderBy: { code: "asc" },
    }),
  ]);

  const exportRows = expenses.map((e) => ({
    expenseNumber: e.expenseNumber,
    date: formatDateDDMMYYYY(e.expenseDate),
    project: e.project.code,
    category: e.category,
    description: e.description,
    amount: toNumber(e.amount),
    paymentMethod: e.paymentMethod,
    status: e.status,
  }));

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Project Expense Management ({expenses.length} Vouchers)
            </h1>
            <p className="text-xs text-slate-500">
              Approved expenses feed into Project Profit & Loss without double counting warehouse
              issues or payroll
            </p>
          </div>
          <ExportButtons
            title="Project Expenses Report"
            filename="Project-Expenses-LKR"
            columns={[
              { header: "Voucher #", key: "expenseNumber" },
              { header: "Date", key: "date" },
              { header: "Project", key: "project" },
              { header: "Category", key: "category" },
              { header: "Description", key: "description" },
              { header: "Amount (LKR)", key: "amount" },
              { header: "Method", key: "paymentMethod" },
              { header: "Status", key: "status" },
            ]}
            rows={exportRows}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Plus className="h-4 w-4 text-blue-600" />
              Record Project Expense
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await createExpenseAction(formData);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold">Project *</label>
                <select
                  name="projectId"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold">Expense Category *</label>
                <select
                  name="category"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="TRANSPORT_EXPENSES">Transport Expenses</option>
                  <option value="FUEL_EXPENSES">Fuel Expenses</option>
                  <option value="EQUIPMENT_RENTAL">Equipment Rental</option>
                  <option value="MACHINERY_REPAIR">Machinery Repair</option>
                  <option value="ACCOMMODATION">Accommodation</option>
                  <option value="FOOD">Food & Site Mess</option>
                  <option value="UTILITY_EXPENSES">Utility Expenses</option>
                  <option value="ADMINISTRATIVE_EXPENSES">Administrative (Indirect)</option>
                  <option value="OTHER_EXPENSES">Other Direct Expenses</option>
                </select>
              </div>
              <input
                name="description"
                required
                placeholder="Description"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="Amount (LKR)"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <select
                  name="paymentMethod"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                  <option value="CASH">CASH</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Post Approved Expense
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                    <th className="pb-2">Voucher #</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Project</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="py-2.5 font-mono font-bold text-blue-600">
                        {e.expenseNumber}
                      </td>
                      <td className="py-2.5">{formatDateDDMMYYYY(e.expenseDate)}</td>
                      <td className="py-2.5 font-mono font-bold">{e.project.code}</td>
                      <td className="py-2.5">{e.category.replace(/_/g, " ")}</td>
                      <td className="py-2.5">{e.description}</td>
                      <td className="py-2.5 font-extrabold">{formatLKR(toNumber(e.amount))}</td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            e.status === "APPROVED"
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-amber-500/15 text-amber-600"
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

