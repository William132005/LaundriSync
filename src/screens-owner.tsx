import { useState } from 'react'
import { Banknote, Wallet, Layers, Gauge, FilePlus2, ScanLine, AlertTriangle, MessageCircle, Download, Plus, Check, Minus, Crown, Info, TrendingUp, Pencil, Trash2 } from 'lucide-react'
import { useApp, cn, Btn, Card, Badge, Metric, MetricGrid, Progress, DataTable, StatusBadge, rp, Field, Input, Select, Modal, Toggle } from './ui'
import { Shell } from './shell'
import { useStore, ageDays, fmtTime, fmtDate, STATUSES, type Order, type User, type Item } from './store'

const chipCls = ['bg-slate-100 text-slate-700', 'bg-blue-50 text-blue-700', 'bg-amber-50 text-amber-700', 'bg-brand-tint text-brand-dark', 'bg-green-50 text-green-700']

export function Dashboard() {
  const { go } = useApp()
  const { counts, rev, piutang, terpakai, settings, logs } = useStore()
  const total = piutang.reduce((a, o) => a + o.total, 0)
  const oldest = piutang[0]
  const aktif = counts.slice(0, 4).reduce((a, b) => a + b, 0)
  const pct = Math.round((terpakai / settings.kap) * 100)
  const act = logs.slice(0, 5)
  return (
    <Shell title="Dashboard">
      <MetricGrid>
        <Metric label="Pendapatan Hari Ini" value={rp(rev)} icon={<Banknote size={18} />} sub={<span className="inline-flex items-center gap-1 font-semibold text-ok"><TrendingUp size={14} />+8% <span className="font-normal text-mute">dari kemarin</span></span>} />
        <Metric label="Piutang Belum Tertagih" value={rp(total)} tone="bad" icon={<Wallet size={18} />} sub={`dari ${new Set(piutang.map((o) => o.wa)).size} pelanggan`} />
        <Metric label="Pesanan Aktif" value={`${aktif} batch`} icon={<Layers size={18} />} sub="sedang diproses" />
        <Metric label="Kapasitas Mesin" value={`${terpakai}/${settings.kap} kg`} icon={<Gauge size={18} />}><div className="mt-3"><Progress pct={pct} tone={pct >= 95 ? 'bad' : pct >= 80 ? 'warn' : 'brand'} /></div></Metric>
      </MetricGrid>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <h2 className="mb-3 text-base">Status Pesanan</h2>
            <div className="flex flex-wrap gap-2">{STATUSES.map((l, i) => <button key={l} onClick={() => go('pesanan')} className={cn('inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold', chipCls[i])}>{l}<b className="rounded-full bg-white/70 px-2 text-xs">{counts[i]}</b></button>)}</div>
          </Card>
          <Card>
            <h2 className="mb-3 text-base">Aksi Cepat</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Btn onClick={() => go('transaksi')}><FilePlus2 size={16} />Transaksi Baru</Btn>
              <Btn variant="soft" onClick={() => go('log')}><ScanLine size={16} />Scan Status</Btn>
              <Btn variant="ghost" onClick={() => go('piutang')}><Wallet size={16} />Lihat Piutang</Btn>
            </div>
          </Card>
          <Card pad={false}>
            <div className="flex items-center justify-between p-5 pb-2"><h2 className="text-base">Aktivitas Produksi Terbaru</h2><button onClick={() => go('log')} className="text-sm font-semibold text-brand hover:underline">Lihat log</button></div>
            <ul className="divide-y divide-line">
              {act.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-tint text-xs font-bold text-brand">{l.staf[0]}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{l.staf} <span className="font-normal text-mute">(PIN {l.pin})</span></p><p className="truncate text-xs text-mute">{l.resi}</p></div>
                  <div className="text-right"><StatusBadge s={l.ke} /><p className="mt-1 text-xs text-mute">Hari ini, {fmtTime(l.at)}</p></div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="border-red-200">
            <div className="flex items-center justify-between"><h2 className="text-base">Kapasitas Kritis</h2><Badge tone="bad">Kritis</Badge></div>
            <p className="mt-3 text-3xl font-bold text-bad">98<span className="text-lg font-semibold text-mute">/100 kg</span></p>
            <div className="mt-3"><Progress pct={98} tone="bad" /></div>
            <p className="mt-3 flex items-start gap-2 rounded-[10px] bg-amber-50 p-3 text-sm font-medium text-amber-800"><AlertTriangle size={16} className="mt-0.5 shrink-0" />Kapasitas hampir penuh</p>
          </Card>
          {oldest && (
            <Card>
              <h2 className="text-base">Piutang Tertua</h2>
              <div className="mt-3 rounded-[10px] border border-red-200 bg-red-50 p-4">
                <p className="font-semibold">{oldest.nama}</p><p className="text-sm text-mute">{oldest.id}</p>
                <div className="mt-2 flex items-center justify-between"><span className="font-bold text-bad">{rp(oldest.total)}</span><Badge tone="bad">umur {ageDays(oldest.masuk)} hari</Badge></div>
              </div>
              <Btn variant="ghost" className="mt-3 w-full" onClick={() => go('piutang')}>Tagih Sekarang</Btn>
            </Card>
          )}
        </div>
      </div>
    </Shell>
  )
}

export function Piutang() {
  const { toast } = useApp()
  const { piutang, markLunas, sendWa, waQuota, waUsed, settings } = useStore()
  const [all, setAll] = useState(false)
  const [conf, setConf] = useState<Order | null>(null)
  const rows = [...piutang].reverse().sort((a, b) => ageDays(b.masuk) - ageDays(a.masuk))
  const shown = all ? rows : rows.slice(0, 7)
  const total = rows.reduce((a, o) => a + o.total, 0)
  const tertua = rows[0] ? ageDays(rows[0].masuk) : 0
  const age = (d: number) => d >= 15 ? 'bg-red-50 text-red-700 ring-red-200' : d >= 5 ? 'bg-orange-50 text-orange-700 ring-orange-200' : 'bg-green-50 text-green-700 ring-green-200'
  const remind = (o: Order) => {
    if (!settings.waOn) return toast('Notifikasi WhatsApp nonaktif. Aktifkan di Pengaturan')
    if (!sendWa()) return toast(`Kuota WhatsApp habis (${waUsed}/${waQuota})`)
    toast(`Pengingat WhatsApp terkirim ke ${o.nama}`)
  }
  return (
    <Shell title="Piutang">
      <MetricGrid>
        <Metric label="Total Piutang" value={rp(total)} icon={<Wallet size={18} />} />
        <Metric label="Pelanggan Berhutang" value={String(new Set(rows.map((o) => o.wa)).size)} icon={<Layers size={18} />} />
        <Metric label="Piutang Tertua" value={`${tertua} hari`} tone="bad" icon={<AlertTriangle size={18} />} />
      </MetricGrid>
      <Card pad={false} className="mt-6 p-2 md:p-3">
        <div className="p-3 pb-1"><h2 className="text-base">Aging Piutang</h2><p className="text-sm text-mute">Diurutkan dari yang paling lama</p></div>
        <div className="p-2 md:p-0">
          {shown.length ? <DataTable rowKey={(r) => r.id} rows={shown} cols={[
            { h: 'Pelanggan', r: (r) => <b>{r.nama}</b> }, { h: 'No. WA', r: (r) => r.wa }, { h: 'Resi', r: (r) => r.id },
            { h: 'Nominal', r: (r) => <b>{rp(r.total)}</b> },
            { h: 'Umur', r: (r) => <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', age(ageDays(r.masuk)))}>{ageDays(r.masuk)} hari</span> },
            { h: 'Status', r: () => <StatusBadge s="Kasbon" /> },
            { h: 'Aksi', r: (r) => <div className="flex flex-wrap gap-2">
              <Btn variant="wa" className="min-h-9 px-3 text-xs" onClick={() => remind(r)}><MessageCircle size={14} />Kirim Pengingat WA</Btn>
              <Btn variant="ghost" className="min-h-9 px-3 text-xs" onClick={() => setConf(r)}><Check size={14} />Tandai Lunas</Btn></div> },
          ]} /> : <p className="py-10 text-center text-sm text-mute">Semua piutang sudah lunas.</p>}
        </div>
        <div className="flex items-center justify-between px-4 pb-3 pt-2 text-sm text-mute"><span>Menampilkan {shown.length} dari {rows.length} pelanggan berhutang</span>
          {rows.length > 7 && <button onClick={() => setAll((a) => !a)} className="font-semibold text-brand hover:underline">{all ? 'Tampilkan 7 teratas' : 'Lihat semua'}</button>}</div>
      </Card>
      {conf && <Modal title="Tandai Lunas?" onClose={() => setConf(null)} footer={<><Btn variant="ghost" className="flex-1" onClick={() => setConf(null)}>Batal</Btn><Btn className="flex-1" onClick={() => { markLunas(conf.id); toast(`${conf.id} ditandai lunas, kas bertambah ${rp(conf.total)}`); setConf(null) }}>Ya, Lunas</Btn></>}>
        <p className="text-sm text-mute">Pembayaran {rp(conf.total)} dari <b className="text-ink">{conf.nama}</b> ({conf.id}) akan dicatat sebagai kas masuk dan dihapus dari buku piutang.</p>
      </Modal>}
    </Shell>
  )
}

const DAYS = [[62, 8], [75, 12], [58, 6], [90, 4], [82, 15], [70, 9], [48, 5], [95, 10], [88, 3], [66, 11], [79, 7], [92, 6], [84, 9]]
export function Laporan() {
  const { toast } = useApp()
  const { rev, piutang } = useStore()
  const [tab, setTab] = useState('Ringkasan')
  const [per, setPer] = useState('Bulan ini')
  const cur = per === 'Bulan ini'
  const pend = cur ? 18450000 + (rev - 1240000) : 16980000
  const bahan = cur ? 4120000 : 3880000, gaji = 3200000
  const keluar = bahan + gaji, laba = pend - keluar
  const pct = (a: number) => Math.round((a / pend) * 100)
  const pPiu = cur ? Math.min(100, pct(piutang.reduce((a, o) => a + o.total, 0))) : 7
  return (
    <Shell title="Laporan Keuangan" actions={<div className="flex gap-2"><Select value={per} onChange={(e) => setPer(e.target.value)} className="w-40" aria-label="Periode"><option>Bulan ini</option><option>Bulan lalu</option></Select><Btn onClick={() => { toast(`Menyiapkan PDF laporan ${per.toLowerCase()}`); setTimeout(() => window.print(), 300) }}><Download size={16} />Ekspor PDF</Btn></div>}>
      <MetricGrid>
        <Metric label="Pendapatan" value={rp(pend)} icon={<Banknote size={18} />} />
        <Metric label="Pengeluaran Operasional" value={rp(keluar)} sub={`${pct(keluar)}% dari pendapatan`} icon={<Wallet size={18} />} />
        <Metric label="Laba Bersih" value={rp(laba)} tone="ok" sub={`margin ${pct(laba)}%`} icon={<TrendingUp size={18} />} />
        <Metric label="Kas vs Piutang" value={`${100 - pPiu}% / ${pPiu}%`} icon={<Layers size={18} />}><div className="mt-3 flex h-2 overflow-hidden rounded-full"><div className="bg-ok" style={{ width: `${100 - pPiu}%` }} /><div className="bg-bad" style={{ width: `${pPiu}%` }} /></div></Metric>
      </MetricGrid>
      <div className="mt-6 flex gap-1 border-b border-line" role="tablist">
        {['Ringkasan', 'Laba-Rugi', 'Arus Kas'].map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn('-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold', tab === t ? 'border-brand text-brand' : 'border-transparent text-mute hover:text-ink')}>{t}</button>)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {tab !== 'Laba-Rugi' && (
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-base">{tab === 'Arus Kas' ? 'Arus Kas Harian' : 'Kas vs Kasbon Harian'}</h2>
              <div className="flex gap-3 text-xs text-mute"><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-ok" />Kas</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-bad" />Kasbon</span></div></div>
            <div className="mt-5 flex h-56 items-end gap-1.5 sm:gap-2.5">
              {DAYS.map(([k, b], i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div className="flex h-full w-full items-end justify-center gap-0.5"><div className="w-full max-w-3 rounded-t bg-ok" style={{ height: `${k}%` }} title={`Kas ${k}%`} /><div className="w-full max-w-3 rounded-t bg-bad" style={{ height: `${b}%` }} /></div>
                  <span className="text-[10px] text-mute sm:text-xs">{i + 1}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-mute">Tanggal Februari 2026 (1 - 13 Feb)</p>
          </Card>
        )}
        <Card className={tab === 'Laba-Rugi' ? 'lg:col-span-2' : ''}>
          <h2 className="mb-3 text-base">Laba-Rugi Sederhana</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt>Pendapatan jasa</dt><dd className="font-semibold">{rp(pend)}</dd></div>
            <div className="flex justify-between"><dt>Bahan & utilitas</dt><dd className="font-semibold text-bad">({rp(bahan)})</dd></div>
            <div className="flex justify-between"><dt>Gaji karyawan</dt><dd className="font-semibold text-bad">({rp(gaji)})</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base"><dt className="font-bold">Laba bersih</dt><dd className="font-bold text-ok">{rp(laba)}</dd></div>
          </dl>
        </Card>
      </div>
    </Shell>
  )
}

export function Inventaris() {
  const { toast } = useApp()
  const { items, addItem, saveItem, delItem } = useStore()
  const [mode, setMode] = useState<null | 'add' | { use: Item } | { edit: Item } | { del: Item }>(null)
  const [f, setF] = useState({ n: '', q: '', u: 'kg', min: '' })
  const [amt, setAmt] = useState('')
  const [err, setErr] = useState('')
  const close = () => { setMode(null); setErr(''); setAmt('') }
  const openAdd = () => { setF({ n: '', q: '', u: 'kg', min: '' }); setMode('add') }
  const openEdit = (i: Item) => { setF({ n: i.n, q: String(i.q), u: i.u, min: String(i.min) }); setMode({ edit: i }) }
  const saveForm = () => {
    const q = parseFloat(f.q), min = parseFloat(f.min || '0')
    if (!f.n.trim()) return setErr('Nama bahan wajib diisi')
    if (!(q >= 0) || f.q === '') return setErr('Jumlah harus berupa angka 0 atau lebih')
    if (mode === 'add') { addItem({ n: f.n.trim(), q, u: f.u, min: min || Math.round(q * 0.25), max: Math.max(q, min * 4, 1) }); toast(`${f.n} ditambahkan`) }
    else if (mode && typeof mode === 'object' && 'edit' in mode) { saveItem(mode.edit.id, { n: f.n.trim(), q, u: f.u, min, max: Math.max(mode.edit.max, q) }); toast('Bahan diperbarui') }
    close()
  }
  const useItem = (i: Item) => {
    const a = parseFloat(amt)
    if (!(a > 0)) return setErr('Masukkan jumlah pemakaian')
    if (a > i.q) return setErr(`Melebihi stok (${i.q} ${i.u})`)
    saveItem(i.id, { q: +(i.q - a).toFixed(2) }); toast(`Pemakaian ${a} ${i.u} ${i.n} dicatat`); close()
  }
  const isForm = mode === 'add' || (mode && typeof mode === 'object' && 'edit' in mode)
  return (
    <Shell title="Inventaris" actions={<Btn onClick={openAdd}><Plus size={16} />Tambah Bahan</Btn>}>
      <Card pad={false} className="p-2 md:p-3">
        <div className="p-2 md:p-0">{items.length ? <DataTable rowKey={(r) => r.id} rows={items} cols={[
          { h: 'Bahan', r: (r) => <b>{r.n}</b> },
          { h: 'Stok', r: (r) => <b>{r.q}</b> }, { h: 'Satuan', r: (r) => r.u },
          { h: 'Indikator', r: (r) => <div className="w-32 md:w-40"><Progress pct={(r.q / r.max) * 100} tone={r.q <= r.min ? 'warn' : 'ok'} /></div> },
          { h: 'Status', r: (r) => <StatusBadge s={r.q <= r.min ? 'Stok Menipis' : 'Stok Aman'} /> },
          { h: 'Aksi', r: (r) => <div className="flex flex-wrap gap-2"><Btn variant="ghost" className="min-h-9 px-3 text-xs" onClick={() => { setAmt(''); setMode({ use: r }) }}><Minus size={14} />Catat Pemakaian</Btn>
            <Btn variant="ghost" className="min-h-9 px-3 text-xs" aria-label={`Edit ${r.n}`} onClick={() => openEdit(r)}><Pencil size={14} /></Btn>
            <Btn variant="ghost" className="min-h-9 px-3 text-xs text-bad" aria-label={`Hapus ${r.n}`} onClick={() => setMode({ del: r })}><Trash2 size={14} /></Btn></div> },
        ]} /> : <p className="py-10 text-center text-sm text-mute">Belum ada bahan. Tambahkan dengan tombol di atas.</p>}</div>
      </Card>
      {isForm && <Modal title={mode === 'add' ? 'Tambah Bahan' : 'Edit Bahan'} onClose={close} footer={<><Btn variant="ghost" className="flex-1" onClick={close}>Batal</Btn><Btn className="flex-1" onClick={saveForm}>Simpan</Btn></>}>
        <div className="space-y-4"><Field label="Nama bahan"><Input value={f.n} onChange={(e) => setF({ ...f, n: e.target.value })} placeholder="mis. Pelembut" /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Jumlah stok"><Input type="number" min={0} value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></Field>
            <Field label="Satuan"><Select value={f.u} onChange={(e) => setF({ ...f, u: e.target.value })}><option>kg</option><option>liter</option><option>lembar</option><option>tabung</option></Select></Field></div>
          <Field label="Batas stok menipis" hint="Kosongkan untuk 25% dari stok awal"><Input type="number" min={0} value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
          {err && <p className="text-sm font-medium text-bad">{err}</p>}</div>
      </Modal>}
      {mode && typeof mode === 'object' && 'use' in mode && <Modal title={`Catat Pemakaian ${mode.use.n}`} onClose={close} footer={<><Btn variant="ghost" className="flex-1" onClick={close}>Batal</Btn><Btn className="flex-1" onClick={() => useItem(mode.use)}>Simpan</Btn></>}>
        <Field label={`Jumlah dipakai (${mode.use.u})`} hint={`Stok saat ini ${mode.use.q} ${mode.use.u}`}><Input type="number" min={0} autoFocus value={amt} onChange={(e) => setAmt(e.target.value)} /></Field>
        {err && <p className="mt-2 text-sm font-medium text-bad">{err}</p>}
      </Modal>}
      {mode && typeof mode === 'object' && 'del' in mode && <Modal title="Hapus bahan?" onClose={close} footer={<><Btn variant="ghost" className="flex-1" onClick={close}>Batal</Btn><Btn variant="danger" className="flex-1" onClick={() => { delItem(mode.del.id); toast(`${mode.del.n} dihapus`); close() }}>Hapus</Btn></>}>
        <p className="text-sm text-mute">{mode.del.n} akan dihapus dari daftar inventaris.</p></Modal>}
    </Shell>
  )
}

export function Log() {
  const { logs } = useStore()
  const [staff, setStaff] = useState('Semua staf')
  const [date, setDate] = useState('2026-02-09')
  const names = [...new Set(logs.map((l) => l.staf))]
  const rows = logs.filter((l) => (staff === 'Semua staf' || l.staf === staff) && (!date || new Date(l.at).toLocaleDateString('sv-SE') === date)).sort((a, b) => b.at.localeCompare(a.at))
  return (
    <Shell title="Log Karyawan">
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <Field label="Staf"><Select value={staff} onChange={(e) => setStaff(e.target.value)}><option>Semua staf</option>{names.map((n) => <option key={n}>{n}</option>)}</Select></Field>
          <Field label="Tanggal"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>
        {rows.length ? <DataTable rowKey={(r) => r.id} rows={rows} cols={[
          { h: 'Waktu', r: (r) => <b>{fmtTime(r.at)}</b> }, { h: 'Staf', r: (r) => <>{r.staf} <span className="text-mute">(PIN {r.pin})</span></> },
          { h: 'Resi', r: (r) => r.resi }, { h: 'Perubahan Status', r: (r) => `${r.dari} → ${r.ke}` },
        ]} /> : <p className="py-10 text-center text-sm text-mute">Tidak ada aktivitas untuk filter ini.</p>}
      </Card>
    </Shell>
  )
}

export function Pengguna() {
  const { toast } = useApp()
  const { users, addUser, saveUser, me, plan } = useStore()
  const [m, setM] = useState<null | { id?: string }>(null)
  const [f, setF] = useState({ nama: '', role: 'Staf' as User['role'], pin: '' })
  const [err, setErr] = useState('')
  const self = me('pemilik')
  const open = (u?: User) => { setErr(''); setF(u ? { nama: u.nama, role: u.role, pin: u.pin } : { nama: '', role: 'Staf', pin: '' }); setM({ id: u?.id }) }
  const limit = plan === 'Pasti' ? 10 : 3
  const submit = () => {
    if (!f.nama.trim()) return setErr('Nama wajib diisi')
    if (!m?.id && users.filter((u) => u.aktif).length >= limit) return setErr(`Paket ${plan} maksimal ${limit} akun aktif. Upgrade paket atau nonaktifkan akun lain`)
    const e = m?.id ? saveUser(m.id, { nama: f.nama.trim(), role: f.role, pin: f.pin }) : addUser({ nama: f.nama.trim(), role: f.role, pin: f.pin })
    if (e) return setErr(e)
    toast(m?.id ? 'Data pengguna diperbarui' : `${f.nama} ditambahkan`); setM(null)
  }
  const editing = users.find((u) => u.id === m?.id)
  return (
    <Shell title="Karyawan & Pengguna" actions={<Btn onClick={() => open()}><Plus size={16} />Tambah Pengguna</Btn>}>
      <p className="-mt-3 mb-4 text-sm text-mute">{users.filter((u) => u.aktif).length} dari {limit} akun aktif (Paket {plan})</p>
      <Card pad={false} className="p-2 md:p-3"><div className="p-2 md:p-0"><DataTable rowKey={(r) => r.id} rows={users} cols={[
        { h: 'Nama', r: (r) => <b>{r.nama}</b> }, { h: 'Peran', r: (r) => <Badge tone={r.role === 'Pemilik' ? 'brand' : r.role === 'Kasir' ? 'info' : 'gray'}>{r.role}</Badge> },
        { h: 'PIN', r: () => <span className="tracking-widest">•••</span> }, { h: 'Status Akun', r: (r) => <StatusBadge s={r.aktif ? 'Aktif' : 'Nonaktif'} /> },
        { h: 'Aksi', r: (r) => <div className="flex gap-2"><Btn variant="ghost" className="min-h-9 px-3 text-xs" onClick={() => open(r)}>Edit</Btn>
          {r.id !== self?.id && <Btn variant="ghost" className={cn('min-h-9 px-3 text-xs', r.aktif && 'text-bad')} onClick={() => {
            if (!r.aktif && users.filter((u) => u.aktif).length >= limit) return toast(`Batas ${limit} akun aktif tercapai`)
            saveUser(r.id, { aktif: !r.aktif }); toast(`${r.nama} ${r.aktif ? 'dinonaktifkan' : 'diaktifkan'}`) }}>{r.aktif ? 'Nonaktifkan' : 'Aktifkan'}</Btn>}</div> },
      ]} /></div></Card>
      {m && <Modal title={m.id ? 'Edit Pengguna' : 'Tambah Pengguna'} onClose={() => setM(null)} footer={<><Btn variant="ghost" className="flex-1" onClick={() => setM(null)}>Batal</Btn><Btn className="flex-1" onClick={submit}>Simpan</Btn></>}>
        <div className="space-y-4"><Field label="Nama"><Input value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} placeholder="Nama lengkap" /></Field>
          <Field label="Peran"><Select value={f.role} disabled={editing?.role === 'Pemilik'} onChange={(e) => setF({ ...f, role: e.target.value as User['role'] })}>{editing?.role === 'Pemilik' ? <option>Pemilik</option> : <><option>Kasir</option><option>Staf</option></>}</Select></Field>
          <Field label={editing?.role === 'Pemilik' ? 'PIN' : 'PIN (3 digit)'} hint={editing?.role === 'Pemilik' ? undefined : 'Wajib 3 digit angka dan unik'}><Input value={f.pin} inputMode="numeric" maxLength={editing?.role === 'Pemilik' ? 6 : 3} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, '') })} placeholder="mis. 204" /></Field>
          {err && <p className="text-sm font-medium text-bad">{err}</p>}</div>
      </Modal>}
    </Shell>
  )
}

export function Pengaturan() {
  const { toast } = useApp()
  const { settings, saveSettings, waUsed, waQuota, plan } = useStore()
  const [s, setS] = useState(settings)
  const [err, setErr] = useState('')
  const dirty = JSON.stringify(s) !== JSON.stringify(settings)
  const num = (k: 'reg' | 'eks' | 'kap') => (e: React.ChangeEvent<HTMLInputElement>) => setS({ ...s, [k]: Math.max(0, parseInt(e.target.value) || 0) })
  const save = () => {
    if (!s.outlet.trim()) return setErr('Nama outlet wajib diisi')
    if (s.reg <= 0 || s.eks <= 0) return setErr('Tarif per kg harus lebih dari 0')
    if (s.kap <= 0) return setErr('Kapasitas harus lebih dari 0 kg')
    setErr(''); saveSettings(s); toast('Pengaturan disimpan')
  }
  const sisa = waQuota - waUsed
  return (
    <Shell title="Pengaturan" actions={<div className="flex items-center gap-2">{dirty && <span className="text-sm font-medium text-amber-700">Belum disimpan</span>}{dirty && <Btn variant="ghost" onClick={() => { setS(settings); setErr('') }}>Batalkan</Btn>}<Btn disabled={!dirty} onClick={save}>Simpan Perubahan</Btn></div>}>
      {err && <p className="mb-4 rounded-[10px] bg-red-50 p-3 text-sm font-medium text-red-700">{err}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><h2 className="mb-4 text-base">Profil Outlet</h2><div className="space-y-4">
          <Field label="Nama outlet"><Input value={s.outlet} onChange={(e) => setS({ ...s, outlet: e.target.value })} /></Field><Field label="Alamat"><Input value={s.alamat} onChange={(e) => setS({ ...s, alamat: e.target.value })} /></Field><Field label="Nomor WhatsApp outlet"><Input value={s.wa} onChange={(e) => setS({ ...s, wa: e.target.value })} /></Field></div></Card>
        <Card><h2 className="mb-4 text-base">Tarif Layanan</h2><div className="space-y-4">
          <Field label="Reguler (2 hari) per kg"><div className="relative"><span className="absolute left-3 top-3 text-sm text-mute">Rp</span><Input type="number" value={s.reg} onChange={num('reg')} className="pl-10" /></div></Field>
          <Field label="Ekspres (1 hari) per kg"><div className="relative"><span className="absolute left-3 top-3 text-sm text-mute">Rp</span><Input type="number" value={s.eks} onChange={num('eks')} className="pl-10" /></div></Field></div></Card>
        <Card><h2 className="mb-4 text-base">Kapasitas Mesin Harian</h2><div className="space-y-4">
          <Field label="Kapasitas (kg)"><Input type="number" value={s.kap} onChange={num('kap')} /></Field>
          <div className="flex items-center justify-between gap-4 rounded-[10px] bg-slate-50 p-3"><div><p className="text-sm font-semibold">Tutup Ekspres otomatis</p><p className="text-xs text-mute">Layanan Ekspres ditutup saat kapasitas penuh</p></div><Toggle on={s.autoClose} onChange={(v) => setS({ ...s, autoClose: v })} label="Tutup Ekspres otomatis" /></div></div></Card>
        <Card><h2 className="mb-4 text-base">Notifikasi WhatsApp</h2>
          <div className="flex items-center justify-between gap-4 rounded-[10px] bg-slate-50 p-3"><div><p className="text-sm font-semibold">Kirim notifikasi otomatis</p><p className="text-xs text-mute">Nota, status selesai, dan pengingat piutang</p></div><Toggle on={s.waOn} onChange={(v) => setS({ ...s, waOn: v })} label="Notifikasi WhatsApp" /></div>
          <div className="mt-4"><div className="mb-1.5 flex justify-between text-sm"><span className="text-mute">Sisa kuota bulan ini (Paket {plan})</span><b>{sisa.toLocaleString('id-ID')} / {waQuota.toLocaleString('id-ID')} pesan</b></div><Progress pct={(sisa / waQuota) * 100} tone={sisa / waQuota < 0.1 ? 'bad' : 'ok'} /></div></Card>
      </div>
    </Shell>
  )
}

const Ck = ({ v }: { v: boolean | string }) => typeof v === 'string' ? <span className="text-sm font-semibold">{v}</span> : v ? <Check size={18} className="mx-auto text-ok" /> : <Minus size={18} className="mx-auto text-slate-300" />
export function Langganan() {
  const { toast } = useApp()
  const { plan, setPlan } = useStore()
  const [conf, setConf] = useState(false)
  const tertib = ['POS tunai/QRIS/kasbon', 'Barcode resi dan tautan pelacakan', '500 pesan WhatsApp per bulan', 'Dashboard piutang', 'Laporan pendapatan harian', '3 akun pengguna']
  const pasti = ['Semua fitur Paket Tertib', 'Laba-rugi dan arus kas dengan ekspor PDF', 'Inventaris dan log karyawan', 'CRM / loyalty pelanggan', '2.000 pesan WhatsApp per bulan', '10 akun pengguna', 'Dukungan WhatsApp prioritas']
  const cmp: [string, boolean | string, boolean | string][] = [['POS tunai/QRIS/kasbon', true, true], ['Barcode resi & tracking', true, true], ['Dashboard piutang', true, true], ['Laporan harian', true, true], ['Laba-rugi & arus kas (PDF)', false, true], ['Inventaris & log karyawan', false, true], ['CRM / loyalty', false, true], ['Pesan WhatsApp / bulan', '500', '2.000'], ['Akun pengguna', '3', '10'], ['Dukungan prioritas', false, true]]
  return (
    <Shell title="Langganan & Paket">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand p-5 text-white shadow-card">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-[10px] bg-white/20"><Crown size={22} /></span><div><p className="text-sm text-teal-50/90">Paket saat ini</p><p className="text-lg font-bold">Paket {plan} aktif s/d 12 Des 2026</p></div></div>
        <Badge tone="ok">Aktif</Badge>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col"><h2 className="text-lg">Paket Tertib</h2><p className="mt-2 text-3xl font-bold">Rp99.000<span className="text-base font-medium text-mute">/bulan</span></p>
          <ul className="mt-5 flex-1 space-y-2.5 text-sm">{tertib.map((t) => <li key={t} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-ok" />{t}</li>)}</ul>
          <Btn variant="ghost" disabled className="mt-6 w-full">{plan === 'Tertib' ? 'Paket Saat Ini' : 'Paket Dasar'}</Btn></Card>
        <Card className="relative flex flex-col border-2 border-brand"><span className="absolute -top-3 right-5 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">Direkomendasikan</span>
          <h2 className="text-lg">Paket Pasti</h2><p className="mt-2 text-3xl font-bold text-brand">Rp149.000<span className="text-base font-medium text-mute">/bulan</span></p>
          <ul className="mt-5 flex-1 space-y-2.5 text-sm">{pasti.map((t) => <li key={t} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-ok" />{t}</li>)}</ul>
          <Btn className="mt-6 w-full" disabled={plan === 'Pasti'} onClick={() => setConf(true)}>{plan === 'Pasti' ? 'Paket Saat Ini' : 'Upgrade Paket'}</Btn></Card>
      </div>
      <Card className="mt-6" pad={false}><h2 className="p-5 pb-2 text-base">Perbandingan Fitur</h2>
        <table className="w-full text-sm"><thead><tr className="border-b border-line text-xs uppercase text-mute"><th className="px-4 py-3 text-left">Fitur</th><th className="px-2 py-3">Tertib</th><th className="px-2 py-3 text-brand">Pasti</th></tr></thead>
          <tbody>{cmp.map(([f, a, b]) => <tr key={f} className="border-b border-line last:border-0"><td className="px-4 py-3">{f}</td><td className="px-2 py-3 text-center"><Ck v={a} /></td><td className="px-2 py-3 text-center"><Ck v={b} /></td></tr>)}</tbody></table>
      </Card>
      <p className="mt-4 flex items-start gap-2 text-sm text-mute"><Info size={16} className="mt-0.5 shrink-0" />Biaya instalasi sekali bayar: Rp150.000 (Tertib) dan Rp250.000 (Pasti).</p>
      {conf && <Modal title="Upgrade ke Paket Pasti?" onClose={() => setConf(false)} footer={<><Btn variant="ghost" className="flex-1" onClick={() => setConf(false)}>Batal</Btn><Btn className="flex-1" onClick={() => { setPlan('Pasti'); setConf(false); toast('Paket Pasti aktif. Kuota WhatsApp dan akun bertambah') }}>Ya, Upgrade</Btn></>}>
        <p className="text-sm text-mute">Tagihan menjadi Rp149.000/bulan dengan biaya instalasi sekali bayar Rp250.000 untuk Paket Pasti. Kuota WhatsApp naik ke 2.000 pesan dan akun pengguna ke 10.</p></Modal>}
    </Shell>
  )
}
