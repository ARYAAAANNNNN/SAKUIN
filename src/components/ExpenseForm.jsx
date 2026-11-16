import { useState } from 'react'
import { Plus, Banknote, Loader2, AlertCircle, Wallet, PiggyBank, QrCode } from 'lucide-react'
import { formatRupiah } from '../lib/formatters'

const CATEGORIES = [
  { id: 'Jajan', label: 'Jajan / Makan', icon: '🍟', dbCat: 'Jajan', placeholder: 'Contoh: Bakso & Es Teh Manis' },
  { id: 'Ongkos', label: 'Ongkos / Bensin', icon: '🚌', dbCat: 'Ongkos', placeholder: 'Contoh: Angkot pulang sekolah / bensin' },
  { id: 'Sekolah', label: 'Sekolah & ATK', icon: '✏️', dbCat: 'Lainnya', prefix: '[Sekolah]', placeholder: 'Contoh: Fotokopi tugas Biologi & buku tulis' },
  { id: 'Kas', label: 'Kas / Iuran', icon: '🗓️', dbCat: 'Kas', prefix: '[Kas]', placeholder: 'Contoh: Uang kas kelas / iuran kebersihan' },
  { id: 'Hiburan', label: 'Hiburan / Kuota', icon: '🎮', dbCat: 'Lainnya', prefix: '[Hiburan]', placeholder: 'Contoh: Beli kuota internet / mabar' },
  { id: 'Belanja', label: 'Beli Kebutuhan', icon: '🛍️', dbCat: 'Lainnya', prefix: '[Belanja]', placeholder: 'Contoh: Beli perlengkapan / barang impian' },
  { id: 'Lainnya', label: 'Lain-lain', icon: '📦', dbCat: 'Lainnya', placeholder: 'Contoh: Kebutuhan tak terduga' },
]

const QUICK_AMOUNTS = [2000, 5000, 10000, 15000, 20000, 50000]

export const ExpenseForm = ({
  onAddExpense,
  sisaSaku = 0,
  totalCelengan = 0,
  isSubmitting,
}) => {
  const [sumberDana, setSumberDana] = useState('saku') // 'saku' | 'celengan'
  const [kategori, setKategori] = useState('Jajan')
  const [metodeBayar, setMetodeBayar] = useState('tunai') // 'tunai' | 'qris'
  const [nominal, setNominal] = useState('')
  const [judul, setJudul] = useState('')
  const [validationError, setValidationError] = useState('')

  const activeCategoryObj = CATEGORIES.find((c) => c.id === kategori) || CATEGORIES[0]

  const maxAvailable = sumberDana === 'saku' ? sisaSaku : totalCelengan

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

    if (parsedNominal > maxAvailable) {
      setValidationError(
        sumberDana === 'saku'
          ? `Uang saku tidak mencukupi! Sisa saku Anda hanya ${formatRupiah(sisaSaku)}.`
          : `Isi celengan tidak mencukupi! Tabungan Anda hanya ${formatRupiah(totalCelengan)}.`
      )
      return
    }

    const defaultJudul = {
      Jajan: 'Jajan kantin / makanan',
      Ongkos: 'Ongkos perjalanan / bensin',
      Sekolah: 'Keperluan sekolah / ATK',
      Kas: 'Iuran kas kelas',
      Hiburan: 'Hiburan / kuota internet',
      Belanja: 'Beli barang kebutuhan',
      Lainnya: 'Pengeluaran harian',
    }

    let finalJudul = judul.trim() || defaultJudul[kategori] || 'Pengeluaran'
    if (activeCategoryObj.prefix && !finalJudul.includes(activeCategoryObj.prefix)) {
      finalJudul = `${activeCategoryObj.prefix} ${finalJudul}`
    }
    if (metodeBayar === 'qris') {
      finalJudul = `${finalJudul} (QRIS)`
    }
    if (sumberDana === 'celengan') {
      finalJudul = `[Ambil Celengan] ${finalJudul}`
    }

    const success = await onAddExpense({
      nominal: parsedNominal,
      kategori: sumberDana === 'celengan' ? 'Celengan' : activeCategoryObj.dbCat,
      judul: finalJudul,
      sumberDana,
      metodeBayar,
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
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          sumberDana === 'saku'
            ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-700'
            : 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700'
        }`}>
          {sumberDana === 'saku' ? 'Potong Uang Saku' : 'Ambil dari Celengan'}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Pilihan Sumber Dana (Saku vs Celengan) */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
            Sumber Dana Pembayaran
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSumberDana('saku')
                setValidationError('')
              }}
              className={`p-2 rounded-xl border-2 text-left transition cursor-pointer flex items-center justify-between ${
                sumberDana === 'saku'
                  ? 'bg-amber-200 dark:bg-amber-400/30 border-zinc-900 dark:border-amber-500 shadow-[1.5px_1.5px_0px_0px_#18181b]'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 opacity-80'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Wallet className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                <div className="truncate">
                  <div className="text-[11px] font-black text-zinc-900 dark:text-zinc-100">Uang Saku</div>
                  <div className="text-[10px] text-zinc-600 dark:text-zinc-400">{formatRupiah(sisaSaku)}</div>
                </div>
              </div>
              <div className={`w-3.5 h-3.5 rounded-full border border-zinc-900 flex items-center justify-center shrink-0 ${sumberDana === 'saku' ? 'bg-amber-500' : 'bg-white'}`}>
                {sumberDana === 'saku' && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSumberDana('celengan')
                setValidationError('')
              }}
              className={`p-2 rounded-xl border-2 text-left transition cursor-pointer flex items-center justify-between ${
                sumberDana === 'celengan'
                  ? 'bg-emerald-200 dark:bg-emerald-400/30 border-zinc-900 dark:border-emerald-500 shadow-[1.5px_1.5px_0px_0px_#18181b]'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 opacity-80'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <PiggyBank className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <div className="truncate">
                  <div className="text-[11px] font-black text-zinc-900 dark:text-zinc-100">Tabungan</div>
                  <div className="text-[10px] text-zinc-600 dark:text-zinc-400">{formatRupiah(totalCelengan)}</div>
                </div>
              </div>
              <div className={`w-3.5 h-3.5 rounded-full border border-zinc-900 flex items-center justify-center shrink-0 ${sumberDana === 'celengan' ? 'bg-emerald-500' : 'bg-white'}`}>
                {sumberDana === 'celengan' && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
              </div>
            </button>
          </div>
        </div>

        {/* Category Selector */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            Pilih Kategori
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
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
                  <span className="text-base leading-none">{cat.icon}</span>
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

        {/* Metode Pembayaran (Tunai vs QRIS) */}
        <div>
          <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
            Metode Bayar
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setMetodeBayar('tunai')}
              className={`p-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                metodeBayar === 'tunai'
                  ? 'bg-amber-200 dark:bg-amber-400 text-zinc-950 border-zinc-900 dark:border-amber-400 shadow-[1px_1px_0px_0px_#18181b]'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <span>💵 Tunai (Cash)</span>
            </button>
            <button
              type="button"
              onClick={() => setMetodeBayar('qris')}
              className={`p-1.5 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                metodeBayar === 'qris'
                  ? 'bg-amber-200 dark:bg-amber-400 text-zinc-950 border-zinc-900 dark:border-amber-400 shadow-[1px_1px_0px_0px_#18181b]'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-zinc-900" />
              <span>QRIS / E-Wallet</span>
            </button>
          </div>
        </div>

        {/* Judul Input */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            Keterangan (Opsional)
          </label>
          <input
            type="text"
            placeholder={activeCategoryObj.placeholder}
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
