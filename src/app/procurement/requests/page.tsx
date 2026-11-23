import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPurchaseRequestAction } from "@/actions/erp";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function PurchaseRequestsPage() {
  const session = await requireModuleAccess("PROCUREMENT", "READ");
  const [requests, projects, materials] = await Promise.all([
    prisma.purchaseRequest.findMany({
      where: { organizationId: session.organizationId },
      include: { project: true, items: { include: { material: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      where: { organizationId: session.organizationId, deletedAt: null },
    }),
    prisma.material.findMany({
      where: { organizationId: session.organizationId },
    }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Site Material Purchase Requisitions (PR)
          </h1>
          <p className="text-xs text-slate-500">
            Purchase Request → Centralized Approval → Supplier Quotation → Purchase Order → GRN
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Plus className="h-4 w-4 text-blue-600" />
              Raise Purchase Request
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await createPurchaseRequestAction(formData);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold">Project *</label>
                <select
                  name="projectId"
                  required
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
                  name="quantity"
                  type="number"
                  step="0.01"
                  required
                  placeholder="Quantity"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  name="estimatedUnitCost"
                  type="number"
                  step="0.01"
                  required
                  placeholder="Est. Rate (LKR)"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <input
                name="notes"
                placeholder="Urgency / Specification Notes"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Submit Requisition for Approval
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-bold">Purchase Requisitions Register</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                    <th className="pb-2">PR #</th>
                    <th className="pb-2">Project</th>
                    <th className="pb-2">Requested By</th>
                    <th className="pb-2">Required Date</th>
                    <th className="pb-2">Estimated Value</th>
                    <th className="pb-2">Approval Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {requests.map((pr) => (
                    <tr key={pr.id}>
                      <td className="py-2.5 font-mono font-bold text-blue-600">
                        {pr.requestNumber}
                      </td>
                      <td className="py-2.5 font-bold">{pr.project.code}</td>
                      <td className="py-2.5">{pr.requestedBy}</td>
                      <td className="py-2.5">{formatDateDDMMYYYY(pr.requiredDate)}</td>
                      <td className="py-2.5 font-bold">
                        {formatLKR(toNumber(pr.estimatedTotal))}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            pr.status === "APPROVED"
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-amber-500/15 text-amber-600"
                          }`}
                        >
                          {pr.status}
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

