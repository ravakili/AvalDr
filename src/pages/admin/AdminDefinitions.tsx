import { useState } from 'react'
import GlassCard from '../../components/ui/GlassCard'
import PrimaryButton from '../../components/ui/PrimaryButton'
import Modal from '../../components/ui/Modal'
import InputField, { TextArea } from '../../components/ui/InputField'
import EmptyState from '../../components/ui/EmptyState'
import {
  IconCheck,
  IconEdit,
  IconPlus,
  IconShield,
  IconTrash,
} from '../../components/ui/icons'
import { toFa } from '../../lib/utils'

type Tab = 'specialties' | 'diagnoses' | 'allergies' | 'drugs' | 'cities' | 'tips'

interface NamedItem {
  id: string
  name: string
}

const tabs: { key: Tab; label: string }[] = [
  { key: 'specialties', label: 'تخصص‌ها' },
  { key: 'diagnoses', label: 'تشخیص‌ها' },
  { key: 'allergies', label: 'آلرژی‌ها' },
  { key: 'drugs', label: 'داروها' },
  { key: 'cities', label: 'شهرها' },
  { key: 'tips', label: 'نکات روزانه سلامت' },
]

export default function AdminDefinitions() {
  const [tab, setTab] = useState<Tab>('specialties')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🩺')
  const [tipTitle, setTipTitle] = useState('')
  const [tipText, setTipText] = useState('')
  const [tipIcon, setTipIcon] = useState('💡')

  // Data per tab
  const [specialties, setSpecialties] = useState(
    JSON.parse(sessionStorage.getItem('def-specialties') || 'null') || [
      { id: 'sp-cardio', name: 'قلب و عروق', icon: '🫀' },
      { id: 'sp-derma', name: 'پوست و مو', icon: '🧴' },
      { id: 'sp-neuro', name: 'مغز و اعصاب', icon: '🧠' },
      { id: 'sp-ortho', name: 'ارتوپدی', icon: '🦴' },
      { id: 'sp-ped', name: 'اطفال', icon: '🧸' },
      { id: 'sp-ent', name: 'گوش و حلق و بینی', icon: '👂' },
      { id: 'sp-eye', name: 'چشم پزشکی', icon: '👁️' },
      { id: 'sp-psy', name: 'روان پزشکی', icon: '🧘' },
      { id: 'sp-dental', name: 'دندان پزشکی', icon: '🦷' },
      { id: 'sp-gp', name: 'پزشک عمومی', icon: '🩺' },
    ],
  )
  const [diagnoses, setDiagnoses] = useState(getPersisted<NamedItem[]>('def-diagnoses', [
    { id: 'dx-1', name: 'فشار خون بالا' },
    { id: 'dx-2', name: 'دیابت نوع ۲' },
    { id: 'dx-3', name: 'چربی خون' },
    { id: 'dx-4', name: 'میگرن مزمن' },
    { id: 'dx-5', name: 'کم‌خونی' },
    { id: 'dx-6', name: 'آسم' },
  ]))
  const [allergies, setAllergies] = useState(getPersisted<NamedItem[]>('def-allergies', [
    { id: 'al-1', name: 'پنی‌سیلین' },
    { id: 'al-2', name: 'سولفونامید' },
    { id: 'al-3', name: 'گلوتن' },
    { id: 'al-4', name: 'گرده گل' },
    { id: 'al-5', name: 'آسپرین' },
  ]))
  const [drugs, setDrugs] = useState(getPersisted<NamedItem[]>('def-drugs', [
    { id: 'dr-1', name: 'آتورواستاتین ۲۰ میلی‌گرم' },
    { id: 'dr-2', name: 'متفورمین ۵۰۰ میلی‌گرم' },
    { id: 'dr-3', name: 'لوزارتان ۵۰ میلی‌گرم' },
    { id: 'dr-4', name: 'آسپرین ۸۰ میلی‌گرم' },
    { id: 'dr-5', name: 'امپرازول ۲۰ میلی‌گرم' },
    { id: 'dr-6', name: 'سوماتریپتان ۵۰ میلی‌گرم' },
    { id: 'dr-7', name: 'فلوکستین ۲۰ میلی‌گرم' },
    { id: 'dr-8', name: 'لوراتادین ۱۰ میلی‌گرم' },
  ]))
  const [cities, setCities] = useState(getPersisted<NamedItem[]>('def-cities', [
    { id: 'ct-1', name: 'تهران' },
    { id: 'ct-2', name: 'اصفهان' },
    { id: 'ct-3', name: 'شیراز' },
    { id: 'ct-4', name: 'مشهد' },
    { id: 'ct-5', name: 'تبریز' },
    { id: 'ct-6', name: 'اهواز' },
    { id: 'ct-7', name: 'کرج' },
    { id: 'ct-8', name: 'قم' },
  ]))
  const [tips, setTips] = useState(getPersisted<any[]>('def-tips', [
    { id: 'tp-1', title: 'آب بنوشید', text: 'روزانه ۸ لیوان آب بنوشید تا بدنی سالم داشته باشید', icon: '💧' },
    { id: 'tp-2', title: 'پیاده‌روی', text: '۳۰ دقیقه پیاده‌روی روزانه به سلامت قلب کمک می‌کند', icon: '🚶' },
    { id: 'tp-3', title: 'تغذیه سالم', text: 'مصرف نمک را کاهش دهید و میوه و سبزیجات تازه مصرف کنید', icon: '🥗' },
    { id: 'tp-4', title: 'خواب کافی', text: '۷ تا ۸ ساعت خواب مفید برای بازسازی بدن ضروری است', icon: '😴' },
  ]))

  function getPersisted<T>(key: string, fallback: T): T {
    try {
      const raw = sessionStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  }

  function persist(key: string, data: unknown) {
    sessionStorage.setItem(key, JSON.stringify(data))
  }

  const currentItems = () => {
    switch (tab) {
      case 'specialties': return specialties
      case 'diagnoses': return diagnoses
      case 'allergies': return allergies
      case 'drugs': return drugs
      case 'cities': return cities
      case 'tips': return tips
    }
  }

  const setItems = (items: any[]) => {
    const key = `def-${tab}`
    switch (tab) {
      case 'specialties':
        setSpecialties(items)
        persist('def-specialties', items)
        break
      case 'diagnoses':
        setDiagnoses(items)
        persist(key, items)
        break
      case 'allergies':
        setAllergies(items)
        persist(key, items)
        break
      case 'drugs':
        setDrugs(items)
        persist(key, items)
        break
      case 'cities':
        setCities(items)
        persist(key, items)
        break
      case 'tips':
        setTips(items)
        persist(key, items)
        break
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

  const save = () => {
    if (tab === 'specialties' && !name.trim()) return
    if (tab !== 'tips' && tab !== 'specialties' && !name.trim()) return
    if (tab === 'tips' && !tipTitle.trim()) return

    const items = [...currentItems()]

    if (editId) {
      setItems(items.map((item: any) => {
        if (tab === 'specialties' && item.id === editId) return { ...item, name: name.trim(), icon }
        if (tab === 'tips' && item.id === editId) return { ...item, title: tipTitle.trim(), text: tipText.trim(), icon: tipIcon }
        if (item.id === editId) return { ...item, name: name.trim() }
        return item
      }))
    } else {
      const newItem: any = { id: `${tab.slice(0, 3)}-${Date.now()}` }
      if (tab === 'specialties') {
        newItem.name = name.trim()
        newItem.icon = icon
      } else if (tab === 'tips') {
        newItem.title = tipTitle.trim()
        newItem.text = tipText.trim()
        newItem.icon = tipIcon
      } else {
        newItem.name = name.trim()
      }
      setItems([...items, newItem])
    }
    setOpen(false)
  }

  const remove = (id: string) => setItems(currentItems().filter((i: any) => i.id !== id))

  const label = () => {
    switch (tab) {
      case 'specialties': return { single: 'تخصص', plural: 'تخصص‌ها' }
      case 'diagnoses': return { single: 'تشخیص', plural: 'تشخیص‌ها' }
      case 'allergies': return { single: 'آلرژی', plural: 'آلرژی‌ها' }
      case 'drugs': return { single: 'دارو', plural: 'داروها' }
      case 'cities': return { single: 'شهر', plural: 'شهرها' }
      case 'tips': return { single: 'نکته', plural: 'نکات سلامت' }
    }
  }

  const l = label()

  return (
    <div className="space-y-5">
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                tab === t.key
                  ? 'bg-primary-500 text-white shadow-glass-sm'
                  : 'bg-white/40 text-ink-500 hover:bg-white/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="flex items-center justify-between p-4">
        <div>
          <h2 className="font-bold text-ink-800">{l.plural}</h2>
          <p className="text-xs text-ink-400">مدیریت {l.plural} سامانه</p>
        </div>
        <PrimaryButton icon={<IconPlus />} onClick={openAdd}>
          افزودن {l.single}
        </PrimaryButton>
      </GlassCard>

      {currentItems().length ? (
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
              placeholder={`مثلاً ${tab === 'diagnoses' ? 'فشار خون' : tab === 'allergies' ? 'پنی‌سیلین' : tab === 'drugs' ? 'آسپرین' : 'تهران'}`}
            />
          )}
        </div>
      </Modal>
    </div>
  )
}
