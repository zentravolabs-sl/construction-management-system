import Link from "next/link";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireSession } from "@/lib/auth";
import { Building2, Users, ShieldCheck, CreditCard } from "lucide-react";

export default async function SettingsIndexPage() {
  const session = await requireSession();

  const cards = [
    {
      title: "Company Profile & Branches",
      desc: "Manage legal entity details, BRN, TIN, default VAT %, negative stock rules, and regional offices.",
      href: "/settings/company",
      icon: Building2,
    },
    {
      title: "Users & Team Access",
      desc: "Invite engineers, quantity surveyors, store keepers, and accountants to your workspace.",
      href: "/settings/users",
      icon: Users,
    },
    {
      title: "Roles & Permission Matrix",
      desc: "Inspect the 11 system roles and module-level CREATE, READ, UPDATE, DELETE, APPROVE permissions.",
      href: "/settings/roles",
      icon: ShieldCheck,
    },
    {
      title: "SaaS Subscription & Billing",
      desc: "Manage your Starter, Professional, or Enterprise plan, usage limits, and billing cycle.",
      href: "/settings/subscription",
      icon: CreditCard,
    },
  ];

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Workspace Settings & Administration
          </h1>
          <p className="text-xs text-slate-500">
            Configure organization parameters, team access, RBAC policies, and SaaS subscription
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 inline-flex rounded-xl bg-blue-600/10 p-3 text-blue-600 dark:text-blue-400">
                <c.icon className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 dark:text-white">
                {c.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {c.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </ErpPageWrapper>
  );
}

