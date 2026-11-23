import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupplierAction } from "@/actions/erp";
import { formatLKR, toNumber } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function SuppliersPage() {
  const session = await requireModuleAccess("PROCUREMENT", "READ");
  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { supplierCode: "asc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Approved Suppliers & Trade Creditors ({suppliers.length})
          </h1>
          <p className="text-xs text-slate-500">
            Manage cement, steel, aggregate, and MEP vendors, credit days, and outstanding balances
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Plus className="h-4 w-4 text-blue-600" />
              Register Supplier
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await createSupplierAction(formData);
              }}
              className="space-y-3"
            >
              <input
                name="name"
                required
                placeholder="Supplier Name (e.g., INSEE Cement Lanka)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="category"
                defaultValue="Cement & Concrete"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="contactPerson"
                placeholder="Account Manager Name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="phone"
                  required
                  placeholder="+94 11 234 9900"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  name="paymentTermsDays"
                  type="number"
                  defaultValue={30}
                  placeholder="Credit Days"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Register Supplier
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                    <th className="pb-2">Code</th>
                    <th className="pb-2">Supplier Name</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Contact</th>
                    <th className="pb-2">Credit Terms</th>
                    <th className="pb-2">Outstanding Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2.5 font-mono font-bold text-blue-600">{s.supplierCode}</td>
                      <td className="py-2.5 font-bold">{s.name}</td>
                      <td className="py-2.5">{s.category}</td>
                      <td className="py-2.5">
                        {s.contactPerson} • {s.phone}
                      </td>
                      <td className="py-2.5">{s.paymentTermsDays} Days</td>
                      <td className="py-2.5 font-bold text-amber-600">
                        {formatLKR(toNumber(s.outstandingBalance))}
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

