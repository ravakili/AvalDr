import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../../components/ui/GlassCard'
import Avatar from '../../components/ui/Avatar'
import PrimaryButton from '../../components/ui/PrimaryButton'
import EmptyState from '../../components/ui/EmptyState'
import { IconChat, IconChevron } from '../../components/ui/icons'
import { appointments, getDoctor, getPatient } from '../../data/apiData'
import { useAuthStore } from '../../store/authStore'
import { relativeDay, shortDateFa, toFa, formatDateFa } from '../../lib/utils'
import { StatusBadge } from '../../components/ui/Badge'

export default function ChatInbox() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const role = user?.role || 'user'
  const ME = user?.id || ''
  const ME_REF = user?.refId || ''

  const myAppointments = useMemo(
    () => appointments
      .filter((a) => {
        if (role === 'doctor') return a.doctorId === ME_REF
        if (role === 'admin') return true
        return a.patientId === (user?.refId || ME)
      })
      .filter((a) => a.status !== 'cancelled' && a.status !== 'pending-payment')
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
    [role, ME, ME_REF],
  )

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-100 text-primary-600">
            <IconChat className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink-800">مکالمات</h2>
            <p className="text-xs text-ink-400">
              {myAppointments.length} گفتگو
            </p>
          </div>
        </div>
      </GlassCard>

      {myAppointments.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {myAppointments.map((a) => {
            const isDoctor = role === 'doctor'
            const counterpart = isDoctor ? getPatient(a.patientId) : getDoctor(a.doctorId)
            const target = `${a.date}T${a.time}:00`
            return (
              <GlassCard
                key={a.id}
                hover
                className="flex items-center gap-4 p-4 cursor-pointer transition"
                onClick={() => navigate(`/${role}/consult/${a.id}`)}
              >
                <Avatar
                  src={counterpart?.avatar}
                  size="md"
                  ring
                  alt={counterpart?.name || ''}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-ink-800">
                      {counterpart?.name || 'کاربر'}
                    </p>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-500">{a.reason}</p>
                  <p className="mt-0.5 text-[11px] text-ink-400">
                    {relativeDay(a.date) || formatDateFa(a.date)} • {toFa(a.time)}
                  </p>
                </div>
                <IconChevron className="h-5 w-5 shrink-0 text-ink-300" />
              </GlassCard>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<IconChat />}
          title="مکالمه‌ای وجود ندارد"
          description="پس از دریافت نوبت، گفتگوها اینجا نمایش داده می‌شوند."
        />
      )}
    </div>
  )
}
