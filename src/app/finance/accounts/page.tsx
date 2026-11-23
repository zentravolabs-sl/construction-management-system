import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatLKR, toNumber } from "@/lib/utils";

export default async function ChartOfAccountsPage() {
  const session = await requireModuleAccess("FINANCE", "READ");
  const accounts = await prisma.account.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { code: "asc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Chart of Accounts (General Ledger)
          </h1>
          <p className="text-xs text-slate-500">
            Structured double-entry accounts across Assets, Liabilities, Equity, Revenue, and
            Direct Construction Expenses
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2">GL Code</th>
                  <th className="pb-2">Account Name</th>
                  <th className="pb-2">Account Type</th>
                  <th className="pb-2">Classification</th>
                  <th className="pb-2">Currency</th>
                  <th className="pb-2">Current Ledger Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td className="py-3 font-mono font-bold text-blue-600">{acc.code}</td>
                    <td className="py-3 font-bold">{acc.name}</td>
                    <td className="py-3">
                      <span className="rounded-lg bg-blue-500/10 px-2.5 py-0.5 font-semibold text-blue-600">
                        {acc.accountType}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">
                      {acc.isBankAccount
                        ? `Bank (${acc.bankName || "Corporate"})`
                        : acc.isCashAccount
                        ? "Petty Cash"
                        : acc.subType || "General Ledger"}
                    </td>
                    <td className="py-3">{acc.currency}</td>
                    <td className="py-3 font-extrabold">{formatLKR(toNumber(acc.balance))}</td>
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

