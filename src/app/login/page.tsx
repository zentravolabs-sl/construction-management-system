"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { loginAction, quickDemoLoginAction } from "@/actions/auth";

const DEMO_ACCOUNTS = [
  {
    label: "Company Admin (Apex Constructions)",
    email: "admin@apexconstructions.lk",
    role: "COMPANY_ADMIN",
  },
  {
    label: "Project Manager",
    email: "pm@apexconstructions.lk",
    role: "PROJECT_MANAGER",
  },
  {
    label: "Site Engineer",
    email: "engineer@apexconstructions.lk",
    role: "SITE_ENGINEER",
  },
  {
    label: "Chief Accountant",
    email: "accountant@apexconstructions.lk",
    role: "ACCOUNTANT",
  },
  {
    label: "Client Portal (Colombo Metro PLC)",
    email: "client@colomboproperties.lk",
    role: "CLIENT",
  },
  {
    label: "Platform Super Admin",
    email: "superadmin@buildmaster.lk",
    role: "SUPER_ADMIN",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await loginAction(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.redirectTo) {
        router.push(res.redirectTo);
        router.refresh();
      }
    });
  }

  function handleDemoLogin(email: string) {
    setError(null);
    startTransition(async () => {
      const res = await quickDemoLoginAction(email);
      if (res?.error) {
        setError(res.error);
      } else if (res?.redirectTo) {
        router.push(res.redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">BuildMaster</span>
            <span className="ml-1.5 rounded bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-400">
              ERP
            </span>
          </div>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white">
          Sign in to your ERP Workspace
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Or{" "}
          <Link href="/register" className="font-semibold text-blue-400 hover:text-blue-300">
            register a new construction company (14-day free trial)
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 px-6 py-8 shadow-xl sm:px-10">
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Work Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue="admin@apexconstructions.lk"
                  placeholder="admin@apexconstructions.lk"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  name="password"
                  type="password"
                  required
                  defaultValue="Password123!"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 disabled:opacity-50"
            >
              {isPending ? "Authenticating Workspace..." : "Sign In to BuildMaster ERP"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* One-Click Role Switcher for Demo & Testing */}
          <div className="mt-8 border-t border-slate-800 pt-6">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <UserCheck className="h-4 w-4 text-amber-400" />
              Instant Role-Based Workspace Access (Password: Password123!)
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDemoLogin(acc.email)}
                  className="flex flex-col items-start rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 text-left transition hover:border-blue-500/50 hover:bg-slate-800/60"
                >
                  <span className="text-xs font-semibold text-white">{acc.label}</span>
                  <span className="text-[11px] text-blue-400">{acc.role}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Multi-Tenant Organization Isolation & Server-Side RBAC Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}

