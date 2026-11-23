import Link from "next/link";
import { ErpPageWrapper } from "@/components/layout/ErpPageWrapper";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/actions/erp";
import { formatDateTimeColombo } from "@/lib/utils";
import { Bell, CheckCheck } from "lucide-react";

export default async function NotificationsPage() {
  const session = await requireSession();
  const notifications = await prisma.notification.findMany({
    where: { organizationId: session.organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ErpPageWrapper sessionOverride={session}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              In-App Notification Center ({notifications.length})
            </h1>
            <p className="text-xs text-slate-500">
              Real-time alerts for low stock, pending approvals, delayed schedules, overdue
              invoices, and client payments
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await markAllNotificationsReadAction();
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              <CheckCheck className="h-4 w-4" /> Mark All as Read
            </button>
          </form>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${
                n.isRead
                  ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  : "border-blue-500/40 bg-blue-500/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-blue-600/10 p-2.5 text-blue-600">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {n.title}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold dark:bg-slate-800">
                      {n.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{n.message}</p>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {formatDateTimeColombo(n.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {n.linkUrl && (
                  <Link
                    href={n.linkUrl}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Open Module →
                  </Link>
                )}
                {!n.isRead && (
                  <form
                    action={async () => {
                      "use server";
                      await markNotificationReadAction(n.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Mark Read
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ErpPageWrapper>
  );
}

