import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      onClose()
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null

  const { type = 'success', message, title } = toast

  const styleConfig = {
    success: {
      bg: 'bg-emerald-300 dark:bg-emerald-400',
      icon: <CheckCircle2 className="w-5 h-5 text-zinc-950 shrink-0" />,
    },
    error: {
      bg: 'bg-rose-300 dark:bg-rose-400',
      icon: <AlertCircle className="w-5 h-5 text-zinc-950 shrink-0" />,
    },
    info: {
      bg: 'bg-sky-300 dark:bg-sky-400',
      icon: <Info className="w-5 h-5 text-zinc-950 shrink-0" />,
    },
  }[type] || {
    bg: 'bg-amber-300 dark:bg-amber-400',
    icon: <Info className="w-5 h-5 text-zinc-950 shrink-0" />,
  }

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none transition-all duration-200">
      <div
        className={`pointer-events-auto max-w-sm w-full ${styleConfig.bg} border-2 border-zinc-900 shadow-[4px_4px_0px_0px_#18181b] rounded-xl p-3.5 flex items-start gap-3 text-zinc-950`}
      >
        {styleConfig.icon}
        <div className="flex-1 text-sm">
          {title && <div className="font-extrabold text-xs uppercase tracking-wider mb-0.5">{title}</div>}
          <div className="font-semibold text-xs leading-relaxed">{message}</div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/10 rounded-md transition-colors text-zinc-950 cursor-pointer"
          aria-label="Tutup notifikasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
