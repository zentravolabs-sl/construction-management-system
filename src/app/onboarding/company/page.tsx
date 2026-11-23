import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCompanySettingsAction } from "@/actions/erp";
import { Building2, ArrowRight, CheckCircle2 } from "lucide-react";

export default async function OnboardingCompanyPage() {
  const session = await requireSession();
  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
  });

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Company Setup Wizard</h1>
              <p className="text-xs text-slate-400">Step 1 of 3 • Company Profile & Tax Configuration</p>
            </div>
          </div>
          <Link
            href="/onboarding/branch"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Next: Branches <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          <form
            action={async (formData) => {
              "use server";
              await updateCompanySettingsAction(formData);
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Registered Company Name *
                </label>
                <input
                  name="name"
                  required
                  defaultValue={org?.name || ""}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Business Registration No (BRN)
                </label>
                <input
                  name="businessRegistrationNumber"
                  defaultValue={org?.businessRegistrationNumber || ""}
                  placeholder="PV-0084921"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  VAT / Tax Identification No (TIN)
                </label>
                <input
                  name="taxIdentificationNumber"
                  defaultValue={org?.taxIdentificationNumber || ""}
                  placeholder="114908231-7000"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Default VAT / Tax Rate (%)
                </label>
                <input
                  name="defaultTaxRate"
                  type="number"
                  step="0.01"
                  defaultValue={Number(org?.defaultTaxRate ?? 18)}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Head Office Address
                </label>
                <input
                  name="address"
                  defaultValue={org?.address || ""}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  City
                </label>
                <input
                  name="city"
                  defaultValue={org?.city || "Colombo"}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Corporate Email
                </label>
                <input
                  name="email"
                  defaultValue={org?.email || ""}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Phone Number
                </label>
                <input
                  name="phone"
                  defaultValue={org?.phone || ""}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                <CheckCircle2 className="h-4 w-4" /> Save Company Profile
              </button>
              <Link
                href="/onboarding/branch"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Continue to Step 2: Branches <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

