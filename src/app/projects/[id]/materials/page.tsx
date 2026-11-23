import { redirect } from "next/navigation";

export default async function ProjectMaterialsSubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/projects/${id}?tab=materials`);
}

