import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLabourAdvanceAction } from "@/actions/erp";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";
import { Wallet } from "lucide-react";

export default async function LabourAdvancesPage() {
  const session = await requireModuleAccess("LABOUR", "READ");

  const [labours, advances] = await Promise.all([
    prisma.labour.findMany({
      where: { organizationId: session.organizationId, status: "ACTIVE", deletedAt: null },
      orderBy: { labourCode: "asc" },
    }),
    prisma.labourAdvance.findMany({
      where: { labour: { organizationId: session.organizationId } },
      include: { labour: true },
      orderBy: { advanceDate: "desc" },
    }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Labour Wage Advances & Recovery Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Issue festival or emergency cash advances to workers and track automatic payroll
            recovery
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Wallet className="h-4 w-4 text-amber-500" />
              Issue Worker Advance
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await createLabourAdvanceAction(formData);
              }}
              className="space-y-3"
            >
              <select
                name="labourId"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                {labours.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.labourCode} - {l.fullName}
                  </option>
                ))}
              </select>
              <input
                name="amount"
                type="number"
                step="0.01"
                required
                placeholder="Advance Amount (LKR)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="reason"
                required
                placeholder="Reason (e.g., Festival / Medical Advance)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Approve & Issue Advance
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-bold">Active & Historical Labour Advances</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Worker</th>
                    <th className="pb-2">Reason</th>
                    <th className="pb-2">Advance Amount</th>
                    <th className="pb-2">Recovered</th>
                    <th className="pb-2">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {advances.map((adv) => {
                    const amt = toNumber(adv.amount);
                    const rec = toNumber(adv.recoveredAmt);
                    return (
                      <tr key={adv.id}>
                        <td className="py-2.5">{formatDateDDMMYYYY(adv.advanceDate)}</td>
                        <td className="py-2.5 font-bold">{adv.labour.fullName}</td>
                        <td className="py-2.5 text-slate-500">{adv.reason}</td>
                        <td className="py-2.5 font-bold">{formatLKR(amt)}</td>
                        <td className="py-2.5 text-emerald-600">{formatLKR(rec)}</td>
                        <td className="py-2.5 font-bold text-amber-600">
                          {formatLKR(Math.max(0, amt - rec))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

