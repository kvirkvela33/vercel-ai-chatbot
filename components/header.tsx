'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Header() {
  return (
    <header className="flex h-12 items-center justify-between border-b px-4 shadow-sm">
      <div className="flex items-center space-x-2">
        <div className="rounded-full bg-pink-600 px-2.5 py-0.5 text-xs font-medium text-white shadow">
          HER
        </div>
      </div>
      <div className="text-sm font-semibold text-muted-foreground">
        Breakup Coach
      </div>
      <div className="w-8" /> {/* Spacer to visually center the title */}
    </header>
  )
}