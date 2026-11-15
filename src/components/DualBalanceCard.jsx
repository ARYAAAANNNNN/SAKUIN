import { useState } from 'react'
import {
  Wallet,
  PiggyBank,
  ArrowDownRight,
  PlusCircle,
  Loader2,
  RotateCcw,
  AlertTriangle,
  Target,
  Banknote,
  Scale,
} from 'lucide-react'
import { formatRupiah } from '../lib/formatters'

const QUICK_ADD_OPTIONS = [10000, 20000, 50000, 100000]
const QUICK_TARGET_OPTIONS = [50000, 100000, 250000, 500000, 1000000]

export const DualBalanceCard = ({
  wallet,
  todayExpense,
  targetGoal,
  onAddAllowance,
  onResetBalance,
  onUpdateTarget,
  isLoadingAction,
}) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showTargetModal, setShowTargetModal] = useState(false)

  // Tambah Uang Saku Form state
  const [nominal, setNominal] = useState('')
  const [alokasi, setAlokasi] = useState('saku_only') // 'saku_only' | 'split_50_50'
  const [keterangan, setKeterangan] = useState('')
  const [resetKas, setResetKas] = useState(false)
  const [formError, setFormError] = useState('')

  // Target Tabungan Form state
  const [targetNameInput, setTargetNameInput] = useState(targetGoal?.name || 'Beli Barang Impian')
  const [targetAmountInput, setTargetAmountInput] = useState(String(targetGoal?.amount || 100000))
  const [targetError, setTargetError] = useState('')

  const sisaSaku = Number(wallet?.sisa_saku) || 0
  const totalCelengan = Number(wallet?.total_celengan) || 0

  // Target metrics calculation
  const targetName = targetGoal?.name || 'Beli Barang Impian'
  const targetAmount = Number(targetGoal?.amount) || 100000
  const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((totalCelengan / targetAmount) * 100)) : 0
  const remaining = Math.max(0, targetAmount - totalCelengan)
  const isGoalReached = totalCelengan >= targetAmount && targetAmount > 0

  const handleQuickChip = (amt) => {
    setNominal(String(amt))
    setFormError('')
    if (amt >= 50000) {
      setAlokasi('split_50_50')
      setResetKas(true)
    } else {
      setAlokasi('saku_only')
      setResetKas(false)
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const num = Number(nominal)
    if (!num || num <= 0) {
      setFormError('Masukkan nominal uang yang valid.')
      return
    }

    const ok = await onAddAllowance({
      nominal: num,
      alokasi,
      keterangan: keterangan.trim() || (alokasi === 'split_50_50' ? 'Uang saku mingguan (Bagi 50:50)' : 'Uang saku jajan'),
      resetKas,
    })

    if (ok) {
      setNominal('')
      setKeterangan('')
      setShowAddModal(false)
    }
  }

  const handleConfirmReset = async (clearHistory) => {
    setShowResetModal(false)
    await onResetBalance(clearHistory)
  }

  const handleTargetSubmit = async (e) => {
    e.preventDefault()
    setTargetError('')

    const amt = Number(targetAmountInput)
    if (!amt || amt <= 0) {
      setTargetError('Masukkan nominal target tabungan yang valid.')
      return
    }

    const name = targetNameInput.trim() || 'Barang Impian'
    const ok = await onUpdateTarget({
      name,
      amount: amt,
    })

    if (ok) {
      setShowTargetModal(false)
    }
  }

  return (
    <div className="space-y-3 mb-4">
      {/* Dual Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Card 1: Sisa Uang Saku */}
        <div className="brutal-card bg-[#fef3c7] dark:bg-[#272115] p-3.5 sm:p-4 border-2 border-zinc-800 dark:border-amber-900/60 shadow-[3px_3px_0px_0px_#27272a] relative overflow-hidden flex flex-col justify-between text-zinc-950 dark:text-amber-100">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Wallet className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-zinc-800 dark:text-amber-200 truncate">
                  Uang Saku
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                sisaSaku === 0
                  ? 'text-zinc-600 dark:text-zinc-400 bg-white/60 dark:bg-zinc-800'
                  : sisaSaku <= 5000
                  ? 'text-rose-700 dark:text-rose-300 bg-rose-200/80 dark:bg-rose-950/70'
                  : 'text-emerald-800 dark:text-emerald-300 bg-emerald-200/80 dark:bg-emerald-950/70'
              }`}>
                {sisaSaku === 0 ? 'Habis' : sisaSaku <= 5000 ? 'Kritis' : 'Siap Jajan'}
              </span>
            </div>

            <div className="font-display font-black text-2xl sm:text-[28px] text-zinc-950 dark:text-amber-50 tracking-tight my-1.5 truncate">
              {formatRupiah(sisaSaku)}
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-zinc-800/10 dark:border-amber-900/30 flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-amber-200/70 text-[11px] flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Keluar hari ini:</span>
            </span>
            <span className="font-extrabold text-zinc-900 dark:text-amber-100 text-xs">
              {formatRupiah(todayExpense)}
            </span>
          </div>
        </div>

        {/* Card 2: Total Isi Celengan & Target Tabungan Interaktif */}
        <div className="brutal-card bg-[#ecfdf5] dark:bg-[#132820] p-3.5 sm:p-4 border-2 border-zinc-800 dark:border-emerald-900/60 shadow-[3px_3px_0px_0px_#27272a] relative overflow-hidden flex flex-col justify-between text-zinc-950 dark:text-emerald-100">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <PiggyBank className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-zinc-800 dark:text-emerald-200 truncate">
                  Celengan
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTargetNameInput(targetName)
                  setTargetAmountInput(String(targetAmount))
                  setShowTargetModal(true)
                }}
                className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 dark:hover:text-emerald-100 bg-white/80 dark:bg-zinc-800 hover:bg-white px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-1 cursor-pointer transition shrink-0"
                title="Atur Target Impian"
              >
                <Target className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Atur</span>
              </button>
            </div>

            <div className="font-display font-black text-2xl sm:text-[28px] text-zinc-950 dark:text-emerald-50 tracking-tight my-1.5 truncate">
              {formatRupiah(totalCelengan)}
            </div>
          </div>

          {/* Target Progress Bar & Info */}
          <div className="mt-2 pt-2 border-t border-zinc-800/10 dark:border-emerald-900/30 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="truncate max-w-[100px] text-zinc-700 dark:text-emerald-200 font-medium" title={targetName}>
                🎯 {targetName}
              </span>
              <span className="font-extrabold text-zinc-900 dark:text-emerald-100 text-xs shrink-0">
                {formatRupiah(targetAmount)}
              </span>
            </div>

            {/* Visual Progress Bar (clean & slim) */}
            <div className="w-full bg-emerald-950/10 dark:bg-zinc-900/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-600 dark:text-emerald-300/80 font-medium">
              <span>{progressPercent}% terkumpul</span>
              <span className="font-bold text-zinc-800 dark:text-emerald-200">
                {isGoalReached ? '🎉 Tercapai!' : `Sisa ${formatRupiah(remaining)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons: Tambah Uang Saku & Reset Saldo */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          disabled={isLoadingAction}
          className="flex-1 brutal-btn bg-[#a7f3d0] hover:bg-[#86efac] dark:bg-emerald-400/90 dark:hover:bg-emerald-400 text-zinc-950 py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 border-2 border-zinc-800 dark:border-zinc-700 shadow-[3px_3px_0px_0px_#27272a] cursor-pointer"
        >
          {isLoadingAction ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
          ) : (
            <PlusCircle className="w-4 h-4 text-zinc-950" />
          )}
          <span>+ Tambah Uang Saku Baru</span>
        </button>

        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          disabled={isLoadingAction}
          className="p-3 brutal-btn bg-zinc-100 hover:bg-rose-200 dark:bg-zinc-800 dark:hover:bg-rose-950 text-zinc-800 dark:text-zinc-200 hover:text-rose-900 rounded-xl border-2 border-zinc-800 dark:border-zinc-700 shadow-[3px_3px_0px_0px_#27272a] cursor-pointer shrink-0"
          title="Reset semua saldo ke Rp0"
          aria-label="Reset semua saldo ke Rp0"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Modal: Atur Target Tabungan Impian */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="brutal-card bg-white dark:bg-zinc-900 max-w-sm w-full p-5 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-800 dark:border-zinc-700 shadow-[4px_4px_0px_0px_#27272a]">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#a7f3d0] dark:bg-emerald-950/60 border-2 border-zinc-800 dark:border-emerald-700/60 flex items-center justify-center text-emerald-900 dark:text-emerald-200 shadow-[1.5px_1.5px_0px_0px_#27272a]">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-base text-zinc-900 dark:text-white">
                  Atur Target Tabungan
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Tentukan barang impian dan nominal target Anda
                </p>
              </div>
            </div>

            <form onSubmit={handleTargetSubmit} className="space-y-3 text-xs">
              {/* Nama Target */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  Nama Barang / Tujuan Impian
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Sepatu Olahraga, Buku, Keyboard"
                  value={targetNameInput}
                  onChange={(e) => setTargetNameInput(e.target.value)}
                  className="w-full brutal-input bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-600 px-3 py-2 rounded-xl text-xs font-bold placeholder:text-zinc-400"
                />
              </div>

              {/* Nominal Target */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300">
                    Nominal Target (Rp)
                  </label>
                  {targetAmountInput && Number(targetAmountInput) > 0 && (
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                      {formatRupiah(targetAmountInput)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-black text-zinc-500">
                    Rp
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    placeholder="Contoh: 250000"
                    value={targetAmountInput}
                    onChange={(e) => {
                      setTargetAmountInput(e.target.value)
                      setTargetError('')
                    }}
                    className="w-full brutal-input bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-600 pl-9 pr-3 py-2 rounded-xl text-sm font-bold placeholder:text-zinc-400"
                  />
                </div>

                {/* Preset Target Cepat */}
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5">
                  <span className="text-[10px] text-zinc-500 font-bold shrink-0">Pilihan:</span>
                  {QUICK_TARGET_OPTIONS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTargetAmountInput(String(amt))}
                      className="brutal-badge bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-900 dark:border-zinc-700 text-[10px] px-2 py-0.5 rounded-md cursor-pointer active:scale-95 transition"
                    >
                      {amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              {targetError && (
                <div className="text-[11px] text-rose-700 dark:text-rose-300 font-bold bg-rose-100 dark:bg-rose-950/80 p-2 rounded border border-rose-300 dark:border-rose-800">
                  {targetError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="flex-1 brutal-btn bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 py-2.5 rounded-lg font-bold border-2 border-zinc-900 dark:border-zinc-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoadingAction || !targetAmountInput || Number(targetAmountInput) <= 0}
                  className="flex-1 brutal-btn bg-emerald-400 hover:bg-emerald-500 text-zinc-950 py-2.5 rounded-lg font-black border-2 border-zinc-900 dark:border-zinc-700 cursor-pointer disabled:opacity-50"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Uang Saku Fleksibel */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="brutal-card bg-white dark:bg-zinc-900 max-w-sm w-full p-5 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-800 dark:border-zinc-700 shadow-[4px_4px_0px_0px_#27272a] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#a7f3d0] dark:bg-emerald-950/60 border-2 border-zinc-800 dark:border-emerald-700/60 flex items-center justify-center text-emerald-900 dark:text-emerald-200 shadow-[1.5px_1.5px_0px_0px_#27272a]">
                <Banknote className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-base text-zinc-900 dark:text-white">
                  Input Uang Saku Masuk
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Masukkan uang saku harian atau mingguan Anda
                </p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              {/* Input Nominal */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300">
                    Nominal Uang (Rp)
                  </label>
                  {nominal && Number(nominal) > 0 && (
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                      {formatRupiah(nominal)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-black text-zinc-500">
                    Rp
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    placeholder="Contoh: 15000 atau 100000"
                    value={nominal}
                    onChange={(e) => {
                      setNominal(e.target.value)
                      setFormError('')
                    }}
                    className="w-full brutal-input bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-600 pl-9 pr-3 py-2 rounded-xl text-sm font-bold placeholder:text-zinc-400"
                  />
                </div>

                {/* Quick Chips */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-zinc-500 font-bold shrink-0">Cepat:</span>
                  {QUICK_ADD_OPTIONS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickChip(amt)}
                      className="brutal-badge bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-900 dark:border-zinc-700 text-[10px] px-2 py-0.5 rounded-md cursor-pointer active:scale-95 transition"
                    >
                      {amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Alokasi */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Pilihan Pembagian
                </label>
                <div className="space-y-1.5">
                  <label
                    onClick={() => {
                      setAlokasi('saku_only')
                      setResetKas(false)
                    }}
                    className={`p-2.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition ${
                      alokasi === 'saku_only'
                        ? 'bg-amber-200 dark:bg-amber-400/30 border-zinc-900 dark:border-amber-500 shadow-[2px_2px_0px_0px_#18181b]'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-700 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <span>🍟 100% Uang Saku</span>
                        <span className="text-[9px] bg-white dark:bg-zinc-900 px-1 py-0.2 rounded border border-zinc-900">
                          Harian
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-600 dark:text-zinc-400">
                        Seluruh nominal masuk ke sisa uang saku jajan.
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 border-zinc-900 flex items-center justify-center ${alokasi === 'saku_only' ? 'bg-amber-400' : 'bg-white'}`}>
                      {alokasi === 'saku_only' && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
                    </div>
                  </label>

                  <label
                    onClick={() => {
                      setAlokasi('split_50_50')
                      setResetKas(true)
                    }}
                    className={`p-2.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition ${
                      alokasi === 'split_50_50'
                        ? 'bg-lime-200 dark:bg-lime-400/30 border-zinc-900 dark:border-lime-500 shadow-[2px_2px_0px_0px_#18181b]'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-700 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <span className="flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                          Bagi 50:50
                        </span>
                        <span className="text-[9px] bg-white dark:bg-zinc-900 px-1 py-0.2 rounded border border-zinc-800 dark:border-zinc-700">
                          Mingguan
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-600 dark:text-zinc-400">
                        50% sisa saku jajan, 50% otomatis masuk ke celengan.
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 border-zinc-900 flex items-center justify-center ${alokasi === 'split_50_50' ? 'bg-lime-400' : 'bg-white'}`}>
                      {alokasi === 'split_50_50' && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
                    </div>
                  </label>
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  Catatan Sumber Uang (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Uang saku Senin atau Uang dari Ayah"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full brutal-input bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-600 px-3 py-1.5 rounded-xl text-xs placeholder:text-zinc-400"
                />
              </div>

              {/* Opsi Reset Kas */}
              {alokasi === 'split_50_50' && (
                <label className="flex items-start gap-2 bg-amber-50 dark:bg-zinc-800 p-2.5 rounded-xl border border-zinc-900 dark:border-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetKas}
                    onChange={(e) => setResetKas(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-900 accent-zinc-900"
                  />
                  <span className="text-[11px] text-zinc-800 dark:text-zinc-300 leading-snug">
                    <b>Reset Kas Senin</b> ke belum lunas untuk minggu baru ini.
                  </span>
                </label>
              )}

              {formError && (
                <div className="text-[11px] text-rose-700 dark:text-rose-300 font-bold bg-rose-100 dark:bg-rose-950/80 p-2 rounded border border-rose-300 dark:border-rose-800">
                  {formError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 brutal-btn bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 py-2.5 rounded-lg font-bold border-2 border-zinc-900 dark:border-zinc-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoadingAction || !nominal || Number(nominal) <= 0}
                  className="flex-1 brutal-btn bg-lime-400 hover:bg-lime-500 text-zinc-950 py-2.5 rounded-lg font-black border-2 border-zinc-900 dark:border-zinc-700 cursor-pointer disabled:opacity-50"
                >
                  Simpan Uang Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Saldo ke 0 */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="brutal-card bg-white dark:bg-zinc-900 max-w-sm w-full p-5 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-700 shadow-[4px_4px_0px_0px_#18181b] dark:shadow-[4px_4px_0px_0px_#27272a]">
            <div className="w-10 h-10 rounded-xl bg-rose-200 dark:bg-rose-900 border-2 border-zinc-900 dark:border-zinc-700 flex items-center justify-center text-xl mb-3 shadow-[2px_2px_0px_0px_#18181b]">
              <AlertTriangle className="w-5 h-5 text-rose-800 dark:text-rose-200" />
            </div>

            <h3 className="font-display font-black text-base text-zinc-900 dark:text-white">
              Reset Semua Uang ke Rp0?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
              Saldo saku dan celengan akan dikosongkan menjadi <b>Rp0</b> sehingga Anda bisa mulai menginput uang saku riil dari awal.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleConfirmReset(false)}
                className="w-full brutal-btn bg-rose-300 hover:bg-rose-400 dark:bg-rose-400 dark:hover:bg-rose-500 text-zinc-950 py-2.5 rounded-lg text-xs font-black border-2 border-zinc-900 dark:border-zinc-700 cursor-pointer"
              >
                Reset Saldo ke Rp0 (Simpan Riwayat)
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReset(true)}
                className="w-full brutal-btn bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-lg text-xs font-black border-2 border-zinc-900 dark:border-zinc-700 cursor-pointer"
              >
                Reset Bersih (Saldo 0 &amp; Kosongkan Riwayat)
              </button>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="w-full brutal-btn bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 py-2 rounded-lg text-xs font-bold border-2 border-zinc-900 dark:border-zinc-700 cursor-pointer mt-1"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
