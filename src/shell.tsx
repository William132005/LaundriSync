import { useEffect, useState, type ReactNode } from 'react'
import { LayoutDashboard, FilePlus2, ClipboardList, Wallet, BarChart3, Boxes, History, Users, Settings, CreditCard, ScanLine, LogOut, Menu, ChevronDown, UserCircle, Search, ReceiptText, X, Crown } from 'lucide-react'
import { useStore } from './store'
import { useApp, useWidth, cn, Logo, Modal, Btn, type Role } from './ui'

type Nav = { id: string; label: string; icon: ReactNode; also?: string[] }
const I = 18
export const NAV: Record<Exclude<Role, 'pelanggan'>, Nav[]> = {
  pemilik: [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={I} /> },
    { id: 'transaksi', label: 'Transaksi Baru', icon: <FilePlus2 size={I} />, also: ['konfirmasi'] },
    { id: 'pesanan', label: 'Daftar Pesanan', icon: <ClipboardList size={I} /> },
    { id: 'piutang', label: 'Piutang', icon: <Wallet size={I} /> },
    { id: 'laporan', label: 'Laporan Keuangan', icon: <BarChart3 size={I} /> },
    { id: 'inventaris', label: 'Inventaris', icon: <Boxes size={I} /> },
    { id: 'log', label: 'Log Karyawan', icon: <History size={I} /> },
    { id: 'pengguna', label: 'Karyawan & Pengguna', icon: <Users size={I} /> },
    { id: 'pengaturan', label: 'Pengaturan', icon: <Settings size={I} /> },
    { id: 'langganan', label: 'Langganan & Paket', icon: <CreditCard size={I} /> },
  ],
  kasir: [
    { id: 'k-dashboard', label: 'Dashboard Kasir', icon: <LayoutDashboard size={I} /> },
    { id: 'transaksi', label: 'Transaksi Baru', icon: <FilePlus2 size={I} />, also: ['konfirmasi'] },
    { id: 'pesanan', label: 'Daftar Pesanan', icon: <ClipboardList size={I} /> },
  ],
  staf: [
    { id: 'scan', label: 'Scan Status', icon: <ScanLine size={I} /> },
    { id: 'riwayat-scan', label: 'Riwayat Scan', icon: <History size={I} /> },
  ],
}
export const HOME: Record<Role, string> = { pemilik: 'dashboard', kasir: 'k-dashboard', staf: 'scan', pelanggan: 'c-track' }
const ROLE_LABEL = { pemilik: 'Pemilik', kasir: 'Kasir', staf: 'Staf Produksi' }
const ini = (n?: string) => (n ?? '?').split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase()

function NavList({ onPick }: { onPick?: () => void }) {
  const { role, screen, go, setLogout, setDrawer } = useApp()
  const items = NAV[role as keyof typeof NAV]
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label="Navigasi utama">
      {items.map((n) => {
        const active = screen === n.id || n.also?.includes(screen)
        return (
          <button key={n.id} onClick={() => { go(n.id); onPick?.() }} aria-current={active ? 'page' : undefined}
            className={cn('flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm font-semibold transition',
              active ? 'bg-brand-tint text-brand' : 'text-mute hover:bg-slate-50 hover:text-ink')}>
            {n.icon}{n.label}
          </button>
        )
      })}
      {onPick && (
        <button onClick={() => { setDrawer(false); setLogout(true) }} className="mt-2 flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-sm font-semibold text-bad hover:bg-red-50">
          <LogOut size={I} />Logout
        </button>
      )}
    </nav>
  )
}
function PackageCard() {
  const { role } = useApp()
  const { plan, settings } = useStore()
  const pasti = plan === 'Pasti'
  return (
    <div className="m-3 rounded-xl bg-brand-tint p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-brand-dark"><Crown size={14} />Paket aktif</div>
      <p className="mt-1 text-sm font-bold">{pasti ? 'Paket Pasti' : 'Paket Tertib'}</p>
      <p className="text-xs text-mute">{role === 'pemilik' ? 'Aktif s/d 12 Des 2026' : settings.outlet}</p>
      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-ok"><span className="h-2 w-2 rounded-full bg-ok" />Online</span>
    </div>
  )
}

export function Shell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const { role, drawer, setDrawer, logout, setLogout, go, screen } = useApp()
  const { settings, me } = useStore()
  const user = me(role)
  const w = useWidth()
  const desktop = w >= 1200
  const [collapsed, setCollapsed] = useState(false)
  const [menu, setMenu] = useState(false)
  useEffect(() => { if (desktop) setDrawer(false) }, [desktop, setDrawer])
  useEffect(() => setMenu(false), [screen])
  const showSide = desktop && !collapsed
  return (
    <div className="min-h-screen">
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white transition-transform duration-200', showSide ? 'translate-x-0' : '-translate-x-full')} aria-hidden={!showSide}>
        <div className="flex h-16 items-center px-5"><Logo /></div>
        <NavList />
        <PackageCard />
      </aside>

      {!desktop && drawer && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-slate-900/50" style={{ animation: 'fadein .2s' }} onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl" style={{ animation: 'slidein .22s' }} role="dialog" aria-label="Menu navigasi">
            <div className="flex h-16 items-center justify-between px-5"><Logo />
              <button onClick={() => setDrawer(false)} aria-label="Tutup menu" className="rounded-lg p-1.5 text-mute hover:bg-slate-100"><X size={18} /></button>
            </div>
            <NavList onPick={() => setDrawer(false)} />
            <PackageCard />
          </aside>
        </div>
      )}

      <div className={cn('transition-[margin] duration-200', showSide ? 'ml-64' : 'ml-0')}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-white px-4 sm:px-6">
          <button onClick={() => (desktop ? setCollapsed((c) => !c) : setDrawer(true))} aria-label="Buka atau tutup menu" className="grid h-10 w-10 place-items-center rounded-[10px] text-ink hover:bg-slate-100"><Menu size={22} /></button>
          <div className="relative flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm font-semibold sm:block">{settings.outlet}</span>
            <span className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-semibold text-brand-dark">{ROLE_LABEL[role as keyof typeof ROLE_LABEL]}</span>
            <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-1 rounded-full hover:bg-slate-50" aria-label="Menu profil" aria-expanded={menu}>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-bold text-white">{ini(user?.nama)}</span>
              <ChevronDown size={14} className="text-mute" />
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                <div className="absolute right-0 top-12 z-20 w-56 rounded-xl border border-line bg-white p-1.5 shadow-xl" style={{ animation: 'pop .15s' }}>
                  <div className="border-b border-line px-3 py-2"><p className="text-sm font-semibold">{user?.nama}</p><p className="text-xs text-mute">{ROLE_LABEL[role as keyof typeof ROLE_LABEL]} · {settings.outlet}</p></div>
                  <button onClick={() => { setMenu(false); if (role === 'pemilik') go('pengaturan') }} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-50"><UserCircle size={16} />Profil Saya</button>
                  <button onClick={() => { setMenu(false); setLogout(true) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-bad hover:bg-red-50"><LogOut size={16} />Logout</button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="p-6">
          <div className="mx-auto max-w-[1180px]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl tracking-tight">{title}</h1>
              {actions}
            </div>
            {children}
          </div>
        </main>
      </div>

      {logout && <LogoutModal />}
    </div>
  )
}

export function LogoutModal() {
  const { role, setLogout, go } = useApp()
  return (
    <Modal onClose={() => setLogout(false)}
      footer={<><Btn variant="ghost" className="flex-1" onClick={() => setLogout(false)}>Batal</Btn><Btn variant="danger" className="flex-1" onClick={() => { setLogout(false); go('login-' + role) }}>Ya, Logout</Btn></>}>
      <div className="text-center">
        <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-red-50 text-bad"><LogOut size={22} /></span>
        <h3 className="text-lg">Akhiri sesi Anda?</h3>
        <p className="mt-1 text-sm text-mute">Anda akan keluar dari LaundriSync dan kembali ke halaman login.</p>
      </div>
    </Modal>
  )
}

export function CustomerShell({ children }: { children: ReactNode }) {
  const { go, drawer, setDrawer, screen } = useApp()
  const { settings } = useStore()
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white px-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setDrawer(true)} aria-label="Buka menu" className="grid h-10 w-10 place-items-center rounded-[10px] hover:bg-slate-100"><Menu size={22} /></button>
          <Logo size={30} />
        </div>
        <Btn variant="ghost" className="min-h-9 px-3" onClick={() => go('c-end')}><LogOut size={16} />Keluar</Btn>
      </header>
      {drawer && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-slate-900/50" style={{ animation: 'fadein .2s' }} onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl" style={{ animation: 'slidein .22s' }}>
            <div className="flex h-16 items-center justify-between px-5"><Logo />
              <button onClick={() => setDrawer(false)} aria-label="Tutup menu" className="rounded-lg p-1.5 text-mute hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="flex-1 space-y-1 px-3 py-2">
              {[['c-track', 'Lacak Pesanan', <Search size={I} />], ['c-history', 'Riwayat Pesanan', <ReceiptText size={I} />]].map(([id, l, ic]) => (
                <button key={id as string} onClick={() => go(id as string)} className={cn('flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-semibold', screen.startsWith(id as string) ? 'bg-brand-tint text-brand' : 'text-mute hover:bg-slate-50')}>{ic}{l}</button>
              ))}
              <button onClick={() => go('c-end')} className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-semibold text-bad hover:bg-red-50"><LogOut size={I} />Keluar</button>
            </div>
            <div className="m-3 rounded-xl bg-brand-tint p-4 text-xs text-mute">Pelacakan oleh <b className="text-brand-dark">{settings.outlet}</b><br />Didukung LaundriSync</div>
          </aside>
        </div>
      )}
      <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-5">{children}</main>
    </div>
  )
}
