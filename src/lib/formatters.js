// Format number to Indonesian Rupiah (e.g. 50000 -> "Rp50.000")
export const formatRupiah = (number) => {
  const num = Number(number) || 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num).replace(/\s+/g, '')
}

// Format date into human readable Indonesian string for display
export const formatRelativeTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()

  const isTodayDate =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  const timeString = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isTodayDate) return `Hari ini, ${timeString}`
  if (isYesterday) return `Kemarin, ${timeString}`

  return `${date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}, ${timeString}`
}

// Format local Indonesian date string for `tanggal` column in Supabase (e.g. "15 Nov 2026")
export const formatTanggalIndo = (dateInput = new Date()) => {
  const date = new Date(dateInput)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Check if a date string or timestamp is today in local time
export const isToday = (isoString) => {
  if (!isoString) return false
  const date = new Date(isoString)
  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}
