"use client"

import { useMemo, useState } from "react"
import { Check, Gauge, Leaf, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ACTIONS, type Action, type ActionCategory, type EffortLevel } from "@/lib/carbon-data"

const CATEGORIES: (ActionCategory | "All")[] = ["All", "Food", "Transport", "Home", "Goods"]

/* Effort is conveyed with text + an icon dot pattern, never color alone. */
const EFFORT_META: Record<EffortLevel, { label: string; dots: number }> = {
  Low: { label: "Low effort", dots: 1 },
  Medium: { label: "Medium effort", dots: 2 },
  High: { label: "High effort", dots: 3 },
}

interface ReduceEngineProps {
  committedIds: string[]
  onToggle: (id: string) => void
}

export function ReduceEngine({ committedIds, onToggle }: ReduceEngineProps) {
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("All")

  const visible = useMemo(
    () => (filter === "All" ? ACTIONS : ACTIONS.filter((a) => a.category === filter)),
    [filter],
  )

  const committedSet = useMemo(() => new Set(committedIds), [committedIds])
  const totalSaving = useMemo(
    () => ACTIONS.filter((a) => committedSet.has(a.id)).reduce((sum, a) => sum + a.monthlySavingsKg, 0),
    [committedSet],
  )

  return (
    <section aria-labelledby="reduce-heading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 id="reduce-heading" className="text-lg font-semibold tracking-tight">
            Micro-action engine
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Commit to small, repeatable habits. Each shows its monthly carbon payoff and effort.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">Committed monthly savings</p>
          <p className="text-xl font-bold tabular-nums text-primary">
            {totalSaving.toLocaleString()} kg CO₂e
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter actions by category">
        {CATEGORIES.map((cat) => {
          const active = filter === cat
          return (
            <Button
              key={cat}
              size="sm"
              variant={active ? "default" : "outline"}
              aria-pressed={active}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </Button>
          )
        })}
      </div>

      <ul className="grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((action) => (
          <li key={action.id}>
            <ActionCard
              action={action}
              committed={committedSet.has(action.id)}
              onToggle={() => onToggle(action.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

function ActionCard({
  action,
  committed,
  onToggle,
}: {
  action: Action
  committed: boolean
  onToggle: () => void
}) {
  const effort = EFFORT_META[action.effort]

  return (
    <Card className={cn("h-full transition-colors", committed && "border-primary bg-primary/5")}>
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">{action.category}</Badge>
          {committed ? (
            <Badge className="bg-success text-success-foreground">
              <Check aria-hidden="true" />
              Committed
            </Badge>
          ) : null}
        </div>
        <h3 className="text-base font-semibold tracking-tight text-balance">{action.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{action.description}</p>
      </CardHeader>

      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Leaf aria-hidden="true" className="size-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            <span className="font-bold tabular-nums">{action.monthlySavingsKg} kg</span>
            <span className="text-muted-foreground"> / month</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5" title={effort.label}>
          <Gauge aria-hidden="true" className="size-4 text-muted-foreground" />
          <span className="flex items-center gap-1" aria-hidden="true">
            {[1, 2, 3].map((d) => (
              <span
                key={d}
                className={cn(
                  "size-1.5 rounded-full",
                  d <= effort.dots ? "bg-foreground" : "bg-border",
                )}
              />
            ))}
          </span>
          <span className="sr-only">{effort.label}</span>
          <span className="text-sm text-muted-foreground">{action.effort}</span>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant={committed ? "outline" : "default"}
          className="w-full"
          onClick={onToggle}
          aria-pressed={committed}
        >
          {committed ? (
            "Remove from my habits"
          ) : (
            <>
              <Plus aria-hidden="true" />
              Commit to this
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
