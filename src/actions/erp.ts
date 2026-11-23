"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireModuleAccess, requireSession, logAudit, hashPassword } from "@/lib/auth";
import {
  calculateAttendanceEarnings,
  calculateBoqItem,
  calculateContractorNetPayable,
  calculateInvoiceTotals,
  calculatePayrollItem,
  calculateProjectProgress,
  validateAndCalculateStockChange,
  validateJournalBalance,
} from "@/lib/calculations";
import { toNumber, round2 } from "@/lib/utils";
import type {
  ApprovalStatus,
  AttendanceStatus,
  DocumentCategory,
  ExpenseCategoryType,
  LabourCategoryType,
  LabourEmploymentType,
  MaterialCategoryType,
  PaymentMethod,
  PriorityLevel,
  ProjectStatus,
  ProjectType,
  SystemRole,
  TaskStatus,
} from "@prisma/client";

// ============================================================================
// 1. ONBOARDING & COMPANY SETTINGS ACTIONS
// ============================================================================

export async function updateCompanySettingsAction(formData: FormData) {
  const session = await requireModuleAccess("SETTINGS", "UPDATE");

  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "Colombo").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const brn = String(formData.get("businessRegistrationNumber") || "").trim();
  const tin = String(formData.get("taxIdentificationNumber") || "").trim();
  const defaultTaxRate = Number(formData.get("defaultTaxRate") ?? 18);
  const workingDays = Number(formData.get("standardWorkingDaysPerMonth") ?? 26);
  const allowNegativeStock = formData.get("allowNegativeStock") === "true";

  if (!name) return { error: "Company name is required." };

  await prisma.organization.update({
    where: { id: session.organizationId },
    data: {
      name,
      address,
      city,
      phone,
      email,
      website,
      businessRegistrationNumber: brn,
      taxIdentificationNumber: tin,
      defaultTaxRate,
      standardWorkingDaysPerMonth: workingDays,
      allowNegativeStock,
      onboardingCompleted: true,
    },
  });

  await logAudit({
    organizationId: session.organizationId,
    userId: session.userId,
    action: "UPDATE_COMPANY_SETTINGS",
    module: "SETTINGS",
    entityId: session.organizationId,
    entityName: name,
  });

  revalidatePath("/settings/company");
  revalidatePath("/onboarding/company");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createBranchAction(formData: FormData) {
  const session = await requireModuleAccess("SETTINGS", "CREATE");
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || `BR-${Date.now().toString().slice(-4)}`).trim().toUpperCase();
  const city = String(formData.get("city") || "Colombo").trim();
  const address = String(formData.get("address") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!name) return { error: "Branch name is required." };

  await prisma.branch.create({
    data: {
      organizationId: session.organizationId,
      name,
      code,
      city,
      address,
      phone,
    },
  });

  revalidatePath("/settings/company");
  revalidatePath("/onboarding/branch");
  return { success: true };
}

export async function inviteUserAction(formData: FormData) {
  const session = await requireModuleAccess("SETTINGS", "CREATE");
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const role = String(formData.get("role") || "SITE_ENGINEER") as SystemRole;
  const title = String(formData.get("title") || "").trim();
  const password = String(formData.get("password") || "Password123!");

  if (!fullName || !email) {
    return { error: "Full name and email are required." };
  }

  const passwordHash = await hashPassword(password);

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        systemRole: role === "SUPER_ADMIN" ? "COMPANY_ADMIN" : role,
        emailVerified: new Date(),
      },
    });
  }

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: session.organizationId,
        userId: user.id,
      },
    },
    update: {
      systemRole: role === "SUPER_ADMIN" ? "COMPANY_ADMIN" : role,
      title: title || role,
      isActive: true,
    },
    create: {
      organizationId: session.organizationId,
      userId: user.id,
      systemRole: role === "SUPER_ADMIN" ? "COMPANY_ADMIN" : role,
      title: title || role,
      isActive: true,
    },
  });

  await logAudit({
    organizationId: session.organizationId,
    userId: session.userId,
    action: "USER_INVITED",
    module: "SETTINGS",
    entityId: user.id,
    entityName: email,
    details: `Assigned role ${role}`,
  });

  revalidatePath("/settings/users");
  revalidatePath("/onboarding/team");
  return { success: true };
}

export async function toggleUserStatusAction(membershipId: string, isActive: boolean) {
  const session = await requireModuleAccess("SETTINGS", "UPDATE");
  const m = await prisma.membership.findFirst({
    where: { id: membershipId, organizationId: session.organizationId },
  });
  if (!m) return { error: "User membership not found." };

  await prisma.membership.update({
    where: { id: membershipId },
    data: { isActive },
  });

  revalidatePath("/settings/users");
  return { success: true };
}

// ============================================================================
// 2. CLIENT MANAGEMENT ACTIONS
// ============================================================================

export async function createClientAction(formData: FormData) {
  const session = await requireModuleAccess("CLIENTS", "CREATE");
  const name = String(formData.get("name") || "").trim();
  const companyName = String(formData.get("companyName") || name).trim();
  const clientType = String(formData.get("clientType") || "COMPANY") === "INDIVIDUAL" ? "INDIVIDUAL" : "COMPANY";
  const contactPerson = String(formData.get("contactPerson") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "Colombo").trim();
  const nicOrBrn = String(formData.get("nicOrBrn") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!name || !phone) {
    return { error: "Client name and phone number are required." };
  }

  const count = await prisma.client.count({
    where: { organizationId: session.organizationId },
  });
  const clientCode = `CL-${String(count + 1).padStart(3, "0")}`;

  const client = await prisma.client.create({
    data: {
      organizationId: session.organizationId,
      clientCode,
      clientType,
      name,
      companyName,
      contactPerson,
      phone,
      email: email || null,
      address,
      city,
      nicOrBrn,
      notes,
      portalEnabled: true,
    },
  });

  await logAudit({
    organizationId: session.organizationId,
    userId: session.userId,
    action: "CREATE_CLIENT",
    module: "CLIENTS",
    entityId: client.id,
    entityName: client.name,
  });

  revalidatePath("/clients");
  revalidatePath("/projects/new");
  return { success: true, clientId: client.id };
}

// ============================================================================
// 3. PROJECT MANAGEMENT, TASKS & MILESTONES ACTIONS
// ============================================================================

export async function recalculateAndSaveProjectProgress(projectId: string, organizationId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
    include: { milestones: true, tasks: true },
  });
  if (!project) return 0;

  const progress = calculateProjectProgress(
    project.milestones.map((m) => ({
      weightPct: toNumber(m.weightPct),
      progressPct: toNumber(m.progressPct),
      isCompleted: m.isCompleted,
    })),
    project.tasks.map((t) => ({
      weight: t.weight,
      progressPct: toNumber(t.progressPct),
      status: t.status,
    }))
  );

  await prisma.project.update({
    where: { id: projectId },
    data: { calculatedProgress: progress },
  });

  return progress;
}

export async function createProjectAction(formData: FormData) {
  const session = await requireModuleAccess("PROJECTS", "CREATE");
  const name = String(formData.get("name") || "").trim();
  const clientId = String(formData.get("clientId") || "").trim();
  const projectType = (String(formData.get("projectType") || "COMMERCIAL_CONSTRUCTION") as ProjectType);
  const location = String(formData.get("location") || "").trim();
  const city = String(formData.get("city") || "Colombo").trim();
  const description = String(formData.get("description") || "").trim();
  const startDate = new Date(String(formData.get("startDate") || new Date().toISOString()));
  const expectedCompletionDate = new Date(
    String(formData.get("expectedCompletionDate") || new Date(Date.now() + 180 * 86400000).toISOString())
  );
  const contractValue = Number(formData.get("contractValue") || 0);
  const estimatedBudget = Number(formData.get("estimatedBudget") || 0);
  const status = (String(formData.get("status") || "ONGOING") as ProjectStatus);
  const priority = (String(formData.get("priority") || "HIGH") as PriorityLevel);

  if (!name || !clientId || !location) {
    return { error: "Project name, client, and location are required." };
  }

  // Verify client belongs to tenant
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId: session.organizationId },
  });
  if (!client) {
    return { error: "Selected client does not belong to your organization." };
  }

  const count = await prisma.project.count({
    where: { organizationId: session.organizationId },
  });
  const code = `PRJ-2026-${String(count + 1).padStart(3, "0")}`;

  const project = await prisma.project.create({
    data: {
      organizationId: session.organizationId,
      clientId,
      projectManagerId: session.userId,
      code,
      name,
      description,
      projectType,
      location,
      city,
      startDate,
      expectedCompletionDate,
      contractValue,
      estimatedBudget,
      revisedBudget: estimatedBudget,
      status,
      priority,
      calculatedProgress: 0,
    },
  });

  await prisma.projectActivity.create({
    data: {
      projectId: project.id,
      actorName: session.fullName,
      action: "PROJECT_CREATED",
      details: `Registered project ${code} (${name}) with contract value LKR ${contractValue.toLocaleString()}`,
    },
  });

  await logAudit({
    organizationId: session.organizationId,
    userId: session.userId,
    action: "CREATE_PROJECT",
    module: "PROJECTS",
    entityId: project.id,
    entityName: `${project.code} - ${project.name}`,
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true, projectId: project.id };
}

export async function updateProjectAction(formData: FormData) {
  const session = await requireModuleAccess("PROJECTS", "UPDATE");
  const projectId = String(formData.get("projectId") || "");
  const existing = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
  });
  if (!existing) return { error: "Project not found." };

  const name = String(formData.get("name") || existing.name).trim();
  const location = String(formData.get("location") || existing.location).trim();
  const description = String(formData.get("description") ?? existing.description ?? "").trim();
  const status = (String(formData.get("status") || existing.status) as ProjectStatus);
  const priority = (String(formData.get("priority") || existing.priority) as PriorityLevel);
  const contractValue = Number(formData.get("contractValue") ?? existing.contractValue);
  const estimatedBudget = Number(formData.get("estimatedBudget") ?? existing.estimatedBudget);
  const revisedBudget = Number(formData.get("revisedBudget") ?? existing.revisedBudget ?? estimatedBudget);

  await prisma.project.update({
    where: { id: projectId },
    data: {
      name,
      location,
      description,
      status,
      priority,
      contractValue,
      estimatedBudget,
      revisedBudget,
    },
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createProjectTaskAction(formData: FormData) {
  const session = await requireModuleAccess("PROJECTS", "UPDATE");
  const projectId = String(formData.get("projectId") || "");
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "Structural").trim();
  const priority = (String(formData.get("priority") || "MEDIUM") as PriorityLevel);
  const status = (String(formData.get("status") || "TO_DO") as TaskStatus);
  const progressPct = Number(formData.get("progressPct") || (status === "COMPLETED" ? 100 : 0));
  const weight = Number(formData.get("weight") || 2);
  const startDate = new Date(String(formData.get("startDate") || new Date().toISOString()));
  const endDate = new Date(String(formData.get("endDate") || new Date(Date.now() + 14 * 86400000).toISOString()));

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
  });
  if (!project) return { error: "Project not found." };
  if (!title) return { error: "Task title is required." };

  const count = await prisma.projectTask.count({ where: { projectId } });
  await prisma.projectTask.create({
    data: {
      projectId,
      assigneeId: session.userId,
      code: `TSK-${100 + count + 1}`,
      title,
      category,
      startDate,
      endDate,
      priority,
      status,
      progressPct: status === "COMPLETED" ? 100 : progressPct,
      weight,
    },
  });

  await recalculateAndSaveProjectProgress(projectId, session.organizationId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/tasks`);
  return { success: true };
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus, progressPct: number) {
  const session = await requireModuleAccess("PROJECTS", "UPDATE");
  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    include: { project: true },
  });
  if (!task || task.project.organizationId !== session.organizationId) {
    return { error: "Task not found." };
  }

  await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      status,
      progressPct: status === "COMPLETED" ? 100 : status === "TO_DO" ? 0 : progressPct,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });

  await recalculateAndSaveProjectProgress(task.projectId, session.organizationId);
  revalidatePath(`/projects/${task.projectId}`);
  revalidatePath(`/projects/${task.projectId}/tasks`);
  return { success: true };
}

export async function createMilestoneAction(formData: FormData) {
  const session = await requireModuleAccess("PROJECTS", "UPDATE");
  const projectId = String(formData.get("projectId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const dueDate = new Date(String(formData.get("dueDate") || new Date().toISOString()));
  const weightPct = Number(formData.get("weightPct") || 20);
  const progressPct = Number(formData.get("progressPct") || 0);
  const billingAmount = Number(formData.get("billingAmount") || 0);

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
  });
  if (!project) return { error: "Project not found." };

  await prisma.projectMilestone.create({
    data: {
      projectId,
      title,
      description,
      dueDate,
      weightPct,
      progressPct,
      billingAmount,
      isCompleted: progressPct >= 100,
    },
  });

  await recalculateAndSaveProjectProgress(projectId, session.organizationId);
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// ============================================================================
// 4. BOQ MANAGEMENT ACTIONS
// ============================================================================

export async function createBoqItemAction(formData: FormData) {
  const session = await requireModuleAccess("BOQ", "CREATE");
  const projectId = String(formData.get("projectId") || "");
  const categoryName = String(formData.get("categoryName") || "Structural Concrete Work").trim();
  const itemCode = String(formData.get("itemCode") || `ITM-${Date.now().toString().slice(-3)}`).trim();
  const description = String(formData.get("description") || "").trim();
  const unit = String(formData.get("unit") || "m3").trim();
  const quantity = Number(formData.get("quantity") || 0);
  const materialRate = Number(formData.get("materialRate") || 0);
  const labourRate = Number(formData.get("labourRate") || 0);
  const equipmentRate = Number(formData.get("equipmentRate") || 0);
  const otherCost = Number(formData.get("otherCost") || 0);

  if (!projectId || !description || quantity <= 0) {
    return { error: "Project, item description, and positive quantity are required." };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
  });
  if (!project) return { error: "Project not found." };

  const calc = calculateBoqItem({
    quantity,
    materialRate,
    labourRate,
    equipmentRate,
    otherCost,
  });

  await prisma.$transaction(async (tx) => {
    let boq = await tx.bOQ.findFirst({
      where: { projectId, organizationId: session.organizationId },
      orderBy: { versionNumber: "desc" },
    });

    if (!boq) {
      boq = await tx.bOQ.create({
        data: {
          organizationId: session.organizationId,
          projectId,
          boqCode: `BOQ-${project.code}-V1`,
          title: `Master BOQ - ${project.name}`,
          versionNumber: 1,
          status: "APPROVED",
          totalAmount: 0,
        },
      });
    }

    let category = await tx.bOQCategory.findFirst({
      where: { boqId: boq.id, name: categoryName },
    });

    if (!category) {
      const catCount = await tx.bOQCategory.count({ where: { boqId: boq.id } });
      category = await tx.bOQCategory.create({
        data: {
          boqId: boq.id,
          code: String.fromCharCode(65 + catCount),
          name: categoryName,
          sortOrder: catCount + 1,
          subtotal: 0,
        },
      });
    }

    await tx.bOQItem.create({
      data: {
        boqId: boq.id,
        categoryId: category.id,
        itemCode,
        description,
        unit,
        quantity,
        materialRate,
        labourRate,
        equipmentRate,
        otherCost,
        totalUnitRate: calc.totalUnitRate,
        totalAmount: calc.totalAmount,
      },
    });

    const catItems = await tx.bOQItem.findMany({ where: { categoryId: category.id } });
    const catSubtotal = catItems.reduce((s, i) => s + toNumber(i.totalAmount), 0);
    await tx.bOQCategory.update({
      where: { id: category.id },
      data: { subtotal: round2(catSubtotal) },
    });

    const allItems = await tx.bOQItem.findMany({ where: { boqId: boq.id } });
    const boqTotal = allItems.reduce((s, i) => s + toNumber(i.totalAmount), 0);
    await tx.bOQ.update({
      where: { id: boq.id },
      data: { totalAmount: round2(boqTotal) },
    });
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/boq`);
  return { success: true };
}

export async function createBoqRevisionAction(boqId: string, changeSummary: string) {
  const session = await requireModuleAccess("BOQ", "UPDATE");
  const boq = await prisma.bOQ.findFirst({
    where: { id: boqId, organizationId: session.organizationId },
    include: { items: true },
  });
  if (!boq) return { error: "BOQ not found." };

  const nextVersion = boq.versionNumber + 1;
  await prisma.$transaction([
    prisma.bOQRevision.create({
      data: {
        boqId: boq.id,
        versionNumber: boq.versionNumber,
        totalAmount: boq.totalAmount,
        changeSummary: changeSummary || `Archived revision v${boq.versionNumber}`,
        snapshotJson: JSON.stringify(boq.items),
        revisedBy: session.fullName,
      },
    }),
    prisma.bOQ.update({
      where: { id: boq.id },
      data: { versionNumber: nextVersion, status: "APPROVED" },
    }),
  ]);

  revalidatePath(`/projects/${boq.projectId}/boq`);
  return { success: true };
}

// ============================================================================
// 5. LABOUR, ATTENDANCE, ADVANCES & PAYROLL ACTIONS
// ============================================================================

export async function createLabourAction(formData: FormData) {
  const session = await requireModuleAccess("LABOUR", "CREATE");
  const fullName = String(formData.get("fullName") || "").trim();
  const nicNumber = String(formData.get("nicNumber") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const categoryType = (String(formData.get("categoryType") || "MASON") as LabourCategoryType);
  const employmentType = (String(formData.get("employmentType") || "DAILY_WAGE") as LabourEmploymentType);
  const dailyWage = Number(formData.get("dailyWage") || 4500);
  const monthlySalary = Number(formData.get("monthlySalary") || 0);
  const overtimeHourlyRate = Number(formData.get("overtimeHourlyRate") || round2((dailyWage / 8) * 1.5));
  const projectId = String(formData.get("projectId") || "").trim();

  if (!fullName || !nicNumber || !phone) {
    return { error: "Full name, NIC number, and phone are required." };
  }

  const count = await prisma.labour.count({ where: { organizationId: session.organizationId } });
  const labourCode = `LAB-${String(count + 1).padStart(3, "0")}`;

  const worker = await prisma.labour.create({
    data: {
      organizationId: session.organizationId,
      labourCode,
      fullName,
      nicNumber,
      phone,
      address,
      categoryType,
      employmentType,
      dailyWage,
      monthlySalary,
      overtimeHourlyRate,
      joiningDate: new Date(),
      status: "ACTIVE",
    },
  });

  if (projectId) {
    await prisma.labourAssignment.create({
      data: {
        labourId: worker.id,
        projectId,
        isCurrent: true,
        notes: "Initial registration assignment",
      },
    });
  }

  revalidatePath("/labour");
  return { success: true, labourId: worker.id };
}

export async function recordAttendanceAction(formData: FormData) {
  const session = await requireModuleAccess("LABOUR", "CREATE");
  const labourId = String(formData.get("labourId") || "");
  const projectId = String(formData.get("projectId") || "");
  const workDateStr = String(formData.get("workDate") || new Date().toISOString().slice(0, 10));
  const shift = String(formData.get("shift") || "DAY").trim().toUpperCase();
  const status = (String(formData.get("status") || "FULL_DAY") as AttendanceStatus);
  const overtimeHours = Number(formData.get("overtimeHours") || 0);
  const checkIn = String(formData.get("checkIn") || "07:30");
  const checkOut = String(formData.get("checkOut") || "17:30");
  const remarks = String(formData.get("remarks") || "").trim();

  if (!labourId || !projectId || !workDateStr) {
    return { error: "Worker, Project, and Work Date are required." };
  }

  const [labour, org] = await Promise.all([
    prisma.labour.findFirst({ where: { id: labourId, organizationId: session.organizationId } }),
    prisma.organization.findUnique({ where: { id: session.organizationId } }),
  ]);

  if (!labour || !org) return { error: "Worker not found in your organization." };

  const workDate = new Date(workDateStr);

  // Prevent duplicate attendance records for the same worker, date, and shift
  const duplicate = await prisma.attendance.findUnique({
    where: {
      labourId_workDate_shift: {
        labourId,
        workDate,
        shift,
      },
    },
  });

  if (duplicate) {
    return {
      error: `Duplicate attendance prevented: ${labour.fullName} already has a ${shift} shift attendance record on ${workDateStr}.`,
    };
  }

  const earnings = calculateAttendanceEarnings({
    status,
    employmentType: labour.employmentType,
    dailyWage: toNumber(labour.dailyWage),
    monthlySalary: toNumber(labour.monthlySalary),
    standardWorkingDaysPerMonth: org.standardWorkingDaysPerMonth,
    overtimeHours,
    overtimeHourlyRate: toNumber(labour.overtimeHourlyRate),
    defaultOvertimeMultiplier: toNumber(org.defaultOvertimeMultiplier),
  });

  await prisma.attendance.create({
    data: {
      organizationId: session.organizationId,
      labourId,
      projectId,
      workDate,
      shift,
      checkIn,
      checkOut,
      status,
      overtimeHours,
      dailyWageEarned: earnings.dailyWageEarned,
      overtimeEarned: earnings.overtimeEarned,
      totalEarned: earnings.totalEarned,
      remarks,
    },
  });

  revalidatePath("/labour/attendance");
  revalidatePath("/labour/payroll");
  revalidatePath(`/projects/${projectId}/labour`);
  return { success: true };
}

export async function createLabourAdvanceAction(formData: FormData) {
  const session = await requireModuleAccess("LABOUR", "CREATE");
  const labourId = String(formData.get("labourId") || "");
  const amount = Number(formData.get("amount") || 0);
  const reason = String(formData.get("reason") || "").trim();

  if (!labourId || amount <= 0) {
    return { error: "Worker and positive advance amount are required." };
  }

  const labour = await prisma.labour.findFirst({
    where: { id: labourId, organizationId: session.organizationId },
  });
  if (!labour) return { error: "Worker not found." };

  await prisma.labourAdvance.create({
    data: {
      labourId,
      advanceDate: new Date(),
      amount,
      reason,
      status: "APPROVED",
    },
  });

  revalidatePath("/labour/advances");
  revalidatePath("/labour/payroll");
  return { success: true };
}

export async function generateMonthlyPayrollAction(formData: FormData) {
  const session = await requireModuleAccess("LABOUR", "CREATE");
  const month = Number(formData.get("month") || 11);
  const year = Number(formData.get("year") || 2026);

  const periodStart = new Date(Date.UTC(year, month - 1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  const payrollCode = `PAY-${year}-${String(month).padStart(2, "0")}`;

  const [labours, attendances, advances] = await Promise.all([
    prisma.labour.findMany({
      where: { organizationId: session.organizationId, status: "ACTIVE" },
    }),
    prisma.attendance.findMany({
      where: {
        organizationId: session.organizationId,
        workDate: { gte: periodStart, lte: periodEnd },
      },
    }),
    prisma.labourAdvance.findMany({
      where: {
        labour: { organizationId: session.organizationId },
        isRecovered: false,
        status: "APPROVED",
      },
    }),
  ]);

  let totalGross = 0;
  let totalOvertime = 0;
  let totalAdvances = 0;
  let totalNetPay = 0;

  const itemsData = labours.map((worker) => {
    const workerAtt = attendances.filter((a) => a.labourId === worker.id);
    const fullDays = workerAtt.filter((a) => a.status === "FULL_DAY").length;
    const halfDays = workerAtt.filter((a) => a.status === "HALF_DAY").length;
    const otHours = workerAtt.reduce((s, a) => s + toNumber(a.overtimeHours), 0);

    const workerUnrecoveredAdv = advances
      .filter((adv) => adv.labourId === worker.id)
      .reduce((s, adv) => s + (toNumber(adv.amount) - toNumber(adv.recoveredAmt)), 0);

    const dailyRate =
      worker.employmentType === "MONTHLY_SALARY" && toNumber(worker.monthlySalary) > 0
        ? round2(toNumber(worker.monthlySalary) / 26)
        : toNumber(worker.dailyWage);

    const calc = calculatePayrollItem({
      fullDaysWorked: fullDays || 20, // fallback if generating for demo period
      halfDaysWorked: halfDays,
      dailyRate,
      overtimeHours: otHours,
      overtimeHourlyRate: toNumber(worker.overtimeHourlyRate),
      advanceRecovery: Math.min(workerUnrecoveredAdv, round2(dailyRate * 5)),
    });

    totalGross = round2(totalGross + calc.grossPay);
    totalOvertime = round2(totalOvertime + calc.overtimeEarnings);
    totalAdvances = round2(totalAdvances + calc.totalDeductions);
    totalNetPay = round2(totalNetPay + calc.netPay);

    return {
      labourId: worker.id,
      fullDaysWorked: fullDays || 20,
      halfDaysWorked: halfDays,
      effectiveDays: calc.effectiveDays,
      basicEarnings: calc.basicEarnings,
      overtimeHours: otHours,
      overtimeEarnings: calc.overtimeEarnings,
      grossPay: calc.grossPay,
      advanceRecovery: calc.totalDeductions,
      netPay: calc.netPay,
    };
  });

  await prisma.$transaction(async (tx) => {
    const existing = await tx.payroll.findUnique({
      where: { organizationId_payrollCode: { organizationId: session.organizationId, payrollCode } },
    });
    if (existing) {
      await tx.payrollItem.deleteMany({ where: { payrollId: existing.id } });
      await tx.payroll.delete({ where: { id: existing.id } });
    }

    const payroll = await tx.payroll.create({
      data: {
        organizationId: session.organizationId,
        payrollCode,
        month,
        year,
        periodStart,
        periodEnd,
        totalGross,
        totalOvertime,
        totalAdvances,
        totalDeductions: totalAdvances,
        totalNetPay,
        status: "APPROVED",
        approvedBy: session.fullName,
        approvedAt: new Date(),
      },
    });

    for (const item of itemsData) {
      await tx.payrollItem.create({
        data: {
          payrollId: payroll.id,
          ...item,
        },
      });
    }
  });

  revalidatePath("/labour/payroll");
  revalidatePath("/labour/payments");
  return { success: true };
}

// ============================================================================
// 6. INVENTORY & MATERIAL STOCK OPERATIONS (TRANSACTION-SAFE)
// ============================================================================

export async function createMaterialAction(formData: FormData) {
  const session = await requireModuleAccess("INVENTORY", "CREATE");
  const name = String(formData.get("name") || "").trim();
  const categoryType = (String(formData.get("categoryType") || "CEMENT") as MaterialCategoryType);
  const unit = String(formData.get("unit") || "Bags").trim();
  const minimumStockLevel = Number(formData.get("minimumStockLevel") || 25);
  const defaultPurchasePrice = Number(formData.get("defaultPurchasePrice") || 0);
  const defaultIssueRate = Number(formData.get("defaultIssueRate") || defaultPurchasePrice);

  if (!name || !unit) return { error: "Material name and unit are required." };

  const count = await prisma.material.count({ where: { organizationId: session.organizationId } });
  const code = `MAT-${String(count + 1).padStart(3, "0")}`;

  await prisma.material.create({
    data: {
      organizationId: session.organizationId,
      code,
      name,
      categoryType,
      unit,
      minimumStockLevel,
      currentStock: 0,
      defaultPurchasePrice,
      defaultIssueRate,
    },
  });

  revalidatePath("/inventory");
  revalidatePath("/inventory/materials");
  return { success: true };
}

export async function receiveStockAction(formData: FormData) {
  const session = await requireModuleAccess("INVENTORY", "CREATE");
  const materialId = String(formData.get("materialId") || "");
  const warehouseId = String(formData.get("warehouseId") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const unitCost = Number(formData.get("unitCost") || 0);
  const referenceNo = String(formData.get("referenceNo") || "").trim();
  const remarks = String(formData.get("remarks") || "Direct stock receive").trim();

  if (!materialId || !warehouseId || quantity <= 0) {
    return { error: "Material, warehouse, and positive quantity are required." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const material = await tx.material.findFirst({
        where: { id: materialId, organizationId: session.organizationId },
      });
      if (!material) throw new Error("Material not found.");

      const calc = validateAndCalculateStockChange({
        currentStock: toNumber(material.currentStock),
        quantityDelta: quantity,
        unitCost: unitCost || toNumber(material.defaultPurchasePrice),
        allowNegativeStock: false,
      });

      await tx.material.update({
        where: { id: material.id },
        data: { currentStock: calc.balanceAfter },
      });

      await tx.stockBatch.create({
        data: {
          organizationId: session.organizationId,
          materialId: material.id,
          warehouseId,
          batchNumber: `BAT-${Date.now().toString().slice(-6)}`,
          initialQty: quantity,
          remainingQty: quantity,
          unitCost: unitCost || toNumber(material.defaultPurchasePrice),
          totalValue: calc.totalCost,
        },
      });

      await tx.stockMovement.create({
        data: {
          organizationId: session.organizationId,
          materialId: material.id,
          warehouseId,
          movementCode: `MOV-${Date.now().toString().slice(-6)}`,
          movementType: "STOCK_RECEIVE",
          quantity,
          unitCost: unitCost || toNumber(material.defaultPurchasePrice),
          totalCost: calc.totalCost,
          balanceAfter: calc.balanceAfter,
          referenceNo: referenceNo || "DIRECT-RCV",
          remarks,
          performedBy: session.fullName,
        },
      });
    });

    revalidatePath("/inventory");
    revalidatePath("/inventory/materials");
    revalidatePath("/inventory/stock-receive");
    revalidatePath("/inventory/stock-history");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Stock receive failed." };
  }
}

export async function issueStockToProjectAction(formData: FormData) {
  const session = await requireModuleAccess("INVENTORY", "CREATE");
  const projectId = String(formData.get("projectId") || "");
  const warehouseId = String(formData.get("warehouseId") || "");
  const materialId = String(formData.get("materialId") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const issuedTo = String(formData.get("issuedTo") || session.fullName).trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!projectId || !warehouseId || !materialId || quantity <= 0) {
    return { error: "Project, Warehouse, Material, and positive Quantity are required." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const [org, material] = await Promise.all([
        tx.organization.findUnique({ where: { id: session.organizationId } }),
        tx.material.findFirst({ where: { id: materialId, organizationId: session.organizationId } }),
      ]);

      if (!org || !material) throw new Error("Material not found.");

      const unitCost = toNumber(material.defaultPurchasePrice);
      const calc = validateAndCalculateStockChange({
        currentStock: toNumber(material.currentStock),
        quantityDelta: -Math.abs(quantity),
        unitCost,
        allowNegativeStock: org.allowNegativeStock,
      });

      await tx.material.update({
        where: { id: material.id },
        data: { currentStock: calc.balanceAfter },
      });

      const issueCount = await tx.stockIssue.count({
        where: { organizationId: session.organizationId },
      });
      const issueNumber = `ISS-2026-${String(issueCount + 1).padStart(3, "0")}`;

      const issue = await tx.stockIssue.create({
        data: {
          organizationId: session.organizationId,
          projectId,
          warehouseId,
          issueNumber,
          issuedTo,
          status: "APPROVED",
          totalValue: calc.totalCost,
          approvedBy: session.fullName,
          notes,
        },
      });

      await tx.stockIssueItem.create({
        data: {
          stockIssueId: issue.id,
          materialId: material.id,
          quantity,
          unitCost,
          totalCost: calc.totalCost,
          remarks: notes,
        },
      });

      await tx.stockMovement.create({
        data: {
          organizationId: session.organizationId,
          materialId: material.id,
          warehouseId,
          projectId,
          movementCode: `MOV-${Date.now().toString().slice(-6)}`,
          movementType: "STOCK_ISSUE",
          quantity: -Math.abs(quantity),
          unitCost,
          totalCost: calc.totalCost,
          balanceAfter: calc.balanceAfter,
          referenceNo: issueNumber,
          remarks: `Issued to project (${issuedTo})`,
          performedBy: session.fullName,
        },
      });

      // Trigger Low Stock Notification automatically if balance drops below minimum
      if (calc.balanceAfter <= toNumber(material.minimumStockLevel)) {
        await tx.notification.create({
          data: {
            organizationId: session.organizationId,
            title: `Low Stock Alert: ${material.name}`,
            message: `Remaining stock (${calc.balanceAfter} ${material.unit}) fell below threshold (${material.minimumStockLevel} ${material.unit}).`,
            category: "LOW_STOCK",
            linkUrl: "/inventory/materials",
          },
        });
      }
    });

    revalidatePath("/inventory");
    revalidatePath("/inventory/materials");
    revalidatePath("/inventory/stock-issue");
    revalidatePath("/inventory/stock-history");
    revalidatePath(`/projects/${projectId}/materials`);
    revalidatePath("/finance/profit-loss");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Stock issue failed." };
  }
}

export async function returnStockToWarehouseAction(formData: FormData) {
  const session = await requireModuleAccess("INVENTORY", "CREATE");
  const projectId = String(formData.get("projectId") || "");
  const warehouseId = String(formData.get("warehouseId") || "");
  const materialId = String(formData.get("materialId") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const reason = String(formData.get("reason") || "Surplus material returned from site").trim();

  if (!projectId || !warehouseId || !materialId || quantity <= 0) {
    return { error: "Project, warehouse, material, and positive quantity are required." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const material = await tx.material.findFirst({
        where: { id: materialId, organizationId: session.organizationId },
      });
      if (!material) throw new Error("Material not found.");

      const unitCost = toNumber(material.defaultPurchasePrice);
      const calc = validateAndCalculateStockChange({
        currentStock: toNumber(material.currentStock),
        quantityDelta: Math.abs(quantity),
        unitCost,
      });

      await tx.material.update({
        where: { id: material.id },
        data: { currentStock: calc.balanceAfter },
      });

      const returnNumber = `RET-${Date.now().toString().slice(-6)}`;
      await tx.stockReturn.create({
        data: {
          organizationId: session.organizationId,
          projectId,
          warehouseId,
          materialId: material.id,
          returnNumber,
          quantity,
          unitCost,
          totalValue: calc.totalCost,
          reason,
          status: "APPROVED",
        },
      });

      await tx.stockMovement.create({
        data: {
          organizationId: session.organizationId,
          materialId: material.id,
          warehouseId,
          projectId,
          movementCode: `MOV-${Date.now().toString().slice(-6)}`,
          movementType: "STOCK_RETURN",
          quantity,
          unitCost,
          totalCost: calc.totalCost,
          balanceAfter: calc.balanceAfter,
          referenceNo: returnNumber,
          remarks: reason,
          performedBy: session.fullName,
        },
      });
    });

    revalidatePath("/inventory");
    revalidatePath("/inventory/stock-return");
    revalidatePath("/inventory/stock-history");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Stock return failed." };
  }
}

// ============================================================================
// 7. SUPPLIER & PROCUREMENT ACTIONS
// ============================================================================

export async function createSupplierAction(formData: FormData) {
  const session = await requireModuleAccess("PROCUREMENT", "CREATE");
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "General Materials").trim();
  const contactPerson = String(formData.get("contactPerson") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const city = String(formData.get("city") || "Colombo").trim();
  const paymentTermsDays = Number(formData.get("paymentTermsDays") || 30);

  if (!name || !phone) return { error: "Supplier name and phone are required." };

  const count = await prisma.supplier.count({ where: { organizationId: session.organizationId } });
  const supplierCode = `SUP-${String(count + 1).padStart(3, "0")}`;

  await prisma.supplier.create({
    data: {
      organizationId: session.organizationId,
      supplierCode,
      name,
      category,
      contactPerson,
      phone,
      email: email || null,
      city,
      paymentTermsDays,
    },
  });

  revalidatePath("/procurement/suppliers");
  return { success: true };
}

export async function createPurchaseRequestAction(formData: FormData) {
  const session = await requireModuleAccess("PROCUREMENT", "CREATE");
  const projectId = String(formData.get("projectId") || "");
  const materialId = String(formData.get("materialId") || "");
  const quantity = Number(formData.get("quantity") || 0);
  const estimatedUnitCost = Number(formData.get("estimatedUnitCost") || 0);
  const priority = (String(formData.get("priority") || "HIGH") as PriorityLevel);
  const notes = String(formData.get("notes") || "").trim();

  if (!projectId || !materialId || quantity <= 0) {
    return { error: "Project, material, and positive quantity are required." };
  }

  const estimatedTotal = round2(quantity * estimatedUnitCost);
  const count = await prisma.purchaseRequest.count({ where: { organizationId: session.organizationId } });
  const requestNumber = `PR-2026-${String(count + 1).padStart(3, "0")}`;

  const pr = await prisma.purchaseRequest.create({
    data: {
      organizationId: session.organizationId,
      projectId,
      requestNumber,
      requestedBy: session.fullName,
      requiredDate: new Date(Date.now() + 7 * 86400000),
      priority,
      status: "PENDING",
      estimatedTotal,
      notes,
      items: {
        create: {
          materialId,
          quantity,
          estimatedUnitCost,
          estimatedTotal,
        },
      },
    },
  });

  await prisma.approval.create({
    data: {
      organizationId: session.organizationId,
      requesterId: session.userId,
      entityType: "PURCHASE_REQUEST",
      entityId: pr.id,
      referenceCode: requestNumber,
      title: `Purchase Requisition ${requestNumber}`,
      amount: estimatedTotal,
      projectId,
      status: "PENDING",
      comments: notes,
    },
  });

  revalidatePath("/procurement/requests");
  revalidatePath("/approvals");
  return { success: true };
}

export async function createPurchaseOrderAction(formData: FormData) {
  const session = await requireModuleAccess("PROCUREMENT", "CREATE");
  const supplierId = String(formData.get("supplierId") || "");
  const projectId = String(formData.get("projectId") || "");
  const materialId = String(formData.get("materialId") || "");
  const orderedQty = Number(formData.get("orderedQty") || 0);
  const unitPrice = Number(formData.get("unitPrice") || 0);
  const notes = String(formData.get("notes") || "").trim();

  if (!supplierId || !materialId || orderedQty <= 0 || unitPrice <= 0) {
    return { error: "Supplier, material, quantity, and unit price are required." };
  }

  const subtotal = round2(orderedQty * unitPrice);
  const taxAmount = round2(subtotal * 0.18);
  const totalAmount = round2(subtotal + taxAmount);

  const count = await prisma.purchaseOrder.count({ where: { organizationId: session.organizationId } });
  const poNumber = `PO-2026-${String(count + 1).padStart(3, "0")}`;

  await prisma.purchaseOrder.create({
    data: {
      organizationId: session.organizationId,
      supplierId,
      projectId: projectId || null,
      poNumber,
      status: "APPROVED",
      subtotal,
      taxAmount,
      totalAmount,
      approvedBy: session.fullName,
      approvedAt: new Date(),
      notes,
      items: {
        create: {
          materialId,
          orderedQty,
          unitPrice,
          totalPrice: subtotal,
        },
      },
    },
  });

  revalidatePath("/procurement/purchase-orders");
  return { success: true };
}

// ============================================================================
// 8. CONTRACTOR MANAGEMENT & CERTIFIED PAYMENT CALCULATIONS
// ============================================================================

export async function createContractorAction(formData: FormData) {
  const session = await requireModuleAccess("CONTRACTORS", "CREATE");
  const name = String(formData.get("name") || "").trim();
  const companyName = String(formData.get("companyName") || name).trim();
  const category = String(formData.get("category") || "Civil & Structural").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const nicOrBrn = String(formData.get("nicOrBrn") || "").trim();
  const bankDetails = String(formData.get("bankDetails") || "").trim();

  if (!name || !phone) return { error: "Contractor name and phone are required." };

  const count = await prisma.contractor.count({ where: { organizationId: session.organizationId } });
  const contractorCode = `CON-${String(count + 1).padStart(3, "0")}`;

  await prisma.contractor.create({
    data: {
      organizationId: session.organizationId,
      contractorCode,
      name,
      companyName,
      category,
      phone,
      email: email || null,
      nicOrBrn,
      bankDetails,
    },
  });

  revalidatePath("/contractors");
  return { success: true };
}

export async function createContractorPaymentAction(formData: FormData) {
  const session = await requireModuleAccess("CONTRACTORS", "CREATE");
  const agreementId = String(formData.get("agreementId") || "");
  const approvedWorkValue = Number(formData.get("approvedWorkValue") || 0);
  const previousCertifiedPayments = Number(formData.get("previousCertifiedPayments") || 0);
  const advanceRecovery = Number(formData.get("advanceRecovery") || 0);
  const retentionPct = Number(formData.get("retentionPct") ?? 5);
  const otherDeductions = Number(formData.get("otherDeductions") || 0);
  const notes = String(formData.get("notes") || "").trim();

  const agreement = await prisma.contractorAgreement.findFirst({
    where: { id: agreementId, organizationId: session.organizationId },
  });
  if (!agreement) return { error: "Contractor agreement not found." };

  try {
    const calc = calculateContractorNetPayable({
      approvedWorkValue,
      previousCertifiedPayments,
      advanceRecovery,
      retentionPct,
      otherDeductions,
    });

    const count = await prisma.contractorPayment.count({
      where: { organizationId: session.organizationId },
    });
    const voucherNumber = `CPV-2026-${String(count + 1).padStart(3, "0")}`;

    await prisma.$transaction([
      prisma.contractorPayment.create({
        data: {
          organizationId: session.organizationId,
          contractorId: agreement.contractorId,
          projectId: agreement.projectId,
          agreementId: agreement.id,
          voucherNumber,
          approvedWorkValue,
          previousCertifiedPayments,
          currentGrossClaim: calc.currentGrossClaim,
          advanceRecovery,
          retentionAmount: calc.retentionAmount,
          otherDeductions,
          netPayable: calc.netPayable,
          status: "APPROVED",
          approvedBy: session.fullName,
          notes,
        },
      }),
      prisma.contractorAgreement.update({
        where: { id: agreement.id },
        data: {
          certifiedWorkValue: approvedWorkValue,
          totalPaid: { increment: calc.netPayable },
          retentionHeld: { increment: calc.retentionAmount },
          advanceRecovered: { increment: advanceRecovery },
        },
      }),
    ]);

    revalidatePath("/contractors/payments");
    revalidatePath(`/projects/${agreement.projectId}/contractors`);
    revalidatePath("/finance/profit-loss");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Contractor payment calculation failed." };
  }
}

// ============================================================================
// 9. FINANCE, INVOICING, PARTIAL PAYMENTS, EXPENSES & DOUBLE-ENTRY JOURNALS
// ============================================================================

export async function createExpenseAction(formData: FormData) {
  const session = await requireModuleAccess("FINANCE", "CREATE");
  const projectId = String(formData.get("projectId") || "");
  const category = (String(formData.get("category") || "OTHER_EXPENSES") as ExpenseCategoryType);
  const description = String(formData.get("description") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const paymentMethod = (String(formData.get("paymentMethod") || "BANK_TRANSFER") as PaymentMethod);
  const isDirectCost = formData.get("isDirectCost") !== "false";

  if (!projectId || !description || amount <= 0) {
    return { error: "Project, description, and positive amount are required." };
  }

  const count = await prisma.expense.count({ where: { organizationId: session.organizationId } });
  const expenseNumber = `EXP-2026-${String(count + 1).padStart(3, "0")}`;

  const expense = await prisma.expense.create({
    data: {
      organizationId: session.organizationId,
      projectId,
      expenseNumber,
      category,
      description,
      expenseDate: new Date(),
      amount,
      paymentMethod,
      paidBy: session.fullName,
      status: "APPROVED",
      isDirectCost,
      approvedBy: session.fullName,
      approvedAt: new Date(),
    },
  });

  await logAudit({
    organizationId: session.organizationId,
    userId: session.userId,
    action: "CREATE_EXPENSE",
    module: "FINANCE",
    entityId: expense.id,
    entityName: expenseNumber,
    details: `LKR ${amount.toLocaleString()} - ${description}`,
  });

  revalidatePath("/finance/expenses");
  revalidatePath(`/projects/${projectId}/expenses`);
  revalidatePath("/finance/profit-loss");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createClientInvoiceAction(formData: FormData) {
  const session = await requireModuleAccess("FINANCE", "CREATE");
  const projectId = String(formData.get("projectId") || "");
  const description = String(formData.get("description") || "").trim();
  const quantity = Number(formData.get("quantity") || 1);
  const rate = Number(formData.get("rate") || 0);
  const discountAmount = Number(formData.get("discountAmount") || 0);
  const taxRate = Number(formData.get("taxRate") ?? 18);
  const initialPaidAmount = Number(formData.get("paidAmount") || 0);

  if (!projectId || !description || rate <= 0) {
    return { error: "Project, description, and positive rate are required." };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: session.organizationId },
  });
  if (!project) return { error: "Project not found." };

  const dueDate = new Date(Date.now() + 30 * 86400000);
  const calc = calculateInvoiceTotals({
    items: [{ quantity, rate }],
    discountAmount,
    taxRate,
    paidAmount: initialPaidAmount,
    dueDate,
  });

  const count = await prisma.invoice.count({ where: { organizationId: session.organizationId } });
  const invoiceNumber = `INV-2026-${String(count + 1).padStart(3, "0")}`;

  await prisma.invoice.create({
    data: {
      organizationId: session.organizationId,
      clientId: project.clientId,
      projectId: project.id,
      invoiceNumber,
      invoiceDate: new Date(),
      dueDate,
      description,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      taxRate,
      taxAmount: calc.taxAmount,
      totalAmount: calc.totalAmount,
      paidAmount: calc.paidAmount,
      outstandingAmount: calc.outstandingAmount,
      status: calc.status,
      items: {
        create: {
          description,
          quantity,
          rate,
          amount: calc.subtotal,
        },
      },
    },
  });

  revalidatePath("/finance/invoices");
  revalidatePath(`/projects/${project.id}/finance`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function recordInvoicePartialPaymentAction(formData: FormData) {
  const session = await requireModuleAccess("FINANCE", "CREATE");
  const invoiceId = String(formData.get("invoiceId") || "");
  const amount = Number(formData.get("amount") || 0);
  const paymentMethod = (String(formData.get("paymentMethod") || "BANK_TRANSFER") as PaymentMethod);
  const referenceNo = String(formData.get("referenceNo") || "").trim();

  if (!invoiceId || amount <= 0) {
    return { error: "Invoice and positive payment amount are required." };
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, organizationId: session.organizationId },
  });
  if (!invoice) return { error: "Invoice not found." };

  const currentOutstanding = toNumber(invoice.outstandingAmount);
  if (amount > currentOutstanding + 0.01) {
    return {
      error: `Payment amount (LKR ${amount.toLocaleString()}) cannot exceed outstanding balance (LKR ${currentOutstanding.toLocaleString()}).`,
    };
  }

  const newPaid = round2(toNumber(invoice.paidAmount) + amount);
  const newOutstanding = round2(Math.max(0, toNumber(invoice.totalAmount) - newPaid));
  const newStatus = newOutstanding <= 0 ? "PAID" : "PARTIALLY_PAID";

  const payCount = await prisma.payment.count({ where: { organizationId: session.organizationId } });
  const paymentNumber = `PAY-RCV-${String(payCount + 1).padStart(3, "0")}`;

  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaid,
        outstandingAmount: newOutstanding,
        status: newStatus,
      },
    }),
    prisma.payment.create({
      data: {
        organizationId: session.organizationId,
        clientId: invoice.clientId,
        paymentNumber,
        paymentType: "INCOMING",
        paymentDate: new Date(),
        amount,
        paymentMethod,
        referenceNo: referenceNo || invoice.invoiceNumber,
        notes: `Payment applied against ${invoice.invoiceNumber}`,
        allocations: {
          create: {
            invoiceId: invoice.id,
            allocatedAmount: amount,
          },
        },
      },
    }),
  ]);

  revalidatePath("/finance/invoices");
  revalidatePath("/finance/payments");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createBalancedJournalEntryAction(formData: FormData) {
  const session = await requireModuleAccess("FINANCE", "CREATE");
  const description = String(formData.get("description") || "").trim();
  const debitAccountId = String(formData.get("debitAccountId") || "");
  const creditAccountId = String(formData.get("creditAccountId") || "");
  const debitAmount = Number(formData.get("debitAmount") || 0);
  const creditAmount = Number(formData.get("creditAmount") || 0);
  const referenceNo = String(formData.get("referenceNo") || "").trim();

  if (!description || !debitAccountId || !creditAccountId) {
    return { error: "Description, Debit Account, and Credit Account are required." };
  }

  const lines = [
    { accountId: debitAccountId, debit: debitAmount, credit: 0, description: `${description} (DR)` },
    { accountId: creditAccountId, debit: 0, credit: creditAmount, description: `${description} (CR)` },
  ];

  const check = validateJournalBalance(lines);
  if (!check.isValid) {
    return { error: check.error };
  }

  const count = await prisma.journalEntry.count({ where: { organizationId: session.organizationId } });
  const entryNumber = `JE-2026-${String(count + 1).padStart(3, "0")}`;

  await prisma.$transaction([
    prisma.journalEntry.create({
      data: {
        organizationId: session.organizationId,
        entryNumber,
        entryDate: new Date(),
        referenceNo: referenceNo || entryNumber,
        description,
        sourceModule: "MANUAL_JOURNAL",
        totalDebit: check.totalDebit,
        totalCredit: check.totalCredit,
        postedBy: session.fullName,
        lines: {
          create: lines,
        },
      },
    }),
    prisma.account.update({
      where: { id: debitAccountId },
      data: { balance: { increment: debitAmount } },
    }),
    prisma.account.update({
      where: { id: creditAccountId },
      data: { balance: { increment: creditAmount } },
    }),
  ]);

  revalidatePath("/finance/journals");
  revalidatePath("/finance/accounts");
  return { success: true };
}

// ============================================================================
// 10. SITE MANAGEMENT, EQUIPMENT, DOCUMENTS, APPROVALS & NOTIFICATIONS
// ============================================================================

export async function createDailySiteReportAction(formData: FormData) {
  const session = await requireModuleAccess("SITE_MANAGEMENT", "CREATE");
  const projectId = String(formData.get("projectId") || "");
  const weatherCondition = String(formData.get("weatherCondition") || "Sunny").trim();
  const labourCount = Number(formData.get("labourCount") || 25);
  const workActivities = String(formData.get("workActivities") || "").trim();
  const workCompleted = String(formData.get("workCompleted") || "").trim();
  const materialsUsedNote = String(formData.get("materialsUsedNote") || "").trim();
  const equipmentUsedNote = String(formData.get("equipmentUsedNote") || "").trim();
  const siteInstructions = String(formData.get("siteInstructions") || "").trim();

  if (!projectId || !workActivities || !workCompleted) {
    return { error: "Project, work activities, and work completed are required." };
  }

  const count = await prisma.dailySiteReport.count({ where: { organizationId: session.organizationId } });
  const reportNumber = `DSR-2026-${String(count + 115).padStart(3, "0")}`;

  await prisma.dailySiteReport.create({
    data: {
      organizationId: session.organizationId,
      projectId,
      reportNumber,
      reportDate: new Date(),
      weatherCondition,
      labourCount,
      workActivities,
      workCompleted,
      materialsUsedNote,
      equipmentUsedNote,
      siteInstructions,
      submittedBy: session.fullName,
    },
  });

  revalidatePath("/site-management");
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function createEquipmentAction(formData: FormData) {
  const session = await requireModuleAccess("EQUIPMENT", "CREATE");
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "Heavy Machinery").trim();
  const ownership = String(formData.get("ownership") || "OWNED") === "RENTAL" ? "RENTAL" : "OWNED";
  const dailyRentalRate = Number(formData.get("dailyRentalRate") || 0);

  if (!name) return { error: "Equipment name is required." };

  const count = await prisma.equipment.count({ where: { organizationId: session.organizationId } });
  const equipmentCode = `EQP-${String(count + 1).padStart(3, "0")}`;

  await prisma.equipment.create({
    data: {
      organizationId: session.organizationId,
      equipmentCode,
      name,
      category,
      ownership,
      dailyRentalRate,
      status: "AVAILABLE",
    },
  });

  revalidatePath("/equipment");
  return { success: true };
}

export async function createDocumentAction(formData: FormData) {
  const session = await requireModuleAccess("DOCUMENTS", "CREATE");
  const title = String(formData.get("title") || "").trim();
  const projectId = String(formData.get("projectId") || "").trim();
  const category = (String(formData.get("category") || "CONTRACT") as DocumentCategory);
  const fileName = String(formData.get("fileName") || `${title.replace(/\s+/g, "-")}.pdf`).trim();
  const isClientVisible = formData.get("isClientVisible") === "true";

  if (!title) return { error: "Document title is required." };

  await prisma.document.create({
    data: {
      organizationId: session.organizationId,
      projectId: projectId || null,
      title,
      category,
      fileName,
      fileUrl: `/api/documents/download?name=${encodeURIComponent(fileName)}`,
      fileSizeKb: 1450,
      uploadedBy: session.fullName,
      isClientVisible,
    },
  });

  revalidatePath("/documents");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function decideApprovalAction(
  approvalId: string,
  decision: "APPROVED" | "REJECTED",
  comments: string
) {
  const session = await requireModuleAccess("APPROVALS", "APPROVE");
  const approval = await prisma.approval.findFirst({
    where: { id: approvalId, organizationId: session.organizationId },
  });
  if (!approval) return { error: "Approval record not found." };

  await prisma.$transaction(async (tx) => {
    await tx.approval.update({
      where: { id: approval.id },
      data: {
        status: decision as ApprovalStatus,
        deciderId: session.userId,
        comments: comments || approval.comments,
        decidedAt: new Date(),
      },
    });

    await tx.approvalHistory.create({
      data: {
        approvalId: approval.id,
        actorId: session.userId,
        actorName: session.fullName,
        action: decision as ApprovalStatus,
        comments,
      },
    });

    if (approval.entityType === "PURCHASE_REQUEST") {
      await tx.purchaseRequest.updateMany({
        where: { id: approval.entityId, organizationId: session.organizationId },
        data: {
          status: decision as ApprovalStatus,
          approvedBy: session.fullName,
          approvedAt: new Date(),
        },
      });
    } else if (approval.entityType === "PROJECT_EXPENSE") {
      await tx.expense.updateMany({
        where: { expenseNumber: approval.referenceCode, organizationId: session.organizationId },
        data: {
          status: decision as ApprovalStatus,
          approvedBy: session.fullName,
          approvedAt: new Date(),
        },
      });
    }
  });

  revalidatePath("/approvals");
  revalidatePath("/dashboard");
  revalidatePath("/procurement/requests");
  revalidatePath("/finance/expenses");
  return { success: true };
}

export async function markNotificationReadAction(notificationId: string) {
  const session = await requireSession();
  await prisma.notification.updateMany({
    where: { id: notificationId, organizationId: session.organizationId },
    data: { isRead: true },
  });
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const session = await requireSession();
  await prisma.notification.updateMany({
    where: { organizationId: session.organizationId, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
  return { success: true };
}

