import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMonthlyPayrollAction } from "@/actions/erp";
import { formatLKR, toNumber } from "@/lib/utils";
import { Calculator } from "lucide-react";

export default async function LabourPayrollPage() {
  const session = await requireModuleAccess("LABOUR", "READ");

  const payrolls = await prisma.payroll.findMany({
    where: { organizationId: session.organizationId },
    include: {
      items: {
        include: { labour: true },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  const latestPayroll = payrolls[0];
  const exportRows = (latestPayroll?.items || []).map((item) => ({
    code: item.labour.labourCode,
    name: item.labour.fullName,
    trade: item.labour.categoryType,
    effectiveDays: toNumber(item.effectiveDays),
    basicEarnings: toNumber(item.basicEarnings),
    overtimeHours: toNumber(item.overtimeHours),
    overtimeEarnings: toNumber(item.overtimeEarnings),
    grossPay: toNumber(item.grossPay),
    advanceRecovery: toNumber(item.advanceRecovery),
    netPay: toNumber(item.netPay),
  }));

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Monthly Payroll Engine & Payslip Register
            </h1>
            <p className="text-xs text-slate-500">
              Calculates basic wages from attendance, overtime earnings, and advance recovery
              deductions
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {latestPayroll && (
              <ExportButtons
                title={`Payroll Register - ${latestPayroll.payrollCode}`}
                filename={latestPayroll.payrollCode}
                columns={[
                  { header: "Labour Code", key: "code" },
                  { header: "Worker Name", key: "name" },
                  { header: "Trade", key: "trade" },
                  { header: "Effective Days", key: "effectiveDays" },
                  { header: "Basic Pay (LKR)", key: "basicEarnings" },
                  { header: "OT Hours", key: "overtimeHours" },
                  { header: "OT Pay (LKR)", key: "overtimeEarnings" },
                  { header: "Gross Pay (LKR)", key: "grossPay" },
                  { header: "Advance Recovery", key: "advanceRecovery" },
                  { header: "Net Payable (LKR)", key: "netPay" },
                ]}
                rows={exportRows}
              />
            )}
          </div>
        </div>

        {/* Payroll Generator Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <form
            action={async (formData) => {
              "use server";
              await generateMonthlyPayrollAction(formData);
            }}
            className="flex flex-wrap items-end gap-4"
          >
            <div>
              <label className="block text-xs font-semibold">Payroll Month</label>
              <select
                name="month"
                defaultValue={11}
                className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold">Year</label>
              <input
                name="year"
                type="number"
                defaultValue={2026}
                className="mt-1 w-28 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Calculator className="h-4 w-4" /> Compute & Post Monthly Payroll
            </button>
          </form>
        </div>

        {/* Payroll Results */}
        {payrolls.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Click &ldquo;Compute & Post Monthly Payroll&rdquo; above to generate the payslip register
            from logged attendance and advances.
          </div>
        ) : (
          payrolls.map((pr) => (
            <div
              key={pr.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold">
                    {pr.payrollCode} • Period: {pr.month}/{pr.year}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Approved by {pr.approvedBy} • Status: {pr.status}
                  </p>
                </div>
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Gross: </span>
                    <span className="font-bold">{formatLKR(toNumber(pr.totalGross))}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Advance Recovery: </span>
                    <span className="font-bold text-amber-600">
                      {formatLKR(toNumber(pr.totalDeductions))}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Net Payable: </span>
                    <span className="font-extrabold text-emerald-600">
                      {formatLKR(toNumber(pr.totalNetPay))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                      <th className="pb-2">Worker</th>
                      <th className="pb-2">Effective Days</th>
                      <th className="pb-2">Basic Pay</th>
                      <th className="pb-2">OT Pay</th>
                      <th className="pb-2">Gross Pay</th>
                      <th className="pb-2">Advance Recovery</th>
                      <th className="pb-2">Net Payslip Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pr.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 font-bold">
                          {item.labour.labourCode} - {item.labour.fullName}
                        </td>
                        <td className="py-2.5">{toNumber(item.effectiveDays)} days</td>
                        <td className="py-2.5">{formatLKR(toNumber(item.basicEarnings))}</td>
                        <td className="py-2.5">{formatLKR(toNumber(item.overtimeEarnings))}</td>
                        <td className="py-2.5 font-bold">{formatLKR(toNumber(item.grossPay))}</td>
                        <td className="py-2.5 text-amber-600">
                          -{formatLKR(toNumber(item.advanceRecovery))}
                        </td>
                        <td className="py-2.5 font-extrabold text-emerald-600">
                          {formatLKR(toNumber(item.netPay))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </ErpPageWrapper>
  );
}

