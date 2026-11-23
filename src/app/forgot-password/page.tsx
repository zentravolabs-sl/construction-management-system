"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Building2 className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-5 text-center text-2xl font-bold text-white">
          Reset Your ERP Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter your corporate email to receive a password recovery link.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
          {submitted ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
              <h3 className="mt-4 text-lg font-semibold text-white">Recovery Instructions Sent</h3>
              <p className="mt-2 text-sm text-slate-400">
                If an account exists for <span className="font-semibold text-white">{email}</span>,
                a secure token link has been dispatched. You may also test the{" "}
                <Link href="/reset-password" className="text-blue-400 underline">
                  Reset Password screen directly
                </Link>
                .
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-400"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Registered Email Address
                </label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@apexconstructions.lk"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Send Password Reset Link
              </button>
              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Return to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

