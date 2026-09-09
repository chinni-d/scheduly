'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Bell,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Filter,
  LayoutDashboard,
  Menu,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Trash2,
  Users,
  X,
  XCircle,
} from 'lucide-react'

export type Status = 'Scheduled' | 'Completed' | 'Cancelled'

export type Appointment = {
  id: number
  title: string
  description?: string
  date: string // YYYY-MM-DD
  start_time: string // HH:MM
  end_time: string // HH:MM
  status: Status
  tone: string
  name?: string
  service?: string
  appointment_date?: string
  appointment_time?: string
  duration_minutes?: number
}

function getCurrentWeekStart() {
  const today = new Date()
  const day = today.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  return monday
}

const baseWeek = getCurrentWeekStart()

function toISODate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDDMMYYYY(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const [y, m, d] = parts
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
  }
  return dateStr
}

function getWeekDays(offset: number) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(baseWeek)
    date.setDate(baseWeek.getDate() + offset * 7 + index)
    return {
      isoDate: toISODate(date),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
      fullWeekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
      formattedDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dayNumber: date.getDate(),
      fullLabel: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
    }
  })
}

function getWeekLabel(offset: number) {
  const start = new Date(baseWeek)
  start.setDate(baseWeek.getDate() + offset * 7)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${startLabel} – ${endLabel}`
}

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  let hours = parseInt(parts[0], 10)
  const minutes = parts[1].slice(0, 2)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12
  return `${hours}:${minutes} ${ampm}`
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function minutesToDurationLabel(mins: number): string {
  if (mins <= 0) return '0m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

const toneClasses: Record<string, string> = {
  rose: 'bg-rose-50/90 border border-rose-200/80',
  amber: 'bg-amber-50/90 border border-amber-200/80',
  violet: 'bg-violet-50/90 border border-violet-200/80',
  sky: 'bg-sky-50/90 border border-sky-200/80',
  emerald: 'bg-emerald-50/90 border border-emerald-200/80',
  orange: 'bg-orange-50/90 border border-orange-200/80',
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="grid size-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
        <CalendarDays size={18} />
      </div>
      <span className="text-[17px] font-bold tracking-[-0.04em]">
        schedule<span className="text-emerald-700">ly</span>
      </span>
    </div>
  )
}

function getInitialSampleAppointments(): Appointment[] {
  const today = new Date()
  const d0 = toISODate(today)
  const d1Date = new Date(today)
  d1Date.setDate(today.getDate() + 1)
  const d1 = toISODate(d1Date)
  const d2Date = new Date(today)
  d2Date.setDate(today.getDate() + 2)
  const d2 = toISODate(d2Date)

  return [
    {
      id: 1,
      title: 'Product Design Sprint',
      description: 'Weekly sync with UX and frontend team to finalize dashboard components',
      date: d0,
      start_time: '09:00',
      end_time: '10:00',
      status: 'Completed',
      tone: 'emerald',
    },
    {
      id: 2,
      title: 'Doctor Consultation',
      description: 'Routine checkup and prescription renewal with Dr. Adams',
      date: d0,
      start_time: '10:30',
      end_time: '11:15',
      status: 'Scheduled',
      tone: 'sky',
    },
    {
      id: 3,
      title: 'Client Project Kickoff',
      description: 'Initial scoping and requirements review with Acme Corp stakeholders',
      date: d0,
      start_time: '14:00',
      end_time: '15:30',
      status: 'Scheduled',
      tone: 'violet',
    },
    {
      id: 4,
      title: 'Quarterly Strategy Review',
      description: 'Cancelled due to scheduling conflict with executive offsite',
      date: d0,
      start_time: '16:00',
      end_time: '17:00',
      status: 'Cancelled',
      tone: 'rose',
    },
    {
      id: 5,
      title: 'Frontend Code Review',
      description: 'Deep dive on PR #142 and performance optimization',
      date: d1,
      start_time: '11:00',
      end_time: '12:00',
      status: 'Scheduled',
      tone: 'amber',
    },
    {
      id: 6,
      title: 'Vendor Architecture Demo',
      description: 'Evaluating new cloud analytics integration and APIs',
      date: d2,
      start_time: '13:00',
      end_time: '14:00',
      status: 'Scheduled',
      tone: 'orange',
    },
    {
      id: 7,
      title: 'HR Benefits Briefing',
      description: 'Annual open enrollment Q&A session',
      date: d2,
      start_time: '15:00',
      end_time: '16:00',
      status: 'Completed',
      tone: 'emerald',
    },
  ]
}

export default function Page() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'All' | Status>('All')
  const [dateFilter, setDateFilter] = useState<string>('')

  // Toast / Alert notification state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr))
    }, 4500)
  }

  // Modal State (Add or Edit)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [editingId, setEditingId] = useState<number | null>(null)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDate, setFormDate] = useState(toISODate(new Date()))
  const [formStartTime, setFormStartTime] = useState('10:00')
  const [formEndTime, setFormEndTime] = useState('11:00')
  const [formStatus, setFormStatus] = useState<Status>('Scheduled')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const filterDateRef = useRef<HTMLInputElement>(null)
  const formDateRef = useRef<HTMLInputElement>(null)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset])
  const weekLabel = useMemo(() => getWeekLabel(weekOffset), [weekOffset])

  // Fetch appointments from FastAPI backend or fallback to initial samples / localStorage
  const fetchAppointments = async () => {
    setLoading(true)
    setApiError(null)
    try {
      const res = await fetch('/api/appointments')
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || `Server error (${res.status})`)
      }
      const data = await res.json()
      const mapped: Appointment[] = data.map((a: any) => ({
        id: a.id,
        title: a.title || a.name || 'Appointment',
        description: a.description || '',
        date: a.date || a.appointment_date || toISODate(new Date()),
        start_time: (a.start_time || a.appointment_time || '09:00').slice(0, 5),
        end_time: (a.end_time || '10:00').slice(0, 5),
        status: (['Scheduled', 'Completed', 'Cancelled'].includes(a.status) ? a.status : 'Scheduled') as Status,
        tone: a.tone || 'emerald',
      }))
      setAppointments(mapped)
      setBackendConnected(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to backend'
      setApiError(message)
      setBackendConnected(false)

      const cached = typeof window !== 'undefined' ? localStorage.getItem('scheduly_appointments') : null
      if (cached) {
        try {
          setAppointments(JSON.parse(cached))
        } catch {
          const samples = getInitialSampleAppointments()
          setAppointments(samples)
        }
      } else {
        const samples = getInitialSampleAppointments()
        setAppointments(samples)
        if (typeof window !== 'undefined') {
          localStorage.setItem('scheduly_appointments', JSON.stringify(samples))
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  // Sync to local storage as safety backup
  const persistAppointments = (next: Appointment[]) => {
    setAppointments(next)
    try {
      localStorage.setItem('scheduly_appointments', JSON.stringify(next))
    } catch {}
  }

  // Overlap Conflict Checker
  const checkTimeConflict = (
    date: string,
    start: string,
    end: string,
    excludeId?: number | null
  ): Appointment | null => {
    const sA = timeToMinutes(start)
    const eA = timeToMinutes(end)

    for (const apt of appointments) {
      if (excludeId && apt.id === excludeId) continue
      if (apt.date !== date) continue
      if (apt.status === 'Cancelled') continue // Cancelled appointments free up their slot

      const sB = timeToMinutes(apt.start_time)
      const eB = timeToMinutes(apt.end_time)

      // Overlap condition: startA < endB && endA > startB
      if (sA < eB && eA > sB) {
        return apt
      }
    }
    return null
  }

  // Open Add Modal
  const openAddModal = (defaultDate?: string) => {
    setModalMode('add')
    setEditingId(null)
    setFormTitle('')
    setFormDescription('')
    setFormDate(defaultDate || dateFilter || toISODate(new Date()))
    setFormStartTime('10:00')
    setFormEndTime('11:00')
    setFormStatus('Scheduled')
    setFormError(null)
    setShowModal(true)
  }

  // Open Edit Modal
  const openEditModal = (apt: Appointment) => {
    setModalMode('edit')
    setEditingId(apt.id)
    setFormTitle(apt.title)
    setFormDescription(apt.description || '')
    setFormDate(apt.date)
    setFormStartTime(apt.start_time)
    setFormEndTime(apt.end_time)
    setFormStatus(apt.status)
    setFormError(null)
    setShowModal(true)
  }

  // Submit Handler (Add or Edit)
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formTitle.trim()) {
      setFormError('Title is required.')
      return
    }

    if (!formDate) {
      setFormError('Date is required.')
      return
    }

    if (!formStartTime || !formEndTime) {
      setFormError('Both start time and end time are required.')
      return
    }

    // 1. Time Validation: End time must be after start time
    const sMins = timeToMinutes(formStartTime)
    const eMins = timeToMinutes(formEndTime)
    if (eMins <= sMins) {
      const msg = 'End time must be after start time.'
      setFormError(msg)
      showToast(msg, 'error')
      return
    }

    // 2. Prevent Time Conflicts (Overlap check)
    const conflict = checkTimeConflict(
      formDate,
      formStartTime,
      formEndTime,
      modalMode === 'edit' ? editingId : null
    )

    if (conflict) {
      const msg = `Time slot is already occupied by '${conflict.title}' (${formatTime(conflict.start_time)} – ${formatTime(conflict.end_time)}).`
      setFormError(msg)
      showToast(msg, 'error')
      return
    }

    setSubmitting(true)

    try {
      if (modalMode === 'add') {
        let created: Appointment | null = null

        if (backendConnected) {
          try {
            const res = await fetch('/api/appointments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: formTitle.trim(),
                description: formDescription.trim(),
                date: formDate,
                start_time: formStartTime,
                end_time: formEndTime,
                status: 'Scheduled',
              }),
            })

            if (res.ok) {
              const resData = await res.json()
              created = {
                id: resData.id,
                title: resData.title,
                description: resData.description || '',
                date: resData.date,
                start_time: resData.start_time.slice(0, 5),
                end_time: resData.end_time.slice(0, 5),
                status: resData.status,
                tone: 'emerald',
              }
            } else {
              const errData = await res.json().catch(() => ({}))
              throw new Error(errData.detail || `Error: ${res.statusText}`)
            }
          } catch (err: any) {
            if (err.message && (err.message.includes('occupied') || err.message.includes('End time'))) {
              setFormError(err.message)
              showToast(err.message, 'error')
              setSubmitting(false)
              return
            }
          }
        }

        if (!created) {
          const nextId = appointments.length > 0 ? Math.max(...appointments.map((a) => a.id)) + 1 : 1
          created = {
            id: nextId,
            title: formTitle.trim(),
            description: formDescription.trim(),
            date: formDate,
            start_time: formStartTime,
            end_time: formEndTime,
            status: 'Scheduled',
            tone: 'emerald',
          }
        }

        persistAppointments([...appointments, created])
        setShowModal(false)
        showToast('Appointment added successfully.', 'success')
      } else if (modalMode === 'edit' && editingId) {
        let updated: Appointment | null = null

        if (backendConnected) {
          try {
            const res = await fetch(`/api/appointments/${editingId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: formTitle.trim(),
                description: formDescription.trim(),
                date: formDate,
                start_time: formStartTime,
                end_time: formEndTime,
                status: formStatus,
              }),
            })

            if (res.ok) {
              const resData = await res.json()
              updated = {
                id: resData.id,
                title: resData.title,
                description: resData.description || '',
                date: resData.date,
                start_time: resData.start_time.slice(0, 5),
                end_time: resData.end_time.slice(0, 5),
                status: resData.status,
                tone: 'emerald',
              }
            } else {
              const errData = await res.json().catch(() => ({}))
              throw new Error(errData.detail || `Error: ${res.statusText}`)
            }
          } catch (err: any) {
            if (err.message && (err.message.includes('occupied') || err.message.includes('End time'))) {
              setFormError(err.message)
              showToast(err.message, 'error')
              setSubmitting(false)
              return
            }
          }
        }

        if (!updated) {
          const curr = appointments.find((a) => a.id === editingId)
          updated = {
            id: editingId,
            title: formTitle.trim(),
            description: formDescription.trim(),
            date: formDate,
            start_time: formStartTime,
            end_time: formEndTime,
            status: formStatus,
            tone: curr ? curr.tone : 'emerald',
          }
        }

        persistAppointments(appointments.map((a) => (a.id === editingId ? updated! : a)))
        setShowModal(false)
        showToast('Appointment updated successfully.', 'success')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save appointment'
      setFormError(msg)
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Complete Appointment Handler
  const handleCompleteAppointment = async (appointment: Appointment) => {
    const nextStatus: Status = 'Completed'
    if (backendConnected) {
      fetch(`/api/appointments/${appointment.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      }).catch(() => {})
    }
    persistAppointments(
      appointments.map((a) => (a.id === appointment.id ? { ...a, status: nextStatus } : a))
    )
    showToast('Appointment completed successfully.', 'success')
  }

  // Cancel Appointment Handler (Cancelled appointments remain visible!)
  const handleCancelAppointment = async (appointment: Appointment) => {
    const nextStatus: Status = 'Cancelled'
    if (backendConnected) {
      fetch(`/api/appointments/${appointment.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      }).catch(() => {})
    }
    persistAppointments(
      appointments.map((a) => (a.id === appointment.id ? { ...a, status: nextStatus } : a))
    )
    showToast('Appointment cancelled successfully.', 'success')
  }

  // Delete appointment handler
  const handleDeleteAppointment = async (id: number) => {
    if (backendConnected) {
      fetch(`/api/appointments/${id}`, { method: 'DELETE' }).catch(() => {})
    }
    persistAppointments(appointments.filter((a) => a.id !== id))
    showToast('Appointment deleted.', 'success')
  }


  // Dynamic statistics
  const totalAppointments = appointments.length
  const scheduledCount = appointments.filter((a) => a.status === 'Scheduled').length
  const completedCount = appointments.filter((a) => a.status === 'Completed').length
  const cancelledCount = appointments.filter((a) => a.status === 'Cancelled').length
  const completionRate =
    totalAppointments > 0 ? `${Math.round((completedCount / totalAppointments) * 100)}%` : '0%'

  // Filtered appointments for search, status filter, and date filter
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const matchesFilter = filter === 'All' || a.status === filter
      const matchesDate = !dateFilter || a.date === dateFilter
      const q = search.toLowerCase().trim()
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
      return matchesFilter && matchesDate && matchesSearch
    })
  }, [appointments, filter, dateFilter, search])

  // Upcoming appointments (sorted chronologically, Scheduled)
  const upcomingAppointments = useMemo(() => {
    const todayStr = toISODate(new Date())
    return [...appointments]
      .filter((a) => a.date >= todayStr && a.status === 'Scheduled')
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return a.start_time.localeCompare(b.start_time)
      })
      .slice(0, 5)
  }, [appointments])

  // Appointments per day of current displayed week for chart
  const weekDayCounts = useMemo(() => {
    return weekDays.map((day) => {
      return appointments.filter((a) => a.date === day.isoDate).length
    })
  }, [weekDays, appointments])

  const maxWeekDayCount = Math.max(...weekDayCounts, 1)

  // Reusable Appointment Card Renderer
  const renderAppointmentCard = (a: Appointment) => {
    const isCancelled = a.status === 'Cancelled'
    const isCompleted = a.status === 'Completed'
    const durationMins = timeToMinutes(a.end_time) - timeToMinutes(a.start_time)

    return (
      <div
        key={a.id}
        className={`group relative mb-2 w-full rounded-xl p-3 text-left shadow-[0_2px_6px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-md ${
          isCancelled
            ? 'border border-slate-200 bg-slate-100/90 opacity-75'
            : isCompleted
              ? 'border border-emerald-200 bg-emerald-50/90'
              : toneClasses[a.tone] || 'border border-blue-200 bg-blue-50/90'
        }`}
      >
        <p
          className={`text-xs sm:text-sm font-semibold leading-snug break-words ${
            isCancelled ? 'line-through text-slate-500' : 'text-slate-800'
          }`}
        >
          {a.title}
        </p>

        {a.description && (
          <p className="mt-1 text-[11px] sm:text-xs text-slate-500 break-words">
            {a.description}
          </p>
        )}

        <p className="mt-2 text-[11px] sm:text-xs font-medium text-slate-600">
          {formatTime(a.start_time)} – {formatTime(a.end_time)} · {minutesToDurationLabel(durationMins)}
        </p>

        <div className="mt-2.5 flex items-center justify-between">
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold shadow-2xs ${
              a.status === 'Scheduled'
                ? 'bg-blue-100 text-blue-800'
                : a.status === 'Completed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
            }`}
          >
            {a.status}
          </span>

          <div className="flex items-center gap-1">
            {/* Edit Button (Placed at bottom right next to status) */}
            <button
              onClick={() => openEditModal(a)}
              aria-label="Edit appointment"
              className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-black/5 transition"
            >
              <Edit3 size={14} />
            </button>
            {/* Delete Button */}
            <button
              onClick={() => handleDeleteAppointment(a.id)}
              aria-label="Delete appointment"
              className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-70 md:opacity-0 md:group-hover:opacity-100 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-950 max-w-full overflow-x-hidden">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-4 left-3 right-3 sm:left-auto sm:right-5 sm:top-5 z-50 flex items-center gap-2.5 sm:gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-top-3 max-w-md bg-white border-slate-200 text-slate-800">
          {notification.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
          )}
          <p className="text-xs font-semibold leading-snug">{notification.message}</p>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] flex-col border-r border-white/70 bg-white/70 px-5 py-7 shadow-[8px_0_30px_rgba(15,23,42,0.03)] backdrop-blur-xl lg:flex">
        <Logo />
        <Nav />
      </aside>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 lg:hidden ${
          showMobileNav ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setShowMobileNav(false)}
        aria-hidden={!showMobileNav}
      >
        <aside
          className={`flex h-full w-[min(84vw,300px)] flex-col overflow-y-auto border-r border-slate-200 bg-white px-5 py-6 shadow-2xl transition-transform duration-300 ease-out ${
            showMobileNav ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <Logo />
            <button
              aria-label="Close navigation"
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
              onClick={() => setShowMobileNav(false)}
            >
              <X size={19} />
            </button>
          </div>
          <Nav onNavigate={() => setShowMobileNav(false)} />
        </aside>
      </div>

      {/* Main Content */}
      <section className="lg:pl-[238px] max-w-full overflow-x-hidden">
        {/* Header */}
        <header className="fixed inset-x-0 top-0 z-20 flex min-h-[64px] sm:min-h-[76px] items-center justify-between border-b border-slate-200/80 bg-white px-3.5 sm:px-8 shadow-xs lg:left-[238px]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              aria-label="Open navigation"
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/70 lg:hidden shrink-0"
              onClick={() => setShowMobileNav(true)}
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <p className="hidden sm:block text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400 truncate">
                {getTodayLabel()}
              </p>
              <h1 className="text-sm sm:text-[19px] font-semibold tracking-[-0.03em] truncate">
                Appointments Dashboard
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button aria-label="Notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-orange-400" />
            </button>
            <div className="hidden h-7 w-px bg-slate-200 sm:block" />
            <div className="grid size-8 sm:size-9 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
              FA
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] w-full px-3.5 pb-6 pt-[80px] sm:px-8 sm:pb-8 sm:pt-[108px] xl:px-10 overflow-x-hidden">
          {/* Section Header */}
          <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Appointment Schedule
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.045em] sm:text-[32px]">Calendar</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Manage, schedule, and view your appointments across the week.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => openAddModal()}
                className="inline-flex w-full sm:w-fit items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
              >
                <Plus size={17} /> New appointment
              </button>
            </div>
          </div>

          {/* Dynamic KPI Metrics */}
          <div className="mb-6 sm:mb-7 grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
            {[
              { title: 'Total appointments', value: String(totalAppointments), Icon: CalendarDays, onClick: () => setFilter('All') },
              { title: 'Scheduled', value: String(scheduledCount), Icon: Clock3, onClick: () => setFilter('Scheduled') },
              { title: 'Completed', value: String(completedCount), Icon: CheckCircle2, onClick: () => setFilter('Completed') },
              { title: 'Cancelled', value: String(cancelledCount), Icon: XCircle, onClick: () => setFilter('Cancelled') },
            ].map(({ title, value, Icon, onClick }) => (
              <div
                key={title}
                onClick={onClick}
                className="cursor-pointer rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-5 shadow-[0_2px_10px_rgba(15,23,42,0.02)] transition hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <p className="text-[11px] sm:text-sm font-medium text-slate-500">{title}</p>
                  <span className="rounded-lg bg-slate-50 p-1.5 sm:p-2 text-slate-400 shrink-0">
                    <Icon size={15} />
                  </span>
                </div>
                <div className="mt-2 sm:mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-h-[28px] sm:min-h-[32px]">
                  {loading ? (
                    <div className="h-6 sm:h-7 w-12 rounded-lg bg-slate-200/80 animate-pulse my-0.5" />
                  ) : (
                    <p className="text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
                      {value}
                    </p>
                  )}
                </div>
                <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-[11px] text-slate-400 line-clamp-1">
                  {title === 'Cancelled' ? 'Kept visible & slots freed' : 'Live from board'}
                </p>
              </div>
            ))}
          </div>

          {/* Calendar View Container */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.025)] w-full min-w-0 max-w-full">
            {/* Calendar Controls & Filters */}
            <div className="flex flex-col gap-3.5 border-b border-slate-200/80 p-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5 w-full min-w-0">
              <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0 w-full sm:w-auto">
                <div className="flex gap-1 shrink-0">
                  <button
                    aria-label="Previous week"
                    onClick={() => setWeekOffset(weekOffset - 1)}
                    className="rounded-lg border border-slate-200 p-1.5 sm:p-2 text-slate-500 transition hover:bg-slate-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    aria-label="Today"
                    onClick={() => {
                      setWeekOffset(0)
                      setDateFilter('')
                    }}
                    className="rounded-lg border border-slate-200 px-2 sm:px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Today
                  </button>
                  <button
                    aria-label="Next week"
                    onClick={() => setWeekOffset(weekOffset + 1)}
                    className="rounded-lg border border-slate-200 p-1.5 sm:p-2 text-slate-500 transition hover:bg-slate-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <span className="text-xs sm:text-sm font-semibold truncate">{weekLabel}</span>
              </div>

              {/* Filter by Date, Search & Filter by Status */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto min-w-0">
                {/* Filter by Date Picker */}
                <div className="flex min-w-0 w-full sm:w-auto items-center justify-between sm:justify-start gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white text-xs hover:border-slate-300">
                  <span className="text-[11px] font-medium text-slate-500 shrink-0">Date:</span>
                  <input
                    ref={filterDateRef}
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="min-w-0 w-full sm:w-auto bg-transparent text-xs text-slate-700 outline-none cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        filterDateRef.current?.showPicker()
                      } catch {
                        filterDateRef.current?.focus()
                      }
                    }}
                    aria-label="Open date picker"
                    className="text-slate-400 hover:text-emerald-700 p-0.5 shrink-0 transition cursor-pointer"
                  >
                    <Calendar size={14} />
                  </button>
                  {dateFilter && (
                    <button
                      onClick={() => setDateFilter('')}
                      aria-label="Clear date filter"
                      className="text-slate-400 hover:text-slate-600 ml-0.5 p-0.5 shrink-0 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Search Input */}
                <label className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 sm:w-48">
                  <Search size={14} className="shrink-0 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search appointments"
                    className="min-w-0 w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                      <X size={13} />
                    </button>
                  )}
                </label>

                {/* Filter by Status Custom Dropdown */}
                <div className="relative min-w-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                    className="flex w-full sm:w-auto items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      {filter === 'All' && <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />}
                      {filter === 'Scheduled' && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                      {filter === 'Completed' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                      {filter === 'Cancelled' && <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />}
                      <span>{filter === 'All' ? 'All Statuses' : filter}</span>
                    </div>
                    <ChevronDown size={13} className={`text-slate-400 transition-transform ${filterDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {filterDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 z-30 min-w-[145px] w-full sm:w-auto overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                      {(['All', 'Scheduled', 'Completed', 'Cancelled'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setFilter(opt)
                            setFilterDropdownOpen(false)
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                            filter === opt
                              ? 'bg-emerald-50 text-emerald-800 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {opt === 'All' && <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />}
                          {opt === 'Scheduled' && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                          {opt === 'Completed' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                          {opt === 'Cancelled' && <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />}
                          <span>{opt === 'All' ? 'All Statuses' : opt}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Date Filter Notice */}
            {dateFilter && (
              <div className="bg-emerald-50/70 border-b border-emerald-100 px-4 sm:px-5 py-2 flex items-center justify-between text-xs text-emerald-800 font-medium">
                <span>Filtering appointments for date: <strong>{formatDDMMYYYY(dateFilter)}</strong></span>
                <button
                  onClick={() => setDateFilter('')}
                  className="text-emerald-700 hover:underline font-semibold text-xs"
                >
                  Show all dates
                </button>
              </div>
            )}

            {/* Mobile View: Day Selector Tabs + Selected Day Card Stack (visible on < md) */}
            <div className="block md:hidden">
              {/* Horizontal 7-Day Selector Strip */}
              <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50/50">
                {weekDays.map((day, i) => {
                  const isSelected = (dateFilter === day.isoDate || (!dateFilter && selectedDayIndex === i))
                  const dayApptsCount = filteredAppointments.filter((a) => a.date === day.isoDate).length

                  return (
                    <button
                      key={day.isoDate}
                      onClick={() => {
                        setSelectedDayIndex(i)
                        setDateFilter(day.isoDate)
                      }}
                      className={`relative flex flex-col items-center py-2.5 px-1 transition ${
                        isSelected ? 'bg-white border-b-2 border-emerald-600 shadow-xs' : 'hover:bg-slate-100/70'
                      }`}
                    >
                      <span className={`text-[10px] font-semibold uppercase ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {day.weekday.slice(0, 3)}
                      </span>
                      <span className={`mt-0.5 text-sm font-bold ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>
                        {day.dayNumber}
                      </span>
                      {dayApptsCount > 0 && (
                        <span className="mt-1 flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Selected Day Content */}
              <div className="p-3.5 min-h-[300px]">
                {(() => {
                  const activeDay = weekDays[selectedDayIndex] || weekDays[0]
                  const activeDate = dateFilter || activeDay.isoDate
                  const activeAppointments = filteredAppointments.filter((a) => a.date === activeDate)

                  return (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
                            {dateFilter ? `Date: ${formatDDMMYYYY(dateFilter)}` : `${activeDay.fullWeekday}, ${formatDDMMYYYY(activeDay.isoDate)}`}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shrink-0">
                            {activeAppointments.length}
                          </span>
                        </div>
                        <button
                          onClick={() => openAddModal(activeDate)}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 shrink-0"
                        >
                          <Plus size={14} /> Add for this day
                        </button>
                      </div>

                      {loading ? (
                        <div className="space-y-2.5">
                          {[1, 2, 3].map((n) => (
                            <div key={n} className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs animate-pulse space-y-2.5">
                              <div className="h-4 w-3/4 rounded bg-slate-200" />
                              <div className="h-3 w-1/2 rounded bg-slate-100" />
                              <div className="flex justify-between items-center pt-1">
                                <div className="h-4 w-20 rounded-full bg-slate-200" />
                                <div className="h-4 w-6 rounded bg-slate-100" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : activeAppointments.length === 0 ? (
                        <div className="py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                          <CalendarDays size={28} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-xs font-medium text-slate-500">No appointments scheduled</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">This time slot is completely free</p>
                          <button
                            onClick={() => openAddModal(activeDate)}
                            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                          >
                            <Plus size={13} /> Schedule appointment
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activeAppointments.map((a) => renderAppointmentCard(a))}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Desktop View: Full 7-Day Grid (hidden on < md, visible on md and up) */}
            <div className="hidden md:block calendar-scroll overflow-x-auto w-full max-w-full">
              <div className="min-w-[780px]">
                {/* Header Days */}
                <div className="grid grid-cols-7 border-b border-slate-200/80">
                  {weekDays.map((day, i) => (
                    <button
                      key={day.isoDate}
                      onClick={() => {
                        setSelectedDayIndex(i)
                        setDateFilter(day.isoDate)
                      }}
                      className={`border-r border-slate-100 px-3 py-4 text-left last:border-0 transition ${
                        (dateFilter === day.isoDate || (!dateFilter && selectedDayIndex === i))
                          ? 'bg-emerald-50/70'
                          : ''
                      }`}
                    >
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        {day.weekday}
                      </p>
                      <p
                        className={`mt-1 text-sm font-semibold ${
                          (dateFilter === day.isoDate || (!dateFilter && selectedDayIndex === i))
                            ? 'text-emerald-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {day.dayNumber}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Day Columns */}
                <div className="grid min-h-[370px] grid-cols-7 divide-x divide-slate-100">
                  {weekDays.map((day, i) => {
                    const dayAppointments = filteredAppointments.filter(
                      (a) => a.date === day.isoDate
                    )

                    return (
                      <div
                        key={day.isoDate}
                        className={`relative p-2 ${
                          (dateFilter === day.isoDate || (!dateFilter && selectedDayIndex === i))
                            ? 'bg-[#fcfefd]'
                            : ''
                        }`}
                      >
                        {loading ? (
                          <div className="space-y-2 p-1">
                            <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                            <div className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                          </div>
                        ) : dayAppointments.length === 0 ? (
                          <div className="flex h-32 items-center justify-center text-center">
                            <span className="text-[11px] text-slate-300">No events</span>
                          </div>
                        ) : (
                          dayAppointments.map((a) => renderAppointmentCard(a))
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section: Upcoming & Week at a glance */}
          <div className="mt-6 sm:mt-7 grid gap-6 xl:grid-cols-[1fr_340px] min-w-0 w-full">
            {/* Upcoming Appointments */}
            <div className="min-w-0 w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-[0_2px_12px_rgba(15,23,42,0.025)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold tracking-[-0.02em]">Upcoming appointments</h3>
                  <p className="mt-1 text-xs text-slate-400">Upcoming scheduled appointments</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 shrink-0">
                  {upcomingAppointments.length} scheduled
                </span>
              </div>

              {loading ? (
                <div className="mt-4 divide-y divide-slate-100">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="py-3 first:pt-0 space-y-2 animate-pulse">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-slate-200 shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3.5 w-1/3 rounded bg-slate-200" />
                          <div className="h-2.5 w-1/2 rounded bg-slate-100" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pl-10.5">
                        <div className="h-3 w-36 rounded bg-slate-100" />
                        <div className="h-4 w-14 rounded-full bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="mt-8 py-8 text-center text-xs text-slate-400">
                  No upcoming scheduled appointments.
                </div>
              ) : (
                <div className="mt-4 divide-y divide-slate-100">
                  {upcomingAppointments.map((a) => (
                    <div
                      key={a.id}
                      className="py-3 first:pt-0 min-w-0"
                    >
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="flex min-w-0 items-center gap-2.5 flex-1">
                          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                            {a.title
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs sm:text-sm font-medium">{a.title}</p>
                            <p className="truncate text-[11px] text-slate-400">
                              {a.description || 'No description'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => openEditModal(a)}
                          aria-label="Edit appointment"
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition shrink-0"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pl-10.5 text-[11px]">
                        <p className="font-semibold text-slate-600 truncate">
                          {formatDDMMYYYY(a.date)} · {formatTime(a.start_time)} – {formatTime(a.end_time)}
                        </p>
                        <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
                          {a.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Week at a glance */}
            <div className="min-w-0 w-full overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3.5 sm:p-5">
              <p className="text-sm font-semibold">Your week at a glance</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {loading ? (
                  <span className="inline-block h-3.5 w-48 rounded bg-emerald-200/60 animate-pulse mt-0.5" />
                ) : scheduledCount > 0 ? (
                  `You have ${scheduledCount} scheduled appointment${scheduledCount > 1 ? 's' : ''} in total.`
                ) : (
                  'No scheduled appointments in the current calendar.'
                )}
              </p>
              <div className="mt-5 flex h-24 items-end gap-1.5">
                {loading
                  ? [35, 60, 25, 75, 45, 20, 40].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-md bg-emerald-200/50 animate-pulse"
                        style={{ height: `${h}%` }}
                      />
                    ))
                  : weekDayCounts.map((count, i) => {
                      const heightPercent =
                        count === 0 ? 8 : Math.round((count / maxWeekDayCount) * 100)
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-t-md transition-all ${
                            count > 0 ? 'bg-emerald-700' : 'bg-emerald-200/60'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      )
                    })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                <span>Mon</span>
                <span>Sun</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Appointment Modal: Add / Edit */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3 sm:p-4 backdrop-blur-[2px] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="appointment-modal-title"
        >
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl my-auto">
            <div className="flex items-start justify-between">
              <div>
                <h2 id="appointment-modal-title" className="text-base sm:text-lg font-semibold tracking-[-0.02em]">
                  {modalMode === 'add' ? 'New appointment' : 'Edit appointment'}
                </h2>
                <p className="mt-0.5 sm:mt-1 text-xs text-slate-400">
                  {modalMode === 'add'
                    ? 'Enter appointment details and schedule.'
                    : 'Modify appointment details and check time slot availability.'}
                </p>
              </div>
              <button
                aria-label="Close dialog"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-3 sm:mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveAppointment} className="mt-4 sm:mt-6 flex flex-col gap-3.5 sm:gap-4">
              {/* Title (Required) */}
              <label className="text-xs sm:text-sm font-medium">
                Title <span className="text-rose-500">*</span>
                <input
                  autoFocus
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Product Design Sprint"
                  className="mt-1.5 sm:mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 sm:py-2.5 text-xs sm:text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
              </label>

              {/* Description (Optional) */}
              <label className="text-xs sm:text-sm font-medium">
                Description
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="e.g. Review sprint components with team"
                  className="mt-1.5 sm:mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
              </label>

              {/* Date (Required) */}
              <label className="text-xs sm:text-sm font-medium">
                Date <span className="text-rose-500">*</span>
                <div className="mt-1.5 sm:mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 sm:py-2.5 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/10">
                  <input
                    ref={formDateRef}
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-800 outline-none cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        formDateRef.current?.showPicker()
                      } catch {
                        formDateRef.current?.focus()
                      }
                    }}
                    aria-label="Open date picker calendar"
                    className="text-slate-400 hover:text-emerald-700 p-0.5 shrink-0 ml-1 transition cursor-pointer"
                  >
                    <Calendar size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 mt-1">
                  <span>Format: <strong className="font-semibold text-slate-700">DD/MM/YYYY</strong></span>
                  {formDate && (
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Selected: {formatDDMMYYYY(formDate)}
                    </span>
                  )}
                </div>
              </label>

              {/* Start Time and End Time (Required) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <label className="text-xs sm:text-sm font-medium">
                  Start Time <span className="text-rose-500">*</span>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="mt-1.5 sm:mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 block">
                    {formatTime(formStartTime)}
                  </span>
                </label>
                <label className="text-xs sm:text-sm font-medium">
                  End Time <span className="text-rose-500">*</span>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="mt-1.5 sm:mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1 block">
                    {formatTime(formEndTime)}
                  </span>
                </label>
              </div>

              {/* Status (Only in edit / pencil mode) */}
              {modalMode === 'edit' && (
                <div>
                  <label className="text-xs sm:text-sm font-medium block">
                    Status
                  </label>
                  <div className="relative mt-1.5 sm:mt-2">
                    <button
                      type="button"
                      onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 cursor-pointer hover:border-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        {formStatus === 'Scheduled' && (
                          <>
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            <span className="font-semibold text-blue-700">Scheduled</span>
                          </>
                        )}
                        {formStatus === 'Completed' && (
                          <>
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="font-semibold text-emerald-700">Completed</span>
                          </>
                        )}
                        {formStatus === 'Cancelled' && (
                          <>
                            <span className="h-2 w-2 rounded-full bg-slate-400" />
                            <span className="font-semibold text-slate-600">Cancelled</span>
                          </>
                        )}
                      </div>
                      <ChevronDown
                        size={15}
                        className={`text-slate-400 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {statusDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-30 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => {
                            setFormStatus('Scheduled')
                            setStatusDropdownOpen(false)
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition cursor-pointer ${
                            formStatus === 'Scheduled'
                              ? 'bg-blue-50 text-blue-800 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                          <span>Scheduled</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFormStatus('Completed')
                            setStatusDropdownOpen(false)
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition cursor-pointer ${
                            formStatus === 'Completed'
                              ? 'bg-emerald-50 text-emerald-800 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span>Completed</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFormStatus('Cancelled')
                            setStatusDropdownOpen(false)
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition cursor-pointer ${
                            formStatus === 'Cancelled'
                              ? 'bg-slate-100 text-slate-800 font-semibold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="h-2 w-2 rounded-full bg-slate-400" />
                          <span>Cancelled</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Time Validation & Conflict Prevention Hint */}
              <div className="rounded-xl bg-slate-50 p-2 sm:p-2.5 text-[10px] sm:text-[11px] text-slate-500">
                <p>• End time must be after start time.</p>
                <p>• Time slots cannot overlap on the same date.</p>
              </div>

              <div className="mt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formTitle.trim()}
                  className="rounded-xl bg-emerald-700 px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <RefreshCw size={14} className="animate-spin" />}
                  {submitting ? 'Saving...' : modalMode === 'add' ? 'Create appointment' : 'Update appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="mt-10 flex flex-col gap-1.5">
      <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        Workspace
      </p>
      {[
        ['Overview', LayoutDashboard],
        ['Calendar', CalendarDays],
        ['Clients', Users],
      ].map(([label, Icon], i) => (
        <button
          key={label as string}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
            i === 1
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          }`}
        >
          <Icon size={17} />
          {label as string}
        </button>
      ))}
      <p className="mb-2 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
        Manage
      </p>
      {[
        ['Team', Users],
        ['Settings', Settings],
      ].map(([label, Icon]) => (
        <button
          key={label as string}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
        >
          <Icon size={17} />
          {label as string}
        </button>
      ))}
    </nav>
  )
}
