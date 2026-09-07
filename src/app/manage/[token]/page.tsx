import { notFound } from "next/navigation";
import { ManagePlan } from "@/components/consensus/manage-plan";
import { getManagedPlan } from "@/server/plans";

export default async function ManagePlanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getManagedPlan(token);
  if (!data) notFound();
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/p/${data.plan.public_slug}`;
  return (
    <main className="shell">
      <ManagePlan
        token={token}
        publicUrl={publicUrl}
        plan={data.plan}
        slots={data.slots}
        ranking={data.ranking.map((result) => ({
          ...result,
          startAt: result.startAt.toISOString(),
        }))}
        participantCount={data.participantCount}
      />
    </main>
  );
}
