'use client'

export function ManageCookiesButton() {
  return (
    <button
      onClick={() => {
        localStorage.removeItem('cookie_consent')
        localStorage.removeItem('cookie_consent_date')
        window.location.reload()
      }}
      className="text-sm transition-colors duration-200 hover:text-[#00D4FF] text-left"
      style={{ color: '#4A6080' }}
    >
      Gestionar cookies
    </button>
  )
}
