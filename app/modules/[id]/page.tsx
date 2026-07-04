import Link from "next/link";
import { notFound } from "next/navigation";
import { TOPICS } from "@/lib/topics";
import { getModuleById } from "@/content";
import Markdown from "@/components/Markdown";
import CodeBlock from "@/components/CodeBlock";
import ChallengeEditor from "@/components/ChallengeEditor";

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

  const mod = getModuleById(id);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
      <p className="text-text-faint font-mono text-xs">{topic.category}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
        {topic.title}
      </h1>

      {mod ? (
        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[3fr_2fr] lg:items-start lg:gap-8">
          <div className="flex flex-col gap-10 lg:min-w-0">
            <Markdown content={mod.explanation} />

            {mod.codeExamples.length > 0 && (
              <section>
                <h2 className="text-text-faint mb-3 text-xs font-semibold tracking-wider uppercase">
                  Examples
                </h2>
                <div className="flex flex-col gap-4">
                  {mod.codeExamples.map((example) => (
                    <CodeBlock key={example.title} example={example} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <section className="flex flex-col gap-4 lg:sticky lg:top-8 lg:min-w-0">
            <h2 className="text-text-faint text-xs font-semibold tracking-wider uppercase">
              Challenge
            </h2>
            <div className="border-border bg-surface rounded-lg border px-5 py-6">
              <p className="text-text whitespace-pre-line text-sm leading-6">
                {mod.challenge.prompt}
              </p>
            </div>
            <ChallengeEditor moduleId={mod.id} starterCode={mod.challenge.starterCode} />
          </section>
        </div>
      ) : (
        <div className="border-border bg-surface mt-8 rounded-lg border px-5 py-6">
          <p className="text-text-muted text-sm">
            Content for this module hasn&apos;t been written yet.
          </p>
        </div>
      )}

      <Link href="/" className="text-accent mt-10 inline-block text-sm hover:underline">
        ← Back to all modules
      </Link>
    </div>
  );
}
