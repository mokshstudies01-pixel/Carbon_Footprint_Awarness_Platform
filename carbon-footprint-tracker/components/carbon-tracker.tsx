"use client"

import { useMemo, useState } from "react"
import { BarChart3, Leaf, Lightbulb, Sprout } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLocalStorage } from "@/lib/use-local-storage"
import { calculateFootprint, type QuizAnswers } from "@/lib/carbon-data"
import { UnderstandQuiz } from "@/components/understand-quiz"
import { ReduceEngine } from "@/components/reduce-engine"
import { TrackDashboard } from "@/components/track-dashboard"

const STORAGE_ANSWERS = "cft.answers.v1"
const STORAGE_COMMITTED = "cft.committed.v1"

export function CarbonTracker() {
  const [answers, setAnswers, answersReady] = useLocalStorage<QuizAnswers | null>(STORAGE_ANSWERS, null)
  const [committedIds, setCommittedIds] = useLocalStorage<string[]>(STORAGE_COMMITTED, [])
  const [tab, setTab] = useState<string>("understand")

  // Footprint is derived (not stored) so it always reflects the latest answers.
  const footprint = useMemo(() => (answers ? calculateFootprint(answers) : null), [answers])

  function toggleAction(id: string) {
    setCommittedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Leaf aria-hidden="true" className="size-5" />
          </span>
          <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Carbon Footprint Tracker
          </span>
        </div>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Understand your impact, then shrink it one habit at a time.
        </h1>
        <p className="max-w-prose leading-relaxed text-muted-foreground">
          Answer a few quick questions to find your baseline, commit to high-payoff micro-actions, and watch your
          footprint translate into real ecological wins.
        </p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <nav aria-label="Dashboard sections">
          <TabsList className="h-auto w-full flex-wrap gap-1 bg-muted p-1 sm:w-fit">
            <TabsTrigger value="understand" className="h-9 gap-2 px-4">
              <Lightbulb aria-hidden="true" />
              Understand
            </TabsTrigger>
            <TabsTrigger value="reduce" className="h-9 gap-2 px-4">
              <Sprout aria-hidden="true" />
              Reduce
            </TabsTrigger>
            <TabsTrigger value="track" className="h-9 gap-2 px-4">
              <BarChart3 aria-hidden="true" />
              Track
            </TabsTrigger>
          </TabsList>
        </nav>

        <TabsContent value="understand" className="mt-6">
          {answersReady ? (
            <UnderstandQuiz
              answers={answers}
              footprint={footprint}
              onComplete={setAnswers}
              onReset={() => {
                setAnswers(null)
                setCommittedIds([])
              }}
            />
          ) : (
            <LoadingState />
          )}
        </TabsContent>

        <TabsContent value="reduce" className="mt-6">
          <ReduceEngine committedIds={committedIds} onToggle={toggleAction} />
        </TabsContent>

        <TabsContent value="track" className="mt-6">
          {footprint ? (
            <TrackDashboard footprint={footprint} committedIds={committedIds} />
          ) : (
            <EmptyBaseline onStart={() => setTab("understand")} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyBaseline({ onStart }: { onStart: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <BarChart3 aria-hidden="true" className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">No baseline yet</h2>
          <p className="max-w-sm leading-relaxed text-muted-foreground">
            Complete the quick onboarding quiz in the Understand tab to unlock your personalized impact dashboard.
          </p>
        </div>
        <Button onClick={onStart}>Take the quiz</Button>
      </CardContent>
    </Card>
  )
}

function LoadingState() {
  return (
    <Card>
      <CardContent className="py-10 text-center text-sm text-muted-foreground" aria-live="polite">
        Loading your saved data…
      </CardContent>
    </Card>
  )
}
