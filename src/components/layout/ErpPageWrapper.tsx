import { requireSession, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "./AppShell";

export async function ErpPageWrapper({
  children,
  sessionOverride,
}: {
  children: React.ReactNode;
  sessionOverride?: SessionPayload;
}) {
  const session = sessionOverride ?? (await requireSession());

  const [unreadCount, pendingApprovalsCount] = await Promise.all([
    prisma.notification.count({
      where: { organizationId: session.organizationId, isRead: false },
    }),
    prisma.approval.count({
      where: { organizationId: session.organizationId, status: "PENDING" },
    }),
  ]);

  return (
    <AppShell
      session={session}
      unreadCount={unreadCount}
      pendingApprovalsCount={pendingApprovalsCount}
    >
      {children}
    </AppShell>
  );
}

