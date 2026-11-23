import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDailySiteReportAction } from "@/actions/erp";
import { formatDateDDMMYYYY } from "@/lib/utils";
import { Compass, CloudSun, HardHat, ShieldCheck } from "lucide-react";

export default async function SiteManagementPage() {
  const session = await requireModuleAccess("SITE_MANAGEMENT", "READ");
  const [reports, projects] = await Promise.all([
    prisma.dailySiteReport.findMany({
      where: { organizationId: session.organizationId },
      include: { project: true },
      orderBy: { reportDate: "desc" },
    }),
    prisma.project.findMany({
      where: { organizationId: session.organizationId, deletedAt: null },
      orderBy: { code: "asc" },
    }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Daily Site Operations, Inspections & HSE Safety Logs
          </h1>
          <p className="text-xs text-slate-500">
            Mobile-friendly daily site reporting for resident engineers: weather, labour headcount,
            materials used, and quality instructions
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Submit Daily Site Report */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Compass className="h-4 w-4 text-blue-600" />
              Submit Daily Site Report (DSR)
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await createDailySiteReportAction(formData);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold">Project Site *</label>
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold">Weather</label>
                  <select
                    name="weatherCondition"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="Sunny & Clear">Sunny & Clear (31°C)</option>
                    <option value="Partly Cloudy">Partly Cloudy (29°C)</option>
                    <option value="Afternoon Monsoon Rain">Monsoon Rain (26°C)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold">Site Headcount</label>
                  <input
                    name="labourCount"
                    type="number"
                    defaultValue={65}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold">Work Activities in Progress *</label>
                <textarea
                  name="workActivities"
                  rows={2}
                  required
                  placeholder="Formwork erection, rebar cage lowering, MEP first-fix..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Measured Work Completed *</label>
                <textarea
                  name="workCompleted"
                  rows={2}
                  required
                  placeholder="Completed 340m2 slab shuttering and 14 MT reinforcement..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <input
                name="materialsUsedNote"
                placeholder="Materials consumed today (e.g., 120 Bags Cement, 12 MT Steel)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="equipmentUsedNote"
                placeholder="Plant & Machinery deployed (e.g., Tower Crane TC-01 - 9 hrs)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                name="siteInstructions"
                placeholder="Consultant / QA-QC Inspection Instructions"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Submit Daily Site Report
              </button>
            </form>
          </div>

          {/* Site Reports Stream */}
          <div className="space-y-4 lg:col-span-2">
            {reports.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="rounded bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-600">
                      {r.reportNumber}
                    </span>
                    <span className="ml-2 font-bold text-slate-900 dark:text-white">
                      {r.project.code} — {r.project.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <CloudSun className="h-3.5 w-3.5 text-amber-500" />
                      {r.weatherCondition}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardHat className="h-3.5 w-3.5 text-blue-500" />
                      {r.labourCount} Workers
                    </span>
                    <span>{formatDateDDMMYYYY(r.reportDate)}</span>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                    <div className="font-semibold text-slate-500">Work Activities Executed</div>
                    <p className="mt-1">{r.workActivities}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/5 p-3 text-xs">
                    <div className="font-semibold text-emerald-600">Measured Output Completed</div>
                    <p className="mt-1">{r.workCompleted}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>Materials: {r.materialsUsedNote || "Logged via store issue"}</span>
                  <span>Equipment: {r.equipmentUsedNote || "Standard site plant"}</span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> Zero Safety Incidents • By{" "}
                    {r.submittedBy}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

