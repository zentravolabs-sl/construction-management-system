"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, CheckCircle2 } from "lucide-react";
import { registerCompanyAction } from "@/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await registerCompanyAction(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.redirectTo) {
        router.push(res.redirectTo);
      }
    });
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <Link href="/" className="flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-white">BuildMaster ERP</span>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold text-white">
          Register Your Construction Company Workspace
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Includes a 14-day free trial • Default Currency: LKR • Timezone: Asia/Colombo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-8 shadow-xl sm:px-10">
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Company / Contractor Name *
                </label>
                <input
                  name="companyName"
                  required
                  placeholder="Sierra Civil Engineering (Pvt) Ltd"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Business Reg. Number (BRN)
                </label>
                <input
                  name="businessRegNo"
                  placeholder="PV-0098412"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Your Full Name (Company Admin) *
                </label>
                <input
                  name="fullName"
                  required
                  placeholder="Eng. Kasun Perera"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Head Office City *
                </label>
                <input
                  name="city"
                  required
                  defaultValue="Colombo"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Official Email Address *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="director@company.lk"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Contact Phone (+94) *
                </label>
                <input
                  name="phone"
                  required
                  placeholder="+94 77 123 4567"
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300">
                Master Password (Min 8 characters) *
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="••••••••••••"
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white"
              />
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 font-semibold text-blue-400">
                <CheckCircle2 className="h-4 w-4" />
                Included in Your Isolated Tenant Workspace:
              </div>
              <p className="mt-1 text-slate-400">
                Pre-configured Sri Lankan Chart of Accounts (LKR), Head Office Branch, 14-day
                Professional Plan Trial, and Role-Based Access Control.
              </p>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 disabled:opacity-50"
            >
              {isPending ? "Provisioning Company Workspace..." : "Create Company Workspace"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Already have a company workspace?{" "}
            <Link href="/login" className="font-semibold text-blue-400 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

