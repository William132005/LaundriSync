import { useState, useRef } from 'react'
import { Mail, Lock, Phone, ScanLine, MessageCircle, Check, ShieldCheck, Clock, ArrowRight, History } from 'lucide-react'
import { useApp, cn, Btn, Field, Input, Logo, Card, Badge, rp, type Role } from './ui'
import { CustomerShell, HOME } from './shell'
import { useStore, STATUSES, fmtFull, fmtDate, fmtTime, type Order } from './store'

const TABS: { id: Role; label: string }[] = [
  { id: 'pemilik', label: 'Pemilik' }, { id: 'kasir', label: 'Kasir' }, { id: 'staf', label: 'Staf' }, { id: 'pelanggan', label: 'Pelanggan' },
]
function AuthFrame({ children, role }: { children: React.ReactNode; role: Role }) {
  const { go } = useApp()
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-brand p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" /><div className="absolute -bottom-32 -left-10 h-96 w-96 rounded-full bg-black/10" />
        <Logo light />
        <div className="relative">
          <h2 className="max-w-md text-4xl font-bold leading-tight">Laundry Tertib, Keuangan Pasti</h2>
          <p className="mt-4 max-w-md text-teal-50/90">Kelola pesanan kiloan, piutang anak kos, dan laporan keuangan outlet Anda dalam satu aplikasi sederhana.</p>
          <ul className="mt-8 space-y-3 text-sm">
            {['Barcode resi dan tautan pelacakan untuk pelanggan', 'Buku piutang dan pengingat WhatsApp otomatis', 'Laporan laba-rugi harian tanpa Excel'].map((t) => <li key={t} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-white/20"><Check size={12} /></span>{t}</li>)}
          </ul>
        </div>
        <p className="relative text-xs text-teal-50/70">© 2026 LaundriSync</p>
      </div>
      <div className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <div className="mb-6 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={role === t.id} onClick={() => go(t.id === 'pelanggan' ? 'c-login' : 'login-' + t.id, t.id)}
                className={cn('rounded-[9px] py-2 text-xs font-semibold sm:text-sm', role === t.id ? 'bg-white text-brand shadow-card' : 'text-mute hover:text-ink')}>{t.label}</button>
            ))}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

const digits = (s: string) => s.replace(/\D/g, '')
let tracked = { resi: 'TRX-2026-0012', wa: '0812-3456-7890' }
const DEMO_OTP = '482913'

export function Login({ role }: { role: Exclude<Role, 'pelanggan'> }) {
  const { go, toast } = useApp()
  const { login, users } = useStore()
  const first = users.find((u) => u.aktif && u.role.toLowerCase() === role)
  const [email, setEmail] = useState(first?.email ?? '')
  const [pin, setPin] = useState('')
  const [err, setErr] = useState('')
  const title = { pemilik: 'Masuk sebagai Pemilik', kasir: 'Masuk sebagai Kasir', staf: 'Masuk sebagai Staf Produksi' }[role]
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !pin) return setErr('Email dan PIN wajib diisi')
    const r = login(role, email, pin)
    if (typeof r === 'string') return setErr(r)
    go(HOME[role], role)
  }
  return (
    <AuthFrame role={role}>
      <h1 className="text-2xl">{title}</h1>
      <p className="mt-1 text-sm text-mute">Masukkan email dan PIN untuk mengelola outlet Anda.</p>
      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        <Field label="Email"><div className="relative"><Mail size={16} className="absolute left-3 top-3.5 text-slate-400" /><Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr('') }} className="pl-9" autoComplete="username" /></div></Field>
        <Field label="PIN" hint={`Demo: PIN ${first?.pin ?? ''}`}><div className="relative"><Lock size={16} className="absolute left-3 top-3.5 text-slate-400" /><Input type="password" inputMode="numeric" value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setErr('') }} placeholder="Masukkan PIN" maxLength={6} className="pl-9 tracking-[0.3em]" autoComplete="current-password" /></div></Field>
        {err && <p role="alert" className="rounded-[10px] bg-red-50 p-3 text-sm font-medium text-red-700">{err}</p>}
        <div className="flex justify-end"><button type="button" onClick={() => toast('Tautan reset PIN dikirim ke WhatsApp terdaftar')} className="text-sm font-semibold text-brand hover:text-brand-dark hover:underline">Lupa PIN?</button></div>
        <Btn type="submit" className="w-full">Masuk</Btn>
      </form>
    </AuthFrame>
  )
}

export function CustLogin() {
  const { go } = useApp()
  const { orders } = useStore()
  const [resi, setResi] = useState(tracked.resi)
  const [wa, setWa] = useState(tracked.wa)
  const [err, setErr] = useState('')
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const o = orders.find((x) => x.id.toLowerCase() === resi.trim().toLowerCase())
    if (!o) return setErr('Nomor resi tidak ditemukan')
    if (digits(o.wa) !== digits(wa)) return setErr('Nomor WhatsApp tidak cocok dengan resi ini')
    tracked = { resi: o.id, wa: o.wa }; go('c-otp')
  }
  return (
    <AuthFrame role="pelanggan">
      <h1 className="text-2xl">Lacak Cucian Anda</h1>
      <p className="mt-1 text-sm text-mute">Masukkan nomor resi dan nomor WhatsApp yang terdaftar saat transaksi.</p>
      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        <Field label="Nomor Resi"><div className="relative"><ScanLine size={16} className="absolute left-3 top-3.5 text-slate-400" /><Input value={resi} onChange={(e) => { setResi(e.target.value); setErr('') }} className="pl-9" /></div></Field>
        <Field label="Nomor WhatsApp"><div className="relative"><Phone size={16} className="absolute left-3 top-3.5 text-slate-400" /><Input value={wa} inputMode="tel" onChange={(e) => { setWa(e.target.value); setErr('') }} className="pl-9" /></div></Field>
        {err && <p role="alert" className="rounded-[10px] bg-red-50 p-3 text-sm font-medium text-red-700">{err}</p>}
        <Btn type="submit" className="w-full">Kirim Kode OTP</Btn>
        <p className="flex items-center gap-2 text-xs text-mute"><ShieldCheck size={14} />Kode 6 digit akan dikirim melalui WhatsApp.</p>
      </form>
    </AuthFrame>
  )
}

export function CustOtp() {
  const { go, toast } = useApp()
  const [v, setV] = useState<string[]>(['', '', '', '', '', ''])
  const [err, setErr] = useState('')
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const set = (i: number, ch: string) => {
    const d = ch.replace(/\D/g, '').slice(-1)
    setErr(''); setV((p) => p.map((x, j) => (j === i ? d : x)))
    if (d && i < 5) refs.current[i + 1]?.focus()
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (v.join('').length < 6) return setErr('Masukkan 6 digit kode OTP')
    if (v.join('') !== DEMO_OTP) return setErr('Kode OTP salah')
    go('c-track')
  }
  return (
    <AuthFrame role="pelanggan">
      <h1 className="text-2xl">Verifikasi OTP</h1>
      <p className="mt-1 text-sm text-mute">Masukkan 6 digit kode yang dikirim ke WhatsApp <b className="text-ink">{tracked.wa}</b>.</p>
      <form className="mt-6" onSubmit={submit}>
        <div className="flex justify-between gap-2">
          {v.map((d, i) => (
            <input key={i} ref={(el) => { refs.current[i] = el }} value={d} inputMode="numeric" aria-label={`Digit ${i + 1}`}
              onChange={(e) => set(i, e.target.value)} onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && refs.current[i - 1]?.focus()}
              className="h-14 w-full min-w-0 rounded-[10px] border border-line bg-white text-center text-xl font-bold focus:border-brand focus:outline-2 focus:outline-brand/25" />
          ))}
        </div>
        <p className="mt-2 text-xs text-mute">Kode demo: {DEMO_OTP}</p>
        {err && <p role="alert" className="mt-3 rounded-[10px] bg-red-50 p-3 text-sm font-medium text-red-700">{err}</p>}
        <Btn type="submit" className="mt-6 w-full">Verifikasi dan Lacak</Btn>
        <div className="mt-4 flex items-center justify-between text-sm"><button type="button" onClick={() => go('c-login')} className="text-mute hover:text-ink">Ubah nomor</button>
          <button type="button" onClick={() => toast('Kode OTP baru dikirim')} className="font-semibold text-brand hover:underline">Kirim ulang kode</button></div>
      </form>
    </AuthFrame>
  )
}

export function CustTrack({ paid }: { paid: boolean }) {
  const { go } = useApp()
  const { orders, settings } = useStore()
  const o = orders.find((x) => x.id === tracked.resi) ?? orders[0]
  const idx = STATUSES.indexOf(o.status)
  const lunas = paid || o.bayar === 'Lunas'
  const est = new Date(new Date(o.masuk).getTime() + (o.svc === 'Reguler' ? 2 : 1) * 864e5)
  const kgS = o.kg.toString().replace('.', ',')
  return (
    <CustomerShell>
      <div className="rounded-xl bg-brand p-5 text-white shadow-card">
        <p className="text-sm text-teal-50/90">{settings.outlet}</p>
        <p className="mt-1 text-xs text-teal-50/80">No. Resi</p>
        <p className="text-2xl font-bold tracking-tight">{o.id}</p>
      </div>
      <Card className="mt-4">
        <dl className="divide-y divide-line text-sm">
          {[['Nama', o.nama], ['Berat', `${kgS} kg`], ['Layanan', `${o.svc} (${o.svc === 'Reguler' ? '2' : '1'} hari)`], ['Masuk', fmtFull(o.masuk)], ['Estimasi selesai', fmtDate(est.toISOString()) + ' 2026']].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-2.5 first:pt-0 last:pb-0"><dt className="text-mute">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>
          ))}
        </dl>
      </Card>
      <Card className="mt-4">
        <h2 className="mb-4 text-base">Status Cucian</h2>
        <ol>
          {STATUSES.map((s, i) => {
            const st = i < idx || idx === 4 ? 'done' : i === idx ? 'active' : 'wait'
            return (
              <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
                {i < 4 && <span className={cn('absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5', st === 'done' ? 'bg-ok' : 'bg-slate-200')} />}
                <span className={cn('z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-white', st === 'done' ? 'bg-ok' : st === 'active' ? 'bg-info ring-4 ring-blue-100' : 'bg-slate-200')}>
                  {st === 'done' ? <Check size={16} /> : st === 'active' ? <Clock size={15} /> : <span className="h-2 w-2 rounded-full bg-slate-400" />}
                </span>
                <div><p className={cn('text-sm font-semibold', st === 'wait' && 'text-slate-400', st === 'active' && 'text-info')}>{s}</p>
                  <p className="text-xs text-mute">{st === 'wait' ? 'Menunggu' : fmtFull(o.t[i])}{st === 'active' && ' · Sedang berjalan'}</p></div>
              </li>
            )
          })}
        </ol>
      </Card>
      {o.bayar === 'Kasbon' && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-1 text-xs shadow-card ring-1 ring-line" role="group" aria-label="Simulasi status bayar">
          <span className="px-3 text-mute">Simulasi tampilan:</span>
          <div className="flex gap-1"><button onClick={() => go('c-track')} className={cn('rounded-lg px-3 py-1.5 font-semibold', !paid ? 'bg-brand text-white' : 'text-mute')}>Belum Bayar</button>
            <button onClick={() => go('c-track-lunas')} className={cn('rounded-lg px-3 py-1.5 font-semibold', paid ? 'bg-brand text-white' : 'text-mute')}>Lunas</button></div>
        </div>
      )}
      {lunas ? (
        <Card className="mt-4 border-green-200 bg-green-50">
          <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ok text-white"><Check size={20} /></span>
            <div><div className="flex items-center gap-2"><h2 className="text-base">Pembayaran</h2><Badge tone="ok">Lunas</Badge></div>
              <p className="mt-1 text-sm text-slate-700">Terima kasih, Kak {o.nama.split(' ')[0]}! Pembayaran {rp(o.total)} sudah kami terima.</p></div></div>
        </Card>
      ) : (
        <Card className="mt-4">
          <div className="flex items-center justify-between"><h2 className="text-base">Pembayaran</h2><Badge tone="bad">Belum Bayar</Badge></div>
          <div className="mt-3 space-y-2 text-sm"><div className="flex justify-between text-mute"><span>Rincian</span><span>{kgS} kg × {rp(Math.round(o.total / o.kg))}</span></div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><span>Total</span><span>{rp(o.total)}</span></div></div>
          <p className="mt-3 rounded-[10px] bg-amber-50 p-3 text-sm text-amber-800">Mohon pembayaran saat pengambilan.</p>
        </Card>
      )}
      <button onClick={() => go('c-history')} className="mt-4 flex w-full items-center justify-between rounded-xl border border-line bg-white p-4 text-sm font-semibold shadow-card hover:bg-slate-50"><span className="flex items-center gap-2"><History size={18} className="text-brand" />Riwayat Pesanan</span><ArrowRight size={16} /></button>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 p-3 backdrop-blur">
        <div className="mx-auto max-w-xl"><Btn variant="wa" className="w-full" onClick={() => window.open(`https://wa.me/62${digits(settings.wa).replace(/^0/, '')}`, '_blank')}><MessageCircle size={18} />Hubungi Laundry via WhatsApp</Btn></div>
      </div>
    </CustomerShell>
  )
}

export function CustHistory() {
  const { go } = useApp()
  const { orders } = useStore()
  const mine = orders.filter((o) => digits(o.wa) === digits(tracked.wa)).sort((a, b) => b.masuk.localeCompare(a.masuk))
  const name = mine[0]?.nama ?? ''
  return (
    <CustomerShell>
      <h1 className="text-xl">Riwayat Pesanan</h1>
      <p className="mb-4 text-sm text-mute">{name} · {tracked.wa}</p>
      <ul className="space-y-3">
        {mine.map((o: Order) => (
          <li key={o.id}><button onClick={() => { tracked = { resi: o.id, wa: o.wa }; go('c-track') }} className="w-full rounded-xl border border-line bg-white p-4 text-left shadow-card hover:border-brand">
            <div className="flex items-center justify-between"><span className="font-semibold">{o.id}</span><Badge tone={o.status === 'Selesai' ? 'ok' : 'info'}>{o.status}</Badge></div>
            <div className="mt-2 flex items-center justify-between text-sm text-mute"><span>{fmtDate(o.masuk)} · {o.kg.toString().replace('.', ',')} kg</span><span className="font-semibold text-ink">{rp(o.total)}</span></div>
            <div className="mt-2"><Badge tone={o.bayar === 'Lunas' ? 'ok' : 'bad'}>{o.bayar}</Badge></div>
          </button></li>
        ))}
      </ul>
    </CustomerShell>
  )
}

export function CustEnd() {
  const { go } = useApp()
  const { settings } = useStore()
  return (
    <div className="grid min-h-screen place-items-center bg-canvas p-5">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <Card className="p-8">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-50 text-ok"><Check size={28} /></span>
          <h1 className="mt-4 text-xl">Sesi Anda telah berakhir</h1>
          <p className="mt-2 text-sm text-mute">Terima kasih telah memakai layanan {settings.outlet}. Data pelacakan Anda sudah ditutup demi keamanan.</p>
          <Btn className="mt-6 w-full" onClick={() => go('c-login')}>Lacak resi lain</Btn>
        </Card>
      </div>
    </div>
  )
}
