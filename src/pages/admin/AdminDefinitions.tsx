import { useState, useEffect } from 'react'
import GlassCard from '../../components/ui/GlassCard'
import PrimaryButton from '../../components/ui/PrimaryButton'
import Modal from '../../components/ui/Modal'
import InputField, { TextArea } from '../../components/ui/InputField'
import Tabs from '../../components/ui/Tabs'
import EmptyState from '../../components/ui/EmptyState'
import {
  IconCheck,
  IconEdit,
  IconPlus,
  IconShield,
  IconTrash,
} from '../../components/ui/icons'
import { api } from '../../lib/api'
import type { Specialty, HealthTip } from '../../types'
import { toast } from '../../store/toastStore'

type Tab = 'specialties' | 'diagnoses' | 'allergies' | 'drugs' | 'cities' | 'insurance_type' | 'supplementary_insurance' | 'prefix' | 'tips'

interface NamedItem {
  id: string
  name: string
}

const typeMap: Record<string, string> = {
  diagnoses: 'diagnosis',
  allergies: 'allergy',
  drugs: 'drug',
  cities: 'city',
  insurance_type: 'insurance_type',
  supplementary_insurance: 'supplementary_insurance',
  prefix: 'prefix',
}

const tabs: { key: Tab; label: string }[] = [
  { key: 'specialties', label: 'تخصص‌ها' },
  { key: 'diagnoses', label: 'تشخیص‌ها' },
  { key: 'allergies', label: 'آلرژی‌ها' },
  { key: 'drugs', label: 'داروها' },
  { key: 'cities', label: 'شهرها' },
  { key: 'insurance_type', label: 'نوع بیمه درمانی' },
  { key: 'supplementary_insurance', label: 'بیمه تکمیلی' },
  { key: 'prefix', label: 'پیشوند' },
  { key: 'tips', label: 'نکات' },
]

function extractResults<T>(response: T | { results: T }): T {
  if (response && typeof response === 'object' && 'results' in response) {
    return (response as { results: T }).results
  }
  return response as T
}

export default function AdminDefinitions() {
  const [tab, setTab] = useState<Tab>('specialties')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🩺')
  const [tipTitle, setTipTitle] = useState('')
  const [tipText, setTipText] = useState('')
  const [tipIcon, setTipIcon] = useState('💡')

  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [diagnoses, setDiagnoses] = useState<NamedItem[]>([])
  const [allergies, setAllergies] = useState<NamedItem[]>([])
  const [drugs, setDrugs] = useState<NamedItem[]>([])
  const [cities, setCities] = useState<NamedItem[]>([])
  const [insuranceTypes, setInsuranceTypes] = useState<NamedItem[]>([])
  const [supplementaryInsurances, setSupplementaryInsurances] = useState<NamedItem[]>([])
  const [prefixes, setPrefixes] = useState<NamedItem[]>([])
  const [tips, setTips] = useState<HealthTip[]>([])

  useEffect(() => {
    loadTabData()
  }, [tab])

  async function loadTabData() {
    try {
      setLoading(true)
      if (tab === 'specialties') {
        const data = await api.get<Specialty[]>('/admin/specialties/')
        setSpecialties(extractResults(data))
      } else if (tab === 'tips') {
        const data = await api.get<HealthTip[]>('/admin/health-tips/')
        setTips(extractResults(data))
      } else {
        const data = await api.get<NamedItem[]>(`/admin/definitions/?type=${typeMap[tab] || tab}`)
        const items = extractResults(data)
        switch (tab) {
          case 'diagnoses': setDiagnoses(items); break
          case 'allergies': setAllergies(items); break
          case 'drugs': setDrugs(items); break
          case 'cities': setCities(items); break
          case 'insurance_type': setInsuranceTypes(items); break
          case 'supplementary_insurance': setSupplementaryInsurances(items); break
          case 'prefix': setPrefixes(items); break
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const currentItems = () => {
    switch (tab) {
      case 'specialties': return specialties
      case 'diagnoses': return diagnoses
      case 'allergies': return allergies
      case 'drugs': return drugs
      case 'cities': return cities
      case 'insurance_type': return insuranceTypes
      case 'supplementary_insurance': return supplementaryInsurances
      case 'prefix': return prefixes
      case 'tips': return tips
    }
  }

  const itemName = (item: any) => {
    if (tab === 'specialties') return `${item.icon} ${item.name}`
    if (tab === 'tips') return `${item.icon} ${item.title}`
    return item.name
  }

  const openAdd = () => {
    setEditId(null)
    setName('')
    setIcon('🩺')
    setTipTitle('')
    setTipText('')
    setTipIcon('💡')
    setOpen(true)
  }

  const openEdit = (item: any) => {
    setEditId(item.id)
    if (tab === 'specialties') {
      setName(item.name)
      setIcon(item.icon)
    } else if (tab === 'tips') {
      setTipTitle(item.title || '')
      setTipText(item.text || '')
      setTipIcon(item.icon || '💡')
      setName('')
    } else {
      setName(item.name)
    }
    setOpen(true)
  }

  const save = async () => {
    if (tab === 'specialties') {
      if (!name.trim()) return
      try {
        if (editId) {
          await api.patch(`/admin/specialties/${editId}/`, { name, icon, description: '' })
        } else {
          await api.post('/admin/specialties/', { name, icon, description: '' })
        }
        await loadTabData()
        setOpen(false)
        toast.success(editId ? 'تخصص ویرایش شد' : 'تخصص افزوده شد')
      } catch (err) {
        toast.error('ذخیره تخصص انجام نشد', err instanceof Error ? err.message : undefined)
      }
    } else if (tab === 'tips') {
      if (!tipTitle.trim()) return
      try {
        if (editId) {
          await api.patch(`/admin/health-tips/${editId}/`, { title: tipTitle.trim(), text: tipText.trim(), icon: tipIcon })
        } else {
          await api.post('/admin/health-tips/', { title: tipTitle.trim(), text: tipText.trim(), icon: tipIcon })
        }
        await loadTabData()
        setOpen(false)
        toast.success(editId ? 'نکته سلامت ویرایش شد' : 'نکته سلامت افزوده شد')
      } catch (err) {
        toast.error('ذخیره نکته سلامت انجام نشد', err instanceof Error ? err.message : undefined)
      }
    } else {
      if (!name.trim()) return
      try {
        if (editId) {
          await api.patch(`/admin/definitions/${editId}/`, { name: name.trim() })
        } else {
          await api.post('/admin/definitions/', { type: typeMap[tab] || tab, name: name.trim() })
        }
        await loadTabData()
        setOpen(false)
        toast.success(editId ? `${label().single} ویرایش شد` : `${label().single} افزوده شد`)
      } catch (err) {
        toast.error(`ذخیره ${label().single} انجام نشد`, err instanceof Error ? err.message : undefined)
      }
    }
  }

  const remove = async (id: string) => {
    try {
      if (tab === 'specialties') {
        await api.delete(`/admin/specialties/${id}/`)
      } else if (tab === 'tips') {
        await api.delete(`/admin/health-tips/${id}/`)
      } else {
        await api.delete(`/admin/definitions/${id}/`)
      }
      await loadTabData()
      toast.success(`${label().single} حذف شد`)
    } catch (err) {
      toast.error(`حذف ${label().single} انجام نشد`, err instanceof Error ? err.message : undefined)
    }
  }

  const label = () => {
    switch (tab) {
      case 'specialties': return { single: 'تخصص', plural: 'تخصص‌ها' }
      case 'diagnoses': return { single: 'تشخیص', plural: 'تشخیص‌ها' }
      case 'allergies': return { single: 'آلرژی', plural: 'آلرژی‌ها' }
      case 'drugs': return { single: 'دارو', plural: 'داروها' }
      case 'cities': return { single: 'شهر', plural: 'شهرها' }
      case 'insurance_type': return { single: 'نوع بیمه', plural: 'انواع بیمه درمانی' }
      case 'supplementary_insurance': return { single: 'بیمه تکمیلی', plural: 'بیمه‌های تکمیلی' }
      case 'prefix': return { single: 'پیشوند', plural: 'پیشوندها' }
      case 'tips': return { single: 'نکته', plural: 'نکات سلامت' }
    }
  }

  const l = label()

  return (
    <div className="space-y-5">
      <Tabs tabs={tabs} active={tab} onChange={(k) => setTab(k as Tab)} />

      <GlassCard className="flex items-center justify-between p-4">
        <div>
          <h2 className="font-bold text-ink-800">{l.plural}</h2>
          <p className="text-xs text-ink-400">مدیریت {l.plural} سامانه</p>
        </div>
        <PrimaryButton icon={<IconPlus />} onClick={openAdd}>
          افزودن {l.single}
        </PrimaryButton>
      </GlassCard>

      {loading ? (
        <EmptyState
          icon={<IconShield />}
          title="در حال بارگذاری..."
          description="لطفاً صبر کنید"
        />
      ) : currentItems().length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {currentItems().map((item: any) => (
            <GlassCard key={item.id} hover className="flex items-start gap-4 p-4">
              {tab === 'specialties' && (
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-50 text-2xl">
                  {item.icon}
                </div>
              )}
              {tab === 'tips' && (
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-2xl">
                  {item.icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className={`truncate font-semibold text-ink-800 ${tab === 'tips' ? 'text-base' : ''}`}>
                  {itemName(item)}
                </p>
                {tab === 'tips' && item.text && (
                  <p className="mt-1 text-xs leading-5 text-ink-500 line-clamp-2">{item.text}</p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  title="ویرایش"
                  onClick={() => openEdit(item)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
                >
                  <IconEdit className="h-4 w-4" />
                </button>
                <button
                  title="حذف"
                  onClick={() => remove(item.id)}
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
          title={`${l.plural} ثبت نشده`}
          description={`برای شروع یک ${l.single} جدید اضافه کنید.`}
          action={<PrimaryButton icon={<IconPlus />} onClick={openAdd}>افزودن</PrimaryButton>}
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? `ویرایش ${l.single}` : `افزودن ${l.single}`}
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
          {tab === 'specialties' ? (
            <>
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
                پیش‌نمایش: <span className="font-semibold">{icon} {name || '…'}</span>
              </div>
            </>
          ) : tab === 'tips' ? (
            <>
              <InputField
                label="عنوان"
                name="tipTitle"
                value={tipTitle}
                onChange={(e) => setTipTitle(e.target.value)}
                placeholder="مثلاً آب بنوشید"
              />
              <TextArea
                label="متن"
                name="tipText"
                value={tipText}
                onChange={(e) => setTipText(e.target.value)}
                placeholder="مثلاً روزانه ۸ لیوان آب بنوشید تا بدنی سالم داشته باشید"
                rows={3}
              />
              <InputField
                label="آیکون (اموجی)"
                name="tipIcon"
                value={tipIcon}
                onChange={(e) => setTipIcon(e.target.value)}
                placeholder="💡"
              />
              <div className="rounded-xl bg-amber-50/60 p-3 text-xs text-amber-700">
                پیش‌نمایش: <span className="font-semibold">{tipIcon} {tipTitle || '…'}</span>
              </div>
            </>
          ) : (
            <InputField
              label={`نام ${l.single}`}
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`مثلاً ${
                tab === 'diagnoses' ? 'فشار خون' :
                tab === 'allergies' ? 'پنی‌سیلین' :
                tab === 'drugs' ? 'آسپرین' :
                tab === 'insurance_type' ? 'تامین اجتماعی' :
                tab === 'supplementary_insurance' ? 'مهراد' :
                tab === 'prefix' ? 'دکتر' :
                'تهران'
              }`}
            />
          )}
        </div>
      </Modal>
    </div>
  )
}
