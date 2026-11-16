import { useState } from 'react'
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  X,
  ShieldAlert,
  PiggyBank,
  Coins,
  KeyRound,
  ArrowRight,
  RefreshCw,
  HelpCircle,
} from 'lucide-react'
import { SupabaseSetupBanner } from './SupabaseSetupBanner'
import { ThemeToggle } from './ThemeToggle'
import { isSupabaseConfigured } from '../lib/supabase'

export const LoginScreen = ({
  onLoginWithGoogle,
  onLoginWithEmail,
  onSignUpWithEmail,
  onResetPassword,
  onResendVerification,
  darkMode,
  onToggleTheme,
}) => {
  const [activeTab, setActiveTab] = useState('masuk') // 'masuk' | 'daftar'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loadingType, setLoadingType] = useState(null) // 'email' | 'google' | null
  const [errorMsg, setErrorMsg] = useState('')
  const [isUnconfirmedEmail, setIsUnconfirmedEmail] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [registrationSuccessData, setRegistrationSuccessData] = useState(null)

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [isSendingForgot, setIsSendingForgot] = useState(false)
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('')
  const [forgotErrorMsg, setForgotErrorMsg] = useState('')

  // Resend verification email state
  const [isResending, setIsResending] = useState(false)
  const [resendStatusMsg, setResendStatusMsg] = useState('')

  // Google setup modal
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [copiedField, setCopiedField] = useState(null)

  const GOOGLE_CLIENT_ID = 'Dapatkan dari Google Cloud Console'
  const GOOGLE_CLIENT_SECRET = 'Dapatkan dari Google Cloud Console'

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const resetFormState = (tab) => {
    setActiveTab(tab)
    setErrorMsg('')
    setSuccessMsg('')
    setIsUnconfirmedEmail(false)
    setResendStatusMsg('')
    setRegistrationSuccessData(null)
  }

  const friendlyAuthError = (err) => {
    const msg = (err?.message || '').toLowerCase()
    if (msg.includes('invalid login credentials')) {
      return 'Email atau password salah. Jika belum pernah mendaftar, silakan klik tab "Daftar Baru" di atas.'
    }
    if (msg.includes('email not confirmed')) {
      setIsUnconfirmedEmail(true)
      return 'Email Anda belum dikonfirmasi. Silakan periksa inbox/spam email Anda, atau gunakan tombol di bawah untuk kirim ulang email verifikasi.'
    }
    if (msg.includes('user already registered')) {
      return 'Email ini sudah pernah terdaftar! Silakan beralih ke tab "Masuk" untuk login.'
    }
    if (msg.includes('password should be at least 6 characters')) {
      return 'Password minimal 6 karakter. Harap masukkan password yang lebih panjang.'
    }
    if (msg.includes('provider is not enabled') || msg.includes('unsupported provider')) {
      return 'Google OAuth belum diaktifkan di dashboard Supabase.'
    }
    if (msg.includes('network') || msg.includes('failed to fetch')) {
      return 'Gagal terhubung ke server Supabase. Pastikan koneksi internet Anda aktif.'
    }
    return err?.message || 'Gagal memproses autentikasi. Periksa kredensial Anda.'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setIsUnconfirmedEmail(false)
    setResendStatusMsg('')

    const cleanEmail = email.trim()

    if (!cleanEmail || !password) {
      setErrorMsg('Harap isi alamat email dan password.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('Password minimal harus 6 karakter.')
      return
    }

    if (activeTab === 'daftar') {
      if (!fullName.trim()) {
        setErrorMsg('Harap masukkan nama lengkap pelajar.')
        return
      }

      if (password !== confirmPassword) {
        setErrorMsg('Konfirmasi password tidak cocok! Pastikan kolom password dan ulangi password sama persis.')
        return
      }
    }

    setLoadingType('email')
    try {
      if (activeTab === 'daftar') {
        const result = await onSignUpWithEmail({
          email: cleanEmail,
          password,
          namaLengkap: fullName.trim(),
        })

        if (result?.requiresEmailVerification) {
          setRegistrationSuccessData({
            email: cleanEmail,
            namaLengkap: fullName.trim(),
          })
          setSuccessMsg(
            'Pendaftaran berhasil! Akun Anda telah terdaftar di sistem SAKUIN.'
          )
        }
      } else {
        await onLoginWithEmail({
          email: cleanEmail,
          password,
        })
      }
    } catch (err) {
      setErrorMsg(friendlyAuthError(err))
    } finally {
      setLoadingType(null)
    }
  }

  // Pindah langsung ke tab login setelah registrasi
  const handleProceedToLogin = () => {
    setActiveTab('masuk')
    setPassword('')
    setConfirmPassword('')
    setErrorMsg('')
    setSuccessMsg('Silakan masukkan password yang baru saja Anda daftarkan untuk masuk.')
    setRegistrationSuccessData(null)
  }

  // Kirim ulang email verifikasi
  const handleResendConfirm = async (targetEmail) => {
    const toSend = targetEmail || email.trim()
    if (!toSend) {
      setErrorMsg('Harap isi alamat email terlebih dahulu.')
      return
    }

    setIsResending(true)
    setResendStatusMsg('')
    try {
      if (onResendVerification) {
        await onResendVerification(toSend)
        setResendStatusMsg(`Email verifikasi berhasil dikirim ulang ke ${toSend}. Silakan cek inbox atau spam!`)
      } else {
        setResendStatusMsg('Fitur kirim ulang email verifikasi tidak tersedia.')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengirim ulang email verifikasi.')
    } finally {
      setIsResending(false)
    }
  }

  // Handler Lupa Password
  const handleSendForgotPassword = async (e) => {
    e.preventDefault()
    setForgotErrorMsg('')
    setForgotSuccessMsg('')

    const cleanForgotEmail = forgotEmail.trim()
    if (!cleanForgotEmail) {
      setForgotErrorMsg('Harap masukkan alamat email.')
      return
    }

    setIsSendingForgot(true)
    try {
      if (onResetPassword) {
        await onResetPassword(cleanForgotEmail)
        setForgotSuccessMsg(
          `Tautan pemulihan password telah dikirim ke ${cleanForgotEmail}. Periksa inbox atau folder spam Anda!`
        )
      } else {
        setForgotErrorMsg('Layanan reset password belum aktif.')
      }
    } catch (err) {
      setForgotErrorMsg(err.message || 'Gagal mengirim email reset password.')
    } finally {
      setIsSendingForgot(false)
    }
  }

  const handleGoogleLogin = async () => {
    setErrorMsg('')
    setSuccessMsg('')
    setIsUnconfirmedEmail(false)
    setLoadingType('google')

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (supabaseUrl) {
        try {
          const testRes = await fetch(`${supabaseUrl}/auth/v1/authorize?provider=google`, {
            method: 'GET',
          })
          if (testRes.status === 400) {
            const errData = await testRes.json().catch(() => ({}))
            if (
              errData?.msg?.toLowerCase().includes('provider is not enabled') ||
              errData?.error_code === 'validation_failed'
            ) {
              setShowGoogleModal(true)
              setErrorMsg('Google OAuth belum diaktifkan di dashboard Supabase proyek Anda.')
              setLoadingType(null)
              return
            }
          }
        } catch {
          // Abaikan CORS pre-flight, lanjut ke alur normal
        }
      }

      await onLoginWithGoogle()
    } catch (err) {
      const msg = err.message || ''
      if (
        msg.toLowerCase().includes('provider is not enabled') ||
        msg.toLowerCase().includes('unsupported provider')
      ) {
        setShowGoogleModal(true)
        setErrorMsg('Google Provider belum diaktifkan di Supabase Dashboard Anda.')
      } else {
        setErrorMsg(msg || 'Gagal login dengan akun Google.')
      }
      setLoadingType(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-md mx-auto p-4 sm:p-5 antialiased">
      <div>
        {!isSupabaseConfigured && <SupabaseSetupBanner />}

        {/* 1. Header Brand & Theme Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef08a] text-zinc-950 border-2 border-zinc-800 dark:border-zinc-700 rounded-full text-[11px] font-extrabold uppercase tracking-wider shadow-[2px_2px_0px_0px_#27272a]">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            FINANSIAL PINTAR PELAJAR
          </div>

          <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} />
        </div>

        {/* 2. Brand Hero Title */}
        <div className="mb-4 text-center">
          <h1 className="font-display font-black text-3xl sm:text-4xl text-zinc-900 dark:text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>SAKU</span>
            <span className="bg-[#fde68a] text-zinc-900 border-2 border-zinc-800 px-1.5 rounded-md shadow-[2px_2px_0px_0px_#27272a]">
              IN
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-300 dark:bg-amber-400 border-2 border-zinc-800 dark:border-zinc-700 inline-flex items-center justify-center text-zinc-950 shadow-[1.5px_1.5px_0px_0px_#27272a] ml-1.5 -translate-y-0.5">
              <Coins className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
            </div>
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
            Atur saku harian &amp; mingguan, tabung sisa di celengan, dan jangan lupa kas sekolah!
          </p>
        </div>

        {/* 3. Main Auth Card with Tab Switcher */}
        <div className="brutal-card bg-white dark:bg-zinc-900 p-4 sm:p-5 border-2 border-zinc-800 dark:border-zinc-700 mb-4 shadow-[4px_4px_0px_0px_#27272a]">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border-2 border-zinc-800 dark:border-zinc-700 mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => resetFormState('masuk')}
              className={`py-2 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'masuk'
                  ? 'bg-[#fef08a] text-zinc-950 font-black border-2 border-zinc-800 shadow-[1px_1px_0px_0px_#27272a]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => resetFormState('daftar')}
              className={`py-2 rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'daftar'
                  ? 'bg-[#fef08a] text-zinc-950 font-black border-2 border-zinc-800 shadow-[1px_1px_0px_0px_#27272a]'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Daftar Baru
            </button>
          </div>

          {/* Special Post-Registration Success Card */}
          {registrationSuccessData && (
            <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-600 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-sm mb-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>🎉 Akun Berhasil Didaftarkan!</span>
              </div>
              <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed mb-3">
                Akun untuk <span className="font-bold underline">{registrationSuccessData.email}</span> sudah siap.
                Silakan langsung klik tombol di bawah untuk masuk ke dompet Anda:
              </p>
              <button
                type="button"
                onClick={handleProceedToLogin}
                className="w-full brutal-btn bg-emerald-400 hover:bg-emerald-500 text-zinc-950 py-2.5 px-3 rounded-lg border-2 border-zinc-900 font-black text-xs flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#27272a] cursor-pointer"
              >
                <span>Masuk dengan Akun Ini Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="mt-2.5 pt-2 border-t border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400">
                <span>Perlu verifikasi email?</span>
                <button
                  type="button"
                  onClick={() => handleResendConfirm(registrationSuccessData.email)}
                  disabled={isResending}
                  className="font-bold text-emerald-700 dark:text-emerald-300 underline hover:opacity-80 cursor-pointer flex items-center gap-1"
                >
                  {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  <span>Kirim Ulang Email</span>
                </button>
              </div>
            </div>
          )}

          {/* Inline Error Alert */}
          {errorMsg && (
            <div className="mb-3.5 p-3 bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-400 dark:border-rose-700 rounded-xl text-xs text-rose-950 dark:text-rose-200 font-bold">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                <div className="flex-1 leading-snug">
                  <div>{errorMsg}</div>

                  {/* Tombol aksi cepat jika belum terdaftar */}
                  {activeTab === 'masuk' && errorMsg.includes('invalid login credentials') && (
                    <button
                      type="button"
                      onClick={() => {
                        resetFormState('daftar')
                      }}
                      className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-amber-200 dark:bg-amber-900/60 text-zinc-900 dark:text-amber-100 rounded-md border border-zinc-800 text-[11px] font-extrabold cursor-pointer hover:bg-amber-300 transition"
                    >
                      <span>Belum punya akun? Buat akun di sini</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}

                  {/* Tombol kirim ulang email verifikasi */}
                  {isUnconfirmedEmail && (
                    <button
                      type="button"
                      onClick={() => handleResendConfirm(email)}
                      disabled={isResending}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-200 dark:bg-emerald-900/70 text-zinc-950 dark:text-emerald-100 rounded-md border border-zinc-800 text-[11px] font-extrabold cursor-pointer hover:bg-emerald-300 transition"
                    >
                      {isResending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      <span>Kirim Ulang Email Konfirmasi</span>
                    </button>
                  )}

                  {showGoogleModal && (
                    <button
                      type="button"
                      onClick={() => setShowGoogleModal(true)}
                      className="mt-1 text-[11px] underline font-extrabold text-rose-800 dark:text-rose-300 flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span>Klik di sini untuk panduan aktifkan Google di Supabase</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Feedback status kirim ulang email */}
          {resendStatusMsg && (
            <div className="mb-3.5 p-2.5 bg-emerald-50 dark:bg-emerald-950/70 border-2 border-emerald-500 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{resendStatusMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && !registrationSuccessData && (
            <div className="mb-3.5 p-2.5 bg-emerald-100 dark:bg-emerald-950/70 border-2 border-zinc-900 dark:border-emerald-600 rounded-xl text-xs text-emerald-950 dark:text-emerald-200 font-bold flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <span className="leading-snug">{successMsg}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Nama Lengkap (Khusus Mode Daftar) */}
            {activeTab === 'daftar' && (
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  Nama Lengkap Pelajar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rian Pratama"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full brutal-input bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-600 pl-9 pr-3 py-2 rounded-xl text-xs font-semibold placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="pelajar@sekolah.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full brutal-input bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-600 pl-9 pr-3 py-2 rounded-xl text-xs font-semibold placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300">
                  Password {activeTab === 'daftar' && <span className="font-normal">(Min. 6 Karakter)</span>}
                </label>
                {activeTab === 'masuk' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email)
                      setForgotErrorMsg('')
                      setForgotSuccessMsg('')
                      setShowForgotModal(true)
                    }}
                    className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Lupa password?</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full brutal-input bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-600 pl-9 pr-10 py-2 rounded-xl text-xs font-semibold placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password (Khusus Mode Daftar) */}
            {activeTab === 'daftar' && (
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  Ulangi Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Ketik ulang password di atas"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full brutal-input bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 pl-9 pr-10 py-2 rounded-xl text-xs font-semibold placeholder:text-zinc-400 dark:placeholder:text-zinc-500 ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-rose-500 dark:border-rose-500'
                        : confirmPassword && confirmPassword === password
                        ? 'border-emerald-500 dark:border-emerald-500'
                        : 'border-zinc-900 dark:border-zinc-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1">
                    Password tidak sama!
                  </p>
                )}
                {confirmPassword && confirmPassword === password && (
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Password cocok</span>
                  </p>
                )}
              </div>
            )}

            {/* Submit Button Utama */}
            <button
              type="submit"
              disabled={loadingType !== null}
              className="w-full brutal-btn py-3 px-4 rounded-xl font-black text-sm border-2 border-zinc-800 dark:border-zinc-700 bg-[#86efac] hover:bg-[#6ee7b7] text-zinc-950 shadow-[3px_3px_0px_0px_#27272a] active:translate-y-0.5 active:shadow-none transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loadingType === 'email' ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              ) : null}
              <span>
                {loadingType === 'email'
                  ? 'Memproses...'
                  : activeTab === 'masuk'
                  ? 'Masuk ke Dompetku'
                  : 'Daftar Akun SAKUIN'}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-zinc-200 dark:border-zinc-800 w-full"></div>
            <span className="bg-white dark:bg-zinc-900 px-2.5 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider absolute">
              ATAU LANJUTKAN DENGAN
            </span>
          </div>

          {/* Google OAuth Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loadingType !== null}
            className="w-full brutal-btn bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-900 dark:text-zinc-100 py-2.5 px-4 rounded-xl border-2 border-zinc-800 dark:border-zinc-700 shadow-[2px_2px_0px_0px_#27272a] flex items-center justify-center gap-2.5 text-xs font-extrabold active:translate-y-0.5 active:shadow-none transition cursor-pointer"
          >
            {loadingType === 'google' ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-900 dark:text-white" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loadingType === 'google' ? 'Menghubungkan ke Google...' : 'Masuk dengan Akun Google'}</span>
          </button>
        </div>

        {/* 4. Horizontal Feature Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
          <span className="brutal-badge bg-[#ecfdf5] dark:bg-[#132820] text-emerald-950 dark:text-emerald-200 border border-zinc-800 dark:border-emerald-800/60 px-2.5 py-1 rounded-full text-[11px] shadow-[1.5px_1.5px_0px_0px_#27272a] flex items-center gap-1.5 font-bold">
            <PiggyBank className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300 shrink-0" />
            <span>Auto Tabung 50%</span>
          </span>
          <span className="brutal-badge bg-[#fff1f2] dark:bg-[#2a1719] text-rose-950 dark:text-rose-200 border border-zinc-800 dark:border-rose-900/60 px-2.5 py-1 rounded-full text-[11px] shadow-[1.5px_1.5px_0px_0px_#27272a] flex items-center gap-1.5 font-bold">
            <span>📅</span>
            <span>Kas Senin</span>
          </span>
          <span className="brutal-badge bg-[#fef9c3] dark:bg-[#272115] text-amber-950 dark:text-amber-200 border border-zinc-800 dark:border-amber-900/60 px-2.5 py-1 rounded-full text-[11px] shadow-[1.5px_1.5px_0px_0px_#27272a] flex items-center gap-1.5 font-bold">
            <span>🍱</span>
            <span>Bawa Bekal</span>
          </span>
        </div>
      </div>

      {/* 5. Modal Lupa Password */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-xs">
          <div className="brutal-card bg-white dark:bg-zinc-900 max-w-sm w-full p-5 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-700 shadow-[4px_4px_0px_0px_#18181b] dark:shadow-[4px_4px_0px_0px_#27272a]">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-900 dark:border-zinc-700 mb-3">
              <div className="flex items-center gap-2 font-display font-black text-sm uppercase text-amber-600 dark:text-amber-400">
                <KeyRound className="w-5 h-5" />
                <span>Reset Password</span>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">
              Masukkan alamat email akun SAKUIN Anda. Kami akan mengirimkan tautan untuk membuat password baru.
            </p>

            {forgotErrorMsg && (
              <div className="mb-3 p-2 bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-700 rounded-lg text-xs text-rose-900 dark:text-rose-200 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{forgotErrorMsg}</span>
              </div>
            )}

            {forgotSuccessMsg && (
              <div className="mb-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-500 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 font-bold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="leading-snug">{forgotSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendForgotPassword} className="space-y-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Akun
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="pelajar@sekolah.sch.id"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full brutal-input bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-600 pl-9 pr-3 py-2 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2 px-3 border-2 border-zinc-900 dark:border-zinc-600 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={isSendingForgot}
                  className="flex-1 brutal-btn py-2 px-3 bg-amber-300 hover:bg-amber-400 text-zinc-950 border-2 border-zinc-900 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#27272a] cursor-pointer"
                >
                  {isSendingForgot ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{isSendingForgot ? 'Mengirim...' : 'Kirim Link'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Google Setup Guidance Modal (If Google is not enabled yet in Supabase) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-xs">
          <div className="brutal-card bg-white dark:bg-zinc-900 max-w-sm w-full p-5 text-zinc-900 dark:text-zinc-100 border-2 border-zinc-900 dark:border-zinc-700 shadow-[4px_4px_0px_0px_#18181b] dark:shadow-[4px_4px_0px_0px_#27272a]">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-900 dark:border-zinc-700 mb-3">
              <div className="flex items-center gap-2 font-display font-black text-sm uppercase text-amber-600 dark:text-amber-400">
                <ShieldAlert className="w-5 h-5" />
                <span>Aktifkan Google di Supabase</span>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">
              Google OAuth <b>belum di-enable</b> di proyek Supabase Anda. Anda hanya perlu menyalakan saklar Google dan menempelkan kunci di bawah ini:
            </p>

            <div className="space-y-2.5 text-xs">
              {/* Field 1: Client ID */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-zinc-600 dark:text-zinc-400 mb-0.5">
                  <span>1. Client ID (for OAuth)</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(GOOGLE_CLIENT_ID, 'client_id')}
                    className="text-amber-700 dark:text-amber-400 flex items-center gap-0.5 font-bold cursor-pointer"
                  >
                    {copiedField === 'client_id' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedField === 'client_id' ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
                <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 font-mono text-[10px] truncate select-all">
                  {GOOGLE_CLIENT_ID}
                </div>
              </div>

              {/* Field 2: Client Secret */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-extrabold uppercase text-zinc-600 dark:text-zinc-400 mb-0.5">
                  <span>2. Client Secret (for OAuth)</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(GOOGLE_CLIENT_SECRET, 'client_secret')}
                    className="text-amber-700 dark:text-amber-400 flex items-center gap-0.5 font-bold cursor-pointer"
                  >
                    {copiedField === 'client_secret' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedField === 'client_secret' ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
                <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 font-mono text-[10px] truncate select-all">
                  {GOOGLE_CLIENT_SECRET}
                </div>
              </div>
            </div>

            {/* Direct Link Button */}
            <a
              href="https://supabase.com/dashboard/project/fuopjeacnfuascyibddy/auth/providers"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full brutal-btn bg-amber-300 hover:bg-amber-400 dark:bg-amber-400 dark:hover:bg-amber-500 text-zinc-950 py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border-2 border-zinc-900 cursor-pointer shadow-[2px_2px_0px_0px_#18181b]"
            >
              <span>Buka Menu Google di Supabase</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400 text-center flex items-center justify-center gap-1">
              <HelpCircle className="w-3 h-3 shrink-0" />
              <span>Setelah Save di Supabase, tutup popup ini dan klik tombol Google!</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-2 text-[11px] text-zinc-500 dark:text-zinc-500 font-medium">
        SAKUIN &bull; Dibuat khusus untuk pelajar Indonesia &bull; 2026
      </footer>
    </div>
  )
}
