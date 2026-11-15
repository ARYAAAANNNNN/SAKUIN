import { LogOut, Wallet } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export const Header = ({ user, onLogout, isSyncing, darkMode, onToggleTheme }) => {
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Pelajar'

  return (
    <header className="mb-4">
      <div className="flex items-center justify-between gap-2 brutal-card bg-white dark:bg-zinc-900 p-3 border-2 border-zinc-800 dark:border-zinc-700 shadow-[3px_3px_0px_0px_#27272a]">
        {/* Brand & Greetings */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-300 dark:bg-amber-400 border-2 border-zinc-800 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-[1.5px_1.5px_0px_0px_#27272a]">
            <Wallet className="w-5 h-5 text-zinc-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-lg text-zinc-900 dark:text-white tracking-tight">
                SAKUIN
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-md">
                Pelajar
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {isSyncing ? (
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Menyinkronkan...
                </span>
              ) : (
                <span className="truncate">Halo, <b className="text-zinc-800 dark:text-zinc-200">{fullName}</b></span>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions: Theme Toggle, Avatar, Logout */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle darkMode={darkMode} onToggle={onToggleTheme} />

          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full border-2 border-zinc-800 dark:border-zinc-600 object-cover shadow-[1.5px_1.5px_0px_0px_#27272a]"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-800 dark:border-zinc-600 flex items-center justify-center text-xs font-bold text-zinc-800 dark:text-zinc-200 shadow-[1.5px_1.5px_0px_0px_#27272a]">
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}

          <button
            onClick={onLogout}
            title="Keluar dari akun"
            className="p-2 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900 text-zinc-900 dark:text-rose-200 border-2 border-zinc-800 dark:border-zinc-700 rounded-xl transition-all shadow-[2px_2px_0px_0px_#27272a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
            aria-label="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
