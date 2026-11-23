import Link from "next/link";
import { redirect } from "next/navigation";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLabourAction } from "@/actions/erp";
import { ArrowLeft, Save } from "lucide-react";

export default async function NewLabourPage() {
  const session = await requireModuleAccess("LABOUR", "CREATE");
  const projects = await prisma.project.findMany({
    where: { organizationId: session.organizationId, deletedAt: null },
    orderBy: { code: "asc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Register Construction Worker / Technician
            </h1>
            <p className="text-xs text-slate-500">
              Add skilled or unskilled site workforce and assign directly to an active project
            </p>
          </div>
          <Link
            href="/labour"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <form
            action={async (formData) => {
              "use server";
              await createLabourAction(formData);
              redirect("/labour");
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name *
                </label>
                <input
                  name="fullName"
                  required
                  placeholder="R.M. Sunil Shantha"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sri Lankan NIC Number *
                </label>
                <input
                  name="nicNumber"
                  required
                  placeholder="198523401992"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone Number *
                </label>
                <input
                  name="phone"
                  required
                  placeholder="+94 71 445 6677"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Trade Category *
                </label>
                <select
                  name="categoryType"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="MASON">Mason</option>
                  <option value="CARPENTER">Carpenter</option>
                  <option value="ELECTRICIAN">Electrician</option>
                  <option value="PLUMBER">Plumber</option>
                  <option value="PAINTER">Painter</option>
                  <option value="WELDER">Welder</option>
                  <option value="HELPER">Helper</option>
                  <option value="MACHINE_OPERATOR">Machine Operator</option>
                  <option value="SITE_SUPERVISOR">Site Supervisor</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Employment Basis
                </label>
                <select
                  name="employmentType"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="DAILY_WAGE">Daily Wage</option>
                  <option value="MONTHLY_SALARY">Monthly Salary</option>
                  <option value="CONTRACT">Piece-Rate Contract</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Daily Wage (LKR) *
                </label>
                <input
                  name="dailyWage"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={4500}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Monthly Salary (if salaried)
                </label>
                <input
                  name="monthlySalary"
                  type="number"
                  step="0.01"
                  defaultValue={0}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Overtime Rate / Hour (LKR)
                </label>
                <input
                  name="overtimeHourlyRate"
                  type="number"
                  step="0.01"
                  defaultValue={845}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Initial Project Assignment
                </label>
                <select
                  name="projectId"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Residential Address
                </label>
                <input
                  name="address"
                  placeholder="Kadawatha / Gampaha"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <Save className="h-4 w-4" /> Register Worker
            </button>
          </form>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

