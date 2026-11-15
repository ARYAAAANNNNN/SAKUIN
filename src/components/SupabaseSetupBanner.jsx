import { useState } from 'react'
import { AlertTriangle, Copy, Check, X, Database } from 'lucide-react'

export const SupabaseSetupBanner = () => {
  const [copied, setCopied] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const copyEnvSample = () => {
    const text = `VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Compact Top Bar */}
      <div className="mb-3.5 p-2 px-3 bg-amber-200 dark:bg-amber-950/70 border-2 border-zinc-900 dark:border-amber-600 rounded-xl shadow-[2px_2px_0px_0px_#18181b] dark:shadow-[2px_2px_0px_0px_#27272a] flex items-center justify-between gap-2 text-zinc-900 dark:text-amber-200 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
          <span className="font-extrabold text-[11px] truncate">
            Supabase belum terhubung ke .env
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-[10px] font-black uppercase px-2.5 py-1 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-900 dark:border-zinc-600 rounded-lg shadow-[1px_1px_0px_0px_#18181b] dark:shadow-[1px_1px_0px_0px_#27272a] hover:bg-zinc-50 dark:hover:bg-zinc-700 active:translate-y-0.5 shrink-0 transition"
        >
          Panduan Setup
        </button>
      </div>

      {/* Setup Guide Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="brutal-card bg-white dark:bg-zinc-900 max-w-sm w-full p-4 sm:p-5 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-900 dark:border-zinc-700 mb-3">
              <div className="flex items-center gap-2 font-display font-black text-sm uppercase">
                <Database className="w-4 h-4 text-amber-500" />
                <span>Setup Supabase (3 Menit)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-800 dark:text-zinc-200">
              <div className="bg-amber-50 dark:bg-zinc-800/80 border border-zinc-900 dark:border-zinc-700 p-2.5 rounded-lg space-y-1">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">1. Skema Database &amp; RLS</span>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                  Jalankan query dari file <code className="font-mono bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">supabase_schema.sql</code> di menu <b>SQL Editor</b> Supabase Anda.
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-zinc-800/80 border border-zinc-900 dark:border-zinc-700 p-2.5 rounded-lg space-y-1">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">2. Aktifkan Auth Provider</span>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                  Buka <b>Authentication &gt; Providers</b>, aktifkan Email (dan Google jika ingin login dengan Google).
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-zinc-800/80 border border-zinc-900 dark:border-zinc-700 p-2.5 rounded-lg space-y-2">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">3. Isi File .env</span>
                <div className="relative">
                  <pre className="bg-zinc-900 text-amber-300 p-2.5 rounded-lg font-mono text-[10px] overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`}
                  </pre>
                  <button
                    type="button"
                    onClick={copyEnvSample}
                    className="absolute top-1.5 right-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-zinc-700"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="mt-4 w-full brutal-btn bg-amber-300 hover:bg-amber-400 text-zinc-950 py-2 rounded-xl text-xs font-black"
            >
              Mengerti &amp; Tutup
            </button>
          </div>
        </div>
      )}
    </>
  )
}
