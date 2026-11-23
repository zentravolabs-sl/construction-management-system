import { redirect } from "next/navigation";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { returnStockToWarehouseAction } from "@/actions/erp";
import { RotateCcw } from "lucide-react";

export default async function StockReturnPage() {
  const session = await requireModuleAccess("INVENTORY", "CREATE");
  const [projects, warehouses, materials] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: session.organizationId, deletedAt: null },
    }),
    prisma.warehouse.findMany({ where: { organizationId: session.organizationId } }),
    prisma.material.findMany({ where: { organizationId: session.organizationId } }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Site Material Return to Warehouse
          </h1>
          <p className="text-xs text-slate-500">
            Return unused surplus materials from a project site back into warehouse inventory
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <form
            action={async (formData) => {
              "use server";
              await returnStockToWarehouseAction(formData);
              redirect("/inventory/stock-history");
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold">Returning Project *</label>
              <select
                name="projectId"
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold">Receiving Warehouse *</label>
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
              <label className="block text-xs font-semibold">Material *</label>
              <select
                name="materialId"
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} - {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold">Quantity Returned *</label>
              <input
                name="quantity"
                type="number"
                step="0.001"
                required
                defaultValue={15}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold">Return Reason</label>
              <input
                name="reason"
                defaultValue="Surplus un-opened bags returned after pour completion"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <RotateCcw className="h-4 w-4" /> Process Stock Return
            </button>
          </form>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

