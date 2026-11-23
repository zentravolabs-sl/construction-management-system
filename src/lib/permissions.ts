import type { SystemRole } from "@prisma/client";

export type ModuleName =
  | "DASHBOARD"
  | "PROJECTS"
  | "CLIENTS"
  | "BOQ"
  | "LABOUR"
  | "INVENTORY"
  | "PROCUREMENT"
  | "CONTRACTORS"
  | "FINANCE"
  | "SITE_MANAGEMENT"
  | "EQUIPMENT"
  | "DOCUMENTS"
  | "APPROVALS"
  | "REPORTS"
  | "SETTINGS"
  | "SUPER_ADMIN"
  | "CLIENT_PORTAL";

export type PermissionAction = "CREATE" | "READ" | "UPDATE" | "DELETE" | "APPROVE";

export const ROLE_LABELS: Record<SystemRole, string> = {
  SUPER_ADMIN: "Super Admin",
  COMPANY_ADMIN: "Company Admin",
  GENERAL_MANAGER: "General Manager",
  PROJECT_MANAGER: "Project Manager",
  SITE_ENGINEER: "Site Engineer",
  ACCOUNTANT: "Accountant",
  HR_MANAGER: "HR Manager",
  STORE_KEEPER: "Store Keeper",
  PROCUREMENT_OFFICER: "Procurement Officer",
  CONTRACTOR: "Contractor",
  CLIENT: "Client",
};

const ROLE_MODULE_MATRIX: Record<SystemRole, Partial<Record<ModuleName, PermissionAction[]>>> = {
  SUPER_ADMIN: {
    SUPER_ADMIN: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    DASHBOARD: ["READ"],
    PROJECTS: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    CLIENTS: ["CREATE", "READ", "UPDATE", "DELETE"],
    BOQ: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    LABOUR: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    INVENTORY: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    PROCUREMENT: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    CONTRACTORS: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    FINANCE: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    SITE_MANAGEMENT: ["CREATE", "READ", "UPDATE", "DELETE"],
    EQUIPMENT: ["CREATE", "READ", "UPDATE", "DELETE"],
    DOCUMENTS: ["CREATE", "READ", "UPDATE", "DELETE"],
    APPROVALS: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    REPORTS: ["READ"],
    SETTINGS: ["CREATE", "READ", "UPDATE", "DELETE"],
    CLIENT_PORTAL: ["READ"],
  },
  COMPANY_ADMIN: {
    DASHBOARD: ["READ"],
    PROJECTS: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    CLIENTS: ["CREATE", "READ", "UPDATE", "DELETE"],
    BOQ: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    LABOUR: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    INVENTORY: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    PROCUREMENT: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    CONTRACTORS: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    FINANCE: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    SITE_MANAGEMENT: ["CREATE", "READ", "UPDATE", "DELETE"],
    EQUIPMENT: ["CREATE", "READ", "UPDATE", "DELETE"],
    DOCUMENTS: ["CREATE", "READ", "UPDATE", "DELETE"],
    APPROVALS: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    REPORTS: ["READ"],
    SETTINGS: ["CREATE", "READ", "UPDATE", "DELETE"],
  },
  GENERAL_MANAGER: {
    DASHBOARD: ["READ"],
    PROJECTS: ["CREATE", "READ", "UPDATE", "APPROVE"],
    CLIENTS: ["CREATE", "READ", "UPDATE"],
    BOQ: ["CREATE", "READ", "UPDATE", "APPROVE"],
    LABOUR: ["READ", "APPROVE"],
    INVENTORY: ["READ", "APPROVE"],
    PROCUREMENT: ["READ", "APPROVE"],
    CONTRACTORS: ["CREATE", "READ", "UPDATE", "APPROVE"],
    FINANCE: ["READ", "APPROVE"],
    SITE_MANAGEMENT: ["READ"],
    EQUIPMENT: ["READ", "UPDATE"],
    DOCUMENTS: ["CREATE", "READ", "UPDATE"],
    APPROVALS: ["READ", "APPROVE"],
    REPORTS: ["READ"],
    SETTINGS: ["READ"],
  },
  PROJECT_MANAGER: {
    DASHBOARD: ["READ"],
    PROJECTS: ["CREATE", "READ", "UPDATE"],
    CLIENTS: ["READ"],
    BOQ: ["CREATE", "READ", "UPDATE"],
    LABOUR: ["CREATE", "READ", "UPDATE"],
    INVENTORY: ["CREATE", "READ"],
    PROCUREMENT: ["CREATE", "READ"],
    CONTRACTORS: ["CREATE", "READ", "UPDATE"],
    FINANCE: ["CREATE", "READ"],
    SITE_MANAGEMENT: ["CREATE", "READ", "UPDATE"],
    EQUIPMENT: ["CREATE", "READ", "UPDATE"],
    DOCUMENTS: ["CREATE", "READ", "UPDATE"],
    APPROVALS: ["CREATE", "READ", "APPROVE"],
    REPORTS: ["READ"],
  },
  SITE_ENGINEER: {
    DASHBOARD: ["READ"],
    PROJECTS: ["READ", "UPDATE"],
    BOQ: ["READ"],
    LABOUR: ["CREATE", "READ", "UPDATE"],
    INVENTORY: ["CREATE", "READ"],
    PROCUREMENT: ["CREATE", "READ"],
    CONTRACTORS: ["READ", "UPDATE"],
    SITE_MANAGEMENT: ["CREATE", "READ", "UPDATE"],
    EQUIPMENT: ["READ", "UPDATE"],
    DOCUMENTS: ["CREATE", "READ"],
  },
  ACCOUNTANT: {
    DASHBOARD: ["READ"],
    PROJECTS: ["READ"],
    CLIENTS: ["READ", "UPDATE"],
    BOQ: ["READ"],
    LABOUR: ["READ", "UPDATE"],
    INVENTORY: ["READ"],
    PROCUREMENT: ["READ", "UPDATE"],
    CONTRACTORS: ["READ", "UPDATE"],
    FINANCE: ["CREATE", "READ", "UPDATE", "APPROVE"],
    APPROVALS: ["READ", "APPROVE"],
    REPORTS: ["READ"],
    DOCUMENTS: ["CREATE", "READ"],
  },
  HR_MANAGER: {
    DASHBOARD: ["READ"],
    PROJECTS: ["READ"],
    LABOUR: ["CREATE", "READ", "UPDATE", "DELETE", "APPROVE"],
    REPORTS: ["READ"],
    DOCUMENTS: ["CREATE", "READ"],
  },
  STORE_KEEPER: {
    DASHBOARD: ["READ"],
    PROJECTS: ["READ"],
    INVENTORY: ["CREATE", "READ", "UPDATE"],
    PROCUREMENT: ["CREATE", "READ", "UPDATE"],
    EQUIPMENT: ["CREATE", "READ", "UPDATE"],
    REPORTS: ["READ"],
  },
  PROCUREMENT_OFFICER: {
    DASHBOARD: ["READ"],
    PROJECTS: ["READ"],
    INVENTORY: ["READ"],
    PROCUREMENT: ["CREATE", "READ", "UPDATE", "APPROVE"],
    REPORTS: ["READ"],
    DOCUMENTS: ["CREATE", "READ"],
  },
  CONTRACTOR: {
    DASHBOARD: ["READ"],
    PROJECTS: ["READ"],
    CONTRACTORS: ["READ"],
    SITE_MANAGEMENT: ["CREATE", "READ"],
    DOCUMENTS: ["READ"],
  },
  CLIENT: {
    CLIENT_PORTAL: ["READ"],
    DOCUMENTS: ["READ"],
  },
};

export function hasPermission(
  role: SystemRole,
  module: ModuleName,
  action: PermissionAction = "READ"
): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (role === "COMPANY_ADMIN" && module !== "SUPER_ADMIN") return true;

  const modulePerms = ROLE_MODULE_MATRIX[role]?.[module];
  if (!modulePerms) return false;
  return modulePerms.includes(action);
}

export function assertPermission(
  role: SystemRole,
  module: ModuleName,
  action: PermissionAction = "READ"
): void {
  if (!hasPermission(role, module, action)) {
    throw new Error(
      `Access Denied: Role '${ROLE_LABELS[role] ?? role}' does not have '${action}' permission on module '${module}'.`
    );
  }
}

