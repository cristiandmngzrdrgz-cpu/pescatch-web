'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search, Menu, X, Fish, ChevronDown, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORIES } from '@/types'

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [darkMode, setDarkMode] = useState(false)

  const toggleDark = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="sticky top-0 z-50 w-full" style={{
      background: 'rgba(10,19,38,0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(30,58,95,0.5)',
      boxShadow: '0 1px 20px rgba(0,0,0,0.3)',
    }}>
      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-4 px-4">
        <button
          className="lg:hidden hover:scale-105 transition-transform"
          style={{ color: '#8BA3C7' }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <Link href="/" className="flex items-center gap-2.5 no-underline group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(0,212,255,0.3)]"
            style={{ background: 'linear-gradient(135deg, #00D4FF, #1A2535)' }}>
            <Fish className="h-4.5 w-4.5" style={{ color: '#FFFFFF' }} />
          </div>
          <span className="font-extrabold text-xl tracking-tight" style={{ color: '#E8F0FE' }}>PesCatch</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 ml-8">
          <Link href="/" className="text-[0.925rem] font-medium transition-all duration-200 hover:text-[#00D4FF] relative py-1"
            style={{ color: '#E8F0FE' }}>
            Inicio
            <span className="absolute -bottom-px left-0 w-full h-0.5 bg-gradient-to-r from-[#00D4FF] to-[#FFB800] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </Link>
          {CATEGORIES.slice(0, 3).map((cat) => (
            <div key={cat.id} className="relative group">
              <Link href={`/categories/${cat.slug}`}
                className="flex items-center gap-1 text-[0.925rem] font-medium transition-all duration-200 hover:text-[#00D4FF] py-1"
                style={{ color: '#8BA3C7' }}>
                {cat.name}
                {cat.subcategories.length > 0 && <ChevronDown className="h-3 w-3 opacity-60 group-hover:rotate-180 transition-transform" />}
              </Link>
              {cat.subcategories.length > 0 && (
                <div className="absolute top-full left-0 hidden group-hover:block pt-2 z-50">
                  <div className="rounded-xl p-2 shadow-2xl min-w-[200px]" style={{
                    background: 'rgba(17,24,39,0.96)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(30,58,95,0.6)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 15px rgba(0,212,255,0.1)',
                  }}>
                    {cat.subcategories.map((sub) => (
                      <Link key={sub.id} href={`/categories/${cat.slug}/${sub.slug}`}
                        className="block px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:translate-x-1"
                        style={{ color: '#8BA3C7' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#00D4FF'; e.currentTarget.style.background = 'rgba(0,212,255,0.08)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#8BA3C7'; e.currentTarget.style.background = 'transparent' }}>
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <Link href="/blog" className="text-[0.925rem] font-medium transition-colors duration-200 hover:text-[#00D4FF]"
            style={{ color: '#8BA3C7' }}>
            Blog
          </Link>
          <Link href="/search" className="text-[0.925rem] font-medium transition-colors duration-200 hover:text-[#00D4FF]"
            style={{ color: '#8BA3C7' }}>
            Buscar
          </Link>
        </nav>

        <div className="flex-1" />

        <div className={`items-center gap-2 ${searchOpen ? 'flex flex-1' : 'hidden md:flex'}`}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (searchQuery.trim()) {
                window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
              }
            }}
            className="relative flex-1 max-w-sm"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#4A6080' }} />
            <Input
              placeholder="Buscar chollos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm rounded-lg transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(30,58,95,0.5)',
                color: '#E8F0FE',
              }}
            />
          </form>
        </div>

        <button
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200"
          style={{ border: '1px solid rgba(30,58,95,0.5)', background: 'rgba(255,255,255,0.04)', color: '#8BA3C7' }}
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label="Buscar"
        >
          <Search className="h-5 w-5" />
        </button>

        <button
          onClick={toggleDark}
          className="w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-105"
          style={{ border: '1px solid rgba(30,58,95,0.5)', background: 'rgba(255,255,255,0.04)', color: '#8BA3C7' }}
          aria-label="Modo oscuro"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <Link href="/admin">
          <Button variant="ghost" size="sm" className="text-xs transition-all duration-200 hover:text-[#00D4FF]"
            style={{ color: '#8BA3C7' }}>
            Admin
          </Button>
        </Link>
      </div>

      {menuOpen && (
        <div className="border-t lg:hidden" style={{
          background: 'rgba(10,19,38,0.98)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(30,58,95,0.5)',
        }}>
          <div className="px-4 py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (searchQuery.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
                }
              }}
              className="relative mb-4"
            >
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#4A6080' }} />
              <Input
                placeholder="Buscar chollos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-sm rounded-xl w-full"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(30,58,95,0.5)', color: '#E8F0FE' }}
              />
            </form>
            <nav className="flex flex-col gap-1">
              {[
                { href: '/', label: 'Inicio' },
                ...CATEGORIES.map(cat => ({
                  href: `/categories/${cat.slug}`,
                  label: cat.name,
                  subs: cat.subcategories.map(s => ({ href: `/categories/${cat.slug}/${s.slug}`, label: s.name })),
                })),
                { href: '/search', label: 'Buscar' },
              ].map((item, i) => (
                <div key={i}>
                  <Link href={item.href} className="block px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200"
                    style={{ color: '#8BA3C7' }}
                    onClick={() => setMenuOpen(false)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,212,255,0.06)'; e.currentTarget.style.color = '#00D4FF' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8BA3C7' }}>
                    {item.label}
                  </Link>
                  {'subs' in item && item.subs && (
                    <div className="ml-5 flex flex-col border-l border-[#1E3A5F] pl-3">
                      {item.subs.map((sub) => (
                        <Link key={sub.href} href={sub.href}
                          className="block px-3 py-2 text-sm rounded-lg transition-all duration-200"
                          onClick={() => setMenuOpen(false)}
                          style={{ color: '#4A6080' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#00D4FF' }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#4A6080' }}>
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
