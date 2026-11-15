import { Sun, Moon } from 'lucide-react'

export const ThemeToggle = ({ darkMode, onToggle }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="p-2 rounded-xl border-2 border-zinc-900 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-amber-300 shadow-[2px_2px_0px_0px_#18181b] dark:shadow-[2px_2px_0px_0px_#27272a] hover:bg-zinc-50 dark:hover:bg-zinc-700 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center shrink-0 cursor-pointer"
      title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
      aria-label="Toggle tema mode gelap atau terang"
    >
      {darkMode ? (
        <Sun className="w-4 h-4 text-amber-400 stroke-[2.5]" />
      ) : (
        <Moon className="w-4 h-4 text-zinc-800 stroke-[2.5]" />
      )}
    </button>
  )
}
