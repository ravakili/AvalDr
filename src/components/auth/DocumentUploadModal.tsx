import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import GlassCard from '../ui/GlassCard'
import { useAuthStore } from '../../store/authStore'
import { cn, toFa } from '../../lib/utils'
import type { UploadingFile } from '../../types'
import { toast } from '../../store/toastStore'

interface Props {
  open: boolean
  onClose: (confirmed?: boolean) => void
}

interface DocField {
  key: string
  label: string
  required: boolean
  accept: string
  maxSize: number
  icon: string
}

const docFields: DocField[] = [
  { key: 'license', label: 'مدرک پزشکی/پروانه اشتغال', required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, icon: '📋' },
  { key: 'nationalId', label: 'کارت ملی/شناسنامه', required: true, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, icon: '🪪' },
  { key: 'experience', label: 'مدارک سابقه کار', required: false, accept: '.pdf', maxSize: 10, icon: '📄' },
  { key: 'specialty', label: 'مدرک تخصص', required: false, accept: '.pdf,.jpg,.jpeg,.png', maxSize: 5, icon: '🎓' },
  { key: 'profilePhoto', label: 'عکس پروفایل', required: false, accept: '.jpg,.jpeg,.png', maxSize: 2, icon: '📸' },
]

function simulateUpload(file: UploadingFile, onProgress: (p: number) => void, onDone: () => void) {
  let p = 0
  const interval = setInterval(() => {
    p += Math.random() * 15 + 5
    if (p >= 100) {
      p = 100
      clearInterval(interval)
      onProgress(100)
      setTimeout(onDone, 300)
    } else {
      onProgress(Math.round(p))
    }
  }, 250)
  return () => clearInterval(interval)
}

export default function DocumentUploadModal({ open, onClose }: Props) {
  const { uploadedDocs, addUploadedDoc, updateUploadProgress, setIsDoctor } = useAuthStore()
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [confirmClose, setConfirmClose] = useState(false)
  const cancelFns = useRef<Record<string, () => void>>({})

  const hasUploading = Object.values(uploading).some(Boolean)
  const docsForField = (key: string) => uploadedDocs[key] || []

  const requiredUploaded = docFields
    .filter((f) => f.required)
    .every((f) => docsForField(f.key).some((ff) => ff.status === 'uploaded'))

  const handleFile = (field: DocField, file: File) => {
    if (file.size > field.maxSize * 1024 * 1024) {
      toast.warning('حجم فایل بیش از حد مجاز است', `حداکثر حجم این فایل ${toFa(field.maxSize)} مگابایت است.`)
      return
    }
    const item: UploadingFile = {
      id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      size: file.size,
      type: file.name.split('.').pop() || '',
      status: 'pending',
      progress: 0,
    }
    addUploadedDoc(field.key, item)
    setUploading((prev) => ({ ...prev, [item.id]: true }))

    cancelFns.current[item.id] = simulateUpload(
      item,
      (p) => updateUploadProgress(field.key, item.id, p),
      () => {
        updateUploadProgress(field.key, item.id, 100)
        useAuthStore.setState({
          uploadedDocs: {
            ...useAuthStore.getState().uploadedDocs,
            [field.key]: (useAuthStore.getState().uploadedDocs[field.key] || []).map((f) =>
              f.id === item.id ? { ...f, status: 'uploaded' as const, progress: 100 } : f,
            ),
          },
        })
        setUploading((prev) => ({ ...prev, [item.id]: false }))
      },
    )
  }

  const removeFile = (key: string, fileId: string) => {
    cancelFns.current[fileId]?.()
    delete cancelFns.current[fileId]
    const files = useAuthStore.getState().uploadedDocs[key] || []
    useAuthStore.setState({
      uploadedDocs: { ...useAuthStore.getState().uploadedDocs, [key]: files.filter((f) => f.id !== fileId) },
    })
  }

  const handleClose = () => {
    if (hasUploading) {
      setConfirmClose(true)
      return
    }
    onClose(false)
  }

  const handleDone = () => {
    setIsDoctor(true)
    onClose(true)
  }

  const handleSkip = () => {
    setIsDoctor(false)
    onClose(false)
  }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in" onClick={handleClose} />

      <GlassCard variant="default" className="relative z-10 w-full max-w-lg animate-pop-in max-h-[85vh] overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-ink-800">بارگذاری مدارک پزشکی</h3>
            <p className="text-xs text-ink-400">لطفاً مدارک معتبر خود را بارگذاری کنید</p>
          </div>
          <button
            onClick={handleClose}
            className="grid h-8 w-8 place-items-center rounded-full text-ink-400 transition hover:bg-white/50 hover:text-ink-700"
            aria-label="بستن"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {docFields.map((field) => {
            const files = docsForField(field.key)
            return (
              <div key={field.key} className="glass-soft rounded-2xl p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{field.icon}</span>
                    <span className="text-sm font-medium text-ink-700">{field.label}</span>
                    {field.required ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">ضروری</span>
                    ) : (
                      <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] text-ink-400">اختیاری</span>
                    )}
                  </div>
                  {files.length > 0 && (
                    <span className="text-xs text-primary-600">{toFa(files.length)}</span>
                  )}
                </div>

                {/* Drop zone */}
                <FileDropZone
                  accept={field.accept}
                  maxSize={field.maxSize}
                  onFile={(f) => handleFile(field, f)}
                  disabled={hasUploading}
                />

                {/* Files */}
                {files.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {files.map((f) => (
                      <div
                        key={f.id}
                        className={cn(
                          'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
                          f.status === 'uploaded' ? 'bg-green-50/80' : f.status === 'error' ? 'bg-red-50/80' : 'bg-white/60',
                        )}
                      >
                        <span className="shrink-0 text-ink-400">📎</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-ink-700">{f.name}</p>
                          <div className="flex items-center gap-2">
                            {f.status === 'uploading' ? (
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary-100">
                                <div
                                  className="h-full rounded-full bg-primary-500 transition-all duration-200"
                                  style={{ width: `${f.progress}%` }}
                                />
                              </div>
                            ) : f.status === 'uploaded' ? (
                              <span className="text-[10px] text-green-600">✅ بارگذاری شد</span>
                            ) : f.status === 'error' ? (
                              <span className="text-[10px] text-red-500">❌ خطا در بارگذاری</span>
                            ) : (
                              <span className="text-[10px] text-ink-400">{toFa(Math.ceil(f.size / 1024))} KB</span>
                            )}
                            {f.status === 'uploading' && (
                              <span className="tabular text-[10px] text-primary-600">{toFa(f.progress)}%</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(field.key, f.id)}
                          className="shrink-0 text-ink-400 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={handleDone}
            disabled={!requiredUploaded}
            className={cn(
              'w-full rounded-2xl py-3 text-sm font-bold text-white shadow-glass-sm transition-all duration-200',
              requiredUploaded
                ? 'bg-primary-500 hover:bg-primary-600 active:scale-[.98]'
                : 'bg-ink-300 cursor-not-allowed',
            )}
          >
            بارگذاری مدارک
          </button>
          <button
            onClick={handleSkip}
            className="text-sm text-ink-400 transition hover:text-ink-600"
          >
            بعداً بارگذاری می‌کنم
          </button>
          <button
            onClick={handleClose}
            className="text-sm text-ink-400 transition hover:text-ink-600"
          >
            انصراف
          </button>
        </div>
      </GlassCard>

      {/* Confirm close dialog */}
      {confirmClose && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" />
          <GlassCard variant="default" className="relative z-10 w-full max-w-xs animate-pop-in p-6 text-center">
            <p className="mb-4 text-sm text-ink-700">آیا در حین بارگذاری مدارک هستید. می‌خواهید خارج شوید؟</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => { setConfirmClose(false); onClose(false) }}
                className="rounded-xl bg-red-500/90 px-5 py-2 text-sm font-medium text-white"
              >
                بله، خارج شو
              </button>
              <button
                onClick={() => setConfirmClose(false)}
                className="rounded-xl bg-white/60 px-5 py-2 text-sm font-medium text-ink-600"
              >
                ادامه بارگذاری
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>,
    document.body,
  )
}

function FileDropZone({
  accept,
  maxSize,
  onFile,
  disabled,
}: {
  accept: string
  maxSize: number
  onFile: (f: File) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        if (disabled) return
        Array.from(e.dataTransfer.files).forEach(onFile)
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition',
        dragOver ? 'border-primary-400 bg-primary-50/60' : 'border-white/50 bg-white/30 hover:bg-white/50',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span className="text-lg text-ink-400">📤</span>
      <p className="mt-1 text-xs text-ink-500">فایل را بکشید یا کلیک کنید</p>
      <p className="text-[10px] text-ink-400">حداکثر {toFa(maxSize)} MB</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          Array.from(e.target.files || []).forEach(onFile)
          e.target.value = ''
        }}
      />
    </div>
  )
}
