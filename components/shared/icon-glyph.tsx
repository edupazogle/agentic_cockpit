import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Bot,
  BrainCircuit,
  Database,
  FileCheck2,
  PhoneCall,
  RadioTower,
  ShieldAlert,
  Sparkles,
  Truck,
  UserRoundCheck,
  Wrench,
} from 'lucide-react'

import type { IconKey } from '@/lib/domain/types'

const iconMap: Record<IconKey, LucideIcon> = {
  activity: Activity,
  bot: Bot,
  brain: BrainCircuit,
  database: Database,
  file: FileCheck2,
  phone: PhoneCall,
  shield: ShieldAlert,
  sparkles: Sparkles,
  tower: RadioTower,
  truck: Truck,
  user: UserRoundCheck,
  wrench: Wrench,
}

interface IconGlyphProps {
  icon: IconKey
  className?: string
}

export function IconGlyph({ icon, className }: IconGlyphProps) {
  const Glyph = iconMap[icon]
  return <Glyph className={className} strokeWidth={1.8} />
}
