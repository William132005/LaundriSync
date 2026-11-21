import { useState } from 'react'
import { Receipt, Banknote, Wallet, Gauge, FilePlus2, Info, AlertTriangle, Printer, MessageCircle, Search, Keyboard, CheckCircle2 } from 'lucide-react'
import { useApp, cn, Btn, Card, Metric, MetricGrid, Progress, DataTable, StatusBadge, Badge, rp, Field, Input, Select, Barcode } from './ui'
import { Shell } from './shell'
import { useStore, STATUSES, ageDays, fmtTime, fmtFull, fmtDate } from './store'

const isToday = (iso: string) => ageDays(iso) === 0
export function KasirDashboard() {
  const { go } = useApp()
  const { orders, kas, sisa, settings } = useStore()
  const today = orders.filter((o) => isToday(o.masuk))
  const kasbon = today.filter((o) => o.bayar === 'Kasbon')
  const recent = [...orders].sort((a, b) => b.masuk.localeCompare(a.masuk)).slice(0, 5)
  return (
    <Shell title="Dashboard Kasir">
      <MetricGrid>
        <Metric label="Transaksi Hari Ini" value={String(9 + today.length)} icon={<Receipt size={18} />} sub="transaksi" />
        <Metric label="Kas + QRIS" value={rp(kas)} tone="ok" icon={<Banknote size={18} />} />
        <Metric label="Kasbon Baru" value={rp(kasbon.reduce((a, o) => a + o.total, 0))} tone="bad" icon={<Wallet size={18} />} sub={`${kasbon.length} transaksi`} />
        <Metric label="Sisa Kapasitas" value={`${sisa} kg`} icon={<Gauge size={18} />}><div className="mt-3"><Progress pct={100 - (sisa / settings.kap) * 100} tone="warn" /></div></Metric>
      </MetricGrid>
      <button onClick={() => go('transaksi')} className="mt-6 flex w-full items-center gap-4 rounded-xl bg-brand p-6 text-left text-white shadow-card transition hover:bg-brand-dark">
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-white/20"><FilePlus2 size={28} /></span>
        <span><span className="block text-xl font-bold">Transaksi Baru</span><span className="text-sm text-teal-50/90">Catat cucian masuk dan cetak stiker barcode</span></span>
      </button>
      <Card className="mt-6" pad={false}><h2 className="p-5 pb-2 text-base">Transaksi Terbaru</h2>
        <ul className="divide-y divide-line">{recent.map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{o.nama}</p><p className="text-xs text-mute">{o.id} · {fmtFull(o.masuk)}</p></div>
            <div className="text-right"><p className="text-sm font-bold">{rp(o.total)}</p><StatusBadge s={o.bayar} /></div></li>))}</ul></Card>
    </Shell>
  )
}

const Radio = ({ on, children, onClick, disabled }: { on: boolean; children: React.ReactNode; onClick: () => void; disabled?: boolean }) => (
  <button type="button" role="radio" aria-checked={on} disabled={disabled} onClick={onClick}
    className={cn('flex items-center gap-3 rounded-[10px] border p-3 text-left text-sm transition disabled:opacity-50', on ? 'border-brand bg-brand-tint' : 'border-line bg-white hover:border-slate-300')}>
    <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full border-2', on ? 'border-brand' : 'border-slate-300')}>{on && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}</span>{children}
  </button>
)
export function Transaksi() {
  const { go, toast, role } = useApp()
  const { settings, sisa: sisaReal, addOrder } = useStore()
  const [nama, setNama] = useState('')
  const [wa, setWa] = useState('')
  const [svc, setSvc] = useState<'Reguler' | 'Ekspres'>('Reguler')
  const [kg, setKg] = useState('')
  const [full, setFull] = useState(false)
  const [pay, setPay] = useState<'Tunai' | 'QRIS' | 'Kasbon'>('Tunai')
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')
  const rate = svc === 'Reguler' ? settings.reg : settings.eks
  const w = parseFloat(kg.replace(',', '.')) || 0
  const sisa = full ? 0 : sisaReal
  const eksClosed = settings.autoClose && sisa <= 0
  const rpf = (n: number) => 'Rp' + n.toLocaleString('id-ID')
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nama.trim()) return setErr('Nama pelanggan wajib diisi')
    if (!/^[0-9+\-\s]{9,16}$/.test(wa.trim())) return setErr('Nomor WhatsApp tidak valid')
    if (!(w > 0)) return setErr('Berat harus lebih dari 0 kg')
    if (w > sisa) return setErr(sisa <= 0 ? 'Kapasitas penuh, transaksi tidak dapat disimpan' : `Berat melebihi sisa kapasitas (${sisa} kg)`)
    addOrder({ nama: nama.trim(), wa: wa.trim(), kg: w, svc, bayar: pay === 'Kasbon' ? 'Kasbon' : 'Lunas', note: note.trim() || undefined })
    toast('Transaksi tersimpan'); go('konfirmasi')
  }
  return (
    <Shell title="Transaksi Baru">
      <form onSubmit={submit} noValidate className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card><h2 className="mb-4 text-base">Data Pelanggan</h2>
            <div className="grid gap-4 md:grid-cols-2"><Field label="Nama"><Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="mis. Rina Wijaya" /></Field><Field label="Nomor WhatsApp"><Input value={wa} inputMode="tel" onChange={(e) => setWa(e.target.value)} placeholder="0812-3456-7890" /></Field>
              <Field label="Berat (kg)"><Input inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="5" /></Field></div></Card>
          <Card><h2 className="mb-4 text-base">Layanan</h2>
            <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
              <Radio on={svc === 'Reguler'} onClick={() => setSvc('Reguler')}><span><b className="block">Reguler 2 hari</b><span className="text-mute">{rpf(settings.reg)}/kg</span></span></Radio>
              <Radio on={svc === 'Ekspres'} disabled={eksClosed} onClick={() => setSvc('Ekspres')}><span><b className="block">Ekspres 1 hari</b><span className="text-mute">{rpf(settings.eks)}/kg{eksClosed && ' · Ditutup'}</span></span></Radio></div>
            <div className="mt-4 flex items-center justify-between rounded-[10px] bg-slate-50 p-4"><span className="text-sm text-mute">Total otomatis</span><span className="text-2xl font-bold text-brand">{rp(w * rate)}</span></div></Card>
          <Card><h2 className="mb-4 text-base">Pembayaran</h2>
            <div role="radiogroup" className="grid gap-3 sm:grid-cols-3">{(['Tunai', 'QRIS', 'Kasbon'] as const).map((p) => <Radio key={p} on={pay === p} onClick={() => setPay(p)}><b>{p}</b></Radio>)}</div>
            {pay === 'Kasbon' && <p className="mt-3 flex items-start gap-2 rounded-[10px] bg-blue-50 p-3 text-sm font-medium text-blue-800"><Info size={16} className="mt-0.5 shrink-0" />Transaksi akan masuk buku piutang</p>}
            <div className="mt-4"><Field label="Catatan (opsional)"><textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="mis. pisahkan pakaian putih" className="w-full rounded-[10px] border border-line p-3 text-sm focus:border-brand focus:outline-2 focus:outline-brand/25" /></Field></div></Card>
          {err && <p role="alert" className="rounded-[10px] bg-red-50 p-3 text-sm font-medium text-red-700">{err}</p>}
          <div className="sticky bottom-0 -mx-6 flex gap-3 border-t border-line bg-white/95 px-6 py-3 backdrop-blur md:static md:mx-0 md:justify-end md:border-0 md:bg-transparent md:p-0">
            <Btn type="button" variant="ghost" className="flex-1 md:flex-none" onClick={() => go(role === 'kasir' ? 'k-dashboard' : 'dashboard')}>Batal</Btn>
            <Btn type="submit" className="flex-[2] md:flex-none">Simpan Transaksi</Btn></div>
        </div>
        <div className="xl:sticky xl:top-24 xl:self-start"><Card>
          <h2 className="text-base">Kapasitas Mesin</h2>
          <p className="mt-3 text-2xl font-bold">Sisa {sisa}<span className="text-base font-semibold text-mute">/{settings.kap} kg</span></p>
          <div className="mt-3"><Progress pct={100 - (sisa / settings.kap) * 100} tone={sisa <= 0 ? 'bad' : 'warn'} /></div>
          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" checked={full} onChange={(e) => { setFull(e.target.checked); if (e.target.checked && settings.autoClose) setSvc('Reguler') }} className="h-4 w-4 accent-[#0E7A8A]" />Simulasikan kapasitas penuh</label>
          {(sisa <= 0 || w > sisa) && <p className="mt-3 flex items-start gap-2 rounded-[10px] bg-red-50 p-3 text-sm font-medium text-red-700"><AlertTriangle size={16} className="mt-0.5 shrink-0" />{sisa <= 0 ? (eksClosed ? 'Kapasitas penuh. Layanan Ekspres ditutup otomatis.' : 'Kapasitas penuh.') : 'Berat melebihi sisa kapasitas hari ini.'}</p>}
        </Card></div>
      </form>
    </Shell>
  )
}

export function Konfirmasi() {
  const { go, toast } = useApp()
  const { orders, lastId, sendWa, settings, waUsed, waQuota } = useStore()
  const o = orders.find((x) => x.id === lastId)
  if (!o) return <Shell title="Konfirmasi Transaksi"><p>Belum ada transaksi.</p></Shell>
  const rows: [string, React.ReactNode][] = [['No. Resi', o.id], ['Pelanggan', o.nama], ['Berat', `${o.kg.toString().replace('.', ',')} kg`], ['Layanan', o.svc], ['Pembayaran', <StatusBadge s={o.bayar} />], ['Total', <b className="text-lg">{rp(o.total)}</b>]]
  const nota = () => {
    if (!settings.waOn) return toast('Notifikasi WhatsApp nonaktif. Aktifkan di Pengaturan')
    if (!sendWa()) return toast(`Kuota WhatsApp habis (${waUsed}/${waQuota})`)
    toast(`Nota terkirim ke ${o.wa}`)
  }
  return (
    <Shell title="Konfirmasi Transaksi">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center gap-3 rounded-xl bg-ok p-4 text-white shadow-card"><CheckCircle2 size={24} /><p className="font-bold">Transaksi tersimpan</p></div>
        <Card><dl className="divide-y divide-line text-sm">{rows.map(([k, v]) => <div key={k} className="flex items-center justify-between py-3 first:pt-0 last:pb-0"><dt className="text-mute">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl></Card>
        <Card className="text-center"><Barcode code={o.id} className="mx-auto h-28 w-full max-w-md" /><p className="mt-2 font-mono text-sm font-semibold tracking-widest">{o.id}</p><p className="mt-1 text-sm text-mute">Tempel stiker pada keranjang</p></Card>
        <div className="grid gap-3 sm:grid-cols-2"><Btn onClick={() => window.print()}><Printer size={16} />Cetak Stiker Barcode</Btn><Btn variant="wa" onClick={nota}><MessageCircle size={16} />Kirim Nota via WhatsApp</Btn></div>
        <Btn variant="ghost" className="w-full" onClick={() => go('pesanan')}>Lihat Daftar Pesanan</Btn>
      </div>
    </Shell>
  )
}

export function Pesanan() {
  const { role, toast } = useApp()
  const { orders, advance, me } = useStore()
  const [fs, setFs] = useState('Semua'), [fp, setFp] = useState('Semua'), [q, setQ] = useState('')
  const rows = [...orders].sort((a, b) => b.masuk.localeCompare(a.masuk))
  const list = rows.filter((r) => (fs === 'Semua' || r.status === fs) && (fp === 'Semua' || r.bayar === fp) && (r.id + r.nama).toLowerCase().includes(q.toLowerCase()))
  return (
    <Shell title="Daftar Pesanan">
      <div className="mb-4 flex flex-wrap gap-2">{STATUSES.map((s) => <button key={s} onClick={() => setFs(fs === s ? 'Semua' : s)} className={cn('flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold', fs === s ? 'border-brand bg-brand-tint text-brand' : 'border-line bg-white text-mute')}>{s}<b className="text-ink">{orders.filter((r) => r.status === s).length}</b></button>)}</div>
      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <div className="relative"><Search size={16} className="absolute left-3 top-3.5 text-slate-400" /><Input placeholder="Cari No. Resi atau nama" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" aria-label="Cari" /></div>
          <Select value={fs} onChange={(e) => setFs(e.target.value)} aria-label="Filter status"><option>Semua</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>
          <Select value={fp} onChange={(e) => setFp(e.target.value)} aria-label="Filter pembayaran"><option>Semua</option><option>Lunas</option><option>Kasbon</option></Select>
        </div>
        {list.length ? <DataTable rowKey={(r) => r.id} rows={list} cols={[
          { h: 'No. Resi', r: (r) => <b>{r.id}</b> }, { h: 'Pelanggan', r: (r) => r.nama }, { h: 'Berat', r: (r) => `${r.kg.toString().replace('.', ',')} kg` }, { h: 'Layanan', r: (r) => r.svc }, { h: 'Masuk', r: (r) => fmtFull(r.masuk) },
          { h: 'Status', r: (r) => <StatusBadge s={r.status} /> }, { h: 'Pembayaran', r: (r) => <StatusBadge s={r.bayar} /> },
          { h: 'Aksi', r: (r) => <Btn variant="soft" className="min-h-9 px-3 text-xs" disabled={r.status === 'Selesai'} onClick={() => { advance(r.id, me(role)); toast(`${r.id} diperbarui ke ${STATUSES[STATUSES.indexOf(r.status) + 1]}`) }}>Update Status</Btn> },
        ]} /> : <p className="py-10 text-center text-sm text-mute">Tidak ada pesanan yang cocok.</p>}
      </Card>
    </Shell>
  )
}

export function Scan() {
  const { go, role, toast } = useApp()
  const { orders, advance, me, logs } = useStore()
  const user = me(role)!
  const [code, setCode] = useState('TRX-2026-0012')
  const [flash, setFlash] = useState<string | null>(null)
  const [manual, setManual] = useState(false)
  const [input, setInput] = useState('')
  const [err, setErr] = useState('')
  const o = orders.find((x) => x.id === code)
  const mine = logs.filter((l) => l.pin === user.pin && ageDays(l.at) === 0).sort((a, b) => b.at.localeCompare(a.at))
  const next = o ? STATUSES[STATUSES.indexOf(o.status) + 1] : undefined
  const Corner = ({ c }: { c: string }) => <span className={cn('absolute h-9 w-9 border-white', c)} />
  const find = () => {
    const v = input.trim().toUpperCase()
    if (!orders.some((x) => x.id === v)) return setErr('Kode tidak ditemukan')
    setCode(v); setFlash(null); setErr(''); setManual(false)
  }
  return (
    <Shell title="Scan Status"><div className="mx-auto max-w-md">
      <p className="mb-4 rounded-xl bg-brand-tint px-4 py-3 text-sm font-semibold text-brand-dark">Staf: {user.nama.split(' ')[0]} (PIN {user.pin})</p>
      <div className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl bg-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1e293b,#020617)]" />
        <div className="relative h-3/5 w-3/5"><Corner c="left-0 top-0 rounded-tl-lg border-l-4 border-t-4" /><Corner c="right-0 top-0 rounded-tr-lg border-r-4 border-t-4" /><Corner c="bottom-0 left-0 rounded-bl-lg border-b-4 border-l-4" /><Corner c="bottom-0 right-0 rounded-br-lg border-b-4 border-r-4" />
          <span className="absolute inset-x-2 top-1/2 h-0.5 bg-ok shadow-[0_0_12px_#16a34a]" /></div>
        <p className="absolute bottom-4 w-full text-center text-sm text-white/80">Arahkan ke barcode keranjang</p>
      </div>
      <button onClick={() => setManual((m) => !m)} className="mx-auto mt-3 flex items-center gap-2 text-sm font-semibold text-brand hover:underline"><Keyboard size={16} />Masukkan kode manual</button>
      {manual && <div className="mt-3"><div className="flex gap-2"><Input placeholder="TRX-2026-0000" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && find()} /><Btn onClick={find}>Cari</Btn></div>{err && <p className="mt-2 text-sm font-medium text-bad">{err}</p>}</div>}
      {flash && <div className="mt-4 flex items-center gap-3 rounded-xl bg-ok p-4 text-white"><CheckCircle2 size={22} /><div><p className="font-bold">Status berhasil diperbarui</p><p className="text-sm text-green-50">{flash}</p></div></div>}
      {o && <Card className="mt-4"><div className="flex items-start justify-between"><div><p className="font-bold">{o.id}</p><p className="text-sm text-mute">{o.nama} · {o.kg.toString().replace('.', ',')} kg</p></div><StatusBadge s={o.status} /></div>
        {next ? <Btn className="mt-4 w-full" onClick={() => { advance(o.id, user); setFlash(`${o.id} kini ${next}`); toast('Status diperbarui') }}>Perbarui ke Status Berikutnya: {next}</Btn> : <Btn className="mt-4 w-full" disabled>Pesanan sudah Selesai</Btn>}
        {flash && <Btn variant="ghost" className="mt-2 w-full" onClick={() => go('riwayat-scan')}>Lihat Riwayat Scan</Btn>}</Card>}
      <Card className="mt-4" pad={false}><div className="flex items-center justify-between p-5 pb-2"><h2 className="text-base">Riwayat Scan Hari Ini</h2><button onClick={() => go('riwayat-scan')} className="text-sm font-semibold text-brand">Semua</button></div>
        {mine.length ? <ul className="divide-y divide-line">{mine.slice(0, 4).map((h) => <li key={h.id} className="px-5 py-3 text-sm"><div className="flex justify-between"><b>{h.resi}</b><span className="text-mute">{fmtTime(h.at)}</span></div><p className="text-mute">{h.dari} → {h.ke}</p></li>)}</ul> : <p className="px-5 pb-5 text-sm text-mute">Belum ada scan hari ini.</p>}</Card>
    </div></Shell>
  )
}
export function RiwayatScan() {
  const { role } = useApp()
  const { logs, me, orders } = useStore()
  const user = me(role)!
  const rows = logs.filter((l) => l.pin === user.pin && ageDays(l.at) === 0).sort((a, b) => b.at.localeCompare(a.at))
  return (
    <Shell title="Riwayat Scan Hari Ini"><div className="mx-auto max-w-md">
      <p className="mb-4 text-sm text-mute">Staf: {user.nama.split(' ')[0]} (PIN {user.pin}) · {rows.length} scan</p>
      {rows.length ? <ul className="space-y-3">{rows.map((h) => <li key={h.id} className="rounded-xl border border-line bg-white p-4 shadow-card"><div className="flex justify-between"><b className="text-sm">{h.resi}</b><span className="text-xs text-mute">{fmtTime(h.at)}</span></div><p className="mt-1 text-sm text-mute">{orders.find((o) => o.id === h.resi)?.nama}</p><p className="mt-2 text-sm font-medium">{h.dari} → {h.ke}</p></li>)}</ul> : <p className="py-10 text-center text-sm text-mute">Belum ada scan hari ini.</p>}
    </div></Shell>
  )
}
