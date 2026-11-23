import { round2 } from "./utils";

// ============================================================================
// 1. BOQ CALCULATIONS
// ============================================================================

export interface BoqItemCalcInput {
  quantity: number;
  materialRate: number;
  labourRate: number;
  equipmentRate: number;
  otherCost: number;
}

export interface BoqItemCalcResult {
  totalUnitRate: number;
  totalAmount: number;
}

export function calculateBoqItem(input: BoqItemCalcInput): BoqItemCalcResult {
  const qty = Math.max(0, Number(input.quantity) || 0);
  const mat = Math.max(0, Number(input.materialRate) || 0);
  const lab = Math.max(0, Number(input.labourRate) || 0);
  const eqp = Math.max(0, Number(input.equipmentRate) || 0);
  const oth = Math.max(0, Number(input.otherCost) || 0);

  const totalUnitRate = round2(mat + lab + eqp + oth);
  const totalAmount = round2(qty * totalUnitRate);

  return {
    totalUnitRate,
    totalAmount,
  };
}

// ============================================================================
// 2. PROJECT PROGRESS CALCULATION
// ============================================================================

export interface MilestoneProgressInput {
  weightPct: number;
  progressPct: number;
  isCompleted: boolean;
}

export interface TaskProgressInput {
  weight?: number;
  progressPct: number;
  status: string;
}

export function calculateProjectProgress(
  milestones: MilestoneProgressInput[],
  tasks: TaskProgressInput[]
): number {
  let milestoneScore = 0;
  let hasMilestones = false;

  if (milestones.length > 0) {
    const totalWeight = milestones.reduce((sum, m) => sum + (Number(m.weightPct) || 1), 0);
    if (totalWeight > 0) {
      hasMilestones = true;
      const weightedSum = milestones.reduce((sum, m) => {
        const w = Number(m.weightPct) || 1;
        const p = m.isCompleted ? 100 : Math.min(100, Math.max(0, Number(m.progressPct) || 0));
        return sum + w * p;
      }, 0);
      milestoneScore = weightedSum / totalWeight;
    }
  }

  let taskScore = 0;
  let hasTasks = false;

  if (tasks.length > 0) {
    const totalTaskWeight = tasks.reduce((sum, t) => sum + (Number(t.weight) || 1), 0);
    if (totalTaskWeight > 0) {
      hasTasks = true;
      const weightedTaskSum = tasks.reduce((sum, t) => {
        const w = Number(t.weight) || 1;
        const p =
          t.status === "COMPLETED"
            ? 100
            : t.status === "TO_DO"
            ? 0
            : Math.min(100, Math.max(0, Number(t.progressPct) || 0));
        return sum + w * p;
      }, 0);
      taskScore = weightedTaskSum / totalTaskWeight;
    }
  }

  if (hasMilestones && hasTasks) {
    return round2(milestoneScore * 0.5 + taskScore * 0.5);
  }
  if (hasMilestones) return round2(milestoneScore);
  if (hasTasks) return round2(taskScore);
  return 0;
}

// ============================================================================
// 3. LABOUR ATTENDANCE & PAYROLL CALCULATIONS
// ============================================================================

export interface AttendanceCalcInput {
  status: "FULL_DAY" | "HALF_DAY" | "ABSENT" | "LEAVE";
  employmentType: "DAILY_WAGE" | "MONTHLY_SALARY" | "CONTRACT";
  dailyWage: number;
  monthlySalary: number;
  standardWorkingDaysPerMonth?: number;
  overtimeHours: number;
  overtimeHourlyRate?: number;
  defaultOvertimeMultiplier?: number;
}

export interface AttendanceCalcResult {
  effectiveDayFraction: number;
  baseDailyRate: number;
  dailyWageEarned: number;
  effectiveOtRate: number;
  overtimeEarned: number;
  totalEarned: number;
}

export function calculateAttendanceEarnings(input: AttendanceCalcInput): AttendanceCalcResult {
  const workingDays = Math.max(1, input.standardWorkingDaysPerMonth ?? 26);
  const baseDailyRate =
    input.employmentType === "MONTHLY_SALARY" && input.monthlySalary > 0
      ? round2(input.monthlySalary / workingDays)
      : round2(input.dailyWage);

  let effectiveDayFraction = 0;
  if (input.status === "FULL_DAY") effectiveDayFraction = 1;
  else if (input.status === "HALF_DAY") effectiveDayFraction = 0.5;
  else effectiveDayFraction = 0;

  const dailyWageEarned = round2(baseDailyRate * effectiveDayFraction);

  const multiplier = input.defaultOvertimeMultiplier ?? 1.5;
  const effectiveOtRate =
    input.overtimeHourlyRate && input.overtimeHourlyRate > 0
      ? round2(input.overtimeHourlyRate)
      : round2((baseDailyRate / 8) * multiplier);

  const otHours =
    input.status === "ABSENT" || input.status === "LEAVE"
      ? 0
      : Math.max(0, Number(input.overtimeHours) || 0);

  const overtimeEarned = round2(otHours * effectiveOtRate);
  const totalEarned = round2(dailyWageEarned + overtimeEarned);

  return {
    effectiveDayFraction,
    baseDailyRate,
    dailyWageEarned,
    effectiveOtRate,
    overtimeEarned,
    totalEarned,
  };
}

export interface PayrollItemCalcInput {
  fullDaysWorked: number;
  halfDaysWorked: number;
  dailyRate: number;
  overtimeHours: number;
  overtimeHourlyRate: number;
  allowances?: number;
  advanceRecovery?: number;
  otherDeductions?: number;
}

export interface PayrollItemCalcResult {
  effectiveDays: number;
  basicEarnings: number;
  overtimeEarnings: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
}

export function calculatePayrollItem(input: PayrollItemCalcInput): PayrollItemCalcResult {
  const fullDays = Math.max(0, Number(input.fullDaysWorked) || 0);
  const halfDays = Math.max(0, Number(input.halfDaysWorked) || 0);
  const effectiveDays = round2(fullDays + halfDays * 0.5);
  const basicEarnings = round2(effectiveDays * (Number(input.dailyRate) || 0));
  const overtimeEarnings = round2(
    Math.max(0, Number(input.overtimeHours) || 0) * (Number(input.overtimeHourlyRate) || 0)
  );
  const allowances = round2(Math.max(0, Number(input.allowances) || 0));
  const grossPay = round2(basicEarnings + overtimeEarnings + allowances);

  const advanceRecovery = round2(Math.max(0, Number(input.advanceRecovery) || 0));
  const otherDeductions = round2(Math.max(0, Number(input.otherDeductions) || 0));
  const totalDeductions = round2(advanceRecovery + otherDeductions);
  const netPay = round2(Math.max(0, grossPay - totalDeductions));

  return {
    effectiveDays,
    basicEarnings,
    overtimeEarnings,
    grossPay,
    totalDeductions,
    netPay,
  };
}

// ============================================================================
// 4. INVENTORY & STOCK MOVEMENT VALIDATION
// ============================================================================

export interface StockOperationInput {
  currentStock: number;
  quantityDelta: number; // positive for receive/return, negative for issue/damage
  unitCost: number;
  allowNegativeStock?: boolean;
}

export interface StockOperationResult {
  balanceAfter: number;
  totalCost: number;
}

export function validateAndCalculateStockChange(
  input: StockOperationInput
): StockOperationResult {
  const current = Number(input.currentStock) || 0;
  const delta = Number(input.quantityDelta) || 0;
  if (delta === 0) {
    throw new Error("Stock movement quantity cannot be zero.");
  }

  const balanceAfter = round2(current + delta);
  if (balanceAfter < 0 && !input.allowNegativeStock) {
    throw new Error(
      `Insufficient stock available. Current stock is ${current}, cannot deduct ${Math.abs(delta)}.`
    );
  }

  const totalCost = round2(Math.abs(delta) * Math.max(0, Number(input.unitCost) || 0));
  return {
    balanceAfter,
    totalCost,
  };
}

// ============================================================================
// 5. CONTRACTOR PAYMENT CALCULATION
// ============================================================================

export interface ContractorPaymentCalcInput {
  approvedWorkValue: number;
  previousCertifiedPayments: number;
  advanceRecovery: number;
  retentionPct?: number;
  explicitRetentionAmount?: number;
  otherDeductions: number;
}

export interface ContractorPaymentCalcResult {
  currentGrossClaim: number;
  retentionAmount: number;
  netPayable: number;
}

export function calculateContractorNetPayable(
  input: ContractorPaymentCalcInput
): ContractorPaymentCalcResult {
  const approvedWork = Math.max(0, Number(input.approvedWorkValue) || 0);
  const prevCertified = Math.max(0, Number(input.previousCertifiedPayments) || 0);
  const currentGrossClaim = round2(Math.max(0, approvedWork - prevCertified));

  const retentionAmount =
    input.explicitRetentionAmount !== undefined
      ? round2(Math.max(0, Number(input.explicitRetentionAmount) || 0))
      : round2(currentGrossClaim * (Math.max(0, Number(input.retentionPct ?? 0)) / 100));

  const advanceRecovery = round2(Math.max(0, Number(input.advanceRecovery) || 0));
  const otherDeductions = round2(Math.max(0, Number(input.otherDeductions) || 0));

  const netPayable = round2(
    approvedWork - prevCertified - advanceRecovery - retentionAmount - otherDeductions
  );

  if (netPayable < 0) {
    throw new Error("Contractor deductions exceed the approved claimable work value.");
  }

  return {
    currentGrossClaim,
    retentionAmount,
    netPayable,
  };
}

// ============================================================================
// 6. CLIENT INVOICE & PARTIAL PAYMENT CALCULATIONS
// ============================================================================

export interface InvoiceLineInput {
  quantity: number;
  rate: number;
}

export interface InvoiceCalcInput {
  items: InvoiceLineInput[];
  discountAmount?: number;
  taxRate?: number;
  paidAmount?: number;
  dueDate?: Date;
}

export interface InvoiceCalcResult {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
}

export function calculateInvoiceTotals(input: InvoiceCalcInput): InvoiceCalcResult {
  const subtotal = round2(
    input.items.reduce(
      (sum, item) => sum + round2((Number(item.quantity) || 0) * (Number(item.rate) || 0)),
      0
    )
  );
  const discountAmount = round2(Math.min(subtotal, Math.max(0, Number(input.discountAmount) || 0)));
  const taxableAmount = round2(Math.max(0, subtotal - discountAmount));
  const taxRate = Math.max(0, Number(input.taxRate ?? 0));
  const taxAmount = round2(taxableAmount * (taxRate / 100));
  const totalAmount = round2(taxableAmount + taxAmount);

  const paidAmount = round2(Math.min(totalAmount, Math.max(0, Number(input.paidAmount) || 0)));
  const outstandingAmount = round2(Math.max(0, totalAmount - paidAmount));

  let status: "ISSUED" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" = "ISSUED";
  if (outstandingAmount <= 0 && totalAmount > 0) {
    status = "PAID";
  } else if (paidAmount > 0 && outstandingAmount > 0) {
    status = "PARTIALLY_PAID";
  } else if (input.dueDate && input.dueDate.getTime() < Date.now() && outstandingAmount > 0) {
    status = "OVERDUE";
  }

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    totalAmount,
    paidAmount,
    outstandingAmount,
    status,
  };
}

// ============================================================================
// 7. DOUBLE-ENTRY ACCOUNTING VALIDATION
// ============================================================================

export interface JournalLineInput {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
  projectId?: string;
}

export function validateJournalBalance(lines: JournalLineInput[]): {
  isValid: boolean;
  totalDebit: number;
  totalCredit: number;
  error?: string;
} {
  if (!lines || lines.length < 2) {
    return {
      isValid: false,
      totalDebit: 0,
      totalCredit: 0,
      error: "A double-entry journal requires at least two lines (Debit and Credit).",
    };
  }

  const totalDebit = round2(lines.reduce((s, l) => s + Math.max(0, Number(l.debit) || 0), 0));
  const totalCredit = round2(lines.reduce((s, l) => s + Math.max(0, Number(l.credit) || 0), 0));

  if (totalDebit <= 0 || totalCredit <= 0) {
    return {
      isValid: false,
      totalDebit,
      totalCredit,
      error: "Journal entry total debit and credit must be greater than zero.",
    };
  }

  if (Math.abs(totalDebit - totalCredit) > 0.005) {
    return {
      isValid: false,
      totalDebit,
      totalCredit,
      error: `Unbalanced journal entry: Total Debit (${totalDebit.toFixed(2)}) does not equal Total Credit (${totalCredit.toFixed(2)}).`,
    };
  }

  return {
    isValid: true,
    totalDebit,
    totalCredit,
  };
}

// ============================================================================
// 8. PROJECT PROFIT & LOSS ENGINE (WITH ANTI-DOUBLE-COUNTING & ZERO-REVENUE SAFETY)
// ============================================================================

export interface ProjectPnLInput {
  contractRevenue: number;
  approvedVariationRevenue: number;
  otherIncome: number;
  materialConsumptionCost: number; // From StockIssue (not Purchase Orders/GRNs, preventing double counting!)
  labourCost: number; // From Attendance/Payroll earned
  contractorCost: number; // From certified ContractorPayments
  equipmentCost: number; // From EquipmentAssignment rental/fuel + EQUIPMENT_RENTAL expenses
  transportCost: number; // From approved TRANSPORT_EXPENSES & FUEL_EXPENSES
  otherDirectCost: number; // From other approved direct Expenses (excluding MATERIAL_EXPENSES & LABOUR_EXPENSES already in stock/payroll)
  allocatedIndirectCost: number; // From ADMINISTRATIVE_EXPENSES + project allocatedIndirectCost
  originalBudget: number;
  revisedBudget?: number | null;
  estimatedRemainingCost?: number;
}

export interface ProjectPnLResult {
  totalProjectRevenue: number;
  totalDirectCosts: number;
  totalProjectCost: number;
  projectGrossProfit: number;
  projectNetProfit: number;
  grossMarginPct: number;
  profitMarginPct: number;
  effectiveBudget: number;
  budgetVariance: number;
  budgetUtilizationPct: number;
  estimatedRemainingCost: number;
  expectedFinalCost: number;
  expectedProfit: number;
}

export function calculateProjectProfitAndLoss(input: ProjectPnLInput): ProjectPnLResult {
  const contractRev = round2(Number(input.contractRevenue) || 0);
  const variationRev = round2(Number(input.approvedVariationRevenue) || 0);
  const otherInc = round2(Number(input.otherIncome) || 0);
  const totalProjectRevenue = round2(contractRev + variationRev + otherInc);

  const matCost = round2(Number(input.materialConsumptionCost) || 0);
  const labCost = round2(Number(input.labourCost) || 0);
  const conCost = round2(Number(input.contractorCost) || 0);
  const eqpCost = round2(Number(input.equipmentCost) || 0);
  const trnCost = round2(Number(input.transportCost) || 0);
  const othDirect = round2(Number(input.otherDirectCost) || 0);
  const indirectCost = round2(Number(input.allocatedIndirectCost) || 0);

  const totalDirectCosts = round2(matCost + labCost + conCost + eqpCost + trnCost + othDirect);
  const totalProjectCost = round2(totalDirectCosts + indirectCost);

  const projectGrossProfit = round2(totalProjectRevenue - totalDirectCosts);
  const projectNetProfit = round2(totalProjectRevenue - totalProjectCost);

  // Zero-revenue protection
  const grossMarginPct =
    totalProjectRevenue > 0 ? round2((projectGrossProfit / totalProjectRevenue) * 100) : 0;
  const profitMarginPct =
    totalProjectRevenue > 0 ? round2((projectNetProfit / totalProjectRevenue) * 100) : 0;

  const effectiveBudget = round2(
    input.revisedBudget && Number(input.revisedBudget) > 0
      ? Number(input.revisedBudget)
      : Number(input.originalBudget) || 0
  );

  const budgetVariance = round2(effectiveBudget - totalProjectCost);
  const budgetUtilizationPct =
    effectiveBudget > 0 ? round2((totalProjectCost / effectiveBudget) * 100) : 0;

  const estimatedRemainingCost =
    input.estimatedRemainingCost !== undefined
      ? round2(Math.max(0, Number(input.estimatedRemainingCost)))
      : round2(Math.max(0, effectiveBudget - totalProjectCost));

  const expectedFinalCost = round2(totalProjectCost + estimatedRemainingCost);
  const expectedProfit = round2(totalProjectRevenue - expectedFinalCost);

  return {
    totalProjectRevenue,
    totalDirectCosts,
    totalProjectCost,
    projectGrossProfit,
    projectNetProfit,
    grossMarginPct,
    profitMarginPct,
    effectiveBudget,
    budgetVariance,
    budgetUtilizationPct,
    estimatedRemainingCost,
    expectedFinalCost,
    expectedProfit,
  };
}

