import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBranchAction } from "@/actions/erp";
import { Building2, ArrowRight, Plus, MapPin } from "lucide-react";

export default async function OnboardingBranchPage() {
  const session = await requireSession();
  const branches = await prisma.branch.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "asc" },
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
              <h1 className="text-lg font-bold text-white">Regional Branches & Yards</h1>
              <p className="text-xs text-slate-400">Step 2 of 3 • Configure Offices & Operational Locations</p>
            </div>
          </div>
          <Link
            href="/onboarding/team"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            Next: Invite Team <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mb-6 space-y-3">
          {branches.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="font-semibold text-white">
                    {b.name} <span className="text-xs text-slate-400">({b.code})</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {b.city} • {b.address || "Main Office"}
                  </div>
                </div>
              </div>
              {b.isHeadOffice && (
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  Head Office
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-300">
            Add Another Regional Branch
          </h2>
          <form
            action={async (formData) => {
              "use server";
              await createBranchAction(formData);
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Branch Name *
                </label>
                <input
                  name="name"
                  required
                  placeholder="Southern Province Regional Office"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Branch Code *
                </label>
                <input
                  name="code"
                  required
                  placeholder="BR-GAL"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  City
                </label>
                <input
                  name="city"
                  defaultValue="Galle"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Phone
                </label>
                <input
                  name="phone"
                  placeholder="+94 91 223 4455"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" /> Add Branch
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

