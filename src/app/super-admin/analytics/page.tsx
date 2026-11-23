import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatLKR, toNumber } from "@/lib/utils";

export default async function SuperAdminAnalyticsPage() {
  const session = await requireSession();
  const [subscriptions, auditCount, projectCount, invoiceCount] = await Promise.all([
    prisma.subscription.findMany({ include: { plan: true, organization: true } }),
    prisma.auditLog.count(),
    prisma.project.count(),
    prisma.invoice.count(),
  ]);

  const arr = subscriptions.reduce((s, sub) => {
    const amt = toNumber(sub.amountLkr);
    return s + (sub.billingCycle === "ANNUAL" ? amt : amt * 12);
  }, 0);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Super Admin — Platform SaaS Revenue & Telemetry Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Annual Recurring Revenue (ARR), tenant conversion metrics, and platform-wide transaction
            volume
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Annual Recurring Revenue (ARR)</div>
            <div className="mt-1 text-xl font-extrabold text-emerald-600">{formatLKR(arr)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Total Projects Hosted</div>
            <div className="mt-1 text-xl font-extrabold">{projectCount}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Total Invoices Processed</div>
            <div className="mt-1 text-xl font-extrabold">{invoiceCount}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Security Audit Events Logged</div>
            <div className="mt-1 text-xl font-extrabold">{auditCount}</div>
          </div>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

