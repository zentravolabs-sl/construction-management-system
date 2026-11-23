import Link from "next/link";
import { notFound } from "next/navigation";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { ExportButtons } from "@/components/ui/ExportButtons";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBoqItemAction, createBoqRevisionAction } from "@/actions/erp";
import { formatLKR, toNumber } from "@/lib/utils";
import { ArrowLeft, Calculator, History, Plus } from "lucide-react";

export default async function ProjectBoqPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireModuleAccess("BOQ", "READ");
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      boqs: {
        include: {
          categories: { include: { items: true }, orderBy: { sortOrder: "asc" } },
          items: true,
          revisions: { orderBy: { versionNumber: "desc" } },
        },
        orderBy: { versionNumber: "desc" },
      },
    },
  });

  if (!project) notFound();
  const boq = project.boqs[0];

  const exportRows = (boq?.items || []).map((i) => ({
    code: i.itemCode,
    description: i.description,
    unit: i.unit,
    quantity: toNumber(i.quantity),
    materialRate: toNumber(i.materialRate),
    labourRate: toNumber(i.labourRate),
    equipmentRate: toNumber(i.equipmentRate),
    otherCost: toNumber(i.otherCost),
    totalUnitRate: toNumber(i.totalUnitRate),
    totalAmount: toNumber(i.totalAmount),
    actualAmount: toNumber(i.actualAmount),
  }));

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-600">
                {project.code}
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Bill of Quantities (BOQ) & Cost Estimation
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {project.name} • Active Version: v{boq?.versionNumber || 1} ({boq?.status || "DRAFT"})
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExportButtons
              title={`BOQ - ${project.code}`}
              filename={`BOQ-${project.code}-Rev${boq?.versionNumber || 1}`}
              columns={[
                { header: "Code", key: "code" },
                { header: "Description", key: "description" },
                { header: "Unit", key: "unit" },
                { header: "Quantity", key: "quantity" },
                { header: "Material Rate", key: "materialRate" },
                { header: "Labour Rate", key: "labourRate" },
                { header: "Equip Rate", key: "equipmentRate" },
                { header: "Other Cost", key: "otherCost" },
                { header: "Total Unit Rate", key: "totalUnitRate" },
                { header: "Total Estimate (LKR)", key: "totalAmount" },
                { header: "Actual Cost (LKR)", key: "actualAmount" },
              ]}
              rows={exportRows}
            />
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Project Workspace
            </Link>
          </div>
        </div>

        {/* BOQ Categories & Items */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-bold">
                Estimated BOQ Total: {formatLKR(toNumber(boq?.totalAmount))}
              </span>
            </div>
            {boq && (
              <form
                action={async () => {
                  "use server";
                  await createBoqRevisionAction(
                    boq.id,
                    `Archived approved snapshot v${boq.versionNumber}`
                  );
                }}
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-500/20 dark:text-blue-400"
                >
                  <History className="h-3.5 w-3.5" /> Save & Increment BOQ Revision (v
                  {boq.versionNumber + 1})
                </button>
              </form>
            )}
          </div>

          {boq?.categories.map((cat) => (
            <div key={cat.id} className="mb-6">
              <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold dark:bg-slate-800">
                <span>
                  Section {cat.code}: {cat.name}
                </span>
                <span>Subtotal: {formatLKR(toNumber(cat.subtotal))}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                      <th className="pb-2">Code</th>
                      <th className="pb-2">Description</th>
                      <th className="pb-2">Unit</th>
                      <th className="pb-2">Qty</th>
                      <th className="pb-2">Material</th>
                      <th className="pb-2">Labour</th>
                      <th className="pb-2">Equip</th>
                      <th className="pb-2">Other</th>
                      <th className="pb-2">Unit Rate</th>
                      <th className="pb-2">Estimated Total</th>
                      <th className="pb-2">Actual Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cat.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 pr-2 font-mono font-bold">{item.itemCode}</td>
                        <td className="py-2.5 pr-2">{item.description}</td>
                        <td className="py-2.5 pr-2">{item.unit}</td>
                        <td className="py-2.5 pr-2 font-semibold">{toNumber(item.quantity)}</td>
                        <td className="py-2.5 pr-2">{formatLKR(toNumber(item.materialRate))}</td>
                        <td className="py-2.5 pr-2">{formatLKR(toNumber(item.labourRate))}</td>
                        <td className="py-2.5 pr-2">{formatLKR(toNumber(item.equipmentRate))}</td>
                        <td className="py-2.5 pr-2">{formatLKR(toNumber(item.otherCost))}</td>
                        <td className="py-2.5 pr-2 font-bold text-blue-600">
                          {formatLKR(toNumber(item.totalUnitRate))}
                        </td>
                        <td className="py-2.5 pr-2 font-extrabold">
                          {formatLKR(toNumber(item.totalAmount))}
                        </td>
                        <td className="py-2.5 font-semibold text-amber-600">
                          {formatLKR(toNumber(item.actualAmount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Add BOQ Item Form */}
          <form
            action={async (formData) => {
              "use server";
              await createBoqItemAction(formData);
            }}
            className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-800"
          >
            <input type="hidden" name="projectId" value={project.id} />
            <h3 className="mb-3 text-xs font-bold uppercase text-slate-500">
              Add BOQ Item (Auto-Calculates Total Unit Rate & Line Total)
            </h3>
            <div className="grid gap-3 sm:grid-cols-4">
              <input
                name="categoryName"
                required
                placeholder="Category (e.g., Roofing / Electrical)"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="itemCode"
                required
                placeholder="Item Code (e.g., D.1)"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="description"
                required
                placeholder="Detailed Work Item Specification"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:col-span-2 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-6">
              <input
                name="unit"
                required
                placeholder="Unit (m2, m3, MT)"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="quantity"
                type="number"
                step="0.001"
                required
                placeholder="Quantity"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="materialRate"
                type="number"
                step="0.01"
                required
                placeholder="Material Rate"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="labourRate"
                type="number"
                step="0.01"
                required
                placeholder="Labour Rate"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="equipmentRate"
                type="number"
                step="0.01"
                defaultValue={0}
                placeholder="Equipment Rate"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="otherCost"
                type="number"
                step="0.01"
                defaultValue={0}
                placeholder="Other Cost"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <button
              type="submit"
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Plus className="h-3.5 w-3.5" /> Add Item to BOQ
            </button>
          </form>
        </div>

        {/* Historical Revisions */}
        {boq?.revisions && boq.revisions.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-bold">Preserved BOQ Revision History</h3>
            <div className="space-y-2 text-xs">
              {boq.revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <div>
                    <span className="font-bold">Version v{rev.versionNumber}</span> •{" "}
                    {rev.changeSummary}
                  </div>
                  <div className="font-bold text-blue-600">
                    {formatLKR(toNumber(rev.totalAmount))} (by {rev.revisedBy})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ErpPageWrapper>
  );
}

