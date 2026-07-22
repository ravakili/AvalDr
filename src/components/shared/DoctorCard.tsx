import { useNavigate } from 'react-router-dom'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'
import GlassCard from '../ui/GlassCard'
import PrimaryButton from '../ui/PrimaryButton'
import { IconPin, IconStar } from '../ui/icons'
import { formatToman, toFa } from '../../lib/utils'
import { getSpecialty } from '../../data/mockData'
import type { Doctor } from '../../types'

export default function DoctorCard({ doctor }: { doctor: Doctor }) {
  const navigate = useNavigate()
  const specialty = getSpecialty(doctor.specialtyId)

  return (
    <GlassCard hover className="flex flex-col p-5">
      <div className="flex items-start gap-4">
        <Avatar src={doctor.avatar} size="lg" ring />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-bold text-ink-800">{doctor.name}</h3>
            <Badge tone="amber">
              <IconStar className="h-3 w-3" /> {toFa(doctor.rating.toFixed(1))}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-primary-600">
            {specialty?.icon} {specialty?.name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
            <span className="inline-flex items-center gap-1">
              <IconPin className="h-3.5 w-3.5" /> {doctor.city}
            </span>
            <span className="text-ink-300">•</span>
            <span>{toFa(doctor.experienceYears)} سال تجربه</span>
            <span className="text-ink-300">•</span>
            <span>{toFa(doctor.reviewsCount)} نظر</span>
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-xs leading-6 text-ink-500">{doctor.bio}</p>

      <div className="mt-4 flex items-center justify-between border-t border-white/50 pt-4">
        <div>
          <p className="text-[11px] text-ink-400">ویزیت</p>
          <p className="text-sm font-bold text-ink-800 tabular">{formatToman(doctor.fee)}</p>
        </div>
        <PrimaryButton size="sm" onClick={() => navigate(`/user/book/${doctor.id}`)}>
          دریافت نوبت
        </PrimaryButton>
      </div>
    </GlassCard>
  )
}
