import { useState } from 'react'
import { Plus, Banknote, Loader2, AlertCircle } from 'lucide-react'
import { formatRupiah } from '../lib/formatters'

const CATEGORIES = [
  { id: 'Jajan', label: 'Jajan', icon: '🍟' },
  { id: 'Ongkos', label: 'Ongkos (Angkot/Ojek)', icon: '🚌' },
  { id: 'Lainnya', label: 'Lainnya (Fotokopi/ATK)', icon: '✏️' },
]

const QUICK_AMOUNTS = [2000, 5000, 10000, 15000, 20000]

export const ExpenseForm = ({ onAddExpense, sisaSaku, isSubmitting }) => {
  const [kategori, setKategori] = useState('Jajan')
  const [nominal, setNominal] = useState('')
  const [judul, setJudul] = useState('')
  const [validationError, setValidationError] = useState('')

  const handleQuickAdd = (amt) => {
    const current = Number(nominal) || 0
    setNominal(String(current + amt))
    setValidationError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidationError('')

    const parsedNominal = Number(nominal)
    if (!parsedNominal || parsedNominal <= 0) {
      setValidationError('Masukkan nominal pengeluaran yang valid.')
      return
    }

    if (parsedNominal > sisaSaku) {
      setValidationError(
        `Uang saku tidak mencukupi! Sisa saku Anda hanya ${formatRupiah(sisaSaku)}.`
      )
      return
    }

    const defaultJudul = {
      Jajan: 'Jajan kantin / makanan',
      Ongkos: 'Ongkos angkot / ojek pulang-pergi',
      Lainnya: 'Fotokopi materi / alat tulis',
    }

    const finalJudul = judul.trim() || defaultJudul[kategori] || 'Pengeluaran harian'

    const success = await onAddExpense({
      nominal: parsedNominal,
      kategori,
      judul: finalJudul,
    })

    if (success) {
      setNominal('')
      setJudul('')
    }
  }

  return (
    <div className="brutal-card bg-white dark:bg-zinc-900 p-4 mb-4 border-2 border-zinc-800 dark:border-zinc-700 shadow-[3px_3px_0px_0px_#27272a]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
          <Banknote className="w-4 h-4 text-rose-500" />
          <span>Catat Pengeluaran</span>
        </h3>
        <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">
          Potong Saku
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Category Selector */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Pilih Kategori
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {CATEGORIES.map((cat) => {
              const isSelected = kategori === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setKategori(cat.id)}
                  className={`p-2 rounded-xl text-center border-2 transition-all text-xs font-bold flex flex-col items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-[#fde68a] dark:bg-amber-400 text-zinc-950 border-zinc-800 dark:border-zinc-700 shadow-[2px_2px_0px_0px_#27272a] translate-x-[-1px] translate-y-[-1px]'
                      : 'bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 text-zinc-800 dark:text-zinc-200 border-zinc-800 dark:border-zinc-700 opacity-90'
                  }`}
                >
                  <span className="text-lg leading-none">{cat.icon}</span>
                  <span className="truncate w-full text-[10px] font-bold">{cat.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Nominal Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Nominal (Rp)
            </label>
            {nominal && Number(nominal) > 0 && (
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                {formatRupiah(nominal)}
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-zinc-400">
              Rp
            </div>
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={nominal}
              onChange={(e) => {
                setNominal(e.target.value)
                setValidationError('')
              }}
              className="w-full brutal-input bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-800 dark:border-zinc-600 pl-9 pr-3 py-2 rounded-xl text-sm font-bold placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-medium text-zinc-400 shrink-0">Cepat:</span>
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAdd(amt)}
                className="brutal-badge bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-800 dark:border-zinc-700 text-[10px] px-2 py-0.5 rounded-md shrink-0 active:scale-95 transition cursor-pointer"
              >
                +{amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
          </div>
        </div>

        {/* Judul Input */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Keterangan (Opsional)
          </label>
          <input
            type="text"
            placeholder={
              kategori === 'Jajan'
                ? 'Contoh: Cilok & Es Teh Jumbo'
                : kategori === 'Ongkos'
                ? 'Contoh: Angkot pulang sekolah'
                : 'Contoh: Fotokopi tugas Biologi'
            }
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            className="w-full brutal-input bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-800 dark:border-zinc-600 px-3 py-2 rounded-xl text-xs font-medium placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>

        {/* Error notification */}
        {validationError && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-900 dark:text-rose-200 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !nominal || Number(nominal) <= 0}
          className="w-full brutal-btn bg-[#fcd34d] hover:bg-[#fbbf24] dark:bg-amber-400 dark:hover:bg-amber-500 text-zinc-950 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border-2 border-zinc-800 dark:border-zinc-700 shadow-[3px_3px_0px_0px_#27272a] disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
          ) : (
            <Plus className="w-4 h-4 text-zinc-950 stroke-[3]" />
          )}
          <span>Simpan Pengeluaran</span>
        </button>
      </form>
    </div>
  )
}
