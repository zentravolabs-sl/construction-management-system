"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Lock, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [done, setDone] = useState(false);

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Building2 className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-5 text-center text-2xl font-bold text-white">
          Set New Account Password
        </h2>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          {done ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
              <h3 className="mt-4 text-lg font-semibold text-white">Password Updated</h3>
              <p className="mt-2 text-sm text-slate-400">
                Your BuildMaster ERP credentials have been updated.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white"
              >
                Proceed to Sign In
              </Link>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setDone(true);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  New Password
                </label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Confirm New Password
                </label>
                <div className="relative mt-1.5">
                  <Lock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Re-enter password"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Update Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

