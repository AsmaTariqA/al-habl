"use client"

import { useMemo, useState } from "react"

/* ────────────────────────────────────────────────────────────────
   ActivityCalendar — GitHub-style contribution grid.

   Receives `activityDays` as a prop, sourced from the SAME query
   (`qfProfileExtrasQueryFn`) that powers the rest of ProfileView,
   so there's exactly one source of truth for this data.
   ──────────────────────────────────────────────────────────────── */

type ActivityDayInput = {
  date: string // "YYYY-MM-DD"
  active: boolean
  count?: number
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

function formatDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function startOfWeek(d: Date) {
  const day = d.getDay() // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day
  const result = new Date(d)
  result.setDate(d.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function startOfMonth(d: Date) {
  const result = new Date(d)
  result.setDate(1)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Build weeks from `from` (snapped to start-of-week) up through today.
 * `from` does NOT need to be a Monday — we'll pad any partial first week
 * so the grid is always column-aligned.
 */
function buildWeeks(from: Date, to: Date, activityMap: Map<string, ActivityDayInput>) {
  const weeks: { date: Date; key: string; activity: ActivityDayInput | null; inRange: boolean }[][] = []
  const cursor = startOfWeek(from)
  const end = new Date(to)
  end.setHours(23, 59, 59, 999)

  while (cursor <= end) {
    const week: { date: Date; key: string; activity: ActivityDayInput | null; inRange: boolean }[] = []
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(cursor)
      const key = formatDateKey(dayDate)
      const inRange = dayDate.getTime() >= from.getTime() && dayDate.getTime() <= end.getTime()
      week.push({
        date: dayDate,
        key,
        activity: activityMap.get(key) ?? null,
        inRange,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

function intensityColor(activity: ActivityDayInput | null): string {
  if (!activity || !activity.active) return "var(--glass-strong)"
  const count = activity.count ?? 1
  if (count >= 3) return "var(--gold)"
  if (count === 2) return "color-mix(in srgb, var(--gold) 70%, var(--glass-strong))"
  return "color-mix(in srgb, var(--gold) 40%, var(--glass-strong))"
}

function intensityLabel(activity: ActivityDayInput | null): string {
  if (!activity || !activity.active) return "No reflection"
  const count = activity.count ?? 1
  if (count >= 3) return `${count} reflections`
  if (count === 2) return "2 reflections"
  return "1 reflection"
}

function computeCurrentStreak(activityMap: Map<string, ActivityDayInput>, today: Date): number {
  let streak = 0
  const cursor = new Date(today)
  cursor.setHours(0, 0, 0, 0)
  // Allow today to be empty — only count back from the most recent active day
  while (true) {
    const key = formatDateKey(cursor)
    const day = activityMap.get(key)
    if (day?.active) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

function computeLongestStreakInRange(activityDays: ActivityDayInput[], rangeStart: Date, rangeEnd: Date): number {
  if (activityDays.length === 0) return 0
  const startKey = formatDateKey(rangeStart)
  const endKey = formatDateKey(rangeEnd)
  const inRange = activityDays.filter((d) => {
    if (!d.active) return false
    return d.date >= startKey && d.date <= endKey
  })
  if (inRange.length === 0) return 0
  const sorted = inRange.map((d) => d.date).sort()
  let longest = 1
  let current = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const cur = new Date(sorted[i])
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000)
    if (diffDays === 1) {
      current++
      if (current > longest) longest = current
    } else {
      current = 1
    }
  }
  return longest
}

interface ActivityCalendarProps {
  activityDays: ActivityDayInput[]
  loading?: boolean
  /** Number of months to show, ending at today. Defaults to 6 (GitHub-style). */
  monthsToShow?: number
}

export function ActivityCalendar({ activityDays, loading = false, monthsToShow = 6 }: ActivityCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<{ key: string; x: number; y: number } | null>(null)

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  // GitHub-style: snap to the first day of the month `monthsToShow` months back.
  // Grid ends today; everything before the first day is shown as empty/out-of-range.
  const rangeStart = useMemo(() => {
    const d = startOfMonth(today)
    d.setMonth(d.getMonth() - (monthsToShow - 1))
    return d
  }, [today, monthsToShow])

  const activityMap = useMemo(() => {
    const map = new Map<string, ActivityDayInput>()
    activityDays.forEach((d) => map.set(d.date, d))
    return map
  }, [activityDays])

  const weeks = useMemo(
    () => buildWeeks(rangeStart, today, activityMap),
    [rangeStart, today, activityMap]
  )

  // GitHub-style month label: appears above the column where the FIRST
  // in-range day of a new month lives (typically where the 1st falls,
  // or the earliest column of that month when the 1st isn't on a Monday).
  const monthLabelForWeek = (weekIndex: number): string | null => {
    const week = weeks[weekIndex]
    if (!week) return null
    // Find the first in-range day in this column
    const firstInRange = week.find((d) => d.inRange)
    if (!firstInRange) return null
    const day = firstInRange.date.getDate()
    // Only label if this column begins the new month (day <= 7) AND
    // the previous column didn't start in this month too.
    if (day > 7) return null
    if (weekIndex > 0) {
      const prevWeek = weeks[weekIndex - 1]
      const prevFirstInRange = prevWeek.find((d) => d.inRange)
      if (prevFirstInRange) {
        const prevMonth = prevFirstInRange.date.getMonth()
        const prevYear = prevFirstInRange.date.getFullYear()
        if (prevMonth === firstInRange.date.getMonth() && prevYear === firstInRange.date.getFullYear()) {
          return null
        }
      }
    }
    return MONTH_LABELS[firstInRange.date.getMonth()]
  }

  const totalActiveDays = (() => {
    const startKey = formatDateKey(rangeStart)
    const endKey = formatDateKey(today)
    return activityDays.filter((d) => d.active && d.date >= startKey && d.date <= endKey).length
  })()
  const currentStreak = computeCurrentStreak(activityMap, today)
  const longestInRange = computeLongestStreakInRange(activityDays, rangeStart, today)
  const todayKey = formatDateKey(today)
  const todayActivity = activityMap.get(todayKey)
  const todayLabel = todayActivity?.active ? "Reflected today" : "Not yet today"

  // Tooltip positioning helpers
  const cellSize = 15
  const cellGap = 3

  if (loading) {
    return (
      <div style={{ padding: "1.25rem", background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)" }}>
        <div className="skeleton" style={{ height: "0.85rem", width: "8rem", borderRadius: "99px", marginBottom: "0.6rem" }} />
        <div className="skeleton" style={{ height: "0.7rem", width: "14rem", borderRadius: "99px", marginBottom: "1.25rem" }} />
        <div className="skeleton" style={{ height: `${cellSize * 7 + cellGap * 6 + 8}px`, borderRadius: "var(--radius-md)" }} />
      </div>
    )
  }

  return (
    <div
      style={{
        padding: "1.5rem",
        background: "var(--glass)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <span className="muted-kicker" style={{ display: "flex", marginBottom: "0.3rem" }}>Daily Return</span>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            Your reflection activity from {MONTH_LABELS[rangeStart.getMonth()]} {rangeStart.getFullYear()} to {MONTH_LABELS[today.getMonth()]} {today.getFullYear()}.
          </p>
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--muted)", textAlign: "right" }}>
          <span style={{ color: "var(--text)", fontWeight: 600 }}>{totalActiveDays}</span> {totalActiveDays === 1 ? "day" : "days"} reflected
        </p>
      </div>

      {/* Stat row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.6rem", marginBottom: "1.25rem", marginTop: "1rem" }}>
        <div style={{ padding: "0.75rem 0.9rem", background: "var(--glass-strong)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)" }}>
          <p style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.3rem" }}>Current</p>
          <p style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>{currentStreak}<span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted)", marginLeft: "0.3rem" }}>{currentStreak === 1 ? "day" : "days"}</span></p>
        </div>
        <div style={{ padding: "0.75rem 0.9rem", background: "var(--glass-strong)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)" }}>
          <p style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.3rem" }}>Longest run</p>
          <p style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>{longestInRange}<span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted)", marginLeft: "0.3rem" }}>{longestInRange === 1 ? "day" : "days"}</span></p>
        </div>
        <div style={{ padding: "0.75rem 0.9rem", background: "var(--glass-strong)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)" }}>
          <p style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.3rem" }}>Today</p>
          <p style={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2, color: todayActivity?.active ? "var(--gold)" : "var(--muted)" }}>
            {todayLabel}
          </p>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ overflowX: "auto", paddingBottom: "0.5rem", position: "relative" }} className="scrollbar-none">
        <div style={{ display: "inline-flex", gap: `${cellGap}px`, paddingLeft: "0.25rem" }}>
          {/* Weekday labels column */}
          <div style={{ display: "flex", flexDirection: "column", gap: `${cellGap}px`, marginRight: "0.5rem" }}>
            <div style={{ height: "0.9rem" }} />
            {WEEKDAY_LABELS.map((label, i) => (
              <div
                key={label}
                style={{
                  height: `${cellSize}px`,
                  fontSize: "0.68rem",
                  color: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  lineHeight: 1,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {weeks.map((week, weekIndex) => {
            const monthLabel = monthLabelForWeek(weekIndex)
            return (
              <div key={weekIndex} style={{ display: "flex", flexDirection: "column", gap: `${cellGap}px` }}>
                <div
                  style={{
                    height: "0.9rem",
                    fontSize: "0.7rem",
                    color: "var(--muted)",
                    fontFamily: "var(--font-mono)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {monthLabel ?? ""}
                </div>
                {week.map((day) => {
                  if (!day.inRange) {
                    // Pad-out cells outside the requested month range so the
                    // grid is column-aligned (left/right padding).
                    return (
                      <div
                        key={day.key}
                        aria-hidden
                        style={{
                          width: `${cellSize}px`,
                          height: `${cellSize}px`,
                          borderRadius: "3px",
                          background: "transparent",
                          border: "1px solid transparent",
                        }}
                      />
                    )
                  }
                  const isToday = day.key === todayKey
                  const isHovered = hoveredDay?.key === day.key
                  return (
                    <div
                      key={day.key}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        setHoveredDay({ key: day.key, x: rect.left + rect.width / 2, y: rect.top })
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                      tabIndex={0}
                      role="gridcell"
                      aria-label={`${day.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} — ${intensityLabel(day.activity)}`}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        borderRadius: "3px",
                        background: intensityColor(day.activity),
                        border: isToday
                          ? "1.5px solid var(--gold)"
                          : isHovered
                          ? "1.5px solid var(--gold-border)"
                          : "1px solid transparent",
                        outline: "none",
                        cursor: "pointer",
                        transition: "transform 0.1s ease, border-color 0.1s ease",
                        transform: isHovered ? "scale(1.25)" : "scale(1)",
                        position: "relative",
                      }}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Hover tooltip — fixed-positioned, follows the hovered cell */}
        {hoveredDay && (() => {
          const day = activityMap.get(hoveredDay.key)
          const dayDate = new Date(hoveredDay.key)
          const dateLabel = dayDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })
          const intensity = intensityLabel(day ?? null)
          return (
            <div
              role="tooltip"
              style={{
                position: "fixed",
                top: hoveredDay.y - 12,
                left: hoveredDay.x,
                transform: "translate(-50%, -100%)",
                background: "var(--ink-raised)",
                border: "1px solid var(--gold-border)",
                borderRadius: "var(--radius-md)",
                padding: "0.55rem 0.7rem",
                fontSize: "0.78rem",
                color: "var(--text)",
                whiteSpace: "nowrap",
                zIndex: 60,
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
                pointerEvents: "none",
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: "0.15rem" }}>{dateLabel}</p>
              <p style={{ color: day?.active ? "var(--gold)" : "var(--muted)" }}>{intensity}</p>
            </div>
          )
        })()}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
        <p style={{ fontSize: "0.7rem", color: "var(--muted)" }}>
          Each square is one day. Darker = more reflections.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>Less</span>
          {[
            { label: "None", color: "var(--glass-strong)" },
            { label: "1 reflection", color: "color-mix(in srgb, var(--gold) 40%, var(--glass-strong))" },
            { label: "2 reflections", color: "color-mix(in srgb, var(--gold) 70%, var(--glass-strong))" },
            { label: "3+ reflections", color: "var(--gold)" },
          ].map(({ color, label }) => (
            <div
              key={label}
              title={label}
              aria-label={label}
              style={{ width: "12px", height: "12px", borderRadius: "3px", background: color }}
            />
          ))}
          <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>More</span>
        </div>
      </div>
    </div>
  )
}