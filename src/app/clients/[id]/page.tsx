import Link from "next/link";
import { notFound } from "next/navigation";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateDDMMYYYY, formatLKR, toNumber } from "@/lib/utils";
import { ArrowLeft, Building2, FolderKanban, Landmark } from "lucide-react";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireModuleAccess("CLIENTS", "READ");
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      projects: {
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        orderBy: { invoiceDate: "desc" },
      },
      payments: {
        orderBy: { paymentDate: "desc" },
      },
    },
  });

  if (!client) notFound();

  const totalContractValue = client.projects.reduce((s, p) => s + toNumber(p.contractValue), 0);
  const totalInvoiced = client.invoices.reduce((s, i) => s + toNumber(i.totalAmount), 0);
  const totalPaid = client.invoices.reduce((s, i) => s + toNumber(i.paidAmount), 0);
  const totalOutstanding = client.invoices.reduce(
    (s, i) => s + toNumber(i.outstandingAmount),
    0
  );

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-600/10 px-2.5 py-1 font-mono text-xs font-bold text-blue-600">
                {client.clientCode}
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{client.name}</h1>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {client.clientType} • Contact: {client.contactPerson || "—"} • Phone: {client.phone} •
              BRN/NIC: {client.nicOrBrn || "—"}
            </p>
          </div>
          <Link
            href="/clients"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Clients
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Total Contract Value</div>
            <div className="mt-1 text-lg font-extrabold">{formatLKR(totalContractValue)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Total Invoiced (IPC)</div>
            <div className="mt-1 text-lg font-extrabold text-blue-600">
              {formatLKR(totalInvoiced)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Total Received</div>
            <div className="mt-1 text-lg font-extrabold text-emerald-600">
              {formatLKR(totalPaid)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-xs text-slate-500">Outstanding Balance</div>
            <div className="mt-1 text-lg font-extrabold text-amber-600">
              {formatLKR(totalOutstanding)}
            </div>
          </div>
        </div>

        {/* Client Projects */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <FolderKanban className="h-4 w-4 text-blue-600" />
            Client Construction Projects ({client.projects.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2 font-semibold">Code</th>
                  <th className="pb-2 font-semibold">Project Name</th>
                  <th className="pb-2 font-semibold">Location</th>
                  <th className="pb-2 font-semibold">Contract Value</th>
                  <th className="pb-2 font-semibold">Progress</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {client.projects.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-3 font-bold text-blue-600">
                      <Link href={`/projects/${p.id}`} className="hover:underline">
                        {p.code}
                      </Link>
                    </td>
                    <td className="py-3 pr-3 font-medium">{p.name}</td>
                    <td className="py-3 pr-3 text-slate-500">{p.location}</td>
                    <td className="py-3 pr-3 font-semibold">
                      {formatLKR(toNumber(p.contractValue))}
                    </td>
                    <td className="py-3 pr-3 font-semibold">{toNumber(p.calculatedProgress)}%</td>
                    <td className="py-3">
                      <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-bold text-blue-600">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client Invoices */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Landmark className="h-4 w-4 text-emerald-600" />
            Invoice & Payment Ledger ({client.invoices.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2 font-semibold">Invoice #</th>
                  <th className="pb-2 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Due Date</th>
                  <th className="pb-2 font-semibold">Total Amount</th>
                  <th className="pb-2 font-semibold">Paid Amount</th>
                  <th className="pb-2 font-semibold">Outstanding</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {client.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 pr-3 font-mono font-bold">{inv.invoiceNumber}</td>
                    <td className="py-3 pr-3 text-slate-500">
                      {formatDateDDMMYYYY(inv.invoiceDate)}
                    </td>
                    <td className="py-3 pr-3 text-slate-500">{formatDateDDMMYYYY(inv.dueDate)}</td>
                    <td className="py-3 pr-3 font-semibold">
                      {formatLKR(toNumber(inv.totalAmount))}
                    </td>
                    <td className="py-3 pr-3 font-semibold text-emerald-600">
                      {formatLKR(toNumber(inv.paidAmount))}
                    </td>
                    <td className="py-3 pr-3 font-semibold text-amber-600">
                      {formatLKR(toNumber(inv.outstandingAmount))}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold dark:bg-slate-800">
                        {inv.status}
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

