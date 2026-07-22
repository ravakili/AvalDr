import { useRef, useState } from 'react'
import { cn, shortDateFa, toFa } from '../../lib/utils'
import { IconFile, IconUpload } from './icons'

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
}

interface Props {
  accept?: string
  onUpload?: (file: UploadedFile) => void
}

export default function FileUpload({ accept = '.pdf,.jpg,.png,.doc', onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragOver, setDragOver] = useState(false)

  const add = (file: File) => {
    const item: UploadedFile = {
      id: `f-${Date.now()}`,
      name: file.name,
      type: file.name.split('.').pop() || 'file',
      size: file.size,
    }
    setFiles((arr) => [item, ...arr])
    onUpload?.(item)
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          Array.from(e.dataTransfer.files).forEach(add)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition',
          dragOver
            ? 'border-primary-400 bg-primary-50/60'
            : 'border-white/60 bg-white/40 hover:bg-white/60',
        )}
      >
        <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl bg-primary-100 text-primary-600">
          <IconUpload />
        </div>
        <p className="text-sm font-medium text-ink-700">
          فایل را اینجا بکشید یا کلیک کنید
        </p>
        <p className="mt-0.5 text-xs text-ink-400">PDF, JPG, PNG, DOC — حداکثر ۱۰MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => {
            Array.from(e.target.files || []).forEach(add)
            e.target.value = ''
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-xl border border-white/50 bg-white/40 px-3 py-2"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600">
                <IconFile />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-700">{f.name}</p>
                <p className="text-[11px] text-ink-400 tabular">
                  {shortDateFa(new Date().toISOString())} • {toFa(Math.ceil(f.size / 1024))} KB
                </p>
              </div>
              <button
                onClick={() => setFiles((arr) => arr.filter((x) => x.id !== f.id))}
                className="text-ink-400 hover:text-red-500"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
