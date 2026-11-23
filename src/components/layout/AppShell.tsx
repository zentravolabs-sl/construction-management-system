"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  FolderKanban,
  Users,
  HardHat,
  Package,
  ShoppingCart,
  Briefcase,
  Landmark,
  Compass,
  Wrench,
  FileText,
  CheckSquare,
  BarChart3,
  Bell,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Menu,
  Globe,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import type { SessionPayload } from "@/lib/auth";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles?: string[];
  children?: { label: string; href: string }[];
}

export function AppShell({
  session,
  unreadCount = 0,
  pendingApprovalsCount = 0,
  children,
}: {
  session: SessionPayload;
  unreadCount?: number;
  pendingApprovalsCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("bm_theme");
    const isDark = saved ? saved === "dark" : false;
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("bm_theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Projects & BOQ",
      href: "/projects",
      icon: FolderKanban,
      children: [
        { label: "All Projects", href: "/projects" },
        { label: "New Project", href: "/projects/new" },
      ],
    },
    {
      label: "Clients",
      href: "/clients",
      icon: Users,
    },
    {
      label: "Labour & Payroll",
      href: "/labour",
      icon: HardHat,
      children: [
        { label: "Workforce Directory", href: "/labour" },
        { label: "Daily Attendance", href: "/labour/attendance" },
        { label: "Payroll & Payslips", href: "/labour/payroll" },
        { label: "Advances", href: "/labour/advances" },
        { label: "Labour Payments", href: "/labour/payments" },
      ],
    },
    {
      label: "Inventory & Stores",
      href: "/inventory",
      icon: Package,
      children: [
        { label: "Overview", href: "/inventory" },
        { label: "Material Master", href: "/inventory/materials" },
        { label: "Categories", href: "/inventory/categories" },
        { label: "Warehouses", href: "/inventory/warehouses" },
        { label: "Stock Receive", href: "/inventory/stock-receive" },
        { label: "Stock Issue", href: "/inventory/stock-issue" },
        { label: "Stock Transfer", href: "/inventory/stock-transfer" },
        { label: "Stock Return", href: "/inventory/stock-return" },
        { label: "Stock History", href: "/inventory/stock-history" },
      ],
    },
    {
      label: "Procurement",
      href: "/procurement/requests",
      icon: ShoppingCart,
      children: [
        { label: "Purchase Requests", href: "/procurement/requests" },
        { label: "Supplier Quotations", href: "/procurement/quotations" },
        { label: "Purchase Orders", href: "/procurement/purchase-orders" },
        { label: "Goods Received (GRN)", href: "/procurement/grn" },
        { label: "Suppliers", href: "/procurement/suppliers" },
      ],
    },
    {
      label: "Contractors",
      href: "/contractors",
      icon: Briefcase,
      children: [
        { label: "Subcontractors", href: "/contractors" },
        { label: "Agreements & Scope", href: "/contractors/agreements" },
        { label: "IPC Payments", href: "/contractors/payments" },
      ],
    },
    {
      label: "Finance & P&L",
      href: "/finance",
      icon: Landmark,
      children: [
        { label: "Finance Overview", href: "/finance" },
        { label: "Project Profit & Loss", href: "/finance/profit-loss" },
        { label: "Chart of Accounts", href: "/finance/accounts" },
        { label: "Client Invoices", href: "/finance/invoices" },
        { label: "Payments", href: "/finance/payments" },
        { label: "Project Expenses", href: "/finance/expenses" },
        { label: "Cashbook", href: "/finance/cashbook" },
        { label: "Journal Entries", href: "/finance/journals" },
      ],
    },
    {
      label: "Site Operations",
      href: "/site-management",
      icon: Compass,
    },
    {
      label: "Equipment & Fleet",
      href: "/equipment",
      icon: Wrench,
    },
    {
      label: "Documents",
      href: "/documents",
      icon: FileText,
    },
    {
      label: "Approvals",
      href: "/approvals",
      icon: CheckSquare,
      badge: pendingApprovalsCount,
    },
    {
      label: "20 ERP Reports",
      href: "/reports",
      icon: BarChart3,
    },
    {
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: unreadCount,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      children: [
        { label: "General Settings", href: "/settings" },
        { label: "Company Profile", href: "/settings/company" },
        { label: "Users & Team", href: "/settings/users" },
        { label: "Roles & RBAC Matrix", href: "/settings/roles" },
        { label: "SaaS Subscription", href: "/settings/subscription" },
      ],
    },
    {
      label: "Client Portal",
      href: "/portal/dashboard",
      icon: Globe,
    },
    {
      label: "Super Admin SaaS",
      href: "/super-admin",
      icon: ShieldAlert,
      children: [
        { label: "Platform Overview", href: "/super-admin" },
        { label: "Registered Companies", href: "/super-admin/companies" },
        { label: "Subscriptions", href: "/super-admin/subscriptions" },
        { label: "SaaS Plans", href: "/super-admin/plans" },
        { label: "MRR Analytics", href: "/super-admin/analytics" },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-slate-900 text-slate-200 transition-all duration-200 dark:border-slate-800 ${
          collapsed ? "w-20" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow">
              <Building2 className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <div className="text-sm font-bold tracking-tight text-white">BuildMaster ERP</div>
                <div className="truncate text-[11px] text-amber-400">
                  {session.organizationName}
                </div>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:block"
            title="Toggle Sidebar"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
              item.children?.some((c) => pathname.startsWith(c.href));

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge ? (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-slate-950">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>

                {!collapsed && isActive && item.children && (
                  <div className="ml-6 mt-1 space-y-0.5 border-l border-slate-700 pl-3">
                    {item.children.map((sub) => {
                      const subActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          onClick={() => setMobileOpen(false)}
                          className={`block rounded-lg px-2.5 py-1.5 text-xs transition ${
                            subActive
                              ? "font-semibold text-blue-400"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="border-t border-slate-800 p-3">
          {!collapsed && (
            <div className="mb-2 rounded-xl bg-slate-800/60 px-3 py-2">
              <div className="truncate text-xs font-semibold text-white">{session.fullName}</div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{session.role}</span>
                <span className="text-emerald-400">LKR • Colombo</span>
              </div>
            </div>
          )}
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-red-600 hover:border-red-600 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex flex-1 flex-col transition-all duration-200 ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 lg:hidden dark:border-slate-700 dark:text-slate-300"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {session.organizationName}
                </span>
                <span className="rounded-md bg-blue-600/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  {session.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sri Lanka Standard Time (Asia/Colombo) • Currency: LKR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/approvals"
              className="relative inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <CheckSquare className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden sm:inline">Approvals</span>
              {pendingApprovalsCount > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-slate-950">
                  {pendingApprovalsCount}
                </span>
              )}
            </Link>

            <Link
              href="/notifications"
              className="relative rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              title="Toggle Light / Dark Theme"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

