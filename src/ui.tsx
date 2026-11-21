import logoUrl from './assets/logo.png'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'

export type Role = 'pemilik' | 'kasir' | 'staf' | 'pelanggan'
export type Ctx = {
  screen: string
  role: Role
  go: (s: string, r?: Role, drawer?: boolean) => void
  drawer: boolean
  setDrawer: (b: boolean) => void
  logout: boolean
  setLogout: (b: boolean) => void
  toast: (m: string) => void
}
export const App_ = createContext<Ctx>(null as unknown as Ctx)
export const useApp = () => useContext(App_)

export const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')
export const rp = (n: number) => 'Rp' + Math.abs(n).toLocaleString('id-ID')

export function useWidth() {
  const [w, setW] = useState(window.innerWidth)
  useEffect(() => {
    const f = () => setW(window.innerWidth)
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return w
}

export function Card({ children, className, pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <div className={cn('rounded-xl border border-line bg-white shadow-card', pad && 'p-5', className)}>{children}</div>
}

const tones = {
  ok: 'bg-green-50 text-green-700 ring-green-200',
  warn: 'bg-amber-50 text-amber-700 ring-amber-200',
  bad: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-blue-50 text-blue-700 ring-blue-200',
  brand: 'bg-brand-tint text-brand-dark ring-teal-200',
  gray: 'bg-slate-100 text-slate-600 ring-slate-200',
} as const
export type Tone = keyof typeof tones
export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', tones[tone])}>{children}</span>
}
export const statusTone: Record<string, Tone> = {
  'Antre Mesin': 'gray', Dicuci: 'info', Dikeringkan: 'warn', Disetrika: 'brand', Selesai: 'ok',
  Lunas: 'ok', Kasbon: 'bad', 'Stok Aman': 'ok', 'Stok Menipis': 'warn', Aktif: 'ok', Nonaktif: 'gray',
}
export const StatusBadge = ({ s }: { s: string }) => <Badge tone={statusTone[s] ?? 'gray'}>{s}</Badge>

export function Btn({ children, variant = 'primary', className, ...p }: { variant?: 'primary' | 'ghost' | 'danger' | 'wa' | 'soft' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const v = {
    primary: 'bg-brand text-white hover:bg-brand-dark',
    ghost: 'bg-white text-ink border border-line hover:bg-slate-50',
    danger: 'bg-bad text-white hover:bg-red-700',
    wa: 'bg-ok text-white hover:bg-green-700',
    soft: 'bg-brand-tint text-brand-dark hover:bg-teal-100',
  }[variant]
  return (
    <button {...p} className={cn('inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-45 disabled:hover:bg-inherit', v, className)}>
      {children}
    </button>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
    </label>
  )
}
export const inputCls = 'h-11 w-full rounded-[10px] border border-line bg-white px-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand focus:outline-2 focus:outline-brand/25'
export const Input = (p: React.InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn(inputCls, p.className)} />
export const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cn(inputCls, 'pr-8', p.className)} />

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (b: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-brand' : 'bg-slate-300')}>
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

export function Modal({ title, children, onClose, footer }: { title?: string; children: ReactNode; onClose: () => void; footer?: ReactNode }) {
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-slate-900/50" style={{ animation: 'fadein .2s' }} onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" style={{ animation: 'pop .2s' }}>
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg">{title}</h3>
            <button onClick={onClose} aria-label="Tutup" className="rounded-lg p-1 text-mute hover:bg-slate-100"><X size={18} /></button>
          </div>
        )}
        {children}
        {footer && <div className="mt-6 flex gap-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Metric({ label, value, sub, tone = 'ink', icon, children }: { label: string; value: string; sub?: ReactNode; tone?: 'ink' | 'bad' | 'ok'; icon?: ReactNode; children?: ReactNode }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-mute">{label}</p>
        {icon && <span className={cn('grid h-9 w-9 place-items-center rounded-[10px]', tone === 'bad' ? 'bg-red-50 text-bad' : tone === 'ok' ? 'bg-green-50 text-ok' : 'bg-brand-tint text-brand')}>{icon}</span>}
      </div>
      <p className={cn('mt-2 text-2xl font-bold tracking-tight', tone === 'bad' ? 'text-bad' : tone === 'ok' ? 'text-ok' : 'text-ink')}>{value}</p>
      {sub && <div className="mt-1 text-sm text-mute">{sub}</div>}
      {children}
    </Card>
  )
}
export const MetricGrid = ({ children }: { children: ReactNode }) => <div className="grid grid-cols-1 gap-4 min-[600px]:grid-cols-2 xl:grid-cols-4">{children}</div>

export function Progress({ pct, tone = 'brand' }: { pct: number; tone?: 'brand' | 'warn' | 'bad' | 'ok' }) {
  const c = { brand: 'bg-brand', warn: 'bg-warn', bad: 'bg-bad', ok: 'bg-ok' }[tone]
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cn('h-full rounded-full', c)} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  )
}

export type Col<T> = { h: string; r: (row: T) => ReactNode; className?: string }
export function DataTable<T>({ cols, rows, rowKey }: { cols: Col<T>[]; rows: T[]; rowKey: (r: T) => string }) {
  const actionIdx = cols.findIndex((c) => c.h === 'Aksi')
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-mute">
              {cols.map((c) => <th key={c.h} className="whitespace-nowrap px-4 py-3 font-semibold">{c.h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={rowKey(r)} className="border-b border-line last:border-0 hover:bg-slate-50/70">
                {cols.map((c) => <td key={c.h} className={cn('px-4 py-3.5 align-middle', c.className)}>{c.r(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={rowKey(r)} className="rounded-xl border border-line bg-white p-4">
            <div className="mb-2 text-base font-semibold">{cols[0].r(r)}</div>
            <dl className="space-y-2">
              {cols.slice(1).map((c, i) => i + 1 === actionIdx ? null : (
                <div key={c.h} className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-mute">{c.h}</dt>
                  <dd className="text-right font-medium">{c.r(r)}</dd>
                </div>
              ))}
            </dl>
            {actionIdx > 0 && <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">{cols[actionIdx].r(r)}</div>}
          </li>
        ))}
      </ul>
    </>
  )
}

export function Barcode({ code, className }: { code: string; className?: string }) {
  let seed = 7
  for (const ch of code) seed = (seed * 31 + ch.charCodeAt(0)) % 100003
  const bars: { x: number; w: number }[] = []
  let x = 6
  for (let i = 0; i < 58; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648
    const w = 1 + (seed >> 8) % 3
    if (i % 2 === 0) bars.push({ x, w })
    x += w + 1
  }
  return (
    <svg viewBox={`0 0 ${x + 6} 70`} className={className} role="img" aria-label={`Barcode ${code}`} preserveAspectRatio="none">
      <rect width="100%" height="100%" fill="#fff" />
      {bars.map((b, i) => <rect key={i} x={b.x} y="4" width={b.w} height="62" fill="#0F172A" />)}
    </svg>
  )
}

export function Logo({ light, size = 36 }: { light?: boolean; size?: number }) {
  const img = <img src={logoUrl} alt="LaundriSync" style={{ height: size * 1.25 }} className="w-auto object-contain" />
  return light ? <span className="inline-flex rounded-xl bg-white px-3 py-1.5">{img}</span> : img
}
