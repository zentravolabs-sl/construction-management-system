import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireModuleAccess } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatLKR, toNumber } from "@/lib/utils";

const CATEGORIES = [
  "CEMENT",
  "SAND",
  "METAL",
  "BRICKS",
  "STEEL",
  "TIMBER",
  "ELECTRICAL",
  "PLUMBING",
  "PAINT",
  "TILES",
  "HARDWARE",
  "OTHER",
];

export default async function InventoryCategoriesPage() {
  const session = await requireModuleAccess("INVENTORY", "READ");
  const materials = await prisma.material.findMany({
    where: { organizationId: session.organizationId },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Construction Material Categories (12 Standard Divisions)
          </h1>
          <p className="text-xs text-slate-500">
            Valuation and SKU breakdown across standard construction material groups
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const catMats = materials.filter((m) => m.categoryType === cat);
            const val = catMats.reduce(
              (s, m) => s + toNumber(m.currentStock) * toNumber(m.defaultPurchasePrice),
              0
            );
            return (
              <div
                key={cat}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="font-mono text-xs font-bold text-blue-600">{cat}</div>
                <div className="mt-2 text-lg font-extrabold">{formatLKR(val)}</div>
                <div className="mt-1 text-xs text-slate-500">{catMats.length} Active SKUs</div>
              </div>
            );
          })}
        </div>
      </div>
    </ErpPageWrapper>
  );
}

