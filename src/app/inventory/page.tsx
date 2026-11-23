import Link from "next/link";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCompactLKR, formatLKR, toNumber } from "@/lib/utils";
import {
  Package,
  AlertTriangle,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  History,
} from "lucide-react";

export default async function InventoryOverviewPage() {
  const session = await requireModuleAccess("INVENTORY", "READ");
  const [materials, warehouses, movements] = await Promise.all([
    prisma.material.findMany({
      where: { organizationId: session.organizationId },
      include: { preferredSupplier: true },
      orderBy: { code: "asc" },
    }),
    prisma.warehouse.findMany({
      where: { organizationId: session.organizationId },
    }),
    prisma.stockMovement.findMany({
      where: { organizationId: session.organizationId },
      include: { material: true, warehouse: true },
      orderBy: { movementDate: "desc" },
      take: 10,
    }),
  ]);

  const totalInventoryValuation = materials.reduce(
    (s, m) => s + toNumber(m.currentStock) * toNumber(m.defaultPurchasePrice),
    0
  );
  const lowStock = materials.filter(
    (m) => toNumber(m.currentStock) <= toNumber(m.minimumStockLevel)
  );

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Construction Inventory & Warehouse Hub
            </h1>
            <p className="text-xs text-slate-500">
              Transaction-safe stock management across central yards and project site stores
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/inventory/stock-receive"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" /> Stock Receive
            </Link>
            <Link
              href="/inventory/stock-issue"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <ArrowUpFromLine className="h-3.5 w-3.5" /> Issue to Project
            </Link>
            <Link
              href="/inventory/stock-return"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Stock Return
            </Link>
            <Link
              href="/inventory/stock-history"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
            >
              <History className="h-3.5 w-3.5" /> Ledger
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Total Inventory Valuation</span>
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <div className="mt-1 text-xl font-extrabold">
              {formatCompactLKR(totalInventoryValuation)}
            </div>
            <div className="text-[11px] text-slate-400">{formatLKR(totalInventoryValuation)}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Material Master SKUs</span>
              <Package className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-1 text-xl font-extrabold">{materials.length}</div>
            <Link href="/inventory/materials" className="text-[11px] font-semibold text-blue-600">
              Manage Materials →
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Low Stock Alerts</span>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="mt-1 text-xl font-extrabold text-red-600">{lowStock.length}</div>
            <div className="text-[11px] text-slate-400">Below minimum reorder threshold</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Active Warehouses & Yards</span>
              <Warehouse className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-1 text-xl font-extrabold">{warehouses.length}</div>
            <Link href="/inventory/warehouses" className="text-[11px] font-semibold text-blue-600">
              View Yards →
            </Link>
          </div>
        </div>

        {/* Material Stock Valuation Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Live Material Stock Balances</h2>
            <Link
              href="/inventory/materials"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Add New Material
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <th className="pb-2">Code</th>
                  <th className="pb-2">Material Name</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Available Stock</th>
                  <th className="pb-2">Min Level</th>
                  <th className="pb-2">Unit Cost</th>
                  <th className="pb-2">Total Value (LKR)</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {materials.map((m) => {
                  const cur = toNumber(m.currentStock);
                  const min = toNumber(m.minimumStockLevel);
                  const isLow = cur <= min;
                  return (
                    <tr key={m.id}>
                      <td className="py-2.5 font-mono font-bold text-blue-600">{m.code}</td>
                      <td className="py-2.5 font-bold">{m.name}</td>
                      <td className="py-2.5">{m.categoryType}</td>
                      <td className="py-2.5 font-extrabold">
                        {cur} {m.unit}
                      </td>
                      <td className="py-2.5 text-slate-500">
                        {min} {m.unit}
                      </td>
                      <td className="py-2.5">{formatLKR(toNumber(m.defaultPurchasePrice))}</td>
                      <td className="py-2.5 font-bold">
                        {formatLKR(cur * toNumber(m.defaultPurchasePrice))}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isLow
                              ? "bg-red-500/15 text-red-600"
                              : "bg-emerald-500/15 text-emerald-600"
                          }`}
                        >
                          {isLow ? "LOW STOCK" : "HEALTHY"}
                        </span>
                      </td>
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

