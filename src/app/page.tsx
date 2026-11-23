import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  Calculator,
  HardHat,
  PackageCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Layers,
  FileSpreadsheet,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-600/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">BuildMaster</span>
              <span className="ml-1.5 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400">
                ERP SaaS
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <a href="#modules" className="hover:text-white">
              ERP Modules
            </a>
            <a href="#architecture" className="hover:text-white">
              Financial & BOQ Engine
            </a>
            <a href="#pricing" className="hover:text-white">
              Pricing (LKR)
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-500"
            >
              Start 14-Day Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-800/80 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300">
              <HardHat className="h-3.5 w-3.5 text-amber-400" />
              Enterprise Construction Project Management & ERP Platform • Sri Lanka (LKR)
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Complete Control Over Every{" "}
              <span className="text-blue-400">Project, BOQ, Site</span> &{" "}
              <span className="text-amber-400">Rupee</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-400">
              Built for Sri Lankan construction companies, civil contractors, and engineering firms.
              Manage multi-site projects, FIDIC BOQs, daily site attendance, warehouse stock batches,
              subcontractor IPCs, double-entry accounting, and real-time project Profit & Loss.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"
              >
                Create Company Workspace (14-Day Trial)
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
              >
                Explore Live Demo Workspace
              </Link>
            </div>
          </div>

          {/* KPI Preview Banner */}
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "BOQ & Cost Estimation",
                val: "Material + Labour + Equip",
                sub: "Multi-revision BOQ comparison & PDF/Excel exports",
              },
              {
                label: "Transaction-Safe Inventory",
                val: "GRN → Batch → Site Issue",
                sub: "Zero negative stock leakage & low-stock alerts",
              },
              {
                label: "Subcontractor & Labour",
                val: "IPC Retention & Payroll",
                sub: "Automated OT, advance recovery & net payable math",
              },
              {
                label: "Real-Time Project P&L",
                val: "Double-Entry Ledger",
                sub: "Accurate cost recognition without double-counting",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"
              >
                <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  {item.label}
                </div>
                <div className="mt-2 text-lg font-bold text-white">{item.val}</div>
                <p className="mt-1 text-xs text-slate-400">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">
              12 Integrated Construction ERP Modules
            </h2>
            <p className="mt-3 text-slate-400">
              One unified relational database powering site engineers, quantity surveyors, store
              keepers, accountants, and directors.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Layers,
                title: "Multi-Project & Gantt Scheduling",
                desc: "Track milestones, weighted task progress, variations, and site timelines across residential, commercial, and road projects.",
              },
              {
                icon: Calculator,
                title: "Bill of Quantities (BOQ) Engine",
                desc: "Break down every item into Material, Labour, Equipment & Other rates. Compare Estimated vs Actual quantities and archive revisions.",
              },
              {
                icon: HardHat,
                title: "Workforce, Attendance & Payroll",
                desc: "Daily check-in/out, duplicate attendance prevention, configurable overtime multipliers, festival advances, and payslip generation.",
              },
              {
                icon: PackageCheck,
                title: "Warehouse & Material Inventory",
                desc: "Manage Cement, Tor Steel, River Sand & MEP stock across central yards and site stores with batch costing and stock movement audit trails.",
              },
              {
                icon: FileSpreadsheet,
                title: "Procurement & Subcontractors",
                desc: "Full PR → Quotation → PO → GRN workflow plus Subcontractor Measured Work IPCs with Retention & Advance Recovery.",
              },
              {
                icon: TrendingUp,
                title: "Double-Entry Finance & Project P&L",
                desc: "Balanced journal entries, client progress invoices with partial payments, cashbook, and real-time project gross/net margin analysis.",
              },
            ].map((mod) => (
              <div
                key={mod.title}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-blue-500/40"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400">
                  <mod.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">{mod.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section id="pricing" className="border-t border-slate-800/80 bg-slate-900/30 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white">
              Transparent Multi-Tenant SaaS Pricing (LKR)
            </h2>
            <p className="mt-2 text-slate-400">
              Every plan includes a 14-day free trial, Asia/Colombo timezone configuration, and
              strict organization data isolation.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                tier: "Starter",
                price: "LKR 24,500",
                period: "/month",
                annual: "LKR 245,000 / year",
                desc: "For growing contractors managing up to 5 active projects.",
                features: [
                  "Up to 5 Active Construction Projects",
                  "15 Team Members & Site Engineers",
                  "BOQ Estimation & Task Scheduling",
                  "Daily Labour Attendance & Basic Reports",
                ],
                featured: false,
              },
              {
                tier: "Professional",
                price: "LKR 59,000",
                period: "/month",
                annual: "LKR 590,000 / year",
                desc: "Complete ERP for established builders & civil engineering companies.",
                features: [
                  "Up to 25 Active Projects & 5 Branches",
                  "Full Warehouse Inventory & GRN Procurement",
                  "Subcontractor IPCs, Retention & Payroll",
                  "Double-Entry Accounting & Project P&L",
                  "20 Executive PDF & Excel Reports",
                ],
                featured: true,
              },
              {
                tier: "Enterprise",
                price: "LKR 125,000",
                period: "/month",
                annual: "LKR 1,250,000 / year",
                desc: "Unlimited scale for Tier-1 construction groups & developers.",
                features: [
                  "Unlimited Projects & Multi-Branch Yards",
                  "Dedicated Client Portal Access",
                  "Multi-Level Approval Workflows & Audit Logs",
                  "Custom Roles & Priority Engineering Support",
                ],
                featured: false,
              },
            ].map((plan) => (
              <div
                key={plan.tier}
                className={`rounded-2xl border p-8 ${
                  plan.featured
                    ? "border-blue-500 bg-slate-900 shadow-xl shadow-blue-600/10"
                    : "border-slate-800 bg-slate-900/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{plan.tier}</h3>
                  {plan.featured && (
                    <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-400">{plan.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-sm text-slate-400">{plan.period}</span>
                </div>
                <div className="mt-1 text-xs text-amber-400">{plan.annual} (Save 2 Months)</div>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                    plan.featured
                      ? "bg-blue-600 text-white hover:bg-blue-500"
                      : "border border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  Start 14-Day Free Trial
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-10 text-center text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <span>
              BuildMaster ERP • Multi-Tenant Construction Management SaaS • Default Currency: LKR •
              Asia/Colombo
            </span>
          </div>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-slate-300">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-slate-300">
              Company Registration
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

