import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inviteUserAction, toggleUserStatusAction } from "@/actions/erp";
import { formatDateTimeColombo } from "@/lib/utils";
import { UserPlus, Shield, History } from "lucide-react";

export default async function UsersSettingsPage() {
  const session = await requireModuleAccess("SETTINGS", "READ");
  const [memberships, auditLogs] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: session.organizationId },
      include: { user: true, branch: true },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { organizationId: session.organizationId },
      include: { user: true },
      take: 15,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            User Management, Team Invitations & Audit Logs
          </h1>
          <p className="text-xs text-slate-500">
            Manage workspace users, assign RBAC roles, toggle activation status, and review security
            audit history
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Users Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Shield className="h-4 w-4 text-blue-600" />
              Organization Members ({memberships.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                    <th className="pb-2.5 font-semibold">Full Name & Email</th>
                    <th className="pb-2.5 font-semibold">Assigned Role</th>
                    <th className="pb-2.5 font-semibold">Designation</th>
                    <th className="pb-2.5 font-semibold">Last Login</th>
                    <th className="pb-2.5 font-semibold">Status</th>
                    <th className="pb-2.5 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {memberships.map((m) => (
                    <tr key={m.id}>
                      <td className="py-3 pr-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {m.user.fullName}
                        </div>
                        <div className="text-slate-500">{m.user.email}</div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="rounded-lg bg-blue-500/10 px-2.5 py-1 font-semibold text-blue-600 dark:text-blue-400">
                          {m.systemRole}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-slate-600 dark:text-slate-400">
                        {m.title || "—"}
                      </td>
                      <td className="py-3 pr-3 text-slate-500">
                        {formatDateTimeColombo(m.user.lastLoginAt)}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            m.isActive
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-red-500/15 text-red-600"
                          }`}
                        >
                          {m.isActive ? "ACTIVE" : "DEACTIVATED"}
                        </span>
                      </td>
                      <td className="py-3">
                        <form
                          action={async () => {
                            "use server";
                            await toggleUserStatusAction(m.id, !m.isActive);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                          >
                            {m.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invite User Form */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <UserPlus className="h-4 w-4 text-blue-600" />
              Invite / Provision User
            </h2>
            <form
              action={async (formData) => {
                "use server";
                await inviteUserAction(formData);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name *
                </label>
                <input
                  name="fullName"
                  required
                  placeholder="Eng. Dinesh Gunasekara"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Work Email *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="dinesh@apexconstructions.lk"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Phone Number
                </label>
                <input
                  name="phone"
                  placeholder="+94 77 889 9001"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  System RBAC Role *
                </label>
                <select
                  name="role"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="COMPANY_ADMIN">COMPANY_ADMIN</option>
                  <option value="GENERAL_MANAGER">GENERAL_MANAGER</option>
                  <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                  <option value="SITE_ENGINEER">SITE_ENGINEER</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                  <option value="HR_MANAGER">HR_MANAGER</option>
                  <option value="STORE_KEEPER">STORE_KEEPER</option>
                  <option value="PROCUREMENT_OFFICER">PROCUREMENT_OFFICER</option>
                  <option value="CONTRACTOR">CONTRACTOR</option>
                  <option value="CLIENT">CLIENT</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Job Title
                </label>
                <input
                  name="title"
                  placeholder="Senior Resident Engineer"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Temporary Password
                </label>
                <input
                  name="password"
                  defaultValue="Password123!"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-500"
              >
                Create & Grant Workspace Access
              </button>
            </form>
          </div>
        </div>

        {/* Security Audit Log Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <History className="h-4 w-4 text-amber-500" />
            Security & Activity Audit Trail
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2 font-semibold">Timestamp (Asia/Colombo)</th>
                  <th className="pb-2 font-semibold">Actor</th>
                  <th className="pb-2 font-semibold">Module</th>
                  <th className="pb-2 font-semibold">Action</th>
                  <th className="pb-2 font-semibold">Entity</th>
                  <th className="pb-2 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2.5 pr-3 text-slate-500">
                      {formatDateTimeColombo(log.createdAt)}
                    </td>
                    <td className="py-2.5 pr-3 font-medium">
                      {log.user?.fullName || "System"}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] dark:bg-slate-800">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-semibold text-blue-600 dark:text-blue-400">
                      {log.action}
                    </td>
                    <td className="py-2.5 pr-3">{log.entityName || "—"}</td>
                    <td className="py-2.5 text-slate-500">{log.details || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

