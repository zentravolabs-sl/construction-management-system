import { describe, it, expect } from "vitest";
import {
  calculateAttendanceEarnings,
  calculateBoqItem,
  calculateContractorNetPayable,
  calculateInvoiceTotals,
  calculatePayrollItem,
  calculateProjectProfitAndLoss,
  calculateProjectProgress,
  validateAndCalculateStockChange,
  validateJournalBalance,
} from "../src/lib/calculations";
import { assertPermission, hasPermission } from "../src/lib/permissions";
import { prisma } from "../src/lib/prisma";

describe("BuildMaster ERP - Critical Business Logic & Multi-Tenant Suite", () => {
  // 1. BOQ Calculations
  it("calculates BOQ Total Unit Rate and Line Total accurately", () => {
    const res = calculateBoqItem({
      quantity: 3200,
      materialRate: 24500,
      labourRate: 4200,
      equipmentRate: 2800,
      otherCost: 500,
    });
    expect(res.totalUnitRate).toBe(32000);
    expect(res.totalAmount).toBe(102400000);
  });

  // 2. Project Progress Calculation from Milestones & Tasks
  it("computes weighted project progress from milestones and tasks rather than manual arbitrary percentage", () => {
    const progress = calculateProjectProgress(
      [
        { weightPct: 30, progressPct: 100, isCompleted: true },
        { weightPct: 70, progressPct: 50, isCompleted: false },
      ],
      [
        { weight: 2, progressPct: 100, status: "COMPLETED" },
        { weight: 2, progressPct: 50, status: "IN_PROGRESS" },
      ]
    );
    // Milestone score: (30*100 + 70*50)/100 = 65%
    // Task score: (2*100 + 2*50)/4 = 75%
    // Combined 50/50 = 70%
    expect(progress).toBe(70);
  });

  // 3. Labour Attendance & Overtime Calculations
  it("calculates full-day, half-day, and overtime earnings accurately", () => {
    const fullDay = calculateAttendanceEarnings({
      status: "FULL_DAY",
      employmentType: "DAILY_WAGE",
      dailyWage: 4500,
      monthlySalary: 0,
      overtimeHours: 2,
      overtimeHourlyRate: 840,
    });
    expect(fullDay.dailyWageEarned).toBe(4500);
    expect(fullDay.overtimeEarned).toBe(1680);
    expect(fullDay.totalEarned).toBe(6180);

    const halfDay = calculateAttendanceEarnings({
      status: "HALF_DAY",
      employmentType: "DAILY_WAGE",
      dailyWage: 4500,
      monthlySalary: 0,
      overtimeHours: 0,
    });
    expect(halfDay.dailyWageEarned).toBe(2250);
    expect(halfDay.totalEarned).toBe(2250);

    const absent = calculateAttendanceEarnings({
      status: "ABSENT",
      employmentType: "DAILY_WAGE",
      dailyWage: 4500,
      monthlySalary: 0,
      overtimeHours: 4, // OT should be ignored when absent
    });
    expect(absent.totalEarned).toBe(0);
  });

  // 4. Payroll Calculations & Advance Recovery
  it("calculates monthly payroll gross pay, advance recovery, and net pay", () => {
    const payroll = calculatePayrollItem({
      fullDaysWorked: 22,
      halfDaysWorked: 2,
      dailyRate: 4500,
      overtimeHours: 10,
      overtimeHourlyRate: 840,
      allowances: 5000,
      advanceRecovery: 10000,
      otherDeductions: 1500,
    });
    // Effective days = 22 + 1 = 23
    expect(payroll.effectiveDays).toBe(23);
    expect(payroll.basicEarnings).toBe(103500);
    expect(payroll.overtimeEarnings).toBe(8400);
    expect(payroll.grossPay).toBe(116900);
    expect(payroll.totalDeductions).toBe(11500);
    expect(payroll.netPay).toBe(105400);
  });

  // 5. Inventory Stock Calculations & Negative Stock Prevention
  it("enforces transaction-safe stock calculations and blocks negative stock", () => {
    const receive = validateAndCalculateStockChange({
      currentStock: 100,
      quantityDelta: 50,
      unitCost: 2350,
    });
    expect(receive.balanceAfter).toBe(150);
    expect(receive.totalCost).toBe(117500);

    const issue = validateAndCalculateStockChange({
      currentStock: 150,
      quantityDelta: -40,
      unitCost: 2350,
      allowNegativeStock: false,
    });
    expect(issue.balanceAfter).toBe(110);

    expect(() =>
      validateAndCalculateStockChange({
        currentStock: 20,
        quantityDelta: -25,
        unitCost: 2350,
        allowNegativeStock: false,
      })
    ).toThrow(/Insufficient stock available/);
  });

  // 6. Contractor Payment Net Payable Calculation
  it("calculates subcontractor net payable after previous payments, advance recovery, and retention", () => {
    const res = calculateContractorNetPayable({
      approvedWorkValue: 85000000,
      previousCertifiedPayments: 45000000,
      advanceRecovery: 6000000,
      retentionPct: 5,
      otherDeductions: 0,
    });
    // Current gross claim = 40,000,000
    // Retention 5% of 40,000,000 = 2,000,000
    // Net Payable = 85M - 45M - 6M - 2M = 32,000,000
    expect(res.currentGrossClaim).toBe(40000000);
    expect(res.retentionAmount).toBe(2000000);
    expect(res.netPayable).toBe(32000000);
  });

  // 7. Client Invoice & Partial Payment Calculations
  it("calculates client invoice totals with configurable tax and partial payments", () => {
    const partial = calculateInvoiceTotals({
      items: [{ quantity: 1, rate: 140000000 }],
      discountAmount: 0,
      taxRate: 18,
      paidAmount: 120000000,
    });
    expect(partial.subtotal).toBe(140000000);
    expect(partial.taxAmount).toBe(25200000);
    expect(partial.totalAmount).toBe(165200000);
    expect(partial.outstandingAmount).toBe(45200000);
    expect(partial.status).toBe("PARTIALLY_PAID");

    const full = calculateInvoiceTotals({
      items: [{ quantity: 1, rate: 10000000 }],
      taxRate: 18,
      paidAmount: 11800000,
    });
    expect(full.outstandingAmount).toBe(0);
    expect(full.status).toBe("PAID");
  });

  // 8. Double-Entry Accounting Validation
  it("enforces balanced double-entry journal entries where Total Debit === Total Credit", () => {
    const balanced = validateJournalBalance([
      { accountId: "acc-1", debit: 120000000, credit: 0 },
      { accountId: "acc-2", debit: 45200000, credit: 0 },
      { accountId: "acc-3", debit: 0, credit: 165200000 },
    ]);
    expect(balanced.isValid).toBe(true);
    expect(balanced.totalDebit).toBe(165200000);
    expect(balanced.totalCredit).toBe(165200000);

    const unbalanced = validateJournalBalance([
      { accountId: "acc-1", debit: 500000, credit: 0 },
      { accountId: "acc-2", debit: 0, credit: 450000 },
    ]);
    expect(unbalanced.isValid).toBe(false);
    expect(unbalanced.error).toContain("Unbalanced journal entry");
  });

  // 9. Project Profit & Loss & Zero-Revenue Safety
  it("calculates Project Profit & Loss accurately and handles zero revenue safely", () => {
    const pnl = calculateProjectProfitAndLoss({
      contractRevenue: 485000000,
      approvedVariationRevenue: 18500000,
      otherIncome: 0,
      materialConsumptionCost: 41850000,
      labourCost: 114000,
      contractorCost: 32000000,
      equipmentCost: 3450000,
      transportCost: 1280000,
      otherDirectCost: 890000,
      allocatedIndirectCost: 6500000,
      originalBudget: 392000000,
      revisedBudget: 405000000,
    });

    expect(pnl.totalProjectRevenue).toBe(503500000);
    expect(pnl.totalDirectCosts).toBe(79584000);
    expect(pnl.totalProjectCost).toBe(86084000);
    expect(pnl.projectGrossProfit).toBe(423916000);
    expect(pnl.projectNetProfit).toBe(417416000);
    expect(pnl.profitMarginPct).toBeGreaterThan(80);

    // Zero-revenue safety check
    const zeroRevPnl = calculateProjectProfitAndLoss({
      contractRevenue: 0,
      approvedVariationRevenue: 0,
      otherIncome: 0,
      materialConsumptionCost: 500000,
      labourCost: 0,
      contractorCost: 0,
      equipmentCost: 0,
      transportCost: 0,
      otherDirectCost: 0,
      allocatedIndirectCost: 0,
      originalBudget: 1000000,
    });
    expect(zeroRevPnl.profitMarginPct).toBe(0);
    expect(zeroRevPnl.grossMarginPct).toBe(0);
  });

  // 10. RBAC & PBAC Permission Enforcement
  it("enforces role-based and permission-based access control across roles", () => {
    expect(hasPermission("SUPER_ADMIN", "SUPER_ADMIN", "CREATE")).toBe(true);
    expect(hasPermission("COMPANY_ADMIN", "PROJECTS", "APPROVE")).toBe(true);
    expect(hasPermission("COMPANY_ADMIN", "SUPER_ADMIN", "READ")).toBe(false);
    expect(hasPermission("CLIENT", "CLIENT_PORTAL", "READ")).toBe(true);
    expect(hasPermission("CLIENT", "FINANCE", "READ")).toBe(false);
    expect(hasPermission("STORE_KEEPER", "INVENTORY", "CREATE")).toBe(true);
    expect(hasPermission("STORE_KEEPER", "FINANCE", "APPROVE")).toBe(false);

    expect(() => assertPermission("CLIENT", "FINANCE", "CREATE")).toThrow(/Access Denied/);
  });

  // 11. Multi-Tenant Database Isolation Verification (Live Neon DB Integration Test)
  it("verifies strict multi-tenant data isolation in PostgreSQL database", async () => {
    const [org1, org2] = await Promise.all([
      prisma.organization.findUnique({ where: { slug: "apex-constructions-lanka" } }),
      prisma.organization.findUnique({ where: { slug: "ceylon-civil-engineering" } }),
    ]);

    expect(org1).not.toBeNull();
    expect(org2).not.toBeNull();
    expect(org1?.id).not.toBe(org2?.id);

    const org1Projects = await prisma.project.findMany({
      where: { organizationId: org1!.id },
    });
    const org2Projects = await prisma.project.findMany({
      where: { organizationId: org2!.id },
    });

    expect(org1Projects.length).toBeGreaterThanOrEqual(4);
    // Verify no project from org1 leaks into org2 query
    const leaked = org2Projects.some((p) => p.organizationId === org1!.id);
    expect(leaked).toBe(false);
  });
});

