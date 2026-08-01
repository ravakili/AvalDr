import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'
import GlassCard from '../../components/ui/GlassCard'
import PrimaryButton from '../../components/ui/PrimaryButton'
import { api } from '../../lib/api'
import { refreshBackendData } from '../../data/apiData'
import { useUserStore } from '../../store/userStore'
import { toast } from '../../store/toastStore'

type CallbackState = 'loading' | 'success' | 'failed'

export default function PaymentCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const fetchAppointments = useUserStore((state) => state.fetchAppointments)
  const requested = useRef(false)
  const [state, setState] = useState<CallbackState>('loading')
  const [message, setMessage] = useState('در حال تأیید تراکنش با زرین‌پال...')

  useEffect(() => {
    if (requested.current) return
    requested.current = true
    const paymentId = searchParams.get('payment')
    const authority = searchParams.get('Authority') || ''
    const status = searchParams.get('Status') || ''
    if (!paymentId) {
      setState('failed')
      setMessage('شناسه پرداخت در آدرس بازگشت وجود ندارد.')
      return
    }
    api.post(`/payments/${paymentId}/verify/`, { authority, status })
      .then(async () => {
        await Promise.all([fetchAppointments(), refreshBackendData('user')])
        setState('success')
        setMessage('پرداخت تأیید شد و نوبت شما ثبت نهایی شد.')
        toast.success('پرداخت موفق', 'نوبت شما با موفقیت تأیید شد.')
      })
      .catch((error) => {
        setState('failed')
        setMessage(error instanceof Error ? error.message : 'تأیید پرداخت انجام نشد.')
        toast.error('پرداخت ناموفق', 'تراکنش تأیید نشد؛ می‌توانید دوباره تلاش کنید.')
      })
  }, [fetchAppointments, searchParams])

  const Icon = state === 'loading' ? LoaderCircle : state === 'success' ? CheckCircle2 : XCircle

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <GlassCard className="w-full max-w-md p-7 text-center">
        <Icon className={`mx-auto h-14 w-14 ${state === 'loading' ? 'animate-spin text-primary-500' : state === 'success' ? 'text-emerald-600' : 'text-red-500'}`} />
        <h1 className="mt-4 text-lg font-bold text-ink-800">
          {state === 'loading' ? 'تأیید پرداخت' : state === 'success' ? 'پرداخت موفق' : 'پرداخت ناموفق'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-500">{message}</p>
        {state !== 'loading' && (
          <PrimaryButton className="mt-6 w-full" onClick={() => navigate('/user/appointments', { replace: true })}>
            مشاهده نوبت‌های من
          </PrimaryButton>
        )}
      </GlassCard>
    </div>
  )
}
