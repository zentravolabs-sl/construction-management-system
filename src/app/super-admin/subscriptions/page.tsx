import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";

export default async function SuperAdminSubscriptionsPage() {
  const session = await requireSession();
  const subscriptions = await prisma.subscription.findMany({
    include: { organization: true, plan: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Super Admin — Tenant Subscriptions & Trial Lifecycle
          </h1>
          <p className="text-xs text-slate-500">
            Track 14-day trials, annual/monthly renewals, and payment gateway references
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2">Company</th>
                  <th className="pb-2">Plan</th>
                  <th className="pb-2">Billing Cycle</th>
                  <th className="pb-2">Amount (LKR)</th>
                  <th className="pb-2">Period End</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 font-bold">{s.organization.name}</td>
                    <td className="py-3 font-semibold text-blue-600">{s.plan.name}</td>
                    <td className="py-3">{s.billingCycle}</td>
                    <td className="py-3 font-bold">{formatLKR(toNumber(s.amountLkr))}</td>
                    <td className="py-3">{formatDateDDMMYYYY(s.currentPeriodEnd)}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                        {s.status}
                      </span>
                    </td>
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

