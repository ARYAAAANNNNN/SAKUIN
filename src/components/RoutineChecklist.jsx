import { Coins, Sparkles, Loader2, CheckCircle2, Check, X } from 'lucide-react'

export const RoutineChecklist = ({
  wallet,
  onPayKasSenin,
  onToggleBawaBekal,
  isLoadingKas,
  isLoadingBekal,
}) => {
  const isKasLunas = Boolean(wallet?.kas_senin_lunas)
  const isBawaBekal = Boolean(wallet?.bawa_bekal_hari_ini)
  const sisaSaku = Number(wallet?.sisa_saku) || 0

  return (
    <div className="brutal-card bg-white dark:bg-zinc-900 p-4 mb-4 border-2 border-zinc-800 dark:border-zinc-700 shadow-[3px_3px_0px_0px_#27272a]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
          <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Checklist Rutin Sekolah</span>
        </h3>
        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
          Wajib &amp; Hemat
        </span>
      </div>

      <div className="space-y-2.5">
        {/* Item 1: Kas Senin */}
        <div className={`p-3 rounded-xl border transition-all ${
          isKasLunas
            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/50'
            : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-lg border-2 border-zinc-800 dark:border-zinc-700 flex items-center justify-center shrink-0 font-bold ${
                isKasLunas
                  ? 'bg-emerald-300 dark:bg-emerald-400 text-zinc-950'
                  : 'bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200'
              }`}>
                {isKasLunas ? <CheckCircle2 className="w-4 h-4" /> : '🗓️'}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>Kas Senin</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 rounded">
                    Rp5.000
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {isKasLunas
                    ? 'Sudah lunas! Bebas dari tagihan kas kelas 😎'
                    : 'Jangan sampai nunggak kas kelas minggu ini!'}
                </div>
              </div>
            </div>

            {/* Action */}
            {isKasLunas ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 rounded-lg shrink-0">
                Lunas ✨
              </span>
            ) : (
              <button
                type="button"
                onClick={onPayKasSenin}
                disabled={isLoadingKas || sisaSaku < 5000}
                className="brutal-btn bg-[#fde68a] hover:bg-[#fcd34d] dark:bg-amber-400 dark:hover:bg-amber-500 text-zinc-950 text-[11px] py-1.5 px-3 rounded-lg font-bold shrink-0 disabled:opacity-50 border-2 border-zinc-800 dark:border-zinc-700 cursor-pointer shadow-[2px_2px_0px_0px_#27272a]"
                title={sisaSaku < 5000 ? 'Sisa uang saku tidak cukup' : 'Bayar Kas Senin'}
              >
                {isLoadingKas ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Bayar Rp5k'
                )}
              </button>
            )}
          </div>
          {sisaSaku < 5000 && !isKasLunas && (
            <div className="mt-2 text-[10px] text-rose-700 dark:text-rose-300 font-medium bg-rose-100/80 dark:bg-rose-950/60 p-1.5 rounded border border-rose-200 dark:border-rose-900/50">
              ⚠️ Sisa saku tidak cukup untuk bayar kas (min. Rp5.000).
            </div>
          )}
        </div>

        {/* Item 2: Bawa Bekal Hari Ini */}
        <div className={`p-3 rounded-xl border transition-all ${
          isBawaBekal
            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
            : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/60'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 border-2 border-zinc-800 dark:border-zinc-700 flex items-center justify-center shrink-0 font-bold text-zinc-950">
                🍱
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  Hari Ini Bawa Bekal?
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {isBawaBekal ? 'Bekal siap di tas!' : 'Bawa dari rumah bikin hemat'}
                </div>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              type="button"
              onClick={onToggleBawaBekal}
              disabled={isLoadingBekal}
              className={`brutal-btn py-1.5 px-3 rounded-lg text-xs font-bold shrink-0 transition-all border-2 border-zinc-800 dark:border-zinc-700 cursor-pointer shadow-[2px_2px_0px_0px_#27272a] ${
                isBawaBekal
                  ? 'bg-[#a7f3d0] text-zinc-950'
                  : 'bg-white dark:bg-zinc-800 hover:bg-zinc-50 text-zinc-700 dark:text-zinc-200'
              }`}
            >
              {isLoadingBekal ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isBawaBekal ? (
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  Bawa
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                  Tidak
                </span>
              )}
            </button>
          </div>

          {/* Motivational Badge when Bawa Bekal is Active */}
          {isBawaBekal && (
            <div className="mt-2.5 p-2.5 bg-amber-100/70 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-lg text-xs text-zinc-800 dark:text-amber-200 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <b>Hebat!</b> Membawa bekal menghemat uang jajan kamu. Nanti sore sisa saku bisa dipindah ke celengan! 🐷
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
