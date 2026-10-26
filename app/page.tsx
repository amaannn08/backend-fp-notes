import Link from "next/link";
import { ArrowRight, BookOpen, Brain, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllNotesMeta, getStats } from "@/lib/content";
import { MODULES } from "@/lib/modules";
import { ModuleCard } from "@/components/study/module-card";
import { HomeProgress } from "@/components/study/home-progress";
import { ContinueCard } from "@/components/study/continue-card";

export default async function HomePage() {
  const notes = getAllNotesMeta();
  const stats = await getStats();
  const highYield = notes.filter((n) => n.interviewWeight >= 4).sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="flex flex-col items-start gap-5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Fan-made study companion
        </span>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Backend from First Principles — complete notes
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {stats.chapterCount} chapters · {stats.totalDiagrams} diagrams · {stats.totalQuestions} interview
          questions — everything you need to study the whole playlist once and walk into a backend placement
          interview ready.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/notes/roadmap">
              Start chapter 1 <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/interview">
              <Brain className="h-4 w-4" /> Interview bank
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/revise">
              <GraduationCap className="h-4 w-4" /> Revise
            </Link>
          </Button>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-[auto_1fr]">
        <HomeProgress totalChapters={stats.chapterCount} totalQuestions={stats.totalQuestions} />
        <ContinueCard />
      </section>

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Words of notes", value: stats.totalWords.toLocaleString() },
          { label: "Diagrams", value: stats.totalDiagrams },
          { label: "Interview questions", value: stats.totalQuestions },
          { label: "Glossary terms", value: stats.totalGlossaryTerms },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">High-yield for interviews</h2>
          <Link href="/interview" className="text-sm text-primary hover:underline">
            Open the full bank →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {highYield.map((n) => (
            <Link
              key={n.slug}
              href={`/notes/${n.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              {n.title}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">Course map</h2>
          <p className="text-sm text-muted-foreground">A suggested study order — chapter numbers follow the original video order.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mod) => {
            const chapters = notes
              .filter((n) => n.module === mod.name)
              .sort((a, b) => a.order - b.order)
              .map((n) => ({
                slug: n.slug,
                title: n.title,
                order: n.order,
                duration: n.duration,
                difficulty: n.difficulty,
                interviewWeight: n.interviewWeight,
              }));
            return (
              <ModuleCard
                key={mod.slug}
                name={mod.name}
                description={mod.description}
                color={mod.color}
                icon={<mod.icon className="h-4.5 w-4.5" />}
                chapters={chapters}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
