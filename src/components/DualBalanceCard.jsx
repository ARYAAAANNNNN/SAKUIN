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
  Plus,
  Minus,
  SlidersHorizontal,
} from 'lucide-react'
import { formatRupiah } from '../lib/formatters'

const QUICK_ADD_OPTIONS = [10000, 20000, 50000, 100000]
const QUICK_TARGET_OPTIONS = [50000, 100000, 250000, 500000, 1000000]
const SUMBER_PILIHAN = [
  { id: 'Uang Saku Rutin', label: '💵 Uang Saku Rutin' },
  { id: 'Dikasih Ortu / THR', label: '🎁 Dikasih Ortu / THR' },
  { id: 'Hasil Jualan / Upah', label: '💼 Jualan / Upah' },
  { id: 'Prestasi / Lomba', label: '🏆 Prestasi / Beasiswa' },
  { id: 'Uang Kembalian', label: '🪙 Uang Kembalian' },
  { id: 'Lainnya', label: '🏷️ Sumber Lain' },
]

export const DualBalanceCard = ({
  wallet,
  todayExpense,
  targetGoal,
  onAddAllowance,
  onAdjustCashBalance,
  onResetBalance,
  onUpdateTarget,
  isLoadingAction,
}) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [showTargetModal, setShowTargetModal] = useState(false)

  // Kelola Saldo Cash Cepat (Tambah, Kurangi, atau Set Saldo Riil di Dompet)
  const [showCashModal, setShowCashModal] = useState(false)
  const [cashModalMode, setCashModalMode] = useState('add') // 'add' | 'subtract' | 'set'
  const [cashAmount, setCashAmount] = useState('')
  const [cashTargetInput, setCashTargetInput] = useState('')
  const [cashReason, setCashReason] = useState('')
  const [cashError, setCashError] = useState('')
  const [isAdjustingCash, setIsAdjustingCash] = useState(false)

  // Tambah Uang Saku / Masuk Form state
  const [nominal, setNominal] = useState('')
  const [alokasi, setAlokasi] = useState('saku_only') // 'saku_only' | 'celengan_only' | 'split_50_50' | 'custom'
  const [customPercent, setCustomPercent] = useState(30) // Persen masuk celengan (0 - 100)
  const [customSavingsInput, setCustomSavingsInput] = useState('') // Input langsung nominal celengan
  const [sumberPemasukan, setSumberPemasukan] = useState('Uang Saku Rutin')
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

  // Kalkulasi dinamis pembagian uang masuk
  const numNominal = Number(nominal) || 0
  let calcSaku = 0
  let calcCelengan = 0

  if (alokasi === 'saku_only') {
    calcSaku = numNominal
    calcCelengan = 0
  } else if (alokasi === 'celengan_only') {
    calcSaku = 0
    calcCelengan = numNominal
  } else if (alokasi === 'split_50_50') {
    calcSaku = Math.round(numNominal / 2)
    calcCelengan = numNominal - calcSaku
  } else if (alokasi === 'custom') {
    if (customSavingsInput !== '') {
      const manualCel = Math.min(numNominal, Math.max(0, Number(customSavingsInput) || 0))
      calcCelengan = manualCel
      calcSaku = Math.max(0, numNominal - manualCel)
    } else {
      calcCelengan = Math.round((numNominal * customPercent) / 100)
      calcSaku = Math.max(0, numNominal - calcCelengan)
    }
  }

  const handleQuickChip = (amt) => {
    setNominal(String(amt))
    setFormError('')
    if (amt >= 50000 && alokasi === 'saku_only') {
      setAlokasi('split_50_50')
      setResetKas(true)
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
      sumberPemasukan,
      customSakuAmount: calcSaku,
      customCelenganAmount: calcCelengan,
      keterangan: keterangan.trim() || `${sumberPemasukan} (${alokasi === 'saku_only' ? '100% Saku' : alokasi === 'celengan_only' ? '100% Celengan' : alokasi === 'split_50_50' ? 'Bagi 50:50' : `Kustom: ${formatRupiah(calcSaku)} Saku, ${formatRupiah(calcCelengan)} Celengan`})`,
      resetKas,
    })

    if (ok) {
      setNominal('')
      setCustomSavingsInput('')
      setKeterangan('')
      setShowAddModal(false)
    }
  }

  const openCashModal = (mode) => {
    setCashModalMode(mode)
    setCashAmount('')
    setCashReason('')
    setCashError('')
    if (mode === 'set') {
      setCashTargetInput(String(sisaSaku))
    } else {
      setCashTargetInput('')
    }
    setShowCashModal(true)
  }

  const handleCashModalSubmit = async (e) => {
    e.preventDefault()
    setCashError('')

    if (cashModalMode === 'add' || cashModalMode === 'subtract') {
      const amt = Number(cashAmount)
      if (!amt || amt <= 0) {
        setCashError('Masukkan nominal yang valid.')
        return
      }
      if (cashModalMode === 'subtract' && amt > sisaSaku) {
        setCashError(`Saldo uang cash tidak mencukupi! Sisa saldo Anda hanya ${formatRupiah(sisaSaku)}.`)
        return
      }
    } else if (cashModalMode === 'set') {
      const target = Number(cashTargetInput)
      if (isNaN(target) || target < 0) {
        setCashError('Masukkan nominal saldo fisik yang valid.')
        return
      }
    }

    if (!onAdjustCashBalance) return

    setIsAdjustingCash(true)
    const ok = await onAdjustCashBalance({
      mode: cashModalMode,
      amount: Number(cashAmount),
      newBalance: Number(cashTargetInput),
      reason: cashReason,
    })
    setIsAdjustingCash(false)

    if (ok) {
      setShowCashModal(false)
      setCashAmount('')
      setCashReason('')
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
        {/* Card 1: Saldo Uang Cash di Tangan */}
        <div className="brutal-card bg-[#fef3c7] dark:bg-[#272115] p-3.5 sm:p-4 border-2 border-zinc-800 dark:border-amber-900/60 shadow-[3px_3px_0px_0px_#27272a] relative overflow-hidden flex flex-col justify-between text-zinc-950 dark:text-amber-100">
          <div>
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <Wallet className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-zinc-800 dark:text-amber-200 truncate">
                  Uang Cash di Tangan
                </span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                sisaSaku === 0
                  ? 'text-zinc-600 dark:text-zinc-400 bg-white/60 dark:bg-zinc-800'
                  : sisaSaku <= 5000
                  ? 'text-rose-700 dark:text-rose-300 bg-rose-200/80 dark:bg-rose-950/70'
                  : 'text-emerald-800 dark:text-emerald-300 bg-emerald-200/80 dark:bg-emerald-950/70'
              }`}>
                {sisaSaku === 0 ? 'Habis' : sisaSaku <= 5000 ? 'Kritis' : 'Siap Pakai'}
              </span>
            </div>

            <div className="font-display font-black text-2xl sm:text-[28px] text-zinc-950 dark:text-amber-50 tracking-tight my-1 truncate">
              {formatRupiah(sisaSaku)}
            </div>

            {/* Quick Action Buttons on Cash Balance */}
            <div className="flex items-center gap-1.5 my-2">
              <button
                type="button"
                onClick={() => openCashModal('add')}
                className="flex-1 py-1.5 px-2 bg-[#86efac] hover:bg-[#6ee7b7] dark:bg-emerald-500/80 dark:hover:bg-emerald-500 text-zinc-950 rounded-lg text-[11px] font-black border border-zinc-900 dark:border-zinc-700 flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 shadow-[1px_1px_0px_0px_#18181b]"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Tambah</span>
              </button>
              <button
                type="button"
                onClick={() => openCashModal('subtract')}
                className="flex-1 py-1.5 px-2 bg-[#fca5a5] hover:bg-[#f87171] dark:bg-rose-900/80 dark:hover:bg-rose-800 text-zinc-950 dark:text-rose-100 rounded-lg text-[11px] font-black border border-zinc-900 dark:border-zinc-700 flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 shadow-[1px_1px_0px_0px_#18181b]"
              >
                <Minus className="w-3 h-3 stroke-[3]" />
                <span>Kurang</span>
              </button>
              <button
                type="button"
                onClick={() => openCashModal('set')}
                className="py-1.5 px-2 bg-white hover:bg-amber-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-[11px] font-bold border border-zinc-900 dark:border-zinc-700 flex items-center justify-center gap-1 cursor-pointer transition active:scale-95 shadow-[1px_1px_0px_0px_#18181b]"
                title="Sesuaikan dengan jumlah uang fisik yang ada di dompet"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Atur</span>
              </button>
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
          <span>Tambah Uang Saku Baru</span>
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

      {/* Modal: Kelola Saldo Cash Fisik (Tambah, Kurangi, atau Set Saldo Riil) */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="brutal-card bg-white dark:bg-zinc-900 max-w-sm w-full p-5 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-800 dark:border-zinc-700 shadow-[4px_4px_0px_0px_#27272a] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200 dark:bg-amber-400/30 border-2 border-zinc-800 dark:border-amber-600 flex items-center justify-center text-amber-900 dark:text-amber-200 shadow-[1.5px_1.5px_0px_0px_#27272a]">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-base text-zinc-900 dark:text-white">
                  Kelola Uang Cash di Tangan
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Saldo tercatat saat ini: <b className="text-zinc-900 dark:text-white">{formatRupiah(sisaSaku)}</b>
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-300 dark:border-zinc-700 mb-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setCashModalMode('add')
                  setCashError('')
                }}
                className={`py-1.5 rounded-lg transition text-center cursor-pointer text-[11px] flex items-center justify-center gap-1 ${
                  cashModalMode === 'add'
                    ? 'bg-[#86efac] text-zinc-950 font-black shadow-[1px_1px_0px_0px_#18181b]'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Tambah</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCashModalMode('subtract')
                  setCashError('')
                }}
                className={`py-1.5 rounded-lg transition text-center cursor-pointer text-[11px] flex items-center justify-center gap-1 ${
                  cashModalMode === 'subtract'
                    ? 'bg-[#fca5a5] text-zinc-950 font-black shadow-[1px_1px_0px_0px_#18181b]'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Minus className="w-3 h-3 stroke-[3]" />
                <span>Kurang</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCashModalMode('set')
                  setCashTargetInput(String(sisaSaku))
                  setCashError('')
                }}
                className={`py-1.5 rounded-lg transition text-center cursor-pointer text-[11px] flex items-center justify-center gap-1 ${
                  cashModalMode === 'set'
                    ? 'bg-amber-200 dark:bg-amber-400 text-zinc-950 font-black shadow-[1px_1px_0px_0px_#18181b]'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <span>🎯 Atur Pas</span>
              </button>
            </div>

            <form onSubmit={handleCashModalSubmit} className="space-y-3 text-xs">
              {/* Tab 1: Tambah Cash */}
              {cashModalMode === 'add' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                      Nominal Uang Bertambah (Rp)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-black text-zinc-500">
                        Rp
                      </div>
                      <input
                        type="number"
                        inputMode="numeric"
                        required
                        placeholder="Contoh: 10000"
                        value={cashAmount}
                        onChange={(e) => {
                          setCashAmount(e.target.value)
                          setCashError('')
                        }}
                        className="w-full brutal-input bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-600 pl-9 pr-3 py-2 rounded-xl text-sm font-bold placeholder:text-zinc-400"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5">
                      <span className="text-[10px] text-zinc-500 font-bold shrink-0">Cepat:</span>
                      {[2000, 5000, 10000, 20000, 50000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            const cur = Number(cashAmount) || 0
                            setCashAmount(String(cur + amt))
                            setCashError('')
                          }}
                          className="brutal-badge bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-900 dark:border-zinc-700 text-[10px] px-2 py-0.5 rounded-md cursor-pointer active:scale-95 transition"
                        >
                          +{amt >= 1000 ? `${amt / 1000}k` : amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                      Catatan (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Misal: Nemu uang / dikasih kembalian"
                      value={cashReason}
                      onChange={(e) => setCashReason(e.target.value)}
                      className="w-full brutal-input bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 rounded-xl text-xs placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Kurangi Cash */}
              {cashModalMode === 'subtract' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                      Nominal Uang Berkurang (Rp)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-black text-zinc-500">
                        Rp
                      </div>
                      <input
                        type="number"
                        inputMode="numeric"
                        required
                        placeholder="Contoh: 5000"
                        value={cashAmount}
                        onChange={(e) => {
                          setCashAmount(e.target.value)
                          setCashError('')
                        }}
                        className="w-full brutal-input bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-600 pl-9 pr-3 py-2 rounded-xl text-sm font-bold placeholder:text-zinc-400"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5">
                      <span className="text-[10px] text-zinc-500 font-bold shrink-0">Cepat:</span>
                      {[2000, 5000, 10000, 15000, 20000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            const cur = Number(cashAmount) || 0
                            setCashAmount(String(cur + amt))
                            setCashError('')
                          }}
                          className="brutal-badge bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-900 dark:border-zinc-700 text-[10px] px-2 py-0.5 rounded-md cursor-pointer active:scale-95 transition"
                        >
                          -{amt >= 1000 ? `${amt / 1000}k` : amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                      Catatan (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Misal: Jajan cepat / bayar parkir"
                      value={cashReason}
                      onChange={(e) => setCashReason(e.target.value)}
                      className="w-full brutal-input bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 rounded-xl text-xs placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Set Saldo Riil di Dompet */}
              {cashModalMode === 'set' && (
                <div className="space-y-2.5">
                  <div className="p-2.5 bg-amber-50 dark:bg-zinc-800/90 rounded-xl border border-amber-300 dark:border-zinc-700 space-y-1">
                    <span className="text-[11px] font-bold text-amber-950 dark:text-amber-200">
                      💡 Hitung uang cash fisik di dompetmu sekarang, lalu ketik totalnya di bawah ini:
                    </span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                      Jumlah Uang Nyata di Dompet (Rp)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-black text-zinc-500">
                        Rp
                      </div>
                      <input
                        type="number"
                        inputMode="numeric"
                        required
                        placeholder="Contoh: 35000"
                        value={cashTargetInput}
                        onChange={(e) => {
                          setCashTargetInput(e.target.value)
                          setCashError('')
                        }}
                        className="w-full brutal-input bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-600 pl-9 pr-3 py-2 rounded-xl text-sm font-bold placeholder:text-zinc-400"
                      />
                    </div>
                  </div>

                  {/* Kalkulasi Selisih */}
                  {cashTargetInput !== '' && !isNaN(Number(cashTargetInput)) && (
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-300 dark:border-zinc-700 text-[11px] flex items-center justify-between">
                      <span className="text-zinc-500 font-bold">Penyesuaian:</span>
                      <span className={`font-black ${
                        Number(cashTargetInput) - sisaSaku > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : Number(cashTargetInput) - sisaSaku < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {Number(cashTargetInput) - sisaSaku > 0
                          ? `+${formatRupiah(Number(cashTargetInput) - sisaSaku)} (Bertambah)`
                          : Number(cashTargetInput) - sisaSaku < 0
                          ? `-${formatRupiah(Math.abs(Number(cashTargetInput) - sisaSaku))} (Berkurang)`
                          : 'Saldo Cocok (Tidak ada selisih)'}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                      Keterangan Koreksi (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Misal: Penyesuaian uang fisik riil di saku"
                      value={cashReason}
                      onChange={(e) => setCashReason(e.target.value)}
                      className="w-full brutal-input bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 rounded-xl text-xs placeholder:text-zinc-400"
                    />
                  </div>
                </div>
              )}

              {cashError && (
                <div className="text-[11px] text-rose-700 dark:text-rose-300 font-bold bg-rose-100 dark:bg-rose-950/80 p-2 rounded border border-rose-300 dark:border-rose-800">
                  {cashError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCashModal(false)}
                  className="flex-1 brutal-btn bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 py-2.5 rounded-lg font-bold border-2 border-zinc-900 dark:border-zinc-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAdjustingCash}
                  className="flex-1 brutal-btn bg-amber-300 hover:bg-amber-400 dark:bg-amber-400 dark:hover:bg-amber-500 text-zinc-950 py-2.5 rounded-lg font-black border-2 border-zinc-900 dark:border-zinc-700 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isAdjustingCash ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>
                    {cashModalMode === 'add'
                      ? 'Simpan Tambahan'
                      : cashModalMode === 'subtract'
                      ? 'Simpan Pengurangan'
                      : 'Perbarui Saldo Riil'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
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
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5">
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

              {/* Sumber Pemasukan */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Sumber Uang Masuk
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {SUMBER_PILIHAN.map((sumber) => {
                    const isSelected = sumberPemasukan === sumber.id
                    return (
                      <button
                        key={sumber.id}
                        type="button"
                        onClick={() => setSumberPemasukan(sumber.id)}
                        className={`p-1.5 rounded-lg border text-left text-[11px] font-bold transition flex items-center gap-1 cursor-pointer truncate ${
                          isSelected
                            ? 'bg-amber-200 dark:bg-amber-400/40 border-zinc-900 dark:border-amber-400 text-zinc-950 dark:text-amber-100 shadow-[1px_1px_0px_0px_#18181b]'
                            : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <span className="truncate">{sumber.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Mode Alokasi & Pembagian */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300">
                    Pilihan Pembagian (Saku vs Tabungan)
                  </label>
                  {alokasi === 'custom' && (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                      Bebas Diatur
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {/* Opsi 1: 100% Saku */}
                  <button
                    type="button"
                    onClick={() => {
                      setAlokasi('saku_only')
                      setResetKas(false)
                    }}
                    className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                      alokasi === 'saku_only'
                        ? 'bg-amber-200 dark:bg-amber-400/30 border-zinc-900 dark:border-amber-500 shadow-[2px_2px_0px_0px_#18181b]'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-800 dark:border-zinc-700 opacity-80'
                    }`}
                  >
                    <div className="font-black text-xs text-zinc-950 dark:text-zinc-100 flex items-center justify-between">
                      <span>🍟 100% Saku</span>
                      {alokasi === 'saku_only' && <span className="w-2 h-2 rounded-full bg-amber-600" />}
                    </div>
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-1 leading-tight">
                      Seluruhnya untuk jajan harian
                    </span>
                  </button>

                  {/* Opsi 2: 100% Tabungan */}
                  <button
                    type="button"
                    onClick={() => {
                      setAlokasi('celengan_only')
                      setResetKas(false)
                    }}
                    className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                      alokasi === 'celengan_only'
                        ? 'bg-emerald-200 dark:bg-emerald-400/30 border-zinc-900 dark:border-emerald-500 shadow-[2px_2px_0px_0px_#18181b]'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-800 dark:border-zinc-700 opacity-80'
                    }`}
                  >
                    <div className="font-black text-xs text-zinc-950 dark:text-zinc-100 flex items-center justify-between">
                      <span>🐖 100% Tabungan</span>
                      {alokasi === 'celengan_only' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                    </div>
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-1 leading-tight">
                      Khusus celengan / nabung impian
                    </span>
                  </button>

                  {/* Opsi 3: Bagi 50:50 */}
                  <button
                    type="button"
                    onClick={() => {
                      setAlokasi('split_50_50')
                      setResetKas(true)
                    }}
                    className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                      alokasi === 'split_50_50'
                        ? 'bg-lime-200 dark:bg-lime-400/30 border-zinc-900 dark:border-lime-500 shadow-[2px_2px_0px_0px_#18181b]'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-800 dark:border-zinc-700 opacity-80'
                    }`}
                  >
                    <div className="font-black text-xs text-zinc-950 dark:text-zinc-100 flex items-center justify-between">
                      <span>⚖️ Bagi 50:50</span>
                      {alokasi === 'split_50_50' && <span className="w-2 h-2 rounded-full bg-lime-600" />}
                    </div>
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-1 leading-tight">
                      Setengah jajan, setengah tabung
                    </span>
                  </button>

                  {/* Opsi 4: Bebas / Kustom */}
                  <button
                    type="button"
                    onClick={() => {
                      setAlokasi('custom')
                    }}
                    className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer flex flex-col justify-between ${
                      alokasi === 'custom'
                        ? 'bg-sky-200 dark:bg-sky-400/30 border-zinc-900 dark:border-sky-500 shadow-[2px_2px_0px_0px_#18181b]'
                        : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-800 dark:border-zinc-700 opacity-80'
                    }`}
                  >
                    <div className="font-black text-xs text-zinc-950 dark:text-zinc-100 flex items-center justify-between">
                      <span>🎚️ Atur Bebas</span>
                      {alokasi === 'custom' && <span className="w-2 h-2 rounded-full bg-sky-600" />}
                    </div>
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-1 leading-tight">
                      Bebas tentukan nominal tabungan
                    </span>
                  </button>
                </div>

                {/* Sub-panel Pengaturan Bebas / Kustom */}
                {alokasi === 'custom' && (
                  <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border-2 border-sky-300 dark:border-sky-800 space-y-2.5 my-2">
                    <div className="flex justify-between items-center text-[11px] font-bold text-sky-950 dark:text-sky-200">
                      <span>Rasio Masuk ke Tabungan:</span>
                      <span className="px-2 py-0.5 bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-100 rounded-md font-black">
                        {customSavingsInput !== '' && numNominal > 0
                          ? `${Math.round((calcCelengan / numNominal) * 100)}% (${formatRupiah(calcCelengan)})`
                          : `${customPercent}% (${formatRupiah(calcCelengan)})`}
                      </span>
                    </div>

                    {/* Slider Persen */}
                    <div className="space-y-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={customSavingsInput !== '' && numNominal > 0 ? Math.round((calcCelengan / numNominal) * 100) : customPercent}
                        onChange={(e) => {
                          setCustomPercent(Number(e.target.value))
                          setCustomSavingsInput('')
                        }}
                        className="w-full accent-sky-600 dark:accent-sky-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-zinc-500 font-bold">
                        <span>0% (Semua Saku)</span>
                        <span>50:50</span>
                        <span>100% (Semua Tabungan)</span>
                      </div>
                    </div>

                    {/* Preset Rasio Cepat */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                      <span className="text-[9px] text-zinc-500 font-bold shrink-0">Preset:</span>
                      {[10, 20, 30, 50, 70, 80].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            setCustomPercent(pct)
                            setCustomSavingsInput('')
                          }}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition cursor-pointer shrink-0 ${
                            customPercent === pct && customSavingsInput === ''
                              ? 'bg-sky-500 text-white border-sky-600'
                              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                          }`}
                        >
                          {pct}% Tabung
                        </button>
                      ))}
                    </div>

                    {/* Atau Input Rupiah Spesifik Tabungan */}
                    <div>
                      <label className="block text-[10px] font-bold text-sky-900 dark:text-sky-300 mb-1">
                        Atau Ketik Nominal Mau Ditabung (Rp):
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="Misal: 7000 atau 25000"
                        value={customSavingsInput}
                        onChange={(e) => {
                          setCustomSavingsInput(e.target.value)
                        }}
                        className="w-full brutal-input bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-sky-300 dark:border-sky-700 px-2.5 py-1.5 rounded-lg text-xs font-bold placeholder:text-zinc-400"
                      />
                    </div>
                  </div>
                )}

                {/* Live Breakdown Box */}
                {numNominal > 0 && (
                  <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800/90 rounded-xl border border-zinc-300 dark:border-zinc-700 space-y-2">
                    <div className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
                      <span>Hasil Alokasi Saldo:</span>
                      <span>Total: {formatRupiah(numNominal)}</span>
                    </div>

                    {/* Progress proportional bar */}
                    <div className="h-2.5 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden flex">
                      <div
                        className="bg-amber-400 dark:bg-amber-500 h-full transition-all duration-200"
                        style={{ width: `${numNominal > 0 ? (calcSaku / numNominal) * 100 : 100}%` }}
                        title="Masuk Uang Saku"
                      />
                      <div
                        className="bg-emerald-500 dark:bg-emerald-400 h-full transition-all duration-200"
                        style={{ width: `${numNominal > 0 ? (calcCelengan / numNominal) * 100 : 0}%` }}
                        title="Masuk Celengan"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800/60">
                        <div className="text-[10px] text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1">
                          <span>🍟 Uang Saku:</span>
                        </div>
                        <div className="font-black text-zinc-900 dark:text-amber-100 mt-0.5">
                          {formatRupiah(calcSaku)}
                        </div>
                      </div>

                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800/60">
                        <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1">
                          <span>🐖 Celengan:</span>
                        </div>
                        <div className="font-black text-zinc-900 dark:text-emerald-100 mt-0.5">
                          {formatRupiah(calcCelengan)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Uang saku Senin atau Uang dari Kakek"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full brutal-input bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-600 px-3 py-1.5 rounded-xl text-xs placeholder:text-zinc-400"
                />
              </div>

              {/* Opsi Reset Kas */}
              {(alokasi === 'split_50_50' || (alokasi === 'custom' && calcSaku >= 20000)) && (
                <label className="flex items-start gap-2 bg-amber-50 dark:bg-zinc-800 p-2.5 rounded-xl border border-zinc-900 dark:border-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetKas}
                    onChange={(e) => setResetKas(e.target.checked)}
                    className="mt-0.5 rounded border-zinc-900 accent-zinc-900 cursor-pointer"
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

              <div className="flex items-center gap-2 pt-1">
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
