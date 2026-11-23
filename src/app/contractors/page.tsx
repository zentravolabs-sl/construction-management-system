import Link from "next/link";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createContractorAction } from "@/actions/erp";
import { Plus, FileSignature, Landmark } from "lucide-react";

export default async function ContractorsPage() {
  const session = await requireModuleAccess("CONTRACTORS", "READ");
  const contractors = await prisma.contractor.findMany({
    where: { organizationId: session.organizationId },
    include: { agreements: true },
    orderBy: { contractorCode: "asc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Subcontractor & Specialist Contractor Registry ({contractors.length})
            </h1>
            <p className="text-xs text-slate-500">
              Manage piling, structural, MEP, HVAC, and finishing subcontractors
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/contractors/agreements"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
            >
              <FileSignature className="h-3.5 w-3.5 text-blue-600" /> Agreements
            </Link>
            <Link
              href="/contractors/payments"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white"
            >
              <Landmark className="h-3.5 w-3.5" /> Certify IPC Payments
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Plus className="h-4 w-4 text-blue-600" />
              Register Subcontractor
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await createContractorAction(formData);
              }}
              className="space-y-3"
            >
              <input
                name="name"
                required
                placeholder="Subcontractor Company Name *"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="category"
                defaultValue="MEP, HVAC & Fire Safety"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="phone"
                required
                placeholder="Contact Number *"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="nicOrBrn"
                placeholder="BRN / CIDA Registration No"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="bankDetails"
                placeholder="Bank, Branch & Account Number"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Register Contractor
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Company Name</th>
                    <th className="pb-2">Specialty Category</th>
                    <th className="pb-2">Phone</th>
                    <th className="pb-2">Bank Settlement Details</th>
                    <th className="pb-2">Agreements</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {contractors.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 font-mono font-bold text-blue-600">{c.contractorCode}</td>
                      <td className="py-3 font-bold">{c.name}</td>
                      <td className="py-3">{c.category}</td>
                      <td className="py-3">{c.phone}</td>
                      <td className="py-3 text-slate-500">{c.bankDetails || "—"}</td>
                      <td className="py-3 font-bold">{c.agreements.length} Active</td>
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

