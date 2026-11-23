"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  hashPassword,
  logAudit,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { redirect } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function loginAction(formData: FormData) {
  const rawEmail = String(formData.get("email") || "").trim().toLowerCase();
  const rawPassword = String(formData.get("password") || "");

  const parsed = loginSchema.safeParse({ email: rawEmail, password: rawPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid credentials" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: {
      memberships: {
        where: { isActive: true },
        include: { organization: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!user || !user.isActive) {
    return { error: "Invalid email or password, or account is deactivated." };
  }

  const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return { error: "Invalid email or password." };
  }

  const primaryMembership = user.memberships[0];
  if (!primaryMembership) {
    return { error: "No active company workspace found for this user." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const effectiveRole =
    user.systemRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : primaryMembership.systemRole;

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    organizationId: primaryMembership.organizationId,
    organizationName: primaryMembership.organization.name,
    organizationSlug: primaryMembership.organization.slug,
    role: effectiveRole,
    clientId: user.clientId,
    contractorId: user.contractorId,
  });

  await logAudit({
    organizationId: primaryMembership.organizationId,
    userId: user.id,
    action: "USER_LOGIN",
    module: "AUTH",
    entityId: user.id,
    entityName: user.email,
    details: `Logged in with role ${effectiveRole}`,
  });

  if (effectiveRole === "CLIENT") {
    return { success: true, redirectTo: "/portal/dashboard" };
  }
  if (effectiveRole === "SUPER_ADMIN") {
    return { success: true, redirectTo: "/dashboard" };
  }

  return { success: true, redirectTo: "/dashboard" };
}

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid business email is required"),
  phone: z.string().min(7, "Phone number is required"),
  companyName: z.string().min(2, "Company name is required"),
  businessRegNo: z.string().optional(),
  city: z.string().default("Colombo"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerCompanyAction(formData: FormData) {
  const data = {
    fullName: String(formData.get("fullName") || "").trim(),
    email: String(formData.get("email") || "").trim().toLowerCase(),
    phone: String(formData.get("phone") || "").trim(),
    companyName: String(formData.get("companyName") || "").trim(),
    businessRegNo: String(formData.get("businessRegNo") || "").trim(),
    city: String(formData.get("city") || "Colombo").trim(),
    password: String(formData.get("password") || ""),
  };

  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const baseSlug = parsed.data.companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
  const passwordHash = await hashPassword(parsed.data.password);

  let starterPlan = await prisma.subscriptionPlan.findUnique({
    where: { tier: "PROFESSIONAL" },
  });
  if (!starterPlan) {
    starterPlan = await prisma.subscriptionPlan.create({
      data: {
        name: "Professional Plan",
        tier: "PROFESSIONAL",
        monthlyPriceLkr: 59000,
        annualPriceLkr: 590000,
        maxProjects: 25,
        maxUsers: 75,
        maxBranches: 5,
      },
    });
  }

  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 14);

  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: parsed.data.companyName,
        slug,
        businessRegistrationNumber: parsed.data.businessRegNo || null,
        city: parsed.data.city,
        phone: parsed.data.phone,
        email: parsed.data.email,
        currency: "LKR",
        timezone: "Asia/Colombo",
        dateFormat: "DD/MM/YYYY",
      },
    });

    const branch = await tx.branch.create({
      data: {
        organizationId: org.id,
        name: `${parsed.data.city} Head Office`,
        code: "BR-HQ",
        city: parsed.data.city,
        phone: parsed.data.phone,
        email: parsed.data.email,
        isHeadOffice: true,
      },
    });

    const user = await tx.user.create({
      data: {
        email: parsed.data.email,
        passwordHash,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        systemRole: "COMPANY_ADMIN",
        emailVerified: new Date(),
      },
    });

    await tx.membership.create({
      data: {
        organizationId: org.id,
        userId: user.id,
        branchId: branch.id,
        systemRole: "COMPANY_ADMIN",
        title: "Managing Director / Company Admin",
      },
    });

    await tx.subscription.create({
      data: {
        organizationId: org.id,
        planId: starterPlan.id,
        status: "TRIAL",
        billingCycle: "MONTHLY",
        trialStartsAt: new Date(),
        trialEndsAt: trialEnds,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEnds,
        amountLkr: starterPlan.monthlyPriceLkr,
      },
    });

    // Seed default Chart of Accounts for new tenant
    await tx.account.createMany({
      data: [
        {
          organizationId: org.id,
          code: "1010",
          name: "Corporate Bank Account (LKR)",
          accountType: "ASSET",
          isBankAccount: true,
          isSystem: true,
        },
        {
          organizationId: org.id,
          code: "1020",
          name: "Site Petty Cash Float",
          accountType: "ASSET",
          isCashAccount: true,
          isSystem: true,
        },
        {
          organizationId: org.id,
          code: "1100",
          name: "Accounts Receivable",
          accountType: "ASSET",
          isSystem: true,
        },
        {
          organizationId: org.id,
          code: "1200",
          name: "Materials Inventory Asset",
          accountType: "ASSET",
          isSystem: true,
        },
        {
          organizationId: org.id,
          code: "2010",
          name: "Accounts Payable",
          accountType: "LIABILITY",
          isSystem: true,
        },
        {
          organizationId: org.id,
          code: "4010",
          name: "Contract Construction Revenue",
          accountType: "REVENUE",
          isSystem: true,
        },
        {
          organizationId: org.id,
          code: "5010",
          name: "Direct Construction Costs",
          accountType: "EXPENSE",
          isSystem: true,
        },
      ],
    });

    return { org, user };
  });

  await setSessionCookie({
    userId: result.user.id,
    email: result.user.email,
    fullName: result.user.fullName,
    organizationId: result.org.id,
    organizationName: result.org.name,
    organizationSlug: result.org.slug,
    role: "COMPANY_ADMIN",
  });

  await logAudit({
    organizationId: result.org.id,
    userId: result.user.id,
    action: "COMPANY_REGISTERED",
    module: "ONBOARDING",
    entityId: result.org.id,
    entityName: result.org.name,
    details: "Started 14-day Free Trial on BuildMaster ERP",
  });

  return { success: true, redirectTo: "/onboarding/company" };
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function quickDemoLoginAction(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        where: { isActive: true },
        include: { organization: true },
      },
    },
  });

  if (!user || !user.memberships[0]) {
    return { error: "Demo user not found. Please run database seed." };
  }

  const m = user.memberships[0];
  const effectiveRole = user.systemRole === "SUPER_ADMIN" ? "SUPER_ADMIN" : m.systemRole;

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    fullName: user.fullName,
    organizationId: m.organizationId,
    organizationName: m.organization.name,
    organizationSlug: m.organization.slug,
    role: effectiveRole,
    clientId: user.clientId,
    contractorId: user.contractorId,
  });

  if (effectiveRole === "CLIENT") {
    return { success: true, redirectTo: "/portal/dashboard" };
  }
  return { success: true, redirectTo: "/dashboard" };
}

