import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Role } from './ui'

export const STATUSES = ['Antre Mesin', 'Dicuci', 'Dikeringkan', 'Disetrika', 'Selesai']
export type Order = { id: string; nama: string; wa: string; kg: number; svc: 'Reguler' | 'Ekspres'; status: string; bayar: 'Lunas' | 'Kasbon'; total: number; masuk: string; t: string[]; note?: string }
export type User = { id: string; nama: string; role: 'Pemilik' | 'Kasir' | 'Staf'; pin: string; aktif: boolean; email: string }
export type Item = { id: string; n: string; q: number; u: string; min: number; max: number }
export type Log = { id: string; at: string; staf: string; pin: string; resi: string; dari: string; ke: string }
export type Settings = { outlet: string; alamat: string; wa: string; reg: number; eks: number; kap: number; autoClose: boolean; waOn: boolean }
type Data = { orders: Order[]; users: User[]; items: Item[]; logs: Log[]; settings: Settings; plan: 'Tertib' | 'Pasti'; waUsed: number; terpakai: number; counts: number[]; rev: number; kas: number; seq: number; lastId: string }

/** Tanggal simulasi: 9 Feb 2026, jam mengikuti jam nyata. */
export const now = () => { const d = new Date(); return new Date(2026, 1, 9, d.getHours(), d.getMinutes()) }
const at = (hari: number, h: number, m: number) => new Date(2026, 1, 9 - hari, h, m).toISOString()
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':')
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
export const fmtFull = (iso: string) => `${fmtDate(iso)} · ${fmtTime(iso)}`
export const ageDays = (iso: string) => Math.round((new Date(2026, 1, 9).getTime() - new Date(new Date(iso).toDateString()).getTime()) / 864e5)

const mk = (id: string, nama: string, wa: string, kg: number, svc: 'Reguler' | 'Ekspres', status: string, bayar: 'Lunas' | 'Kasbon', total: number, hari: number, h: number, m: number): Order => {
  const base = new Date(at(hari, h, m)).getTime()
  const t = Array.from({ length: STATUSES.indexOf(status) + 1 }, (_, i) => new Date(base + i * 85 * 6e4).toISOString())
  return { id, nama, wa, kg, svc, status, bayar, total, masuk: t[0], t }
}
const RINA = '0812-3456-7890'
const seed = (): Data => ({
  orders: [
    mk('TRX-2026-0012', 'Rina Wijaya', RINA, 5, 'Reguler', 'Dicuci', 'Kasbon', 30000, 0, 8, 15),
    mk('TRX-2026-0011', 'Bagas Pramudya', '0821-5566-1203', 9, 'Ekspres', 'Dikeringkan', 'Lunas', 81000, 0, 7, 50),
    mk('TRX-2026-0010', 'Fajar Nugroho', '0878-3321-9054', 4, 'Reguler', 'Antre Mesin', 'Kasbon', 24000, 0, 7, 30),
    mk('TRX-2026-0009', 'Salsabila Putri', '0857-4410-2276', 6, 'Reguler', 'Disetrika', 'Lunas', 36000, 1, 16, 20),
    mk('TRX-2026-0008', 'Nabila Zahra', '0896-4455-7712', 10, 'Reguler', 'Selesai', 'Kasbon', 110000, 6, 15, 5),
    mk('TRX-2026-0007', 'Mega Lestari', '0813-7720-5531', 7, 'Reguler', 'Dicuci', 'Lunas', 42000, 1, 10, 10),
    mk('TRX-2026-0006', 'Yoga Firmansyah', '0812-7788-2301', 3.5, 'Ekspres', 'Selesai', 'Kasbon', 64000, 9, 11, 40),
    mk('TRX-2026-0005', 'Rizky Maulana', '0813-9087-6612', 7, 'Reguler', 'Selesai', 'Kasbon', 70000, 11, 9, 30),
    mk('TRX-2026-0004', 'Putri Anggraini', '0821-9876-1100', 11, 'Reguler', 'Selesai', 'Kasbon', 132000, 15, 14, 0),
    mk('TRX-2026-0003', 'Dimas Pratama', '0857-1203-4412', 6, 'Ekspres', 'Selesai', 'Kasbon', 78000, 18, 13, 15),
    mk('TRX-2026-0002', 'Hendra Saputra', '0813-5521-9087', 8, 'Reguler', 'Selesai', 'Kasbon', 95000, 21, 10, 20),
    mk('TRX-2026-0001', 'Rina Wijaya', RINA, 4, 'Reguler', 'Selesai', 'Lunas', 24000, 7, 9, 0),
    mk('TRX-2025-0291', 'Rina Wijaya', RINA, 6.5, 'Ekspres', 'Selesai', 'Lunas', 58500, 21, 11, 10),
    mk('TRX-2025-0300', 'Anisa Rahma', '0856-2210-4471', 9, 'Reguler', 'Selesai', 'Kasbon', 82000, 12, 10, 45),
    mk('TRX-2025-0305', 'Citra Dewi', '0822-1145-9038', 5, 'Ekspres', 'Selesai', 'Kasbon', 56000, 8, 16, 30),
    mk('TRX-2025-0310', 'Eko Prasetyo', '0895-3321-7745', 10, 'Reguler', 'Selesai', 'Kasbon', 60000, 4, 12, 0),
    mk('TRX-2025-0318', 'Wulan Sari', '0877-6402-1188', 8, 'Reguler', 'Selesai', 'Kasbon', 64000, 3, 15, 50),
  ],
  users: [
    { id: 'u1', nama: 'Budi Santoso', role: 'Pemilik', pin: '123456', aktif: true, email: 'pemilik@laundrisync.id' },
    { id: 'u2', nama: 'Sari Rahayu', role: 'Kasir', pin: '203', aktif: true, email: 'sari.kasir@laundrisync.id' },
    { id: 'u3', nama: 'Dewi Lestari', role: 'Staf', pin: '102', aktif: true, email: 'dewi.staf@laundrisync.id' },
    { id: 'u4', nama: 'Joko Widodo', role: 'Staf', pin: '201', aktif: true, email: 'joko.staf@laundrisync.id' },
    { id: 'u5', nama: 'Anton Wijaya', role: 'Staf', pin: '104', aktif: false, email: 'anton.staf@laundrisync.id' },
  ],
  items: [{ id: 'i1', n: 'Deterjen', q: 24, u: 'kg', min: 10, max: 40 }, { id: 'i2', n: 'Pewangi', q: 3, u: 'liter', min: 5, max: 20 }, { id: 'i3', n: 'Plastik', q: 420, u: 'lembar', min: 100, max: 800 }, { id: 'i4', n: 'Gas LPG', q: 1, u: 'tabung', min: 2, max: 6 }],
  logs: [
    ['l1', 9, 40, 'Joko', '201', 'TRX-2026-0012', 'Antre Mesin', 'Dicuci'], ['l2', 9, 12, 'Dewi', '102', 'TRX-2026-0011', 'Dicuci', 'Dikeringkan'], ['l3', 8, 55, 'Sari', '203', 'TRX-2026-0009', 'Dikeringkan', 'Disetrika'],
    ['l4', 8, 5, 'Joko', '201', 'TRX-2026-0010', 'Antre Mesin', 'Dicuci'], ['l5', 7, 48, 'Sari', '203', 'TRX-2026-0007', 'Antre Mesin', 'Dicuci'],
  ].map(([id, h, m, staf, pin, resi, dari, ke]) => ({ id: id as string, at: at(0, h as number, m as number), staf: staf as string, pin: pin as string, resi: resi as string, dari: dari as string, ke: ke as string })),
  settings: { outlet: 'Laundry Berkah Jaya', alamat: 'Jl. Kaliurang Km 5, Yogyakarta', wa: '0812-3456-7000', reg: 6000, eks: 9000, kap: 100, autoClose: true, waOn: true },
  plan: 'Tertib', waUsed: 88, terpakai: 82, counts: [6, 9, 7, 6, 14], rev: 1240000, kas: 1010000, seq: 12, lastId: 'TRX-2026-0012',
})

const KEY = 'laundrisync-data-v1'
type Store = Data & {
  meId: string | null; me: (role: Role) => User | undefined; login: (role: Role, email: string, pin: string) => string | User
  addOrder: (i: { nama: string; wa: string; kg: number; svc: 'Reguler' | 'Ekspres'; bayar: 'Lunas' | 'Kasbon'; note?: string }) => Order
  advance: (id: string, actor: User | undefined) => void; markLunas: (id: string) => void
  sendWa: (n?: number) => boolean
  addUser: (u: Omit<User, 'id' | 'email' | 'aktif'>) => string | null; saveUser: (id: string, p: Partial<User>) => string | null
  addItem: (i: Omit<Item, 'id'>) => void; saveItem: (id: string, p: Partial<Item>) => void; delItem: (id: string) => void
  saveSettings: (s: Settings) => void; setPlan: (p: 'Tertib' | 'Pasti') => void; reset: () => void
  waQuota: number; sisa: number; piutang: Order[]
}
const Ctx = createContext<Store>(null as unknown as Store)
export const useStore = () => useContext(Ctx)
const uid = () => Math.random().toString(36).slice(2, 8)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [d, setD] = useState<Data>(() => { try { return JSON.parse(localStorage.getItem(KEY) || '') } catch { return seed() } })
  const [meId, setMeId] = useState<string | null>(null)
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(d)), [d])
  const up = useCallback((f: (p: Data) => Data) => setD(f), [])

  const api = useMemo<Store>(() => {
    const waQuota = d.plan === 'Pasti' ? 2000 : 500
    const emailOf = (nama: string, role: string) => `${nama.trim().split(/\s+/)[0].toLowerCase()}.${role.toLowerCase()}@laundrisync.id`
    const pinErr = (pin: string, role: string, ex?: string) => {
      if (role === 'Pemilik' ? pin.length < 3 : !/^\d{3}$/.test(pin)) return 'PIN harus 3 digit angka'
      if (d.users.some((u) => u.pin === pin && u.id !== ex)) return 'PIN sudah dipakai pengguna lain'
      return null
    }
    return {
      ...d, meId, waQuota, sisa: d.settings.kap - d.terpakai,
      piutang: d.orders.filter((o) => o.bayar === 'Kasbon').sort((a, b) => a.masuk.localeCompare(b.masuk)),
      me: (role) => d.users.find((u) => u.id === meId && u.role.toLowerCase() === (role === 'staf' ? 'staf' : role)) ?? d.users.find((u) => u.aktif && u.role.toLowerCase() === role),
      login: (role, email, pin) => {
        const u = d.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && (role === 'staf' ? x.role === 'Staf' : x.role.toLowerCase() === role))
        if (!u) return 'Email tidak terdaftar untuk peran ini'
        if (u.pin !== pin) return 'PIN salah'
        if (!u.aktif) return 'Akun dinonaktifkan. Hubungi pemilik outlet'
        setMeId(u.id); return u
      },
      addOrder: (i) => {
        const total = i.kg * (i.svc === 'Reguler' ? d.settings.reg : d.settings.eks)
        const seq = d.seq + 1, id = `TRX-2026-${String(seq).padStart(4, '0')}`, n = now().toISOString()
        const o: Order = { id, nama: i.nama, wa: i.wa, kg: i.kg, svc: i.svc, status: 'Antre Mesin', bayar: i.bayar, total, masuk: n, t: [n], note: i.note }
        up((p) => ({ ...p, orders: [o, ...p.orders], seq, lastId: id, terpakai: p.terpakai + i.kg, counts: p.counts.map((c, k) => (k === 0 ? c + 1 : c)), rev: p.rev + total, kas: p.kas + (i.bayar === 'Lunas' ? total : 0) }))
        return o
      },
      advance: (id, actor) => up((p) => {
        const o = p.orders.find((x) => x.id === id); if (!o) return p
        const k = STATUSES.indexOf(o.status); if (k >= 4) return p
        const n = now().toISOString(), ke = STATUSES[k + 1]
        const log: Log = { id: uid(), at: n, staf: actor?.nama.split(' ')[0] ?? 'Sistem', pin: actor?.pin ?? '-', resi: id, dari: o.status, ke }
        return { ...p, orders: p.orders.map((x) => (x.id === id ? { ...x, status: ke, t: [...x.t, n] } : x)), logs: [log, ...p.logs], counts: p.counts.map((c, j) => (j === k ? Math.max(0, c - 1) : j === k + 1 ? c + 1 : c)) }
      }),
      markLunas: (id) => up((p) => { const o = p.orders.find((x) => x.id === id); return o ? { ...p, orders: p.orders.map((x) => (x.id === id ? { ...x, bayar: 'Lunas' } : x)), kas: p.kas + o.total } : p }),
      sendWa: (n = 1) => { if (!d.settings.waOn || d.waUsed + n > waQuota) return false; up((p) => ({ ...p, waUsed: p.waUsed + n })); return true },
      addUser: (u) => {
        const e = pinErr(u.pin, u.role); if (e) return e
        up((p) => ({ ...p, users: [...p.users, { ...u, id: uid(), aktif: true, email: emailOf(u.nama, u.role) }] })); return null
      },
      saveUser: (id, patch) => {
        if (patch.pin !== undefined) { const u = d.users.find((x) => x.id === id)!; const e = pinErr(patch.pin, patch.role ?? u.role, id); if (e) return e }
        up((p) => ({ ...p, users: p.users.map((u) => (u.id === id ? { ...u, ...patch, ...(patch.nama || patch.role ? { email: emailOf(patch.nama ?? u.nama, patch.role ?? u.role) } : {}) } : u)) })); return null
      },
      addItem: (i) => up((p) => ({ ...p, items: [...p.items, { ...i, id: uid() }] })),
      saveItem: (id, patch) => up((p) => ({ ...p, items: p.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      delItem: (id) => up((p) => ({ ...p, items: p.items.filter((x) => x.id !== id) })),
      saveSettings: (s) => up((p) => ({ ...p, settings: s })),
      setPlan: (plan) => up((p) => ({ ...p, plan })),
      reset: () => { localStorage.removeItem(KEY); setD(seed()); setMeId(null) },
    }
  }, [d, meId, up])
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
