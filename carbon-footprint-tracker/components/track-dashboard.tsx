"use client"

import { useMemo } from "react"
import { Car, Recycle, Smartphone, Target, TreePine, TrendingDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MeterBar } from "@/components/meter-bar"
import { ACTIONS, toEquivalents, type FootprintData } from "@/lib/carbon-data"

interface TrackDashboardProps {
  footprint: FootprintData
  committedIds: string[]
}

export function TrackDashboard({ footprint, committedIds }: TrackDashboardProps) {
  const committedActions = useMemo(
    () => ACTIONS.filter((a) => committedIds.includes(a.id)),
    [committedIds],
  )

  // Total carbon avoided per month from all committed habits.
  const monthlySavings = useMemo(
    () => committedActions.reduce((sum, a) => sum + a.monthlySavingsKg, 0),
    [committedActions],
  )

  // Weekly reduction target: aim to cut 15% of the baseline monthly footprint,
  // expressed as a weekly figure so progress feels achievable.
  const weeklyTarget = Math.round((footprint.monthlyKg * 0.15) / 4)
  const weeklySavings = Math.round(monthlySavings / 4)
  const targetPct = weeklyTarget <= 0 ? 0 : Math.min(100, Math.round((weeklySavings / weeklyTarget) * 100))

  // Relatable equivalents are derived from the monthly carbon savings.
  const eq = toEquivalents(monthlySavings)
  const newMonthly = Math.max(0, footprint.monthlyKg - monthlySavings)

  return (
    <section aria-labelledby="track-heading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 id="track-heading" className="text-lg font-semibold tracking-tight">
          Your impact dashboard
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {committedActions.length > 0
            ? `Tracking ${committedActions.length} active ${committedActions.length === 1 ? "habit" : "habits"}.`
            : "Commit to actions in the Reduce tab to start tracking your impact."}
        </p>
      </div>

      {/* Headline savings + new projected footprint */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="lg:col-span-2">
          <CardHeader className="gap-1">
            <div className="flex items-center gap-2">
              <TrendingDown aria-hidden="true" className="size-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Monthly carbon avoided</span>
            </div>
            <p className="text-4xl font-bold tabular-nums text-foreground">
              {monthlySavings.toLocaleString()}{" "}
              <span className="text-lg font-medium text-muted-foreground">kg CO₂e</span>
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your projected footprint drops from{" "}
              <span className="font-semibold text-foreground">{footprint.monthlyKg.toLocaleString()}</span> to{" "}
              <span className="font-semibold text-primary">{newMonthly.toLocaleString()}</span> kg per month.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-accent text-accent-foreground lg:col-span-2">
          <CardHeader className="gap-1">
            <div className="flex items-center gap-2">
              <Target aria-hidden="true" className="size-4" />
              <span className="text-sm font-medium">Weekly reduction target</span>
            </div>
            <p className="text-4xl font-bold tabular-nums">
              {targetPct}
              <span className="text-lg font-medium">%</span>
            </p>
          </CardHeader>
          <CardContent>
            <MeterBar
              label="Progress toward weekly goal"
              value={weeklySavings}
              max={weeklyTarget}
              valueText={`${weeklySavings} / ${weeklyTarget} kg per week`}
              tone="warning"
            />
          </CardContent>
        </Card>
      </div>

      {/* Relatable ecological equivalents */}
      <div>
        <h3 className="mb-3 text-sm font-semibold tracking-tight text-foreground">
          What that means in real terms{" "}
          <span className="font-normal text-muted-foreground">(per month)</span>
        </h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <EquivalentCard
            icon={TreePine}
            value={eq.trees}
            unit={eq.trees === 1 ? "tree" : "trees"}
            label="Equivalent carbon sequestered"
            decimals={1}
          />
          <EquivalentCard
            icon={Recycle}
            value={eq.bottles}
            unit="bottles"
            label="Plastic bottles diverted"
          />
          <EquivalentCard
            icon={Car}
            value={eq.carMiles}
            unit="miles"
            label="Car travel avoided"
          />
          <EquivalentCard
            icon={Smartphone}
            value={eq.phoneCharges}
            unit="charges"
            label="Phone charges offset"
          />
        </div>
      </div>

      {/* Per-habit contribution breakdown */}
      <Card>
        <CardHeader>
          <h3 className="text-base font-semibold tracking-tight">Habit contributions</h3>
        </CardHeader>
        <CardContent>
          {committedActions.length === 0 ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              No active habits yet. Head to the Reduce tab and commit to your first action to see how each one stacks
              up here.
            </p>
          ) : (
            <ul className="flex list-none flex-col gap-4 p-0">
              {committedActions
                .slice()
                .sort((a, b) => b.monthlySavingsKg - a.monthlySavingsKg)
                .map((a) => (
                  <li key={a.id}>
                    <MeterBar
                      label={a.title}
                      value={a.monthlySavingsKg}
                      max={monthlySavings}
                      valueText={`${a.monthlySavingsKg} kg / mo`}
                      tone="primary"
                    />
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function EquivalentCard({
  icon: Icon,
  value,
  unit,
  label,
  decimals = 0,
}: {
  icon: LucideIcon
  value: number
  unit: string
  label: string
  decimals?: number
}) {
  const display =
    value >= 1000
      ? Math.round(value).toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: decimals })

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-1">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <p className="text-2xl font-bold tabular-nums text-foreground">
          {display} <span className="text-sm font-medium text-muted-foreground">{unit}</span>
        </p>
        <p className="text-sm leading-snug text-muted-foreground text-pretty">{label}</p>
      </CardContent>
    </Card>
  )
}
