import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell flex min-h-screen flex-col justify-center">
      <div className="max-w-xl">
        <p className="mb-5 text-lg font-black tracking-tight text-grass">
          QUADRA ⚽
        </p>
        <h1 className="text-5xl font-black leading-[.95] tracking-tight sm:text-6xl">
          Organiza el partido sin organizar 200 mensajes.
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/70">
          Propón horarios, recoge disponibilidad y elegid el mejor momento para
          jugar.
        </p>
        <Link className="button-primary mt-8" href="/new">
          Organizar partido
        </Link>
      </div>
    </main>
  );
}
