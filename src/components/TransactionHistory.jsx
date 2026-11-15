import { useState } from 'react'
import { History, Trash2, Loader2, PiggyBank, Receipt, ArrowDownRight } from 'lucide-react'
import { formatRupiah, formatRelativeTime } from '../lib/formatters'

export const TransactionHistory = ({
  transactions,
  onDeleteTransaction,
  deletingId,
  isLoading,
}) => {
  const [filter, setFilter] = useState('semua')
  const [itemToDelete, setItemToDelete] = useState(null)
  const [refundBalance, setRefundBalance] = useState(true)

  // Filter transactions
  const filteredList = (transactions || []).filter((tx) => {
    if (filter === 'semua') return true
    if (filter === 'keluar') return tx.tipe === 'keluar'
    if (filter === 'tabungan') return tx.tipe === 'tabungan'
    return true
  })

  const confirmDelete = async () => {
    if (!itemToDelete) return
    const id = itemToDelete.id
    const shouldRefund = refundBalance && itemToDelete.tipe === 'keluar'
    const refundAmount = shouldRefund ? Number(itemToDelete.nominal) : 0
    const wasKas = itemToDelete.kategori === 'Kas'

    setItemToDelete(null)
    await onDeleteTransaction(id, { refundAmount, wasKas })
  }

  const getTransactionBadge = (tx) => {
    if (tx.tipe === 'keluar') {
      const isKas = tx.kategori === 'Kas'
      return {
        bg: 'bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800',
        sign: '-',
        nominalColor: 'text-rose-700 dark:text-rose-400',
        iconBg: isKas
          ? 'bg-amber-200 dark:bg-amber-400 text-zinc-950'
          : 'bg-rose-200 dark:bg-rose-400 text-zinc-950',
        icon: isKas ? '🗓️' : tx.kategori === 'Ongkos' ? '🚌' : tx.kategori === 'Jajan' ? '🍟' : tx.kategori === 'Lainnya' ? '✏️' : <ArrowDownRight className="w-4 h-4 text-rose-800 dark:text-rose-200" />,
      }
    }
    // tipe === 'tabungan'
    return {
      bg: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
      sign: '+',
      nominalColor: 'text-emerald-700 dark:text-emerald-400',
      iconBg: 'bg-emerald-200 dark:bg-emerald-400 text-zinc-950',
      icon: <PiggyBank className="w-4 h-4 text-emerald-950 dark:text-emerald-950" />,
    }
  }

  return (
    <div className="brutal-card bg-white dark:bg-zinc-900 p-4 border-2 border-zinc-800 dark:border-zinc-700 shadow-[3px_3px_0px_0px_#27272a]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
          <History className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <span>Riwayat Aktivitas</span>
        </h3>
        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
          {filteredList.length} Catatan
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700 rounded-xl mb-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setFilter('semua')}
          className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
            filter === 'semua'
              ? 'bg-[#fef08a] dark:bg-amber-400 text-zinc-950 font-black shadow-[1px_1px_0px_0px_#27272a]'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Semua
        </button>
        <button
          type="button"
          onClick={() => setFilter('keluar')}
          className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
            filter === 'keluar'
              ? 'bg-[#fecdd3] dark:bg-rose-400 text-zinc-950 font-black shadow-[1px_1px_0px_0px_#27272a]'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => setFilter('tabungan')}
          className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
            filter === 'tabungan'
              ? 'bg-[#a7f3d0] dark:bg-emerald-400 text-zinc-950 font-black shadow-[1px_1px_0px_0px_#27272a]'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          Tabungan
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-800 dark:text-zinc-200" />
          <span className="text-xs font-bold">Memuat riwayat transaksi...</span>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-8 px-4 text-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-800 dark:border-zinc-700 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-2 shadow-[2px_2px_0px_0px_#27272a]">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Belum ada catatan transaksi</div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            Mulai catat uang saku atau pengeluaran pertamamu di atas!
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filteredList.map((tx) => {
            const badge = getTransactionBadge(tx)
            const isDeleting = deletingId === tx.id

            return (
              <div
                key={tx.id}
                className="p-2.5 rounded-xl border-2 border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between gap-2 text-xs"
              >
                {/* Left: Icon & Description */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg border-2 border-zinc-900 dark:border-zinc-700 flex items-center justify-center text-sm font-bold shrink-0 ${badge.iconBg} shadow-[1.5px_1.5px_0px_0px_#18181b] dark:shadow-[1.5px_1.5px_0px_0px_#27272a]`}
                  >
                    {badge.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-xs">
                      {tx.judul || tx.kategori}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 px-1 rounded">
                        {tx.kategori}
                      </span>
                      <span>&bull;</span>
                      <span>{tx.tanggal || formatRelativeTime(tx.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Nominal & Delete Action */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className={`font-display font-black text-xs sm:text-sm ${badge.nominalColor}`}>
                      {badge.sign}
                      {formatRupiah(tx.nominal)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setItemToDelete(tx)
                      setRefundBalance(true)
                    }}
                    disabled={isDeleting}
                    className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors border border-transparent hover:border-zinc-900 dark:hover:border-zinc-700 cursor-pointer"
                    title="Hapus transaksi"
                    aria-label="Hapus transaksi"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs">
          <div className="brutal-card bg-white dark:bg-zinc-900 max-w-sm w-full p-5 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-800 dark:border-zinc-700 shadow-[4px_4px_0px_0px_#27272a]">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/70 border-2 border-rose-300 dark:border-rose-800 flex items-center justify-center mb-3 shadow-[2px_2px_0px_0px_#27272a]">
              <Trash2 className="w-5 h-5 text-rose-700 dark:text-rose-400 stroke-[2.5]" />
            </div>
            <h3 className="font-display font-extrabold text-base text-zinc-900 dark:text-white">
              Hapus Catatan Ini?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              Catatan <b>"{itemToDelete.judul || itemToDelete.kategori}"</b> sebesar{' '}
              <b className="text-zinc-900 dark:text-white">{formatRupiah(itemToDelete.nominal)}</b> akan dihapus.
            </p>

            {itemToDelete.tipe === 'keluar' && (
              <label className="mt-3 flex items-start gap-2 bg-amber-50 dark:bg-zinc-800 p-2.5 rounded-lg border border-zinc-900 dark:border-zinc-700 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={refundBalance}
                  onChange={(e) => setRefundBalance(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-900 dark:border-zinc-600 accent-zinc-900"
                />
                <span className="text-[11px] text-zinc-800 dark:text-zinc-200 leading-snug">
                  <b>Kembalikan saldo uang saku</b> ({formatRupiah(itemToDelete.nominal)}) karena salah catat.
                </span>
              </label>
            )}

            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 brutal-btn bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 py-2.5 rounded-lg text-xs font-bold border-2 border-zinc-900 dark:border-zinc-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 brutal-btn bg-rose-400 hover:bg-rose-500 dark:bg-rose-500 dark:hover:bg-rose-600 text-zinc-950 py-2.5 rounded-lg text-xs font-black border-2 border-zinc-900 dark:border-zinc-700 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
