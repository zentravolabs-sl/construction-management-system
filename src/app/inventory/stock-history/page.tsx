import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTimeColombo, formatLKR, toNumber } from "@/lib/utils";

export default async function StockHistoryPage() {
  const session = await requireModuleAccess("INVENTORY", "READ");
  const movements = await prisma.stockMovement.findMany({
    where: { organizationId: session.organizationId },
    include: { material: true, warehouse: true },
    orderBy: { movementDate: "desc" },
  });

  const exportRows = movements.map((m) => ({
    code: m.movementCode,
    date: formatDateTimeColombo(m.movementDate),
    type: m.movementType,
    material: `${m.material.code} - ${m.material.name}`,
    warehouse: m.warehouse.name,
    quantity: toNumber(m.quantity),
    unitCost: toNumber(m.unitCost),
    totalCost: toNumber(m.totalCost),
    balanceAfter: toNumber(m.balanceAfter),
    reference: m.referenceNo || "",
  }));

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Immutable Stock Movement Audit Ledger ({movements.length})
            </h1>
            <p className="text-xs text-slate-500">
              Every inventory receive, GRN, project issue, return, and adjustment is permanently
              recorded
            </p>
          </div>
          <ExportButtons
            title="Stock Movement History"
            filename="Stock-Movements-Ledger"
            columns={[
              { header: "Movement #", key: "code" },
              { header: "Timestamp", key: "date" },
              { header: "Type", key: "type" },
              { header: "Material", key: "material" },
              { header: "Warehouse", key: "warehouse" },
              { header: "Qty Delta", key: "quantity" },
              { header: "Unit Cost", key: "unitCost" },
              { header: "Total Value", key: "totalCost" },
              { header: "Balance After", key: "balanceAfter" },
              { header: "Ref #", key: "reference" },
            ]}
            rows={exportRows}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2">Movement #</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Operation Type</th>
                  <th className="pb-2">Material</th>
                  <th className="pb-2">Warehouse</th>
                  <th className="pb-2">Qty Delta</th>
                  <th className="pb-2">Total Cost</th>
                  <th className="pb-2">Balance After</th>
                  <th className="pb-2">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {movements.map((m) => {
                  const qty = toNumber(m.quantity);
                  return (
                    <tr key={m.id}>
                      <td className="py-2.5 font-mono font-bold text-blue-600">
                        {m.movementCode}
                      </td>
                      <td className="py-2.5 text-slate-500">
                        {formatDateTimeColombo(m.movementDate)}
                      </td>
                      <td className="py-2.5 font-semibold">{m.movementType}</td>
                      <td className="py-2.5 font-bold">{m.material.name}</td>
                      <td className="py-2.5">{m.warehouse.name}</td>
                      <td
                        className={`py-2.5 font-extrabold ${
                          qty >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {qty >= 0 ? `+${qty}` : qty} {m.material.unit}
                      </td>
                      <td className="py-2.5 font-semibold">{formatLKR(toNumber(m.totalCost))}</td>
                      <td className="py-2.5 font-bold">
                        {toNumber(m.balanceAfter)} {m.material.unit}
                      </td>
                      <td className="py-2.5 text-slate-500">{m.referenceNo || "—"}</td>
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

