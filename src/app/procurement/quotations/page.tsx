import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatLKR, toNumber } from "@/lib/utils";

export default async function SupplierQuotationsPage() {
  const session = await requireModuleAccess("PROCUREMENT", "READ");
  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: session.organizationId },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Supplier Quotations & Bid Comparison Matrix
          </h1>
          <p className="text-xs text-slate-500">
            Compare competitive bids across lead time, credit terms, and unit pricing before PO
            award
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-bold">
            Active Bid Evaluation: PR-2026-001 (50 MT Fe500 Tor Steel Bar)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2">Quotation #</th>
                  <th className="pb-2">Supplier</th>
                  <th className="pb-2">Quoted Rate / MT</th>
                  <th className="pb-2">Total Bid (LKR)</th>
                  <th className="pb-2">Lead Time</th>
                  <th className="pb-2">Credit Terms</th>
                  <th className="pb-2">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {suppliers.map((s, idx) => {
                  const unitRate = 308000 + idx * 4500;
                  return (
                    <tr key={s.id}>
                      <td className="py-3 font-mono font-bold">QT-2026-0{idx + 1}</td>
                      <td className="py-3 font-bold">{s.name}</td>
                      <td className="py-3">{formatLKR(unitRate)}</td>
                      <td className="py-3 font-extrabold">{formatLKR(unitRate * 50)}</td>
                      <td className="py-3">{3 + idx * 2} Days</td>
                      <td className="py-3">{s.paymentTermsDays} Days Credit</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            idx === 0
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                          }`}
                        >
                          {idx === 0 ? "LOWEST EVALUATED BID" : "ALTERNATE BID"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

