import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inviteUserAction } from "@/actions/erp";
import { Users, ArrowRight, UserPlus } from "lucide-react";

export default async function OnboardingTeamPage() {
  const session = await requireSession();
  const members = await prisma.membership.findMany({
    where: { organizationId: session.organizationId },
    include: { user: true },
  });

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Engineering & Finance Team Setup</h1>
              <p className="text-xs text-slate-400">Step 3 of 3 • Invite Role-Based Team Members</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500"
          >
            Launch Main ERP Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mb-6 space-y-2.5">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
            >
              <div>
                <div className="text-sm font-semibold text-white">{m.user.fullName}</div>
                <div className="text-xs text-slate-400">{m.user.email}</div>
              </div>
              <span className="rounded-lg bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-400">
                {m.systemRole}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-300">
            Invite Team Member
          </h2>
          <form
            action={async (formData) => {
              "use server";
              await inviteUserAction(formData);
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Full Name *
                </label>
                <input
                  name="fullName"
                  required
                  placeholder="Eng. Malith Perera"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Email *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="malith@company.lk"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  System Role *
                </label>
                <select
                  name="role"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                >
                  <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                  <option value="SITE_ENGINEER">SITE_ENGINEER</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                  <option value="HR_MANAGER">HR_MANAGER</option>
                  <option value="STORE_KEEPER">STORE_KEEPER</option>
                  <option value="PROCUREMENT_OFFICER">PROCUREMENT_OFFICER</option>
                  <option value="GENERAL_MANAGER">GENERAL_MANAGER</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300">
                  Designation / Title
                </label>
                <input
                  name="title"
                  placeholder="Senior Quantity Surveyor"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <UserPlus className="h-4 w-4" /> Add Member to Workspace
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

