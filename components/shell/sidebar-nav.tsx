'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/pilots', label: 'Pilots', icon: '✈' },
  { href: '/hitl', label: 'HITL Queue', icon: '⚠' },
  { href: '/ops', label: 'Ops', icon: '📊' },
  { href: '/demo', label: 'Demo', icon: '▶' },
  { href: '/', label: 'Scenarios', icon: '⚡' },
] as const

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Main navigation" className="sidebar-nav">
      <ul className="sidebar-nav__list" role="list">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`sidebar-nav__item${isActive ? ' sidebar-nav__item--active' : ''}`}
              >
                <span className="sidebar-nav__icon" aria-hidden="true">
                  {icon}
                </span>
                <span className="sidebar-nav__label">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
