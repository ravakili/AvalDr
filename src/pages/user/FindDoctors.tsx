import { useMemo, useState } from 'react'
import DoctorCard from '../../components/shared/DoctorCard'
import InputField, { SelectField } from '../../components/ui/InputField'
import GlassCard from '../../components/ui/GlassCard'
import EmptyState from '../../components/ui/EmptyState'
import { IconSearch, IconStethoscope } from '../../components/ui/icons'
import { doctors, specialties } from '../../data/mockData'
import { toFa } from '../../lib/utils'

const cities = Array.from(new Set(doctors.map((d) => d.city)))

export default function FindDoctors() {
  const [q, setQ] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [city, setCity] = useState('')

  const filtered = useMemo(() => {
    return doctors
      .filter((d) => d.status === 'approved')
      .filter((d) => (specialty ? d.specialtyId === specialty : true))
      .filter((d) => (city ? d.city === city : true))
      .filter((d) => (q ? d.name.includes(q) || d.bio.includes(q) : true))
  }, [q, specialty, city])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <GlassCard className="p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InputField
            label="جستجوی پزشک"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="نام یا کلیدواژه…"
            icon={<IconSearch />}
          />
          <SelectField
            label="تخصص"
            name="specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          >
            <option value="">همه تخصص‌ها</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="شهر"
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            <option value="">همه شهرها</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-ink-400">
          <span>
            {toFa(filtered.length)} پزشک یافت شد
          </span>
          {(q || specialty || city) && (
            <button
              className="font-medium text-primary-600 hover:underline"
              onClick={() => {
                setQ('')
                setSpecialty('')
                setCity('')
              }}
            >
              پاک کردن فیلترها
            </button>
          )}
        </div>
      </GlassCard>

      {/* Results */}
      {filtered.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <DoctorCard key={d.id} doctor={d} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<IconStethoscope />}
          title="پزشکی با این مشخصات یافت نشد"
          description="فیلترها را تغییر دهید یا عبارت دیگری را جستجو کنید."
        />
      )}
    </div>
  )
}
