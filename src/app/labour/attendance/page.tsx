import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAttendanceAction } from "@/actions/erp";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";
import { CalendarCheck, ShieldAlert } from "lucide-react";

export default async function LabourAttendancePage() {
  const session = await requireModuleAccess("LABOUR", "READ");

  const [labours, projects, attendances] = await Promise.all([
    prisma.labour.findMany({
      where: { organizationId: session.organizationId, status: "ACTIVE", deletedAt: null },
      orderBy: { labourCode: "asc" },
    }),
    prisma.project.findMany({
      where: { organizationId: session.organizationId, deletedAt: null },
      orderBy: { code: "asc" },
    }),
    prisma.attendance.findMany({
      where: { organizationId: session.organizationId },
      include: { labour: true, project: true },
      orderBy: { workDate: "desc" },
      take: 40,
    }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Daily Labour Attendance & Overtime Register
          </h1>
          <p className="text-xs text-slate-500">
            Log daily check-in/out, full/half days, and overtime hours. Enforces unique constraint on
            (Worker + Work Date + Shift) to prevent duplicate entries.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Log Attendance Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <CalendarCheck className="h-4 w-4 text-blue-600" />
              Record Worker Attendance
            </h2>

            <form
              action={async (formData) => {
                "use server";
                await recordAttendanceAction(formData);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold">Worker *</label>
                <select
                  name="labourId"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  {labours.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.labourCode} - {l.fullName} ({l.categoryType})
                    </option>
                  ))}
                </select>
              </div>

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
                  <label className="block text-xs font-semibold">Work Date *</label>
                  <input
                    name="workDate"
                    type="date"
                    required
                    defaultValue="2026-11-21"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Shift</label>
                  <select
                    name="shift"
                    defaultValue="DAY"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="DAY">DAY SHIFT</option>
                    <option value="NIGHT">NIGHT SHIFT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold">Status *</label>
                  <select
                    name="status"
                    defaultValue="FULL_DAY"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="FULL_DAY">FULL_DAY (1.0x)</option>
                    <option value="HALF_DAY">HALF_DAY (0.5x)</option>
                    <option value="ABSENT">ABSENT (0.0x)</option>
                    <option value="LEAVE">LEAVE (0.0x)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold">Overtime Hours</label>
                  <input
                    name="overtimeHours"
                    type="number"
                    step="0.5"
                    defaultValue={2}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold">Check-In</label>
                  <input
                    name="checkIn"
                    defaultValue="07:30"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold">Check-Out</label>
                  <input
                    name="checkOut"
                    defaultValue="18:30"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-amber-500/10 p-2.5 text-[11px] text-amber-700 dark:text-amber-300">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Duplicate Guard Active
                </div>
                Duplicate attendance for the same worker, date, and shift is blocked at both action
                and database constraint levels.
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Calculate Wage & Save Attendance
              </button>
            </form>
          </div>

          {/* Attendance Register Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-bold">
              Recent Attendance & Wage Calculations ({attendances.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                    <th className="pb-2">Date / Shift</th>
                    <th className="pb-2">Worker</th>
                    <th className="pb-2">Project</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Base Wage</th>
                    <th className="pb-2">OT Earned</th>
                    <th className="pb-2">Total Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attendances.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2.5 pr-2">
                        <div className="font-semibold">{formatDateDDMMYYYY(a.workDate)}</div>
                        <div className="text-[10px] text-slate-400">
                          {a.shift} ({a.checkIn}–{a.checkOut})
                        </div>
                      </td>
                      <td className="py-2.5 pr-2">
                        <div className="font-bold">{a.labour.fullName}</div>
                        <div className="text-[10px] text-slate-500">{a.labour.categoryType}</div>
                      </td>
                      <td className="py-2.5 pr-2 font-mono text-blue-600">{a.project.code}</td>
                      <td className="py-2.5 pr-2">
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2">{formatLKR(toNumber(a.dailyWageEarned))}</td>
                      <td className="py-2.5 pr-2 text-amber-600">
                        {formatLKR(toNumber(a.overtimeEarned))} ({toNumber(a.overtimeHours)}h)
                      </td>
                      <td className="py-2.5 font-extrabold">
                        {formatLKR(toNumber(a.totalEarned))}
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

