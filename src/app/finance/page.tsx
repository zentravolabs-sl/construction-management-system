import Link from "next/link";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCompactLKR, formatLKR, toNumber } from "@/lib/utils";
import {
  Landmark,
  FileText,
  CreditCard,
  Receipt,
  BookOpen,
  Scale,
  TrendingUp,
} from "lucide-react";

export default async function FinanceOverviewPage() {
  const session = await requireModuleAccess("FINANCE", "READ");
  const [accounts, invoices, expenses, journals] = await Promise.all([
    prisma.account.findMany({ where: { organizationId: session.organizationId } }),
    prisma.invoice.findMany({ where: { organizationId: session.organizationId } }),
    prisma.expense.findMany({
      where: { organizationId: session.organizationId, status: "APPROVED" },
    }),
    prisma.journalEntry.findMany({ where: { organizationId: session.organizationId } }),
  ]);

  const totalBankAndCash = accounts
    .filter((a) => a.isBankAccount || a.isCashAccount)
    .reduce((s, a) => s + toNumber(a.balance), 0);
  const totalInvoiced = invoices.reduce((s, i) => s + toNumber(i.totalAmount), 0);
  const totalAR = invoices.reduce((s, i) => s + toNumber(i.outstandingAmount), 0);
  const totalDirectExpenses = expenses.reduce((s, e) => s + toNumber(e.amount), 0);

  const navCards = [
    {
      title: "Real-Time Project Profit & Loss",
      desc: "Contract + variation revenue vs material consumption, labour, contractor IPCs & indirect costs.",
      href: "/finance/profit-loss",
      icon: TrendingUp,
    },
    {
      title: "Chart of Accounts",
      desc: "Asset, Liability, Equity, Revenue, and Cost of Sales accounts in LKR.",
      href: "/finance/accounts",
      icon: Landmark,
    },
    {
      title: "Client Invoices & Partial Payments",
      desc: "Generate IPC invoices with configurable VAT and apply partial client settlements.",
      href: "/finance/invoices",
      icon: FileText,
    },
    {
      title: "Payment Receipts & Disbursements",
      desc: "Track incoming client receipts and outgoing supplier/subcontractor settlements.",
      href: "/finance/payments",
      icon: CreditCard,
    },
    {
      title: "Project Expenses Register",
      desc: "Manage transport, fuel, machinery rental, utility, and site welfare expenses.",
      href: "/finance/expenses",
      icon: Receipt,
    },
    {
      title: "Treasury Cashbook & Bank Ledger",
      desc: "Monitor corporate bank current accounts and site petty cash floats.",
      href: "/finance/cashbook",
      icon: BookOpen,
    },
    {
      title: "Double-Entry Journal Engine",
      desc: "Post balanced journal entries enforcing Total Debit = Total Credit.",
      href: "/finance/journals",
      icon: Scale,
    },
  ];

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Financial Accounting & Project Cost Control Center
          </h1>
          <p className="text-xs text-slate-500">
            Double-entry construction accounting, IPC progress invoicing, treasury cashbook &
            real-time P&L
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Cash & Bank Liquidity</div>
            <div className="mt-1 text-xl font-extrabold text-emerald-600">
              {formatCompactLKR(totalBankAndCash)}
            </div>
            <div className="text-[11px] text-slate-400">{formatLKR(totalBankAndCash)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Total Certified Billings</div>
            <div className="mt-1 text-xl font-extrabold text-blue-600">
              {formatCompactLKR(totalInvoiced)}
            </div>
            <div className="text-[11px] text-slate-400">{invoices.length} Client IPC Invoices</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Accounts Receivable (AR)</div>
            <div className="mt-1 text-xl font-extrabold text-amber-600">
              {formatCompactLKR(totalAR)}
            </div>
            <div className="text-[11px] text-slate-400">{formatLKR(totalAR)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Posted Journal Vouchers</div>
            <div className="mt-1 text-xl font-extrabold">{journals.length} Balanced</div>
            <div className="text-[11px] text-slate-400">
              Approved Vouchers: {formatCompactLKR(totalDirectExpenses)}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {navCards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-3 inline-flex rounded-xl bg-blue-600/10 p-3 text-blue-600 dark:text-blue-400">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold group-hover:text-blue-600">{c.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{c.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </ErpPageWrapper>
  );
}

