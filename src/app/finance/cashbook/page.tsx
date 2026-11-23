import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";

export default async function CashbookPage() {
  const session = await requireModuleAccess("FINANCE", "READ");
  const [cashAndBankAccounts, invoices, expenses] = await Promise.all([
    prisma.account.findMany({
      where: {
        organizationId: session.organizationId,
        OR: [{ isBankAccount: true }, { isCashAccount: true }],
      },
    }),
    prisma.invoice.findMany({
      where: { organizationId: session.organizationId, paidAmount: { gt: 0 } },
      include: { client: true },
    }),
    prisma.expense.findMany({
      where: { organizationId: session.organizationId, status: "APPROVED" },
      include: { project: true },
    }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Treasury Cashbook & Bank Reconciliation Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Real-time liquidity across corporate current bank accounts and site petty cash floats
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {cashAndBankAccounts.map((acc) => (
            <div
              key={acc.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600">GL {acc.code}</span>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                  {acc.isBankAccount ? "BANK ACCOUNT" : "CASH FLOAT"}
                </span>
              </div>
              <h2 className="mt-2 text-base font-bold">{acc.name}</h2>
              <div className="mt-3 text-2xl font-extrabold text-emerald-600">
                {formatLKR(toNumber(acc.balance))}
              </div>
              {acc.accountNumber && (
                <div className="mt-1 text-xs text-slate-500">
                  {acc.bankName} • A/C: {acc.accountNumber}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-bold">Cash Inflows & Outflows Register</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Reference</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Cash In (Debit)</th>
                  <th className="pb-2">Cash Out (Credit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2.5">{formatDateDDMMYYYY(inv.invoiceDate)}</td>
                    <td className="py-2.5 font-mono font-bold text-blue-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5">Client Receipt — {inv.client.name}</td>
                    <td className="py-2.5 font-bold text-emerald-600">
                      +{formatLKR(toNumber(inv.paidAmount))}
                    </td>
                    <td className="py-2.5 text-slate-400">—</td>
                  </tr>
                ))}
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="py-2.5">{formatDateDDMMYYYY(exp.expenseDate)}</td>
                    <td className="py-2.5 font-mono font-bold text-amber-600">
                      {exp.expenseNumber}
                    </td>
                    <td className="py-2.5">
                      {exp.project.code} — {exp.description}
                    </td>
                    <td className="py-2.5 text-slate-400">—</td>
                    <td className="py-2.5 font-bold text-red-600">
                      -{formatLKR(toNumber(exp.amount))}
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

