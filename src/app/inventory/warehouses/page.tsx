import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Warehouse } from "lucide-react";

export default async function WarehousesPage() {
  const session = await requireModuleAccess("INVENTORY", "READ");
  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId: session.organizationId },
    include: { branch: true, stockMovements: true },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Warehouses & Project Site Storage Locations
          </h1>
          <p className="text-xs text-slate-500">
            Manage central logistics yards and on-site stores
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {warehouses.map((w) => (
            <div
              key={w.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-blue-600" />
                  <span className="font-mono text-xs font-bold text-blue-600">{w.code}</span>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
                  ACTIVE
                </span>
              </div>
              <h3 className="mt-2 text-base font-bold">{w.name}</h3>
              <p className="mt-1 text-xs text-slate-500">Location: {w.location}</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                <span>Store Keeper: {w.keeperName || "Assigned Store Officer"}</span>
                <span className="font-semibold">{w.stockMovements.length} Movements</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ErpPageWrapper>
  );
}

