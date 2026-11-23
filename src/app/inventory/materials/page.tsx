import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMaterialAction } from "@/actions/erp";
import { formatLKR, toNumber } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function MaterialMasterPage() {
  const session = await requireModuleAccess("INVENTORY", "READ");
  const materials = await prisma.material.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { code: "asc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Material Master Catalog ({materials.length} SKUs)
          </h1>
          <p className="text-xs text-slate-500">
            Register construction materials, units of measurement, minimum reorder levels, and standard rates
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Plus className="h-4 w-4 text-blue-600" />
              Register New Material
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await createMaterialAction(formData);
              }}
              className="space-y-3"
            >
              <input
                name="name"
                required
                placeholder="Material Name (e.g., Nippon Weatherbond Paint 20L)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  name="categoryType"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="CEMENT">CEMENT</option>
                  <option value="SAND">SAND</option>
                  <option value="METAL">METAL</option>
                  <option value="BRICKS">BRICKS</option>
                  <option value="STEEL">STEEL</option>
                  <option value="TIMBER">TIMBER</option>
                  <option value="ELECTRICAL">ELECTRICAL</option>
                  <option value="PLUMBING">PLUMBING</option>
                  <option value="PAINT">PAINT</option>
                  <option value="TILES">TILES</option>
                  <option value="HARDWARE">HARDWARE</option>
                </select>
                <input
                  name="unit"
                  required
                  placeholder="Unit (Bags, MT, Cubes)"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="minimumStockLevel"
                  type="number"
                  step="0.01"
                  required
                  placeholder="Min Stock Level"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  name="defaultPurchasePrice"
                  type="number"
                  step="0.01"
                  required
                  placeholder="Unit Price (LKR)"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Create Material SKU
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Current Stock</th>
                    <th className="pb-2">Min Level</th>
                    <th className="pb-2">Purchase Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {materials.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2.5 font-mono font-bold text-blue-600">{m.code}</td>
                      <td className="py-2.5 font-bold">{m.name}</td>
                      <td className="py-2.5">{m.categoryType}</td>
                      <td className="py-2.5 font-extrabold">
                        {toNumber(m.currentStock)} {m.unit}
                      </td>
                      <td className="py-2.5 text-slate-500">
                        {toNumber(m.minimumStockLevel)} {m.unit}
                      </td>
                      <td className="py-2.5 font-semibold">
                        {formatLKR(toNumber(m.defaultPurchasePrice))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

