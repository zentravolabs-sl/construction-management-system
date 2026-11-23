import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatLKR, toNumber } from "@/lib/utils";

export default async function SuperAdminPlansPage() {
  const session = await requireSession();
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { monthlyPriceLkr: "asc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Super Admin — SaaS Pricing Tiers & Resource Quotas
          </h1>
          <p className="text-xs text-slate-500">
            Starter, Professional, and Enterprise plan configurations in LKR
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="rounded bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-600">
                {p.tier}
              </span>
              <h2 className="mt-2 text-lg font-bold">{p.name}</h2>
              <p className="mt-1 text-xs text-slate-500">{p.description}</p>
              <div className="mt-4 text-xl font-extrabold">
                {formatLKR(toNumber(p.monthlyPriceLkr))} / mo
              </div>
              <div className="text-xs text-amber-600">
                Annual: {formatLKR(toNumber(p.annualPriceLkr))} / yr
              </div>
              <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
                <div>Max Projects: {p.maxProjects}</div>
                <div>Max Users: {p.maxUsers}</div>
                <div>Max Branches: {p.maxBranches}</div>
                <div>Storage Quota: {p.maxStorageMb} MB</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ErpPageWrapper>
  );
}

