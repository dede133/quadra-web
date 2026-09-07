import { notFound } from "next/navigation";
import { PublicPlan } from "@/components/availability/public-plan";
import { getPublicPlan } from "@/server/plans";

export default async function PublicPlanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicPlan(slug);
  if (!data) notFound();
  return (
    <main className="shell">
      <PublicPlan
        slug={slug}
        plan={data.plan}
        slots={data.slots}
        responseCount={data.responseCount}
        confirmedPerfectCount={data.confirmedPerfectCount}
      />
    </main>
  );
}
