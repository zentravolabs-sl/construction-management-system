import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateDDMMYYYY } from "@/lib/utils";

export default async function SuperAdminCompaniesPage() {
  const session = await requireSession();
  const organizations = await prisma.organization.findMany({
    include: {
      subscriptions: { include: { plan: true } },
      _count: { select: { projects: true, memberships: true, branches: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Super Admin — Registered Construction Companies ({organizations.length})
          </h1>
          <p className="text-xs text-slate-500">
            All isolated multi-tenant workspaces provisioned on BuildMaster ERP
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600">{org.slug}</span>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                  {org.isActive ? "ACTIVE TENANT" : "SUSPENDED"}
                </span>
              </div>
              <h2 className="mt-2 text-base font-bold">{org.name}</h2>
              <p className="mt-1 text-xs text-slate-500">
                BRN: {org.businessRegistrationNumber || "—"} • City: {org.city} • Currency:{" "}
                {org.currency}
              </p>
              <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                <span>
                  {org._count.projects} Projects • {org._count.memberships} Users
                </span>
                <span className="text-slate-500">Joined {formatDateDDMMYYYY(org.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ErpPageWrapper>
  );
}

