"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#1d4ed8", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2"];

export interface DashboardChartsProps {
  monthlyRevExp: { month: string; revenueM: number; expenseM: number; cashFlowM: number }[];
  statusDistribution: { name: string; value: number }[];
  projectProfitability: {
    code: string;
    revenueM: number;
    costM: number;
    profitM: number;
    budgetM: number;
  }[];
  materialConsumption: { name: string; valueM: number }[];
  labourCostByCat: { category: string; costK: number }[];
}

export function DashboardCharts({
  monthlyRevExp,
  statusDistribution,
  projectProfitability,
  materialConsumption,
  labourCostByCat,
}: DashboardChartsProps) {
  return (
    <div className="space-y-6">
      {/* Row 1: 1. Monthly Revenue vs Expenses & 2. Project Status Distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                1. Monthly Revenue vs Expenses (LKR Millions)
              </h3>
              <p className="text-xs text-slate-500">
                Certified client billings compared against total direct & indirect project costs
              </p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevExp}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.18} />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="revenueM" name="Revenue (LKR M)" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenseM" name="Expenses (LKR M)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              2. Project Status Distribution
            </h3>
            <p className="text-xs text-slate-500">Live portfolio breakdown by lifecycle state</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {statusDistribution.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: 3. Project Profitability & 4. Budget vs Actual Expenses */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              3. Project Profitability Analysis (LKR Millions)
            </h3>
            <p className="text-xs text-slate-500">
              Contract + Variation Revenue vs Total Cost vs Net Profit
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectProfitability}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.18} />
                <XAxis dataKey="code" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="revenueM" name="Total Revenue (M)" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profitM" name="Net Profit (M)" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              4. Budget vs Actual Cost by Project (LKR Millions)
            </h3>
            <p className="text-xs text-slate-500">
              Revised Project Budget compared to Actual Incurred Cost
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectProfitability}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.18} />
                <XAxis dataKey="code" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="budgetM" name="Budget (LKR M)" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="costM" name="Actual Cost (LKR M)" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: 5. Monthly Cash Flow, 6. Material Consumption, 7. Labour Cost Analysis */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              5. Monthly Net Cash Flow (LKR M)
            </h3>
            <p className="text-xs text-slate-500">Net treasury cash movement across months</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevExp}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.18} />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="cashFlowM"
                  name="Net Cash Flow (M)"
                  stroke="#16a34a"
                  fill="#16a34a"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              6. Material Stock Valuation (LKR M)
            </h3>
            <p className="text-xs text-slate-500">Inventory value & consumption by material</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materialConsumption} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.18} />
                <XAxis type="number" fontSize={11} />
                <YAxis dataKey="name" type="category" width={90} fontSize={10} />
                <Tooltip />
                <Bar dataKey="valueM" name="Value (LKR M)" fill="#0891b2" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              7. Labour Cost Analysis (LKR K)
            </h3>
            <p className="text-xs text-slate-500">Workforce wage & overtime breakdown by trade</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={labourCostByCat}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.18} />
                <XAxis dataKey="category" fontSize={10} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="costK"
                  name="Labour Cost (LKR K)"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

