import { redirect } from "next/navigation";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { issueStockToProjectAction } from "@/actions/erp";
import { toNumber } from "@/lib/utils";
import { ArrowUpFromLine, ShieldCheck } from "lucide-react";

export default async function StockIssuePage() {
  const session = await requireModuleAccess("INVENTORY", "CREATE");
  const [projects, warehouses, materials] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: session.organizationId, deletedAt: null },
      orderBy: { code: "asc" },
    }),
    prisma.warehouse.findMany({ where: { organizationId: session.organizationId } }),
    prisma.material.findMany({ where: { organizationId: session.organizationId } }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Project Material Issue Workflow
          </h1>
          <p className="text-xs text-slate-500">
            Select Project → Select Material → Enter Quantity → Validate Available Stock → Approve
            Issue → Create Stock Movement → Update Project Cost
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <form
            action={async (formData) => {
              "use server";
              const res = await issueStockToProjectAction(formData);
              if (!res?.error) {
                redirect("/inventory/stock-history");
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold">1. Destination Project *</label>
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
              <label className="block text-xs font-semibold">2. Issuing Warehouse / Store *</label>
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
              <label className="block text-xs font-semibold">
                3. Select Material (Available Stock Displayed) *
              </label>
              <select
                name="materialId"
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.code} - {m.name} (Available: {toNumber(m.currentStock)} {m.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold">4. Quantity to Issue *</label>
                <input
                  name="quantity"
                  type="number"
                  step="0.001"
                  required
                  placeholder="10"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Issued To (Site Engineer)</label>
                <input
                  name="issuedTo"
                  defaultValue={session.fullName}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold">Work Element / Notes</label>
              <input
                name="notes"
                placeholder="Issued for Level 16 slab concreting"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div className="rounded-xl bg-blue-500/10 p-3 text-xs text-blue-700 dark:text-blue-300">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="h-4 w-4" />
                Transaction-Safe Negative Stock Guard
              </div>
              Stock cannot become negative unless explicitly permitted in Company Settings.
              Recognizes material cost directly into Project Profit & Loss.
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <ArrowUpFromLine className="h-4 w-4" /> Approve & Issue Stock to Project
            </button>
          </form>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

