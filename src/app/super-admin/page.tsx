import Link from "next/link";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCompactLKR, formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";
import { Building2, CreditCard, ShieldAlert, TrendingUp } from "lucide-react";

export default async function SuperAdminDashboardPage() {
  const session = await requireSession();
  const [organizations, subscriptions, plans, totalUsers, totalProjects] = await Promise.all([
    prisma.organization.findMany({
      include: {
        subscriptions: { include: { plan: true } },
        _count: { select: { projects: true, memberships: true, branches: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.findMany({
      include: { organization: true, plan: true },
    }),
    prisma.subscriptionPlan.findMany({
      orderBy: { monthlyPriceLkr: "asc" },
    }),
    prisma.user.count(),
    prisma.project.count(),
  ]);

  const activeCompanies = organizations.filter((o) => o.isActive).length;
  const trialSubs = subscriptions.filter((s) => s.status === "TRIAL").length;
  const expiredSubs = subscriptions.filter((s) => s.status === "EXPIRED").length;
  const mrr = subscriptions.reduce((s, sub) => {
    const amt = toNumber(sub.amountLkr);
    return s + (sub.billingCycle === "ANNUAL" ? amt / 12 : amt);
  }, 0);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-4 w-4" />
              BuildMaster ERP — Multi-Tenant SaaS Super Admin Control Plane
            </div>
            <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              Platform Tenant & Subscription Governance
            </h1>
            <p className="text-xs text-slate-500">
              Monitor all registered construction companies, MRR, active subscriptions, and SaaS
              plans
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/super-admin/companies"
              className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white"
            >
              Companies ({organizations.length})
            </Link>
            <Link
              href="/super-admin/subscriptions"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
            >
              Subscriptions
            </Link>
            <Link
              href="/super-admin/plans"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
            >
              Plans ({plans.length})
            </Link>
            <Link
              href="/super-admin/analytics"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
            >
              Platform Analytics
            </Link>
          </div>
        </div>

        {/* Super Admin KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Total Registered Companies</div>
            <div className="mt-1 text-2xl font-extrabold">{organizations.length}</div>
            <div className="text-[11px] text-emerald-600">{activeCompanies} Active Tenants</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">14-Day Trial Companies</div>
            <div className="mt-1 text-2xl font-extrabold text-amber-600">{trialSubs}</div>
            <div className="text-[11px] text-slate-400">{expiredSubs} Expired Subscriptions</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Monthly Recurring Revenue (MRR)</div>
            <div className="mt-1 text-2xl font-extrabold text-blue-600">
              {formatCompactLKR(mrr)}
            </div>
            <div className="text-[11px] text-slate-400">{formatLKR(mrr)} / month</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Platform Users</div>
            <div className="mt-1 text-2xl font-extrabold">{totalUsers}</div>
            <div className="text-[11px] text-slate-400">Across all tenants</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Platform Projects</div>
            <div className="mt-1 text-2xl font-extrabold">{totalProjects}</div>
            <div className="text-[11px] text-slate-400">Isolated by organizationId</div>
          </div>
        </div>

        {/* Registered Tenant Workspaces Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-bold">Registered Construction Company Tenants</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2">Company Name & Slug</th>
                  <th className="pb-2">BRN / City</th>
                  <th className="pb-2">SaaS Plan</th>
                  <th className="pb-2">Subscription Status</th>
                  <th className="pb-2">Projects / Users / Branches</th>
                  <th className="pb-2">Registered On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {organizations.map((org) => {
                  const sub = org.subscriptions[0];
                  return (
                    <tr key={org.id}>
                      <td className="py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{org.name}</div>
                        <div className="font-mono text-[11px] text-blue-600">{org.slug}</div>
                      </td>
                      <td className="py-3">
                        {org.businessRegistrationNumber || "—"} • {org.city}
                      </td>
                      <td className="py-3 font-bold">{sub?.plan.name || "Professional"}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            sub?.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-amber-500/15 text-amber-600"
                          }`}
                        >
                          {sub?.status || "TRIAL"}
                        </span>
                      </td>
                      <td className="py-3 font-semibold">
                        {org._count.projects} Projects • {org._count.memberships} Users •{" "}
                        {org._count.branches} Branches
                      </td>
                      <td className="py-3 text-slate-500">{formatDateDDMMYYYY(org.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

