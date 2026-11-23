import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBranchAction, updateCompanySettingsAction } from "@/actions/erp";
import { Building2, MapPin, Plus, Save } from "lucide-react";

export default async function CompanySettingsPage() {
  const session = await requireModuleAccess("SETTINGS", "READ");
  const [org, branches] = await Promise.all([
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
    prisma.branch.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Company Profile, Tax & Multi-Branch Configuration
          </h1>
          <p className="text-xs text-slate-500">
            Configure corporate registration numbers, VAT %, working days, negative stock guards,
            and regional branches
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Building2 className="h-4 w-4 text-blue-600" />
              Organization Legal & Operational Settings
            </h2>

            <form
              action={async (formData) => {
                "use server";
                await updateCompanySettingsAction(formData);
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Company Name *
                  </label>
                  <input
                    name="name"
                    required
                    defaultValue={org?.name || ""}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Business Registration Number (BRN)
                  </label>
                  <input
                    name="businessRegistrationNumber"
                    defaultValue={org?.businessRegistrationNumber || ""}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tax Identification Number (TIN)
                  </label>
                  <input
                    name="taxIdentificationNumber"
                    defaultValue={org?.taxIdentificationNumber || ""}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Configurable VAT / Tax Rate (%)
                  </label>
                  <input
                    name="defaultTaxRate"
                    type="number"
                    step="0.01"
                    defaultValue={Number(org?.defaultTaxRate ?? 18)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Standard Working Days / Month
                  </label>
                  <input
                    name="standardWorkingDaysPerMonth"
                    type="number"
                    defaultValue={org?.standardWorkingDaysPerMonth ?? 26}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Address
                  </label>
                  <input
                    name="address"
                    defaultValue={org?.address || ""}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    City
                  </label>
                  <input
                    name="city"
                    defaultValue={org?.city || "Colombo"}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Official Phone
                  </label>
                  <input
                    name="phone"
                    defaultValue={org?.phone || ""}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Official Email
                  </label>
                  <input
                    name="email"
                    defaultValue={org?.email || ""}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Inventory Negative Stock Rule
                  </label>
                  <select
                    name="allowNegativeStock"
                    defaultValue={org?.allowNegativeStock ? "true" : "false"}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="false">Strict Block (Never allow negative stock)</option>
                    <option value="true">Permit Negative Stock Override</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                <Save className="h-3.5 w-3.5" /> Save Company Configuration
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <MapPin className="h-4 w-4 text-blue-600" />
                Branches ({branches.length})
              </h2>
              <div className="space-y-2.5">
                {branches.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>
                        {b.code} - {b.name}
                      </span>
                      {b.isHeadOffice && (
                        <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-600">
                          HQ
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-slate-500">
                      {b.city} • {b.phone || "No phone"}
                    </div>
                  </div>
                ))}
              </div>

              <form
                action={async (formData) => {
                  "use server";
                  await createBranchAction(formData);
                }}
                className="mt-4 space-y-2.5 border-t border-slate-200 pt-4 dark:border-slate-800"
              >
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Register New Branch
                </div>
                <input
                  name="name"
                  required
                  placeholder="Branch Name (e.g., Galle Office)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    name="code"
                    required
                    placeholder="BR-GAL"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    name="city"
                    required
                    placeholder="Galle"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-blue-600"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Branch
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

