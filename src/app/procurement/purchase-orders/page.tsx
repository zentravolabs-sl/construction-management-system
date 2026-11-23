import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPurchaseOrderAction } from "@/actions/erp";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function PurchaseOrdersPage() {
  const session = await requireModuleAccess("PROCUREMENT", "READ");
  const [purchaseOrders, suppliers, projects, materials] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: { organizationId: session.organizationId },
      include: { supplier: true },
      orderBy: { orderDate: "desc" },
    }),
    prisma.supplier.findMany({ where: { organizationId: session.organizationId } }),
    prisma.project.findMany({
      where: { organizationId: session.organizationId, deletedAt: null },
    }),
    prisma.material.findMany({ where: { organizationId: session.organizationId } }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Purchase Orders (PO) & Supplier Commitments
          </h1>
          <p className="text-xs text-slate-500">
            Issue official Purchase Orders with configurable VAT and track partial/complete GRN
            deliveries
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Plus className="h-4 w-4 text-blue-600" />
              Issue New Purchase Order
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await createPurchaseOrderAction(formData);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold">Supplier *</label>
                <select
                  name="supplierId"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.supplierCode} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold">Project</label>
                <select
                  name="projectId"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold">Material *</label>
                <select
                  name="materialId"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="orderedQty"
                  type="number"
                  step="0.01"
                  required
                  placeholder="Order Qty"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  name="unitPrice"
                  type="number"
                  step="0.01"
                  required
                  placeholder="Unit Rate (LKR)"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Approve & Issue PO
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-bold">Purchase Orders Ledger</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                    <th className="pb-2">PO #</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Supplier</th>
                    <th className="pb-2">Subtotal</th>
                    <th className="pb-2">VAT (18%)</th>
                    <th className="pb-2">Total Amount</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id}>
                      <td className="py-2.5 font-mono font-bold text-blue-600">{po.poNumber}</td>
                      <td className="py-2.5">{formatDateDDMMYYYY(po.orderDate)}</td>
                      <td className="py-2.5 font-bold">{po.supplier.name}</td>
                      <td className="py-2.5">{formatLKR(toNumber(po.subtotal))}</td>
                      <td className="py-2.5">{formatLKR(toNumber(po.taxAmount))}</td>
                      <td className="py-2.5 font-extrabold">{formatLKR(toNumber(po.totalAmount))}</td>
                      <td className="py-2.5">
                        <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                          {po.status}
                        </span>
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

