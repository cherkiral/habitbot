'use client'
import { Header } from '@/components/layout/header'

export default function РецептыPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Рецепты" />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted text-sm">Раздел в разработке</p>
      </div>
    </div>
  )
}