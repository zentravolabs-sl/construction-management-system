import { redirect } from "next/navigation";

export default async function ProjectReportsSubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/reports?projectId=${id}`);
}

