import { useRef, useState } from 'react'
import { useDismiss } from './useDismiss'

export type DateRange = {
  from: Date | null
  to: Date | null
}

type DateRangePickerProps = {
  /** Current selected range (defaults to none). */
  value?: DateRange
  /** Label shown when no date is selected. */
  placeholder?: string
  /** Called whenever a day is picked. */
  onChange?: (range: DateRange) => void
  /** Class for the trigger button so it can match existing button styles. */
  triggerClassName?: string
  /** Which edge the popover aligns to. */
  align?: 'left' | 'right'
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export function DateRangePicker({
  value,
  placeholder = 'Select date range',
  onChange,
  triggerClassName = 'filter-btn',
  align = 'left',
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<Date | null>(null)
  const [view, setView] = useState(() => value?.from ?? new Date())
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, () => setOpen(false), open)

  const today = new Date()
  const from = value?.from ?? null
  const to = value?.to ?? null
  const viewYear = view.getFullYear()
  const viewMonth = view.getMonth()

  // Build a 6-week grid starting on the Sunday on/before the 1st.
  const firstOfMonth = new Date(viewYear, viewMonth, 1)
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(1 - firstOfMonth.getDay())
  const days = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    return date
  })

  const changeMonth = (delta: number) =>
    setView(new Date(viewYear, viewMonth + delta, 1))

  const pick = (date: Date) => {
    const picked = startOfDay(date)
    if (!from || (from && to)) {
      onChange?.({ from: picked, to: null })
    } else if (picked < from) {
      onChange?.({ from: picked, to: null })
    } else if (isSameDay(picked, from)) {
      onChange?.({ from: null, to: null })
    } else {
      onChange?.({ from, to: picked })
    }
  }

  const clear = () => {
    onChange?.({ from: null, to: null })
    setHovered(null)
    setView(new Date())
  }

  const label = from && to
    ? isSameDay(from, to) && isSameDay(from, today)
      ? 'Today'
      : `${from.toLocaleDateString()} – ${to.toLocaleDateString()}`
    : from
      ? `From ${from.toLocaleDateString()}`
      : placeholder

  const rangeClasses = (date: Date) => {
    if (!from) return ''
    const previewEnd = to ?? (hovered && hovered >= from ? hovered : null)
    const inRange = previewEnd && date > from && date < previewEnd
    return [
      isSameDay(date, from) ? 'is-range-start' : '',
      to && isSameDay(date, to) ? 'is-range-end' : '',
      inRange ? 'is-in-range' : '',
    ]
      .filter(Boolean)
      .join(' ')
  }

  return (
    <div className="datepicker" ref={ref}>
      <button
        type="button"
        className={triggerClassName}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
        <CalendarIcon />
      </button>

      {open ? (
        <div
          className={`calendar-pop calendar-pop--range calendar-pop--${align}`}
          role="dialog"
          aria-label="Choose date range"
        >
          <div className="cal-head">
            <button type="button" className="cal-nav" aria-label="Previous month" onClick={() => changeMonth(-1)}>
              <ChevronLeft />
            </button>
            <span className="cal-title">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" className="cal-nav" aria-label="Next month" onClick={() => changeMonth(1)}>
              <ChevronRight />
            </button>
          </div>

          <div className="cal-weekdays">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="cal-grid">
            {days.map((date) => {
              const inMonth = date.getMonth() === viewMonth
              const isToday = isSameDay(date, today)
              return (
                <button
                  type="button"
                  key={date.toISOString()}
                  className={[
                    'cal-day',
                    inMonth ? '' : 'is-muted',
                    isToday ? 'is-today' : '',
                    rangeClasses(date),
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseEnter={() => setHovered(date)}
                  onClick={() => pick(date)}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="cal-foot cal-foot--range">
            <button type="button" className="cal-today-btn" onClick={() => pick(new Date())}>
              Today
            </button>
            <button type="button" className="cal-today-btn" onClick={clear}>
              Clear
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4" />
    </svg>
  )
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
