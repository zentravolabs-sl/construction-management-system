import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import type { SystemRole } from "@prisma/client";
import { prisma } from "./prisma";
import { assertPermission, type ModuleName, type PermissionAction } from "./permissions";

const SESSION_COOKIE_NAME = "buildmaster_erp_session";
const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "buildmaster-erp-super-secret-jwt-key-2026-production-sri-lanka"
);

export interface SessionPayload {
  userId: string;
  email: string;
  fullName: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: SystemRole;
  clientId?: string | null;
  contractorId?: string | null;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireModuleAccess(
  module: ModuleName,
  action: PermissionAction = "READ"
): Promise<SessionPayload> {
  const session = await requireSession();
  assertPermission(session.role, module, action);
  return session;
}

export async function logAudit(params: {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  module: string;
  entityId?: string;
  entityName?: string;
  details?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId ?? null,
        userId: params.userId ?? null,
        action: params.action,
        module: params.module,
        entityId: params.entityId,
        entityName: params.entityName,
        details: params.details,
      },
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}

