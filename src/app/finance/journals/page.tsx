import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBalancedJournalEntryAction } from "@/actions/erp";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";
import { Scale, ShieldCheck } from "lucide-react";

export default async function JournalsPage() {
  const session = await requireModuleAccess("FINANCE", "READ");
  const [accounts, journals] = await Promise.all([
    prisma.account.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { code: "asc" },
    }),
    prisma.journalEntry.findMany({
      where: { organizationId: session.organizationId },
      include: { lines: { include: { account: true } } },
      orderBy: { entryDate: "desc" },
    }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Double-Entry General Journal Engine
          </h1>
          <p className="text-xs text-slate-500">
            Every posted journal entry strictly validates and enforces Total Debit = Total Credit
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Scale className="h-4 w-4 text-blue-600" />
              Post Balanced Journal Entry
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await createBalancedJournalEntryAction(formData);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold">Journal Narration *</label>
                <input
                  name="description"
                  required
                  placeholder="Accrual / Cost Allocation Narration"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Debit Account (DR) *</label>
                <select
                  name="debitAccountId"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold">Credit Account (CR) *</label>
                <select
                  name="creditAccountId"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {[...accounts].reverse().map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold">Total Debit (LKR) *</label>
                  <input
                    name="debitAmount"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={2500000}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Total Credit (LKR) *</label>
                  <input
                    name="creditAmount"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={2500000}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                <div className="flex items-center gap-1 font-bold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Double-Entry Balance Guard
                </div>
                Unbalanced entries where Total Debit ≠ Total Credit are rejected on the server.
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Validate Balance & Post Journal
              </button>
            </form>
          </div>

          <div className="space-y-4 lg:col-span-2">
            {journals.map((je) => (
              <div
                key={je.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-600">
                      {je.entryNumber}
                    </span>
                    <span className="ml-2 text-xs text-slate-500">
                      {formatDateDDMMYYYY(je.entryDate)} • Ref: {je.referenceNo}
                    </span>
                    <h3 className="mt-1 text-sm font-bold">{je.description}</h3>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600">
                    BALANCED: {formatLKR(toNumber(je.totalDebit))}
                  </span>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                        <th className="pb-1.5">Account</th>
                        <th className="pb-1.5">Line Narration</th>
                        <th className="pb-1.5 text-right">Debit (LKR)</th>
                        <th className="pb-1.5 text-right">Credit (LKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {je.lines.map((line) => (
                        <tr key={line.id}>
                          <td className="py-2 font-semibold">
                            {line.account.code} - {line.account.name}
                          </td>
                          <td className="py-2 text-slate-500">{line.description}</td>
                          <td className="py-2 text-right font-bold">
                            {toNumber(line.debit) > 0 ? formatLKR(toNumber(line.debit)) : "—"}
                          </td>
                          <td className="py-2 text-right font-bold">
                            {toNumber(line.credit) > 0 ? formatLKR(toNumber(line.credit)) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

