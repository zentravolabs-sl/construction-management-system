import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireSession } from "@/lib/auth";
import { hasPermission, ROLE_LABELS, type ModuleName } from "@/lib/permissions";
import type { SystemRole } from "@prisma/client";
import { Check, X } from "lucide-react";

const ROLES: SystemRole[] = [
  "SUPER_ADMIN",
  "COMPANY_ADMIN",
  "GENERAL_MANAGER",
  "PROJECT_MANAGER",
  "SITE_ENGINEER",
  "ACCOUNTANT",
  "HR_MANAGER",
  "STORE_KEEPER",
  "PROCUREMENT_OFFICER",
  "CONTRACTOR",
  "CLIENT",
];

const MODULES: ModuleName[] = [
  "DASHBOARD",
  "PROJECTS",
  "CLIENTS",
  "BOQ",
  "LABOUR",
  "INVENTORY",
  "PROCUREMENT",
  "CONTRACTORS",
  "FINANCE",
  "SITE_MANAGEMENT",
  "EQUIPMENT",
  "DOCUMENTS",
  "APPROVALS",
  "REPORTS",
  "SETTINGS",
  "CLIENT_PORTAL",
  "SUPER_ADMIN",
];

export default async function RolesMatrixPage() {
  const session = await requireSession();

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Role-Based & Permission-Based Access Control (RBAC / PBAC) Matrix
          </h1>
          <p className="text-xs text-slate-500">
            Server-enforced authorization rules across all 11 construction roles and 17 ERP modules
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <th className="pb-3 pr-4 font-bold">Module</th>
                {ROLES.map((r) => (
                  <th key={r} className="pb-3 pr-3 text-center font-semibold">
                    <div>{ROLE_LABELS[r]}</div>
                    <div className="font-mono text-[9px] text-slate-400">{r}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {MODULES.map((mod) => (
                <tr key={mod} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 pr-4 font-mono font-bold text-slate-900 dark:text-white">
                    {mod}
                  </td>
                  {ROLES.map((r) => {
                    const canRead = hasPermission(r, mod, "READ");
                    const canCreate = hasPermission(r, mod, "CREATE");
                    const canApprove = hasPermission(r, mod, "APPROVE");
                    return (
                      <td key={r} className="py-3 pr-3 text-center">
                        {canRead ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                            <span className="mt-0.5 text-[9px] text-slate-400">
                              {canApprove ? "CRUD+APP" : canCreate ? "CRUD" : "READ"}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                            <X className="h-3 w-3" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

