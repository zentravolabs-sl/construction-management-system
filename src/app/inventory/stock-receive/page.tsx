import { redirect } from "next/navigation";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { receiveStockAction } from "@/actions/erp";
import { toNumber } from "@/lib/utils";
import { ArrowDownToLine } from "lucide-react";

export default async function StockReceivePage() {
  const session = await requireModuleAccess("INVENTORY", "CREATE");
  const [materials, warehouses] = await Promise.all([
    prisma.material.findMany({ where: { organizationId: session.organizationId } }),
    prisma.warehouse.findMany({ where: { organizationId: session.organizationId } }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Stock Receive & Batch Entry
          </h1>
          <p className="text-xs text-slate-500">
            Receive materials into warehouse storage, create a costed stock batch, and log stock
            movement
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <form
            action={async (formData) => {
              "use server";
              await receiveStockAction(formData);
              redirect("/inventory/stock-history");
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold">Select Warehouse *</label>
              <select
                name="warehouseId"
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold">Select Material *</label>
              <select
                name="materialId"
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} - {m.name} (Current: {toNumber(m.currentStock)} {m.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold">Quantity Received *</label>
                <input
                  name="quantity"
                  type="number"
                  step="0.001"
                  required
                  placeholder="100"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Unit Purchase Cost (LKR)</label>
                <input
                  name="unitCost"
                  type="number"
                  step="0.01"
                  placeholder="Leave blank to use default rate"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold">Delivery Note / Reference No</label>
              <input
                name="referenceNo"
                placeholder="DN-2026-884"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              <ArrowDownToLine className="h-4 w-4" /> Receive Stock & Generate Batch
            </button>
          </form>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

