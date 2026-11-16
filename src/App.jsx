import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import { isToday, formatTanggalIndo, formatRupiah } from './lib/formatters'
import { Header } from './components/Header'
import { LoginScreen } from './components/LoginScreen'
import { DualBalanceCard } from './components/DualBalanceCard'
import { RoutineChecklist } from './components/RoutineChecklist'
import { ExpenseForm } from './components/ExpenseForm'
import { PiggyBankActions } from './components/PiggyBankActions'
import { TransactionHistory } from './components/TransactionHistory'
import { SupabaseSetupBanner } from './components/SupabaseSetupBanner'
import { Toast } from './components/Toast'
import { Loader2, Wallet } from 'lucide-react'

export default function App() {
  // Theme state: dark / light
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('sakuin_theme')
    if (saved) return saved === 'dark'
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.classList.add('dark')
      localStorage.setItem('sakuin_theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('sakuin_theme', 'light')
    }
  }, [darkMode])

  const toggleTheme = useCallback(() => {
    setDarkMode((prev) => !prev)
  }, [])

  // Auth & Session
  const [session, setSession] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  // Wallet & transaction state
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [targetGoal, setTargetGoal] = useState({
    name: 'Beli Barang Impian',
    amount: 100000,
  })
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // Granular action loading states
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false)
  const [isLoadingKas, setIsLoadingKas] = useState(false)
  const [isLoadingBekal, setIsLoadingBekal] = useState(false)
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false)
  const [isSavingPocket, setIsSavingPocket] = useState(false)
  const [isAddingManual, setIsAddingManual] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Toast state
  const [toast, setToast] = useState(null)

  const showToast = useCallback((type, message, title = '') => {
    setToast({ type, message, title })
  }, [])

  const closeToast = useCallback(() => {
    setToast(null)
  }, [])

  // Calculate today's total expenses from `riwayat_transaksi` (tipe === 'keluar')
  const todayExpense = useMemo(() => {
    return transactions
      .filter((tx) => tx.tipe === 'keluar' && isToday(tx.created_at))
      .reduce((sum, tx) => sum + Number(tx.nominal || 0), 0)
  }, [transactions])

  // Fetch or initialize user wallet and transactions
  const loadUserData = useCallback(async (userId) => {
    if (!userId) return
    setIsDataLoading(true)
    setIsSyncing(true)

    try {
      // 1. Fetch wallet data
      const { data: existingWallet, error: walletError } = await supabase
        .from('dompet_pelajar')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (walletError && walletError.code !== 'PGRST116') {
        console.error('Error fetching wallet:', walletError)
      }

      // Muat data target impian dari database atau localStorage
      const savedTarget = localStorage.getItem(`sakuin_target_${userId}`)
      if (savedTarget) {
        try {
          setTargetGoal(JSON.parse(savedTarget))
        } catch (err) {
          console.warn('Gagal memuat target lokal:', err)
        }
      }

      if (!existingWallet) {
        // Inisialisasi awal dompet pengguna baru: mulai dari Rp 0
        const initialWallet = {
          user_id: userId,
          sisa_saku: 0,
          total_celengan: 0,
          kas_senin_lunas: false,
          bawa_bekal_hari_ini: false,
        }

        const { data: newWallet, error: insertWalletError } = await supabase
          .from('dompet_pelajar')
          .insert([initialWallet])
          .select()
          .single()

        if (insertWalletError) throw insertWalletError

        setWallet(newWallet)
        setTransactions([])

        showToast(
          'info',
          'Selamat datang di SAKUIN! Saldo Anda dimulai dari Rp0. Silakan klik "+ Tambah Uang Saku Baru" untuk memasukkan uang saku harian/mingguan Anda.',
          'Dompet Siap!'
        )
      } else {
        setWallet(existingWallet)
        if (existingWallet?.nama_target_celengan && existingWallet?.target_celengan) {
          setTargetGoal({
            name: existingWallet.nama_target_celengan,
            amount: Number(existingWallet.target_celengan),
          })
        }

        // 2. Fetch transaction history
        const { data: txList, error: txError } = await supabase
          .from('riwayat_transaksi')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (txError) {
          console.error('Error fetching transactions:', txError)
        } else {
          setTransactions(txList || [])
        }
      }
    } catch (err) {
      console.error('Failed to load user data:', err)
      showToast('error', err.message || 'Terjadi kesalahan saat memuat data.', 'Gagal Sinkron')
    } finally {
      setIsDataLoading(false)
      setIsSyncing(false)
    }
  }, [showToast])

  // Auth session listener & OAuth URL error detection
  useEffect(() => {
    let mounted = true

    // Cek apakah ada pesan error dari redirect OAuth di hash atau search params
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hash)
      const searchParams = new URLSearchParams(window.location.search)

      const errorDesc = hashParams.get('error_description') || searchParams.get('error_description')
      const errorCode = hashParams.get('error_code') || hashParams.get('error') || searchParams.get('error')

      if (errorDesc) {
        const decoded = decodeURIComponent(errorDesc.replace(/\+/g, ' '))
        setTimeout(() => {
          if (decoded.toLowerCase().includes('provider is not enabled') || errorCode === 'unsupported_provider') {
            showToast(
              'error',
              'Google OAuth belum diaktifkan di Supabase Dashboard. Buka menu Authentication > Providers > Google dan masukkan Client ID & Secret Anda.',
              'Google Auth Belum Aktif'
            )
          } else {
            showToast('error', decoded, 'Error Autentikasi')
          }
        }, 0)
        // Bersihkan hash dari URL agar rapi
        window.history.replaceState(null, '', window.location.pathname)
      }
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          setSession(session)
          if (session?.user?.id) {
            await loadUserData(session.user.id)
          }
        }
      } catch (err) {
        console.error('Session error:', err)
      } finally {
        if (mounted) setIsAuthLoading(false)
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (mounted) {
        setSession(newSession)
        if (newSession?.user?.id) {
          await loadUserData(newSession.user.id)
        } else {
          setWallet(null)
          setTransactions([])
        }
        setIsAuthLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [loadUserData, showToast])

  // Google OAuth Login Handler
  const handleLoginWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      showToast(
        'info',
        'Harap hubungkan project Supabase Anda di file .env terlebih dahulu.',
        'Setup Diperlukan'
      )
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) throw error
  }

  // Email & Password Login Handler
  const handleLoginWithEmail = async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      showToast('info', 'Harap lengkapi file .env terlebih dahulu.', 'Setup Diperlukan')
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    showToast('success', 'Berhasil masuk ke akun!', 'Selamat Datang!')
    return data
  }

  // Email & Password Sign Up Handler
  const handleSignUpWithEmail = async ({ email, password, namaLengkap }) => {
    if (!isSupabaseConfigured) {
      showToast('info', 'Harap lengkapi file .env terlebih dahulu.', 'Setup Diperlukan')
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: namaLengkap,
        },
      },
    })

    if (error) throw error

    if (data.session) {
      showToast('success', 'Akun berhasil dibuat dan otomatis masuk!', 'Selamat Datang!')
      return { requiresEmailVerification: false }
    } else {
      return { requiresEmailVerification: true }
    }
  }

  // Logout Handler
  const handleLogout = async () => {
    try {
      setIsSyncing(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setSession(null)
      setWallet(null)
      setTransactions([])
      showToast('info', 'Anda telah berhasil keluar.', 'Sampai Jumpa!')
    } catch (err) {
      showToast('error', err.message || 'Gagal logout.', 'Error')
    } finally {
      setIsSyncing(false)
    }
  }

  // Feature 2: Tambah Uang Masuk Fleksibel (Saku, Tabungan, 50:50, Kustom)
  const handleAddAllowance = async ({
    nominal,
    alokasi,
    sumberPemasukan = 'Uang Saku',
    customSakuAmount,
    customCelenganAmount,
    keterangan,
    resetKas,
  }) => {
    if (!wallet || !session?.user?.id) return false
    setIsLoadingWeekly(true)
    setIsSyncing(true)

    try {
      const currentSaku = Number(wallet.sisa_saku) || 0
      const currentCelengan = Number(wallet.total_celengan) || 0

      let addedSaku = 0
      let addedCelengan = 0

      if (alokasi === 'saku_only') {
        addedSaku = nominal
        addedCelengan = 0
      } else if (alokasi === 'celengan_only') {
        addedSaku = 0
        addedCelengan = nominal
      } else if (alokasi === 'split_50_50') {
        addedSaku = Math.round(nominal / 2)
        addedCelengan = nominal - addedSaku
      } else if (alokasi === 'custom') {
        addedSaku = customSakuAmount !== undefined ? customSakuAmount : nominal
        addedCelengan = customCelenganAmount !== undefined ? customCelenganAmount : 0
      }

      const updatedSaku = currentSaku + addedSaku
      const updatedCelengan = currentCelengan + addedCelengan

      const walletPayload = {
        sisa_saku: updatedSaku,
        total_celengan: updatedCelengan,
        updated_at: new Date().toISOString(),
      }
      if (resetKas) {
        walletPayload.kas_senin_lunas = false
      }

      // Update Supabase wallet
      const { data: updatedWallet, error: updateError } = await supabase
        .from('dompet_pelajar')
        .update(walletPayload)
        .eq('user_id', session.user.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Log transaction
      let txJudul = keterangan
      if (!txJudul) {
        if (alokasi === 'celengan_only') {
          txJudul = `${sumberPemasukan} (+${formatRupiah(addedCelengan)} Celengan)`
        } else if (alokasi === 'split_50_50' || alokasi === 'custom') {
          txJudul = `${sumberPemasukan} (+${formatRupiah(addedSaku)} Saku, +${formatRupiah(addedCelengan)} Celengan)`
        } else {
          txJudul = `${sumberPemasukan} (+${formatRupiah(addedSaku)} Saku)`
        }
      }

      const newTx = {
        user_id: session.user.id,
        tanggal: formatTanggalIndo(),
        judul: txJudul,
        nominal,
        tipe: 'tabungan',
        kategori: addedCelengan > 0 ? 'Celengan' : 'Lainnya',
      }

      const { data: insertedTx, error: txError } = await supabase
        .from('riwayat_transaksi')
        .insert([newTx])
        .select()
        .single()

      if (txError) throw txError

      setWallet(updatedWallet)
      setTransactions((prev) => [insertedTx, ...prev])
      showToast(
        'success',
        `Berhasil mencatat uang masuk ${formatRupiah(nominal)}! (${formatRupiah(addedSaku)} Saku, ${formatRupiah(addedCelengan)} Tabungan)`,
        'Saldo Bertambah 💵'
      )
      return true
    } catch (err) {
      console.error(err)
      showToast('error', err.message || 'Gagal menambahkan uang saku.', 'Error')
      return false
    } finally {
      setIsLoadingWeekly(false)
      setIsSyncing(false)
    }
  }

  // Feature: Kelola Saldo Cash Cepat (Tambah, Kurangi, atau Set Saldo Riil di Tangan)
  const handleAdjustCashBalance = async ({ mode, amount, newBalance, reason }) => {
    if (!wallet || !session?.user?.id) return false
    setIsSyncing(true)

    try {
      const currentSaku = Number(wallet.sisa_saku) || 0
      let updatedSaku = currentSaku
      let txNominal = 0
      let txTipe = 'tabungan' // 'tabungan' (pemasukan) | 'keluar' (pengeluaran)
      let txJudul = ''

      if (mode === 'add') {
        txNominal = Number(amount)
        if (!txNominal || txNominal <= 0) return false
        updatedSaku = currentSaku + txNominal
        txTipe = 'tabungan'
        txJudul = reason?.trim() || `Tambah Uang Cash (+${formatRupiah(txNominal)})`
      } else if (mode === 'subtract') {
        txNominal = Number(amount)
        if (!txNominal || txNominal <= 0) return false
        if (txNominal > currentSaku) {
          showToast('error', `Saldo uang cash Anda hanya ${formatRupiah(currentSaku)}.`, 'Saldo Tidak Cukup')
          return false
        }
        updatedSaku = currentSaku - txNominal
        txTipe = 'keluar'
        txJudul = reason?.trim() || `Kurang Uang Cash (-${formatRupiah(txNominal)})`
      } else if (mode === 'set') {
        const targetBal = Number(newBalance)
        if (isNaN(targetBal) || targetBal < 0) return false
        const diff = targetBal - currentSaku
        if (diff === 0) {
          showToast('info', 'Saldo yang dimasukkan sama dengan saldo saat ini.', 'Tidak Ada Perubahan')
          return true
        }
        updatedSaku = targetBal
        txNominal = Math.abs(diff)
        if (diff > 0) {
          txTipe = 'tabungan'
          txJudul = reason?.trim() || `Koreksi Saldo Cash Fisik (+${formatRupiah(txNominal)})`
        } else {
          txTipe = 'keluar'
          txJudul = reason?.trim() || `Koreksi Saldo Cash Fisik (-${formatRupiah(txNominal)})`
        }
      }

      // Update Supabase wallet
      const { data: updatedWallet, error: updateError } = await supabase
        .from('dompet_pelajar')
        .update({
          sisa_saku: updatedSaku,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id)
        .select()
        .single()

      if (updateError) throw updateError

      // Log transaction
      const newTx = {
        user_id: session.user.id,
        tanggal: formatTanggalIndo(),
        judul: txJudul,
        nominal: txNominal,
        tipe: txTipe,
        kategori: 'Lainnya',
      }

      const { data: insertedTx, error: txError } = await supabase
        .from('riwayat_transaksi')
        .insert([newTx])
        .select()
        .single()

      if (txError) throw txError

      setWallet(updatedWallet)
      setTransactions((prev) => [insertedTx, ...prev])
      showToast(
        'success',
        `Saldo uang cash berhasil diperbarui menjadi ${formatRupiah(updatedSaku)}!`,
        'Saldo Cash Terupdate 💵'
      )
      return true
    } catch (err) {
      console.error(err)
      showToast('error', err.message || 'Gagal menyesuaikan saldo uang cash.', 'Error')
      return false
    } finally {
      setIsSyncing(false)
    }
  }

  // Feature: Reset Saldo ke Rp0
  const handleResetBalance = async (clearHistory = false) => {
    if (!wallet || !session?.user?.id) return
    setIsLoadingWeekly(true)
    setIsSyncing(true)

    try {
      const { data: updatedWallet, error: updateError } = await supabase
        .from('dompet_pelajar')
        .update({
          sisa_saku: 0,
          total_celengan: 0,
          kas_senin_lunas: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id)
        .select()
        .single()

      if (updateError) throw updateError
      setWallet(updatedWallet)

      if (clearHistory) {
        const { error: delError } = await supabase
          .from('riwayat_transaksi')
          .delete()
          .eq('user_id', session.user.id)

        if (!delError) {
          setTransactions([])
        }
      }

      showToast(
        'success',
        clearHistory
          ? 'Seluruh saldo telah direset ke Rp0 dan riwayat transaksi telah dikosongkan.'
          : 'Seluruh saldo saku dan celengan telah direset ke Rp0.',
        'Reset Berhasil 🔄'
      )
    } catch (err) {
      console.error(err)
      showToast('error', err.message || 'Gagal mereset saldo.', 'Error')
    } finally {
      setIsLoadingWeekly(false)
      setIsSyncing(false)
    }
  }

  // Feature: Update Target Tabungan Impian
  const handleUpdateTarget = async ({ name, amount }) => {
    if (!session?.user?.id) return false
    const newTarget = { name, amount }
    setTargetGoal(newTarget)
    localStorage.setItem(`sakuin_target_${session.user.id}`, JSON.stringify(newTarget))

    try {
      await supabase
        .from('dompet_pelajar')
        .update({
          nama_target_celengan: name,
          target_celengan: amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id)
    } catch {
      // Fallback lokal jika kolom belum di-alter di SQL editor
    }

    showToast(
      'success',
      `Target "${name}" sebesar ${formatRupiah(amount)} berhasil disimpan!`,
      'Target Tabungan 🎯'
    )
    return true
  }

  // Feature 3: Bayar Kas Senin (Rp5.000)
  const handlePayKasSenin = async () => {
    if (!wallet || !session?.user?.id) return
    const currentSaku = Number(wallet.sisa_saku) || 0

    if (currentSaku < 5000) {
      showToast('error', 'Sisa uang saku tidak cukup untuk membayar kas Rp5.000.', 'Saldo Kurang')
      return
    }

    setIsLoadingKas(true)
    setIsSyncing(true)

    try {
      const updatedSaku = currentSaku - 5000

      const { data: updatedWallet, error: updateError } = await supabase
        .from('dompet_pelajar')
        .update({
          sisa_saku: updatedSaku,
          kas_senin_lunas: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id)
        .select()
        .single()

      if (updateError) throw updateError

      const newTx = {
        user_id: session.user.id,
        tanggal: formatTanggalIndo(),
        judul: 'Bayar Kas Senin',
        nominal: 5000,
        tipe: 'keluar',
        kategori: 'Kas',
      }

      const { data: insertedTx, error: txError } = await supabase
        .from('riwayat_transaksi')
        .insert([newTx])
        .select()
        .single()

      if (txError) throw txError

      setWallet(updatedWallet)
      setTransactions((prev) => [insertedTx, ...prev])
      showToast(
        'success',
        'Kas Senin Rp5.000 lunas! Uang saku terpotong Rp5.000.',
        'Bendahara Senang! 💸'
      )
    } catch (err) {
      console.error(err)
      showToast('error', err.message || 'Gagal membayar kas.', 'Error')
    } finally {
      setIsLoadingKas(false)
      setIsSyncing(false)
    }
  }

  // Feature 3: Toggle Bawa Bekal
  const handleToggleBawaBekal = async () => {
    if (!wallet || !session?.user?.id) return
    setIsLoadingBekal(true)

    try {
      const nextStatus = !wallet.bawa_bekal_hari_ini

      const { data: updatedWallet, error: updateError } = await supabase
        .from('dompet_pelajar')
        .update({
          bawa_bekal_hari_ini: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id)
        .select()
        .single()

      if (updateError) throw updateError

      setWallet(updatedWallet)
      if (nextStatus) {
        showToast(
          'success',
          'Status bawa bekal aktif! Uang jajan jadi hemat, sisanya bisa ditabung sore nanti.',
          'Bawa Bekal 🍱'
        )
      } else {
        showToast('info', 'Status bawa bekal dimatikan.', 'Update Bekal')
      }
    } catch (err) {
      console.error(err)
      showToast('error', err.message || 'Gagal mengubah status bekal.', 'Error')
    } finally {
      setIsLoadingBekal(false)
    }
  }

  // Feature 4: Form Catat Pengeluaran Fleksibel (Bisa Potong Saku atau Ambil Celengan)
  const handleAddExpense = async ({ nominal, kategori, judul, sumberDana = 'saku' }) => {
    if (!wallet || !session?.user?.id) return false
    const currentSaku = Number(wallet.sisa_saku) || 0
    const currentCelengan = Number(wallet.total_celengan) || 0

    if (sumberDana === 'saku' && nominal > currentSaku) {
      showToast('error', 'Sisa uang saku tidak mencukupi untuk pengeluaran ini.', 'Saldo Kurang')
      return false
    }

    if (sumberDana === 'celengan' && nominal > currentCelengan) {
      showToast('error', 'Isi celengan tidak mencukupi untuk pengeluaran ini.', 'Saldo Tabungan Kurang')
      return false
    }

    setIsSubmittingExpense(true)
    setIsSyncing(true)

    try {
      const walletPayload = { updated_at: new Date().toISOString() }
      if (sumberDana === 'celengan') {
        walletPayload.total_celengan = currentCelengan - nominal
      } else {
        walletPayload.sisa_saku = currentSaku - nominal
      }

      const { data: updatedWallet, error: updateError } = await supabase
        .from('dompet_pelajar')
        .update(walletPayload)
        .eq('user_id', session.user.id)
        .select()
        .single()

      if (updateError) throw updateError

      const newTx = {
        user_id: session.user.id,
        tanggal: formatTanggalIndo(),
        judul,
        nominal,
        tipe: 'keluar',
        kategori: sumberDana === 'celengan' ? 'Celengan' : kategori,
      }

      const { data: insertedTx, error: txError } = await supabase
        .from('riwayat_transaksi')
        .insert([newTx])
        .select()
        .single()

      if (txError) throw txError

      setWallet(updatedWallet)
      setTransactions((prev) => [insertedTx, ...prev])
      showToast(
        'success',
        `Pengeluaran ${formatRupiah(nominal)} berhasil dipotong dari ${sumberDana === 'celengan' ? 'Celengan' : 'Uang Saku'}!`,
        'Tercatat ✅'
      )
      return true
    } catch (err) {
      console.error(err)
      showToast('error', err.message || 'Gagal mencatat pengeluaran.', 'Error')
      return false
    } finally {
      setIsSubmittingExpense(false)
      setIsSyncing(false)
    }
  }

  // Feature 5: Tabung Sisa Saku
  const handleSaveRemainingPocket = async () => {
    if (!wallet || !session?.user?.id) return
    const currentSaku = Number(wallet.sisa_saku) || 0
    const currentCelengan = Number(wallet.total_celengan) || 0

    if (currentSaku <= 0) {
      showToast('info', 'Tidak ada sisa uang saku untuk ditabung.', 'Saku Kosong')
      return
    }

    setIsSavingPocket(true)
    setIsSyncing(true)

    try {
      const updatedCelengan = currentCelengan + currentSaku
      const updatedSaku = 0

      const { data: updatedWallet, error: updateError } = await supabase
        .from('dompet_pelajar')
        .update({
          sisa_saku: updatedSaku,
          total_celengan: updatedCelengan,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id)
        .select()
        .single()

      if (updateError) throw updateError

      const newTx = {
        user_id: session.user.id,
        tanggal: formatTanggalIndo(),
        judul: 'Tabung Seluruh Sisa Saku',
        nominal: currentSaku,
        tipe: 'tabungan',
        kategori: 'Celengan',
      }

      const { data: insertedTx, error: txError } = await supabase
        .from('riwayat_transaksi')
        .insert([newTx])
        .select()
        .single()

      if (txError) throw txError

      setWallet(updatedWallet)
      setTransactions((prev) => [insertedTx, ...prev])
      showToast(
        'success',
        `Berhasil menabung seluruh sisa saku ke celengan!`,
        'Celengan Bertambah! 🐷'
      )
    } catch (err) {
      console.error(err)
      showToast('error', err.message || 'Gagal memindahkan sisa saku ke celengan.', 'Error')
    } finally {
      setIsSavingPocket(false)
      setIsSyncing(false)
    }
  }

  // Feature 5: Tambah Celengan Manual
  const handleAddManualSavings = async ({ nominal, judul }) => {
    if (!wallet || !session?.user?.id) return false
    setIsAddingManual(true)
    setIsSyncing(true)

    try {
      const currentCelengan = Number(wallet.total_celengan) || 0
      const updatedCelengan = currentCelengan + nominal

      const { data: updatedWallet, error: updateError } = await supabase
        .from('dompet_pelajar')
        .update({
          total_celengan: updatedCelengan,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', session.user.id)
        .select()
        .single()

      if (updateError) throw updateError

      const newTx = {
        user_id: session.user.id,
        tanggal: formatTanggalIndo(),
        judul,
        nominal,
        tipe: 'tabungan',
        kategori: 'Celengan',
      }

      const { data: insertedTx, error: txError } = await supabase
        .from('riwayat_transaksi')
        .insert([newTx])
        .select()
        .single()

      if (txError) throw txError

      setWallet(updatedWallet)
      setTransactions((prev) => [insertedTx, ...prev])
      showToast('success', 'Uang receh tambahan berhasil dicatat ke celengan!', 'Mantap! 🪙')
      return true
    } catch (err) {
      console.error(err)
      showToast('error', err.message || 'Gagal menambah isi celengan.', 'Error')
      return false
    } finally {
      setIsAddingManual(false)
      setIsSyncing(false)
    }
  }

  // Feature 6: Hapus Transaksi (Pengembalian Saldo Cerdas ke Saku atau Celengan)
  const handleDeleteTransaction = async (transactionId, { refundAmount = 0, wasKas = false, wasCelengan = false }) => {
    if (!session?.user?.id) return
    setDeletingId(transactionId)
    setIsSyncing(true)

    try {
      // 1. Delete transaction record
      const { error: deleteError } = await supabase
        .from('riwayat_transaksi')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', session.user.id)

      if (deleteError) throw deleteError

      // 2. Optionally refund to wallet if requested
      if (refundAmount > 0 && wallet) {
        const walletPayload = {
          updated_at: new Date().toISOString(),
        }

        if (wasCelengan) {
          walletPayload.total_celengan = (Number(wallet.total_celengan) || 0) + refundAmount
        } else {
          walletPayload.sisa_saku = (Number(wallet.sisa_saku) || 0) + refundAmount
          if (wasKas) {
            walletPayload.kas_senin_lunas = false
          }
        }

        const { data: updatedWallet, error: walletUpdateErr } = await supabase
          .from('dompet_pelajar')
          .update(walletPayload)
          .eq('user_id', session.user.id)
          .select()
          .single()

        if (!walletUpdateErr && updatedWallet) {
          setWallet(updatedWallet)
        }
      }

      setTransactions((prev) => prev.filter((item) => item.id !== transactionId))
      showToast('info', 'Catatan transaksi telah dihapus.', 'Terhapus')
    } catch (err) {
      console.error(err)
      showToast('error', err.message || 'Gagal menghapus catatan.', 'Error')
    } finally {
      setDeletingId(null)
      setIsSyncing(false)
    }
  }

  // 1. Loading Authentication Check
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#fcfaf7] dark:bg-[#121316] transition-colors">
        <div className="brutal-card bg-[#fef3c7] dark:bg-zinc-900 dark:border-zinc-700 p-6 flex flex-col items-center gap-3 max-w-xs text-center border-2 border-zinc-800 shadow-[3px_3px_0px_0px_#27272a]">
          <div className="w-12 h-12 rounded-2xl bg-amber-300 dark:bg-amber-400 border-2 border-zinc-800 dark:border-zinc-700 flex items-center justify-center text-zinc-950 shadow-[2px_2px_0px_0px_#27272a]">
            <Wallet className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="font-display font-black text-xl text-zinc-900 dark:text-white">SAKUIN</h2>
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-800 dark:text-white" />
            <span>Memeriksa sesi login...</span>
          </div>
        </div>
      </div>
    )
  }

  // 2. Unauthenticated User Screen (Login & Register Revamped)
  if (!session) {
    return (
      <div className="min-h-screen bg-[#fcfaf7] dark:bg-[#121316] text-zinc-800 dark:text-zinc-200 transition-colors duration-200">
        <Toast toast={toast} onClose={closeToast} />
        <LoginScreen
          onLoginWithGoogle={handleLoginWithGoogle}
          onLoginWithEmail={handleLoginWithEmail}
          onSignUpWithEmail={handleSignUpWithEmail}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
        />
      </div>
    )
  }

  // 3. Authenticated User Dashboard
  return (
    <div className="min-h-screen bg-[#fcfaf7] dark:bg-[#121316] text-zinc-800 dark:text-zinc-200 transition-colors duration-200 pb-12 selection:bg-amber-200 selection:text-zinc-900">
      {/* Brutal Notification Toast */}
      <Toast toast={toast} onClose={closeToast} />

      <main className="max-w-[480px] mx-auto p-3.5 sm:p-5">
        {/* Setup Banner if environment is not set */}
        {!isSupabaseConfigured && <SupabaseSetupBanner />}

        {/* User Profile Header with Theme Toggle */}
        <Header
          user={session.user}
          onLogout={handleLogout}
          isSyncing={isSyncing}
          darkMode={darkMode}
          onToggleTheme={toggleTheme}
        />

        {isDataLoading && !wallet ? (
          <div className="py-16 flex flex-col items-center justify-center text-zinc-600 dark:text-zinc-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-950 dark:text-white" />
            <span className="text-xs font-bold">Menyiapkan dompet pelajar Anda...</span>
          </div>
        ) : (
          <>
            {/* 1. Dual-Balance Card & Tambah Uang Saku Baru */}
            <DualBalanceCard
              wallet={wallet}
              todayExpense={todayExpense}
              targetGoal={targetGoal}
              onAddAllowance={handleAddAllowance}
              onAdjustCashBalance={handleAdjustCashBalance}
              onResetBalance={handleResetBalance}
              onUpdateTarget={handleUpdateTarget}
              isLoadingAction={isLoadingWeekly}
            />

            {/* 2. Checklist Rutin (Kas Senin & Bawa Bekal) */}
            <RoutineChecklist
              wallet={wallet}
              onPayKasSenin={handlePayKasSenin}
              onToggleBawaBekal={handleToggleBawaBekal}
              isLoadingKas={isLoadingKas}
              isLoadingBekal={isLoadingBekal}
            />

            {/* 3. Form Catat Pengeluaran */}
            <ExpenseForm
              sisaSaku={Number(wallet?.sisa_saku) || 0}
              totalCelengan={Number(wallet?.total_celengan) || 0}
              onAddExpense={handleAddExpense}
              isSubmitting={isSubmittingExpense}
            />

            {/* 4. Kelola Celengan Fisik */}
            <PiggyBankActions
              wallet={wallet}
              onSaveRemainingPocket={handleSaveRemainingPocket}
              onAddManualSavings={handleAddManualSavings}
              isSavingPocket={isSavingPocket}
              isAddingManual={isAddingManual}
            />

            {/* 5. Riwayat Transaksi */}
            <TransactionHistory
              transactions={transactions}
              onDeleteTransaction={handleDeleteTransaction}
              deletingId={deletingId}
              isLoading={isDataLoading}
            />
          </>
        )}

        <footer className="mt-8 text-center text-xs text-zinc-500 dark:text-zinc-500 font-semibold space-y-1">
          <p>SAKUIN &bull; Dompet &amp; Celengan Pintar Pelajar</p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-600">Mobile-First Soft Brutalism &bull; Mode Terang &amp; Gelap</p>
        </footer>
      </main>
    </div>
  )
}
