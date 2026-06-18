"use client"

import { useState } from "react"
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { FootprintData, QuizAnswers } from "@/lib/carbon-data"

/* Each step renders one high-impact question with discrete, accessible options. */
interface StepOption {
  value: string
  label: string
  hint?: string
}
interface Step {
  key: keyof QuizAnswers
  question: string
  help: string
  options: StepOption[]
  /** Whether the stored value is numeric. */
  numeric?: boolean
}

const STEPS: Step[] = [
  {
    key: "diet",
    question: "How would you describe your diet?",
    help: "Food is often a quarter of a person's footprint.",
    options: [
      { value: "heavy-meat", label: "Meat with most meals", hint: "Beef & lamb several times a week" },
      { value: "average", label: "Average mixed diet", hint: "Meat a few times a week" },
      { value: "low-meat", label: "Mostly plants", hint: "Occasional meat or fish" },
      { value: "vegetarian", label: "Vegetarian", hint: "No meat or fish" },
      { value: "vegan", label: "Vegan", hint: "Fully plant-based" },
    ],
  },
  {
    key: "commute",
    question: "How do you usually get around?",
    help: "Daily travel mode sets your transport baseline.",
    options: [
      { value: "car-petrol", label: "Petrol or diesel car", hint: "Highest per-mile impact" },
      { value: "car-electric", label: "Electric vehicle", hint: "Much lower per mile" },
      { value: "public-transit", label: "Bus or train", hint: "Shared, efficient travel" },
      { value: "bike-walk", label: "Bike or walk", hint: "Effectively zero emissions" },
      { value: "remote", label: "I rarely commute", hint: "Work from home" },
    ],
  },
  {
    key: "weeklyMiles",
    question: "Roughly how many miles do you travel each week?",
    help: "Include commuting and regular errands.",
    numeric: true,
    options: [
      { value: "0", label: "Almost none", hint: "Under 10 miles" },
      { value: "50", label: "Light", hint: "~50 miles" },
      { value: "100", label: "Moderate", hint: "~100 miles" },
      { value: "200", label: "Heavy", hint: "~200 miles" },
      { value: "350", label: "Very heavy", hint: "350+ miles" },
    ],
  },
  {
    key: "flightsPerYear",
    question: "How many round-trip flights do you take per year?",
    help: "A single long flight can rival months of driving.",
    numeric: true,
    options: [
      { value: "0", label: "None", hint: "I don't fly" },
      { value: "1", label: "One", hint: "An annual trip" },
      { value: "3", label: "A few", hint: "~3 trips" },
      { value: "6", label: "Frequent", hint: "6+ trips" },
    ],
  },
  {
    key: "householdSize",
    question: "How many people share your home?",
    help: "Home energy is split across everyone living there.",
    numeric: true,
    options: [
      { value: "1", label: "Just me" },
      { value: "2", label: "Two" },
      { value: "3", label: "Three" },
      { value: "4", label: "Four or more" },
    ],
  },
]

const DEFAULT_DRAFT: Partial<Record<keyof QuizAnswers, string>> = {}

interface UnderstandQuizProps {
  answers: QuizAnswers | null
  footprint: FootprintData | null
  onComplete: (answers: QuizAnswers) => void
  onReset: () => void
}

export function UnderstandQuiz({ answers, footprint, onComplete, onReset }: UnderstandQuizProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [draft, setDraft] = useState<Partial<Record<keyof QuizAnswers, string>>>(() =>
    answers
      ? {
          diet: answers.diet,
          commute: answers.commute,
          weeklyMiles: String(answers.weeklyMiles),
          flightsPerYear: String(answers.flightsPerYear),
          householdSize: String(answers.householdSize),
        }
      : DEFAULT_DRAFT,
  )
  // When a baseline already exists, default to showing results rather than the form.
  const [reviewing, setReviewing] = useState(Boolean(answers))

  const step = STEPS[stepIndex]
  const current = draft[step.key]
  const isLast = stepIndex === STEPS.length - 1
  const progressPct = Math.round(((stepIndex + (current ? 1 : 0)) / STEPS.length) * 100)

  function selectOption(value: string) {
    setDraft((d) => ({ ...d, [step.key]: value }))
  }

  function next() {
    if (!current) return
    if (isLast) {
      const finalAnswers: QuizAnswers = {
        diet: draft.diet as QuizAnswers["diet"],
        commute: draft.commute as QuizAnswers["commute"],
        weeklyMiles: Number(draft.weeklyMiles),
        flightsPerYear: Number(draft.flightsPerYear),
        householdSize: Number(draft.householdSize),
      }
      onComplete(finalAnswers)
      setReviewing(true)
      return
    }
    setStepIndex((i) => i + 1)
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  function restart() {
    onReset()
    setDraft(DEFAULT_DRAFT)
    setStepIndex(0)
    setReviewing(false)
  }

  /* ---------------------------------------------------------------------- */
  /* Results view                                                           */
  /* ---------------------------------------------------------------------- */
  if (reviewing && footprint) {
    return (
      <section aria-labelledby="persona-heading" className="flex flex-col gap-6">
        <Card>
          <CardHeader className="gap-3">
            <Badge variant="secondary" className="self-start">
              Your lifestyle persona
            </Badge>
            <h2 id="persona-heading" className="text-2xl font-semibold tracking-tight text-balance">
              {footprint.persona.name}
            </h2>
            <p className="max-w-prose leading-relaxed text-muted-foreground">{footprint.persona.blurb}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted/40 p-5">
                <p className="text-sm font-medium text-muted-foreground">Estimated annual footprint</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                  {footprint.annualKg.toLocaleString()}{" "}
                  <span className="text-base font-medium text-muted-foreground">kg CO₂e</span>
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-5">
                <p className="text-sm font-medium text-muted-foreground">That's about</p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                  {footprint.monthlyKg.toLocaleString()}{" "}
                  <span className="text-base font-medium text-muted-foreground">kg / month</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3" aria-label="Footprint breakdown by category">
              <BreakdownRow label="Food" value={footprint.breakdown.food} total={footprint.annualKg} />
              <BreakdownRow label="Transport" value={footprint.breakdown.transport} total={footprint.annualKg} />
              <BreakdownRow label="Flights" value={footprint.breakdown.flights} total={footprint.annualKg} />
              <BreakdownRow label="Home energy" value={footprint.breakdown.home} total={footprint.annualKg} />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setReviewing(false)}>
                Edit my answers
              </Button>
              <Button variant="ghost" onClick={restart}>
                <RotateCcw aria-hidden="true" />
                Start over
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    )
  }

  /* ---------------------------------------------------------------------- */
  /* Quiz form view                                                         */
  /* ---------------------------------------------------------------------- */
  return (
    <section aria-labelledby="quiz-heading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 id="quiz-heading" className="text-lg font-semibold tracking-tight">
            Build your baseline
          </h2>
          <span className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Quiz completion"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="gap-1">
          <h3 className="text-xl font-semibold tracking-tight text-balance">{step.question}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{step.help}</p>
        </CardHeader>
        <CardContent>
          <fieldset>
            <legend className="sr-only">{step.question}</legend>
            <RadioGroup
              value={current ?? ""}
              onValueChange={(v) => selectOption(String(v))}
              className="gap-3"
            >
              {step.options.map((opt) => {
                const selected = current === opt.value
                const id = `${step.key}-${opt.value}`
                return (
                  <label
                    key={opt.value}
                    htmlFor={id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 transition-colors",
                      "hover:border-primary/60 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                      selected ? "border-primary bg-primary/5" : "border-border",
                    )}
                  >
                    <RadioGroupItem id={id} value={opt.value} className="mt-0.5" />
                    <span className="flex flex-col">
                      <span className="font-medium text-foreground">{opt.label}</span>
                      {opt.hint ? (
                        <span className="text-sm leading-relaxed text-muted-foreground">{opt.hint}</span>
                      ) : null}
                    </span>
                  </label>
                )
              })}
            </RadioGroup>
          </fieldset>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={back} disabled={stepIndex === 0}>
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
            <Button onClick={next} disabled={!current}>
              {isLast ? (
                <>
                  <Check aria-hidden="true" />
                  See my results
                </>
              ) : (
                <>
                  Next
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

/** A single labeled breakdown row using the accessible meter pattern. */
function BreakdownRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total <= 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {value.toLocaleString()} kg · {pct}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label}: ${value} kilograms, ${pct} percent of total`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={total}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-chart-3 transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
