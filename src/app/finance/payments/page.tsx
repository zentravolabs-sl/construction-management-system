import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";

export default async function FinancePaymentsPage() {
  const session = await requireModuleAccess("FINANCE", "READ");
  const [payments, contractorPayments] = await Promise.all([
    prisma.payment.findMany({
      where: { organizationId: session.organizationId },
      include: { client: true, supplier: true },
      orderBy: { paymentDate: "desc" },
    }),
    prisma.contractorPayment.findMany({
      where: { organizationId: session.organizationId },
      include: { contractor: true, project: true },
      orderBy: { paymentDate: "desc" },
    }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Payment Receipts & Outgoing Settlements Register
          </h1>
          <p className="text-xs text-slate-500">
            Centralized treasury record of client invoice receipts and subcontractor payment
            vouchers
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-bold">Client Payment Receipts ({payments.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2">Receipt #</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Party</th>
                  <th className="pb-2">Method</th>
                  <th className="pb-2">Reference</th>
                  <th className="pb-2">Amount Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 font-mono font-bold text-blue-600">{p.paymentNumber}</td>
                    <td className="py-2.5">{formatDateDDMMYYYY(p.paymentDate)}</td>
                    <td className="py-2.5 font-bold">
                      {p.client?.name || p.supplier?.name || "Client Settlement"}
                    </td>
                    <td className="py-2.5">{p.paymentMethod}</td>
                    <td className="py-2.5 text-slate-500">{p.referenceNo || "—"}</td>
                    <td className="py-2.5 font-extrabold text-emerald-600">
                      +{formatLKR(toNumber(p.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-bold">
            Outgoing Subcontractor Certified Settlements ({contractorPayments.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2">Voucher #</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Subcontractor</th>
                  <th className="pb-2">Project</th>
                  <th className="pb-2">Method</th>
                  <th className="pb-2">Net Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {contractorPayments.map((cp) => (
                  <tr key={cp.id}>
                    <td className="py-2.5 font-mono font-bold text-blue-600">
                      {cp.voucherNumber}
                    </td>
                    <td className="py-2.5">{formatDateDDMMYYYY(cp.paymentDate)}</td>
                    <td className="py-2.5 font-bold">{cp.contractor.name}</td>
                    <td className="py-2.5 font-mono">{cp.project.code}</td>
                    <td className="py-2.5">{cp.paymentMethod}</td>
                    <td className="py-2.5 font-extrabold text-amber-600">
                      -{formatLKR(toNumber(cp.netPayable))}
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

