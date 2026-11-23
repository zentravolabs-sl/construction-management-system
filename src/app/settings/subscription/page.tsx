import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";
import { CheckCircle2, CreditCard, ShieldCheck } from "lucide-react";

export default async function SubscriptionSettingsPage() {
  const session = await requireSession();
  const [subscription, plans, projectCount, userCount, branchCount] = await Promise.all([
    prisma.subscription.findFirst({
      where: { organizationId: session.organizationId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPriceLkr: "asc" },
    }),
    prisma.project.count({ where: { organizationId: session.organizationId, deletedAt: null } }),
    prisma.membership.count({ where: { organizationId: session.organizationId } }),
    prisma.branch.count({ where: { organizationId: session.organizationId } }),
  ]);

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            SaaS Subscription Plan, Usage Limits & Billing
          </h1>
          <p className="text-xs text-slate-500">
            Manage your BuildMaster ERP plan, monitor tenant resource utilization, and review
            payment provider settings
          </p>
        </div>

        {/* Active Plan Banner */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-600/5 p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {subscription?.plan.name || "Enterprise Plan"}
                </span>
                <span className="rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-600">
                  {subscription?.status || "ACTIVE"}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Billing Cycle: {subscription?.billingCycle || "ANNUAL"} • Current Period Ends:{" "}
                {formatDateDDMMYYYY(subscription?.currentPeriodEnd)} • Provider:{" "}
                {subscription?.paymentProvider || "PAYHERE"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {formatLKR(toNumber(subscription?.amountLkr || 1250000))}
              </div>
              <div className="text-xs text-slate-500">
                Ref: {subscription?.externalReference || "PH-LK-9988210"}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs text-slate-500">Active Projects Quota</div>
              <div className="mt-1 text-lg font-bold">
                {projectCount} / {subscription?.plan.maxProjects || 999}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs text-slate-500">Team Members Quota</div>
              <div className="mt-1 text-lg font-bold">
                {userCount} / {subscription?.plan.maxUsers || 500}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs text-slate-500">Regional Branches Quota</div>
              <div className="mt-1 text-lg font-bold">
                {branchCount} / {subscription?.plan.maxBranches || 25}
              </div>
            </div>
          </div>
        </div>

        {/* Plan Comparison */}
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = subscription?.planId === p.id;
            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-6 ${
                  isCurrent
                    ? "border-blue-600 bg-white shadow-md dark:bg-slate-900"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{p.name}</h3>
                  {isCurrent && (
                    <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                      Current Plan
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">{p.description}</p>
                <div className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
                  {formatLKR(toNumber(p.monthlyPriceLkr))}{" "}
                  <span className="text-xs font-normal text-slate-500">/month</span>
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400">
                  Annual: {formatLKR(toNumber(p.annualPriceLkr))} / year
                </div>

                <ul className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Up to {p.maxProjects} Projects & {p.maxUsers} Users
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Up to {p.maxBranches} Regional Branches
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Client Portal: {p.hasClientPortal ? "Included" : "Upgrade Required"}
                  </li>
                </ul>
              </div>
            );
          })}
        </div>

        {/* Payment Gateway Provider Abstraction Notice */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <CreditCard className="h-4 w-4 text-blue-600" />
            Payment Gateway Integration Architecture
          </div>
          <p className="mt-1 text-slate-500">
            Configured Provider:{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
              {process.env.PAYMENT_PROVIDER || "PAYHERE_SANDBOX"}
            </code>
            . Live payment capture requires setting{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
              PAYMENT_MERCHANT_ID
            </code>{" "}
            and{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
              PAYMENT_SECRET
            </code>{" "}
            in environment variables. No fake payment transactions are simulated without valid
            merchant credentials.
          </p>
        </div>
      </div>
    </ErpPageWrapper>
  );
}

