import type { LucideIcon } from 'lucide-react'

import { Bun, Deno, Npm, Pnpm, Nrz, Yarn } from '@/components/icons'
import type { PackageManagerId } from '@/lib/install-commands'

/** Package manager icons — same set as https://benchmarks.nrz.khulnasoft.com */
const iconMap: Record<PackageManagerId, LucideIcon> = {
  nrz: Nrz,
  npm: Npm,
  pnpm: Pnpm,
  yarn: Yarn,
  bun: Bun,
  deno: Deno,
}

export function getPackageManagerIcon(
  id: PackageManagerId,
): LucideIcon {
  return iconMap[id]
}
