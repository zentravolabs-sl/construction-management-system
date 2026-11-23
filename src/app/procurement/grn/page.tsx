import Link from "next/link";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTimeColombo, formatLKR, toNumber } from "@/lib/utils";

export default async function GrnPage() {
  const session = await requireModuleAccess("PROCUREMENT", "READ");
  const grnMovements = await prisma.stockMovement.findMany({
    where: {
      organizationId: session.organizationId,
      movementType: { in: ["GRN_RECEIVE", "STOCK_RECEIVE"] },
    },
    include: { material: true, warehouse: true },
    orderBy: { movementDate: "desc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Goods Received Notes (GRN) & Quality Inspection Register
            </h1>
            <p className="text-xs text-slate-500">
              Verified supplier deliveries received into warehouse stock batches
            </p>
          </div>
          <Link
            href="/inventory/stock-receive"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
          >
            + Record New GRN Receipt
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2">GRN / Movement #</th>
                  <th className="pb-2">Received At</th>
                  <th className="pb-2">Material</th>
                  <th className="pb-2">Warehouse</th>
                  <th className="pb-2">Accepted Qty</th>
                  <th className="pb-2">Unit Cost</th>
                  <th className="pb-2">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {grnMovements.map((g) => (
                  <tr key={g.id}>
                    <td className="py-2.5 font-mono font-bold text-blue-600">
                      {g.referenceNo || g.movementCode}
                    </td>
                    <td className="py-2.5">{formatDateTimeColombo(g.movementDate)}</td>
                    <td className="py-2.5 font-bold">{g.material.name}</td>
                    <td className="py-2.5">{g.warehouse.name}</td>
                    <td className="py-2.5 font-extrabold text-emerald-600">
                      +{toNumber(g.quantity)} {g.material.unit}
                    </td>
                    <td className="py-2.5">{formatLKR(toNumber(g.unitCost))}</td>
                    <td className="py-2.5 font-bold">{formatLKR(toNumber(g.totalCost))}</td>
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

