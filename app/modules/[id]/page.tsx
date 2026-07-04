import Link from "next/link";
import { notFound } from "next/navigation";
import { TOPICS } from "@/lib/topics";

export function generateStaticParams() {
  return TOPICS.map((topic) => ({ id: topic.id }));
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const topic = TOPICS.find((t) => t.id === id);
  if (!topic) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-10">
      <p className="text-text-faint font-mono text-xs">{topic.category}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
        {topic.title}
      </h1>
      <div className="border-border bg-surface mt-8 rounded-lg border px-5 py-6">
        <p className="text-text-muted text-sm">
          Content for this module hasn&apos;t been written yet.
        </p>
      </div>
      <Link href="/" className="text-accent mt-6 inline-block text-sm hover:underline">
        ← Back to all modules
      </Link>
    </div>
  );
}
