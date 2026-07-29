import { useState, useEffect } from 'react'
import GlassCard from '../../components/ui/GlassCard'
import PrimaryButton from '../../components/ui/PrimaryButton'
import Modal from '../../components/ui/Modal'
import InputField from '../../components/ui/InputField'
import EmptyState from '../../components/ui/EmptyState'
import {
  IconCheck,
  IconEdit,
  IconPlus,
  IconShield,
  IconTrash,
} from '../../components/ui/icons'
import { toFa } from '../../lib/utils'
import { api } from '../../lib/api'
import { doctors } from '../../data/apiData'
import type { Specialty } from '../../types'

export default function ManageSpecialties() {
  const [list, setList] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🩺')

  useEffect(() => {
    loadSpecialties()
  }, [])

  async function loadSpecialties() {
    try {
      setLoading(true)
      const data = await api.get<Specialty[]>('/admin/specialties/')
      setList(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setEditId(null)
    setName('')
    setIcon('🩺')
    setOpen(true)
  }
  const openEdit = (s: Specialty) => {
    setEditId(s.id)
    setName(s.name)
    setIcon(s.icon)
    setOpen(true)
  }
  const save = async () => {
    if (!name.trim()) return
    try {
      if (editId) {
        await api.patch(`/admin/specialties/${editId}/`, { name, icon, description: '' })
      } else {
        await api.post('/admin/specialties/', { name, icon, description: '' })
      }
      await loadSpecialties()
      setOpen(false)
    } catch (err) {
      console.error(err)
    }
  }
  const remove = async (id: string) => {
    try {
      await api.delete(`/admin/specialties/${id}/`)
      await loadSpecialties()
    } catch (err) {
      console.error(err)
    }
  }

  const countFor = (id: string) => doctors.filter((d) => d.specialtyId === id).length

  return (
    <div className="space-y-5">
      <GlassCard className="flex items-center justify-between p-4">
        <div>
          <h2 className="font-bold text-ink-800">تخصص‌های پزشکی</h2>
          <p className="text-xs text-ink-400">مدیریت حوزه‌های تخصصی سامانه</p>
        </div>
        <PrimaryButton icon={<IconPlus />} onClick={openAdd}>
          افزودن تخصص
        </PrimaryButton>
      </GlassCard>

      {loading ? (
        <EmptyState
          icon={<IconShield />}
          title="در حال بارگذاری..."
          description="لطفاً صبر کنید"
        />
      ) : list.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <GlassCard key={s.id} hover className="flex items-center gap-4 p-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-50 text-2xl">
                {s.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink-800">{s.name}</p>
                <p className="text-xs text-ink-400">{toFa(countFor(s.id))} پزشک</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  title="ویرایش"
                  onClick={() => openEdit(s)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                >
                  <IconEdit className="h-4 w-4" />
                </button>
                <button
                  title="حذف"
                  onClick={() => remove(s.id)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-red-500 transition hover:bg-red-50"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<IconShield />}
          title="تخصصی ثبت نشده"
          description="برای شروع یک تخصص جدید اضافه کنید."
          action={<PrimaryButton icon={<IconPlus />} onClick={openAdd}>افزودن</PrimaryButton>}
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? 'ویرایش تخصص' : 'افزودن تخصص'}
        footer={
          <>
            <PrimaryButton icon={<IconCheck />} onClick={save}>
              ذخیره
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setOpen(false)}>
              انصراف
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <InputField
            label="نام تخصص"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً قلب و عروق"
          />
          <InputField
            label="آیکون (اموجی)"
            name="icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🩺"
          />
          <div className="rounded-xl bg-primary-50/60 p-3 text-xs text-primary-700">
            پیش‌نمایش:{' '}
            <span className="font-semibold">
              {icon} {name || '…'}
            </span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
