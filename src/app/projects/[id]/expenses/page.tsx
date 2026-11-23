import { redirect } from "next/navigation";

export default async function ProjectExpensesSubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/projects/${id}?tab=expenses`);
}

