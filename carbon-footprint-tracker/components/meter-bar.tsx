import { cn } from "@/lib/utils"

interface MeterBarProps {
  /** Current value. */
  value: number
  /** Maximum value the bar represents. */
  max: number
  /** Accessible label describing what is measured. */
  label: string
  /** Visible text shown on the right of the label row (e.g. "320 / 500 kg"). */
  valueText?: string
  /** Tailwind background class for the filled portion. */
  tone?: "primary" | "warning" | "chart-3" | "chart-4"
  className?: string
}

const toneClass: Record<NonNullable<MeterBarProps["tone"]>, string> = {
  primary: "bg-primary",
  warning: "bg-warning",
  "chart-3": "bg-chart-3",
  "chart-4": "bg-chart-4",
}

/**
 * MeterBar — a semantic, accessible progress visualization built from plain
 * HTML. It exposes the underlying numbers via ARIA (role="progressbar" with
 * valuenow/valuemin/valuemax) and never relies on color alone to convey state,
 * always pairing the bar with a visible numeric label.
 */
export function MeterBar({ value, max, label, valueText, tone = "primary", className }: MeterBarProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100))

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {valueText ? <span className="text-sm tabular-nums text-muted-foreground">{valueText}</span> : null}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 ease-out", toneClass[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
