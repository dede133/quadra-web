import { NewPlanForm } from "@/components/plan/new-plan-form";

export default function NewPlanPage() {
  return (
    <main className="shell">
      <div className="mb-6">
        <p className="font-black tracking-tight text-grass">QUADRA ⚽</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          Organiza un partido
        </h1>
        <p className="mt-2 text-ink/65">
          Propón franjas y deja que el grupo encuentre el mejor momento.
        </p>
      </div>
      <NewPlanForm />
    </main>
  );
}
