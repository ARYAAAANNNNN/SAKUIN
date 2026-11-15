import { useState } from 'react'
import { PiggyBank, ArrowRightLeft, Plus, Loader2, Coins } from 'lucide-react'
import { formatRupiah } from '../lib/formatters'

export const PiggyBankActions = ({
  wallet,
  onSaveRemainingPocket,
  onAddManualSavings,
  isSavingPocket,
  isAddingManual,
}) => {
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualAmount, setManualAmount] = useState('')
  const [manualJudul, setManualJudul] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const sisaSaku = Number(wallet?.sisa_saku) || 0

  const handleSavePocket = async () => {
    if (sisaSaku <= 0) return
    await onSaveRemainingPocket()
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    const num = Number(manualAmount)
    if (!num || num <= 0) {
      setErrorMsg('Masukkan nominal celengan yang valid.')
      return
    }

    const finalJudul = manualJudul.trim() || 'Tabungan Celengan Manual'
    const ok = await onAddManualSavings({
      nominal: num,
      judul: finalJudul,
    })

    if (ok) {
      setManualAmount('')
      setManualJudul('')
      setShowManualForm(false)
    }
  }

  return (
    <div className="brutal-card bg-white dark:bg-zinc-900 p-4 mb-4 border-2 border-zinc-800 dark:border-zinc-700 shadow-[3px_3px_0px_0px_#27272a]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
          <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Kelola Celengan</span>
        </h3>
        <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
          Tabungan
        </span>
      </div>

      <div className="space-y-2.5">
        {/* Action 1: Tabung Sisa Saku */}
        <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-300 dark:border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>Tabung Sisa Uang Saku</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-200 rounded">
                {formatRupiah(sisaSaku)}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Pindahkan sisa uang saku hari ini langsung ke celengan agar tidak habis jajan.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSavePocket}
            disabled={isSavingPocket || sisaSaku <= 0}
            className="brutal-btn bg-[#a7f3d0] hover:bg-[#86efac] dark:bg-emerald-400 dark:hover:bg-emerald-500 text-zinc-950 text-xs py-2 px-3 rounded-lg font-bold shrink-0 disabled:opacity-50 flex items-center justify-center gap-1.5 border-2 border-zinc-800 dark:border-zinc-700 shadow-[2px_2px_0px_0px_#27272a] cursor-pointer"
          >
            {isSavingPocket ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowRightLeft className="w-3.5 h-3.5" />
            )}
            <span>Tabung Sekarang</span>
          </button>
        </div>

        {/* Action 2: Tambah Celengan Manual Toggle / Card */}
        {!showManualForm ? (
          <button
            type="button"
            onClick={() => setShowManualForm(true)}
            className="w-full brutal-btn bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border-2 border-dashed border-zinc-900 dark:border-zinc-700 cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span>+ Masukkan Recehan Manual ke Celengan</span>
          </button>
        ) : (
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/80 rounded-xl border-2 border-zinc-900 dark:border-zinc-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Catat Tambahan Celengan Manual
              </span>
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-bold underline cursor-pointer"
              >
                Batal
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-2.5">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300">
                    Nominal Uang Receh / Celengan (Rp)
                  </label>
                  {manualAmount && Number(manualAmount) > 0 && (
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                      {formatRupiah(manualAmount)}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Contoh: 2000, 5000, 10000"
                  value={manualAmount}
                  onChange={(e) => {
                    setManualAmount(e.target.value)
                    setErrorMsg('')
                  }}
                  className="w-full brutal-input bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-600 px-3 py-2 rounded-lg text-xs font-bold placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />

                {/* Quick Chips for change */}
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5">
                  <span className="text-[10px] text-zinc-500 font-bold shrink-0">Koin/Uang:</span>
                  {[1000, 2000, 5000, 10000, 20000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        const cur = Number(manualAmount) || 0
                        setManualAmount(String(cur + amt))
                        setErrorMsg('')
                      }}
                      className="brutal-badge bg-white dark:bg-zinc-800 hover:bg-emerald-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-900 dark:border-zinc-700 text-[10px] px-2 py-0.5 rounded-md cursor-pointer active:scale-95 transition"
                    >
                      +{amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  Judul / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Uang kembalian belanja ibu"
                  value={manualJudul}
                  onChange={(e) => setManualJudul(e.target.value)}
                  className="w-full brutal-input bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-600 px-3 py-1.5 rounded-lg text-xs font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>

              {errorMsg && (
                <div className="text-[11px] text-rose-700 dark:text-rose-300 font-bold bg-rose-100 dark:bg-rose-950/80 p-2 rounded border border-rose-300 dark:border-rose-800">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="flex-1 brutal-btn bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs py-2 rounded-lg font-bold border-2 border-zinc-900 dark:border-zinc-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAddingManual || !manualAmount || Number(manualAmount) <= 0}
                  className="flex-1 brutal-btn bg-emerald-300 hover:bg-emerald-400 dark:bg-emerald-400 dark:hover:bg-emerald-500 text-zinc-950 text-xs py-2 rounded-lg font-black flex items-center justify-center gap-1.5 border-2 border-zinc-900 dark:border-zinc-700 disabled:opacity-50 cursor-pointer"
                >
                  {isAddingManual ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan ke Celengan</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
