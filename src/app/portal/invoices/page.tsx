import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";

export default async function ClientPortalInvoicesPage() {
  const session = await requireSession();
  const clientFilter = session.clientId ? { clientId: session.clientId } : {};

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: session.organizationId,
      ...clientFilter,
    },
    include: { project: true },
    orderBy: { invoiceDate: "desc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Client Portal — Progress Invoices & Payment History
          </h1>
          <p className="text-xs text-slate-500">
            View certified IPC invoices, payments received, and outstanding balances
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2">Invoice #</th>
                  <th className="pb-2">Project</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Due Date</th>
                  <th className="pb-2">Total Billed</th>
                  <th className="pb-2">Paid</th>
                  <th className="pb-2">Outstanding</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                    <td className="py-3 font-bold">{inv.project.name}</td>
                    <td className="py-3">{formatDateDDMMYYYY(inv.invoiceDate)}</td>
                    <td className="py-3">{formatDateDDMMYYYY(inv.dueDate)}</td>
                    <td className="py-3 font-bold">{formatLKR(toNumber(inv.totalAmount))}</td>
                    <td className="py-3 text-emerald-600">{formatLKR(toNumber(inv.paidAmount))}</td>
                    <td className="py-3 font-extrabold text-amber-600">
                      {formatLKR(toNumber(inv.outstandingAmount))}
                    </td>
                    <td className="py-3 font-bold">{inv.status}</td>
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

