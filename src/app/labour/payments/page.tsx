import Link from "next/link";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";

export default async function LabourPaymentsPage() {
  const session = await requireModuleAccess("LABOUR", "READ");

  const attendances = await prisma.attendance.findMany({
    where: { organizationId: session.organizationId },
    include: { labour: true, project: true },
    orderBy: { workDate: "desc" },
  });

  const totalDisbursed = attendances.reduce((s, a) => s + toNumber(a.totalEarned), 0);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Labour Wage Disbursements & Payment Receipts
            </h1>
            <p className="text-xs text-slate-500">
              Total Earned & Disbursed Workforce Wages: {formatLKR(totalDisbursed)}
            </p>
          </div>
          <Link
            href="/labour/payroll"
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
          >
            Go to Payroll Engine
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2">Work Date</th>
                  <th className="pb-2">Worker</th>
                  <th className="pb-2">Project</th>
                  <th className="pb-2">Daily Wage</th>
                  <th className="pb-2">Overtime</th>
                  <th className="pb-2">Net Voucher Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendances.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5">{formatDateDDMMYYYY(a.workDate)}</td>
                    <td className="py-2.5 font-bold">
                      {a.labour.labourCode} - {a.labour.fullName}
                    </td>
                    <td className="py-2.5 font-mono text-blue-600">{a.project.code}</td>
                    <td className="py-2.5">{formatLKR(toNumber(a.dailyWageEarned))}</td>
                    <td className="py-2.5">{formatLKR(toNumber(a.overtimeEarned))}</td>
                    <td className="py-2.5 font-extrabold text-emerald-600">
                      {formatLKR(toNumber(a.totalEarned))}
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

