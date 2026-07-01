import { useRef, useState } from 'react'
import { useDismiss } from './useDismiss'

type DatePickerProps = {
  /** Initial selected date (defaults to none). */
  initialDate?: Date
  /** Label shown when no date is selected. */
  placeholder?: string
  /** Formats the trigger label once a date is selected. */
  formatLabel?: (date: Date) => string
  /** Called whenever a day is picked. */
  onChange?: (date: Date) => void
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

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export function DatePicker({
  initialDate,
  placeholder = 'Select date',
  formatLabel = (date) => date.toLocaleDateString(),
  onChange,
  triggerClassName = 'filter-btn',
  align = 'left',
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Date | null>(initialDate ?? null)
  const [view, setView] = useState(() => initialDate ?? new Date())
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, () => setOpen(false), open)

  const today = new Date()
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
    setSelected(date)
    setView(date)
    setOpen(false)
    onChange?.(date)
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
        {selected ? formatLabel(selected) : placeholder}
        <CalendarIcon />
      </button>

      {open ? (
        <div className={`calendar-pop calendar-pop--${align}`} role="dialog" aria-label="Choose date">
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
              const isSelected = selected ? isSameDay(date, selected) : false
              return (
                <button
                  type="button"
                  key={date.toISOString()}
                  className={[
                    'cal-day',
                    inMonth ? '' : 'is-muted',
                    isToday ? 'is-today' : '',
                    isSelected ? 'is-selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => pick(date)}
                >
                  {date.getDate()}
                </button>
              )
            })}
          </div>

          <div className="cal-foot">
            <button type="button" className="cal-today-btn" onClick={() => pick(new Date())}>
              Today
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
