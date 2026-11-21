import { useCallback, useState } from 'react'
import { Map as MapIcon, X } from 'lucide-react'
import { App_, useApp, type Role, cn } from './ui'
import { HOME } from './shell'
import { Login, CustLogin, CustOtp, CustTrack, CustHistory, CustEnd } from './screens-auth'
import * as O from './screens-owner'
import * as K from './screens-ops'
import { StoreProvider, useStore } from './store'

const SCREENS: Record<string, () => React.ReactNode> = {
  'login-pemilik': () => <Login role="pemilik" />, 'login-kasir': () => <Login role="kasir" />, 'login-staf': () => <Login role="staf" />,
  'c-login': () => <CustLogin />, 'c-otp': () => <CustOtp />, 'c-track': () => <CustTrack paid={false} />, 'c-track-lunas': () => <CustTrack paid />, 'c-history': () => <CustHistory />, 'c-end': () => <CustEnd />,
  dashboard: () => <O.Dashboard />, laporan: () => <O.Laporan />, piutang: () => <O.Piutang />, inventaris: () => <O.Inventaris />, log: () => <O.Log />,
  pengguna: () => <O.Pengguna />, pengaturan: () => <O.Pengaturan />, langganan: () => <O.Langganan />,
  'k-dashboard': () => <K.KasirDashboard />, transaksi: () => <K.Transaksi />, konfirmasi: () => <K.Konfirmasi />, pesanan: () => <K.Pesanan />,
  scan: () => <K.Scan />, 'riwayat-scan': () => <K.RiwayatScan />,
}

const MAP: [string, [string, string, Role, boolean?][]][] = [
  ['Login', [['Login Pemilik', 'login-pemilik', 'pemilik'], ['Login Kasir', 'login-kasir', 'kasir'], ['Login Staf', 'login-staf', 'staf'], ['Pelanggan: Resi + WA', 'c-login', 'pelanggan'], ['Pelanggan: OTP', 'c-otp', 'pelanggan']]],
  ['Pemilik', [['Dashboard', 'dashboard', 'pemilik'], ['Transaksi Baru', 'transaksi', 'pemilik'], ['Konfirmasi', 'konfirmasi', 'pemilik'], ['Daftar Pesanan', 'pesanan', 'pemilik'], ['Piutang', 'piutang', 'pemilik'], ['Laporan Keuangan', 'laporan', 'pemilik'], ['Inventaris', 'inventaris', 'pemilik'], ['Log Karyawan', 'log', 'pemilik'], ['Karyawan & Pengguna', 'pengguna', 'pemilik'], ['Pengaturan', 'pengaturan', 'pemilik'], ['Langganan & Paket', 'langganan', 'pemilik']]],
  ['Drawer terbuka (<1200px)', [['Dashboard', 'dashboard', 'pemilik', true], ['Transaksi Baru', 'transaksi', 'pemilik', true], ['Daftar Pesanan', 'pesanan', 'pemilik', true], ['Langganan & Paket', 'langganan', 'pemilik', true], ['Pelacakan Pelanggan', 'c-track', 'pelanggan', true]]],
  ['Kasir', [['Dashboard Kasir', 'k-dashboard', 'kasir'], ['Transaksi Baru', 'transaksi', 'kasir'], ['Konfirmasi', 'konfirmasi', 'kasir'], ['Daftar Pesanan', 'pesanan', 'kasir']]],
  ['Staf Produksi', [['Scan', 'scan', 'staf'], ['Riwayat Scan', 'riwayat-scan', 'staf']]],
  ['Pelanggan', [['Tracking (Belum Bayar)', 'c-track', 'pelanggan'], ['Tracking (Lunas)', 'c-track-lunas', 'pelanggan'], ['Riwayat Pesanan', 'c-history', 'pelanggan'], ['Sesi Berakhir', 'c-end', 'pelanggan']]],
]

function ProtoMap() {
  const { go, screen } = useApp()
  const { reset } = useStore()
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed bottom-4 right-4 z-[80] print:hidden" style={{ bottom: screen.startsWith('c-track') || screen === 'transaksi' ? 84 : 16 }}>
      {open && (
        <div className="mb-2 max-h-[70vh] w-72 overflow-y-auto rounded-xl border border-line bg-white p-3 shadow-2xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-mute">Peta Prototipe</p>
          {MAP.map(([g, items]) => <div key={g} className="mb-2"><p className="px-2 pb-1 text-xs font-semibold text-brand">{g}</p>
            {items.map(([l, id, r, d]) => <button key={g + l} onClick={() => { go(id, r, d); setOpen(false) }} className={cn('block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-brand-tint', screen === id && !d && 'font-semibold text-brand')}>{l}</button>)}</div>)}
          <button onClick={() => { if (confirm('Reset semua data demo ke kondisi awal?')) { reset(); go('login-pemilik', 'pemilik'); setOpen(false) } }} className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-left text-sm text-bad hover:bg-red-50">Reset data demo</button>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-label="Peta prototipe" className="ml-auto grid h-11 w-11 place-items-center rounded-full bg-ink text-white shadow-xl hover:bg-slate-700">{open ? <X size={18} /> : <MapIcon size={18} />}</button>
    </div>
  )
}

export default function App() {
  return <StoreProvider><Inner /></StoreProvider>
}

function Inner() {
  const [screen, setScreen] = useState('login-pemilik')
  const [role, setRole] = useState<Role>('pemilik')
  const [drawer, setDrawer] = useState(false)
  const [logout, setLogout] = useState(false)
  const [msg, setMsg] = useState('')
  const go = useCallback((s: string, r?: Role, d = false) => {
    if (r) setRole(r)
    setScreen(s); setDrawer(d); setLogout(false); window.scrollTo(0, 0)
  }, [])
  const toast = useCallback((m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2600) }, [])
  void HOME
  return (
    <App_.Provider value={{ screen, role, go, drawer, setDrawer, logout, setLogout, toast }}>
      {SCREENS[screen]()}
      <ProtoMap />
      {msg && <div role="status" className="fixed left-1/2 top-4 z-[90] -translate-x-1/2 rounded-[10px] bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-xl" style={{ animation: 'pop .2s' }}>{msg}</div>}
    </App_.Provider>
  )
}
