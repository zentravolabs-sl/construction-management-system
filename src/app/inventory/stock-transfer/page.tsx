import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { ArrowLeftRight } from "lucide-react";

export default async function StockTransferPage() {
  const session = await requireModuleAccess("INVENTORY", "CREATE");
  const [warehouses, materials] = await Promise.all([
    prisma.warehouse.findMany({ where: { organizationId: session.organizationId } }),
    prisma.material.findMany({ where: { organizationId: session.organizationId } }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Inter-Warehouse Stock Transfer
          </h1>
          <p className="text-xs text-slate-500">
            Transfer materials between central logistics yards and site warehouses
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <form className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold">Source Warehouse *</label>
                <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold">Destination Warehouse *</label>
                <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                  {[...warehouses].reverse().map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold">Material *</label>
              <select className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} - {m.name} ({toNumber(m.currentStock)} {m.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold">Transfer Quantity *</label>
              <input
                type="number"
                defaultValue={25}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white"
            >
              <ArrowLeftRight className="h-4 w-4" /> Execute Inter-Store Transfer
            </button>
          </form>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

