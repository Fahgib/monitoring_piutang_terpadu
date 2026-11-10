import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Download,
  Eye,
  CheckCircle2,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  FileText,
  ShieldAlert,
  Share2,
  Check,
  Sparkles,
} from 'lucide-react';
import { formatRupiah } from '../utils/piutangCalculator';
import FilterBar from '../components/FilterBar';

const JUDUL_TAB = {
  'pivot-sheet3': 'Rekapitulasi Matriks Pivot per ID Pelanggan (Format Sheet 3 Excel)',
  menunggak: 'Semua Langganan Menunggak Aktif (Data Sheet 1)',
  'kat-n16': 'Kategori Piutang N16 - Tagihan Susulan P2TL',
  'kat-n27': 'Kategori Piutang N27 - Angsuran Biaya Penyambungan (BP)',
  'kat-r8n7': 'Kategori Piutang R8 (Prabayar) & N7 (Kompensasi UJL)',
  'kat-n26prr': 'Kategori Piutang N26 & Pindah Piutang Ragu-Ragu (Gerak 41)',
};

const INITIAL_FILTERS = {
  wilayah: 'ALL',
  tarif: 'ALL',
  daya: 'ALL',
  jenisPiutang: 'ALL',
  statusAngsur: 'ALL',
  ketikJatuhTempo: '',
  statusKunjungan: 'ALL',
  sortBy: 'tagihan_desc',
  page: 1,
};

const OPSI_KUNJUNGAN = [
  'Belum Kunjung',
  'Janji Bayar',
  'Rumah Tutup',
  'Sudah Segel',
  'Sengketa P2TL',
];

const ITEMS_PER_PAGE = 25;

export default function PageKategoriTunggakan({
  activeTab,
  stats,
  onMarkPaidToday,
  darkMode,
}) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedPelanggan, setSelectedPelanggan] = useState(null);
  const [sembunyikanPrr, setSembunyikanPrr] = useState(false);
  const [hanyaTop50, setHanyaTop50] = useState(false);
  const [checkedIds, setCheckedIds] = useState([]);
  const [copiedWaTim, setCopiedWaTim] = useState(false);

  const [statusLapanganMap, setStatusLapanganMap] = useState(() => {
    try {
      const saved = localStorage.getItem('pln_status_kunjungan');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pln_status_kunjungan', JSON.stringify(statusLapanganMap));
    } catch (e) {
      console.error(e);
    }
  }, [statusLapanganMap]);

  const handleUbahStatusKunjungan = (idPel, statusBaru) => {
    setStatusLapanganMap((prev) => ({
      ...prev,
      [idPel]: statusBaru,
    }));
  };

  let sumberData = stats.pelangganMenunggakArray;
  if (activeTab === 'kat-n16') sumberData = stats.katN16P2TL;
  if (activeTab === 'kat-n27') sumberData = stats.katN27BP;
  if (activeTab === 'kat-r8n7') sumberData = stats.katR8N7;
  if (activeTab === 'kat-n26prr') sumberData = stats.katN26PRR;
  if (hanyaTop50) sumberData = stats.top50Pareto;

  const filteredData = useMemo(() => {
    const hasil = sumberData.filter((p) => {
      if (sembunyikanPrr && p.isPrrAnomali) return false;
      if (filters.wilayah !== 'ALL' && p.kodeWilayah !== filters.wilayah) return false;
      if (filters.tarif !== 'ALL' && p.tarif !== filters.tarif) return false;
      if (filters.daya !== 'ALL' && String(p.daya) !== filters.daya) return false;
      if (filters.jenisPiutang !== 'ALL' && p.jenisPiutang !== filters.jenisPiutang)
        return false;
      if (filters.statusAngsur === 'ANGSURAN' && p.statusAngsur !== 'ANGSURAN')
        return false;
      if (filters.statusAngsur === 'TUNAI' && p.statusAngsur !== 'TUNAI') return false;
      if (
        filters.statusAngsur === 'PRR_41' &&
        !p.daftarTagihan.some((t) => t.kodeGerakMasuk.includes('41'))
      )
        return false;

      const statusKunjungPelanggan = statusLapanganMap[p.idPelanggan] || 'Belum Kunjung';
      if (
        filters.statusKunjungan &&
        filters.statusKunjungan !== 'ALL' &&
        statusKunjungPelanggan !== filters.statusKunjungan
      ) {
        return false;
      }

      if (
        filters.ketikJatuhTempo &&
        filters.ketikJatuhTempo.trim() !== '' &&
        !p.daftarTagihan.some((t) =>
          t.tglJatuhTempo
            .toLowerCase()
            .includes(filters.ketikJatuhTempo.trim().toLowerCase())
        )
      ) {
        return false;
      }
      return true;
    });

    return [...hasil].sort((a, b) => {
      if (filters.sortBy === 'tagihan_asc') return a.totalTagihan - b.totalTagihan;
      if (filters.sortBy === 'lembar_desc') return b.jumlahLembar - a.jumlahLembar;
      if (filters.sortBy === 'nama_asc') return a.nama.localeCompare(b.nama);
      return b.totalTagihan - a.totalTagihan;
    });
  }, [sumberData, filters, sembunyikanPrr, statusLapanganMap]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(filters.page, totalPages);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCheckAllPage = (e) => {
    if (e.target.checked) {
      setCheckedIds(paginatedData.map((p) => p.idPelanggan));
    } else {
      setCheckedIds([]);
    }
  };

  const handleSelectTop10 = () => {
    const top10Ids = filteredData.slice(0, 10).map((p) => p.idPelanggan);
    setCheckedIds(top10Ids);
  };

  const handleCheckOne = (id) => {
    if (checkedIds.includes(id)) {
      setCheckedIds(checkedIds.filter((i) => i !== id));
    } else {
      setCheckedIds([...checkedIds, id]);
    }
  };

  const getTargetPelanggan = () => {
    if (checkedIds.length > 0) {
      return filteredData.filter((p) => checkedIds.includes(p.idPelanggan));
    }
    return paginatedData;
  };

  const handleCetakSuratTugasKolektif = () => {
    const terpilih = getTargetPelanggan();
    if (terpilih.length === 0) return;

    const win = window.open('', '_blank', 'width=950,height=800');
    if (!win) return;
    const totalRpTarget = terpilih.reduce((s, p) => s + p.totalTagihan, 0);

    const barisHtml = terpilih
      .map(
        (p, i) => `
        <tr>
          <td style="border:1px solid #cbd5e1;padding:6px;text-align:center;">${i + 1}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;font-family:monospace;font-weight:bold;">${p.idPelanggan}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;font-weight:bold;">${p.nama}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;">${p.tarif} / ${p.daya} VA (Wil. ${p.kodeWilayah})</td>
          <td style="border:1px solid #cbd5e1;padding:6px;">${p.jenisPiutang} (${p.jumlahLembar} Lbr)</td>
          <td style="border:1px solid #cbd5e1;padding:6px;text-align:right;font-weight:bold;">${formatRupiah(
            p.totalTagihan
          )}</td>
          <td style="border:1px solid #cbd5e1;padding:6px;text-align:center;">${
            statusLapanganMap[p.idPelanggan] || 'Belum Kunjung'
          }</td>
        </tr>`
      )
      .join('');

    win.document.write(`
      <html>
        <head><title>Surat Tugas Penagihan Kolektif PLN UP3 Jatinegara</title></head>
        <body style="font-family:sans-serif;padding:24px;color:#0f172a;">
          <h2 style="margin:0;text-align:center;">PT PLN (PERSERO) UP3 JATINEGARA</h2>
          <p style="margin:4px 0 16px;text-align:center;font-size:13px;color:#475569;">SURAT TUGAS OPERASI PENAGIHAN PIUTANG KOLEKTIF LAPANGAN</p>
          <hr/>
          <p style="font-size:13px;margin:12px 0;">
            Daftar Target Operasi: <strong>${terpilih.length} Pelanggan</strong> | Total Target Penagihan: <strong>${formatRupiah(
      totalRpTarget
    )}</strong>
          </p>
          <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:10px;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th style="border:1px solid #cbd5e1;padding:6px;">No</th>
                <th style="border:1px solid #cbd5e1;padding:6px;">ID Pelanggan</th>
                <th style="border:1px solid #cbd5e1;padding:6px;">Nama Pelanggan</th>
                <th style="border:1px solid #cbd5e1;padding:6px;">Tarif / Daya / Wilayah</th>
                <th style="border:1px solid #cbd5e1;padding:6px;">Jenis Piutang</th>
                <th style="border:1px solid #cbd5e1;padding:6px;text-align:right;">Total Tunggakan</th>
                <th style="border:1px solid #cbd5e1;padding:6px;">Status Kunjungan</th>
              </tr>
            </thead>
            <tbody>${barisHtml}</tbody>
          </table>
          <div style="margin-top:40px;display:flex;justify-content:space-between;font-size:13px;">
            <div><p>Mengetahui,<br/>Manajer / Supervisor UP3 Jatinegara</p><br/><br/><p>( .................................... )</p></div>
            <div style="text-align:right;"><p>Petugas Eksekusi Lapangan</p><br/><br/><p>( .................................... )</p></div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleCopyTargetKeWaTim = () => {
    const targetList = getTargetPelanggan().slice(0, 15);
    const totalRp = targetList.reduce((s, p) => s + p.totalTagihan, 0);

    const teks = [
      `*DAFTAR TARGET OPERASI PENAGIHAN PIUTANG - PLN UP3 JATINEGARA*`,
      `Kategori: ${JUDUL_TAB[activeTab] || 'Penagihan Aktif'}`,
      `Jumlah Target: ${targetList.length} Pelanggan (${formatRupiah(totalRp)})`,
      `--------------------------------------------`,
      ...targetList.map(
        (p, idx) =>
          `${idx + 1}. *${p.idPelanggan}* - ${p.nama}\n   • Daya: ${p.tarif}/${p.daya}VA | Wil: ${p.kodeWilayah}\n   • Tagihan: *${formatRupiah(p.totalTagihan)}* (${p.jumlahLembar} Lbr - ${p.jenisPiutang.split(' ')[0]})`
      ),
      `--------------------------------------------`,
      `_Mohon update realisasi pelunasan atau kendala lapangan pada dashboard._`,
    ].join('\n');

    navigator.clipboard.writeText(teks);
    setCopiedWaTim(true);
    setTimeout(() => setCopiedWaTim(false), 2500);
  };

  const handleMarkLunasMassal = () => {
    if (checkedIds.length === 0) return;
    checkedIds.forEach((id) => onMarkPaidToday(id));
    setCheckedIds([]);
  };

  const handleKirimWhatsApp = (p) => {
    const pesan = `Selamat Pagi/Siang/Sore,\nYth. Bapak/Ibu *${p.nama}*\n\nSemoga Bapak/Ibu senantiasa dalam keadaan sehat. Kami dari *PT PLN (Persero) UP3 Jatinegara* izin menyampaikan informasi terkait administrasi tagihan piutang listrik pada:\n\n• ID Pelanggan: *${p.idPelanggan}*\n• Nama Pelanggan: *${p.nama}*\n• Tarif / Daya: *${p.tarif} / ${p.daya.toLocaleString('id-ID')} VA*\n• Jenis Tagihan: *${p.jenisPiutang} (${p.jumlahLembar} Lembar)*\n• Total Tagihan: *${formatRupiah(p.totalTagihan)}*\n\nDemi kenyamanan dan kelancaran layanan kelistrikan Bapak/Ibu, kami memohon kesediaannya untuk dapat melakukan penyelesaian pembayaran melalui aplikasi *PLN Mobile*, ATM/Mobile Banking, atau loket pembayaran (PPOB) resmi terdekat, maupun berkoordinasi dengan petugas pelayanan kami di kantor PLN UP3 Jatinegara.\n\nApabila Bapak/Ibu telah melakukan pembayaran, kami ucapkan terima kasih dan mohon abaikan pesan ini.\n\nHormat kami,\n*PT PLN (Persero) UP3 Jatinegara*`;

    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`,
      '_blank'
    );
  };

  const handleExportExcel = () => {
    const sumberExport =
      checkedIds.length > 0
        ? filteredData.filter((p) => checkedIds.includes(p.idPelanggan))
        : filteredData;

    const rows =
      activeTab === 'pivot-sheet3'
        ? sumberExport.map((p, idx) => ({
            No: idx + 1,
            'Row Labels (ID Pelanggan)': p.idPelanggan,
            'Nama Pelanggan': p.nama,
            'N16 - TS P2TL': p.n16 || 0,
            'N26 - Angsuran PRR': p.n26 || 0,
            'N27 - Angsuran BP': p.n27 || 0,
            'N7 - KOMPENSASI UJL': p.n7 || 0,
            'R8 - Piutang Prabayar': p.r8 || 0,
            'Grand Total': p.totalTagihan,
            'Status Kunjungan': statusLapanganMap[p.idPelanggan] || 'Belum Kunjung',
          }))
        : sumberExport.map((p, idx) => ({
            No: idx + 1,
            'ID Pelanggan': p.idPelanggan,
            Nama: p.nama,
            Tarif: p.tarif,
            'Daya (VA)': p.daya,
            Wilayah: p.kodeWilayah,
            'Jenis Piutang': p.jenisPiutang,
            'Status Angsuran': p.statusAngsur,
            'Lembar Sudah Lunas': p.lembarSudahLunas,
            'Lembar Menunggak': p.jumlahLembar,
            'Total Rp Tunggakan': p.totalTagihan,
            'Status Kunjungan': statusLapanganMap[p.idPelanggan] || 'Belum Kunjung',
          }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Tunggakan');
    XLSX.writeFile(wb, `Rekap_${activeTab}.xlsx`);
  };

  return (
    <div className="space-y-4 pb-16">
      <div
        className={`rounded-2xl border p-5 flex flex-wrap items-center justify-between gap-4 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div>
          <h3 className="text-base font-extrabold">
            {JUDUL_TAB[activeTab] || 'Daftar Pelanggan Menunggak'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ditemukan{' '}
            <span className="font-bold text-teal-600">
              {filteredData.length.toLocaleString('id-ID')} pelanggan
            </span>{' '}
            dengan nilai total{' '}
            <span className="font-bold text-rose-600">
              {formatRupiah(
                filteredData.reduce((acc, item) => acc + item.totalTagihan, 0)
              )}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSembunyikanPrr(!sembunyikanPrr)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
              sembunyikanPrr
                ? 'bg-amber-600 text-white border-amber-600'
                : darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            {sembunyikanPrr ? 'PRR 02/02/2222 Disembunyikan' : 'Sembunyikan PRR (02/02/2222)'}
          </button>

          <button
            onClick={() => setHanyaTop50(!hanyaTop50)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              hanyaTop50
                ? 'bg-purple-600 text-white border-purple-600'
                : darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            {hanyaTop50 ? '⚡ Mode Top 50 Aktif' : '⚡ Fokus Top 50 Pareto'}
          </button>

          <button
            onClick={handleCopyTargetKeWaTim}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            {copiedWaTim ? (
              <>
                <Check className="w-3.5 h-3.5" /> Tersalin ke WA!
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" /> Salin Target ke WA Tim
              </>
            )}
          </button>

          <button
            onClick={handleCetakSuratTugasKolektif}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            {checkedIds.length > 0
              ? `Cetak Surat Tugas (${checkedIds.length} Terpilih)`
              : `Cetak Surat Tugas (${paginatedData.length} Baris Aktif)`}
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel
          </button>
        </div>
      </div>

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        options={stats.filterOptions}
        onReset={() => setFilters(INITIAL_FILTERS)}
        darkMode={darkMode}
        totalHasil={filteredData.length}
      />

      <div
        className={`rounded-xl border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Aksi Pilih Cepat:
          </span>
          <button
            onClick={handleSelectTop10}
            className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 font-bold hover:bg-teal-100 cursor-pointer"
          >
            Pilih 10 Terbesar
          </button>
          <button
            onClick={() => setCheckedIds(paginatedData.map((p) => p.idPelanggan))}
            className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold hover:bg-sky-100 cursor-pointer"
          >
            Pilih Semua di Halaman Ini ({paginatedData.length})
          </button>
          {checkedIds.length > 0 && (
            <button
              onClick={() => setCheckedIds([])}
              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 cursor-pointer"
            >
              Batal Pilih ({checkedIds.length})
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold">Status Lapangan:</span>
          {['ALL', ...OPSI_KUNJUNGAN].map((st) => (
            <button
              key={st}
              onClick={() =>
                setFilters({ ...filters, statusKunjungan: st, page: 1 })
              }
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                filters.statusKunjungan === st
                  ? 'bg-teal-600 text-white'
                  : darkMode
                  ? 'bg-slate-800 text-slate-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`rounded-2xl border p-5 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="overflow-x-auto">
          {activeTab === 'pivot-sheet3' ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      onChange={handleCheckAllPage}
                      checked={
                        paginatedData.length > 0 &&
                        paginatedData.every((p) => checkedIds.includes(p.idPelanggan))
                      }
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">ID Pelanggan</th>
                  <th className="py-2.5 px-3">Nama Pelanggan</th>
                  <th className="py-2.5 px-3 text-right">N16 - TS P2TL</th>
                  <th className="py-2.5 px-3 text-right">N26 - PRR</th>
                  <th className="py-2.5 px-3 text-right">N27 - BP</th>
                  <th className="py-2.5 px-3 text-right">N7 - UJL</th>
                  <th className="py-2.5 px-3 text-right">R8 - Prabayar</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((p) => (
                  <tr
                    key={p.idPelanggan}
                    className={`border-b transition ${
                      checkedIds.includes(p.idPelanggan)
                        ? 'bg-teal-50/70 dark:bg-teal-950/40'
                        : darkMode
                        ? 'border-slate-800 hover:bg-slate-800/50'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={checkedIds.includes(p.idPelanggan)}
                        onChange={() => handleCheckOne(p.idPelanggan)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-600">
                      {p.idPelanggan}
                    </td>
                    <td className="py-2.5 px-3 font-bold">{p.nama}</td>
                    <td className="py-2.5 px-3 text-right">{p.n16 ? formatRupiah(p.n16) : '-'}</td>
                    <td className="py-2.5 px-3 text-right">{p.n26 ? formatRupiah(p.n26) : '-'}</td>
                    <td className="py-2.5 px-3 text-right">{p.n27 ? formatRupiah(p.n27) : '-'}</td>
                    <td className="py-2.5 px-3 text-right">{p.n7 ? formatRupiah(p.n7) : '-'}</td>
                    <td className="py-2.5 px-3 text-right">{p.r8 ? formatRupiah(p.r8) : '-'}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-rose-600">
                      {formatRupiah(p.totalTagihan)}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleKirimWhatsApp(p)}
                        title="Kirim Pesan WhatsApp Penagihan"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" /> WA
                      </button>
                      <button
                        onClick={() => setSelectedPelanggan(p)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                          darkMode
                            ? 'bg-slate-800 border-slate-700 text-slate-200'
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Eye className="w-3 h-3 text-teal-600" /> Detail
                      </button>
                      <button
                        onClick={() => onMarkPaidToday(p.idPelanggan)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Lunas
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      onChange={handleCheckAllPage}
                      checked={
                        paginatedData.length > 0 &&
                        paginatedData.every((p) => checkedIds.includes(p.idPelanggan))
                      }
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">ID Pelanggan</th>
                  <th className="py-2.5 px-3">Nama Pelanggan</th>
                  <th className="py-2.5 px-3">Tarif / Daya</th>
                  <th className="py-2.5 px-3">Sisa Lembar</th>
                  <th className="py-2.5 px-3">Total Tunggakan</th>
                  <th className="py-2.5 px-3">Status Lapangan</th>
                  <th className="py-2.5 px-3 text-right">Tindak Lanjut & WA</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((p) => {
                  const statusSaatIni =
                    statusLapanganMap[p.idPelanggan] || 'Belum Kunjung';
                  return (
                    <tr
                      key={p.idPelanggan}
                      className={`border-b ${
                        checkedIds.includes(p.idPelanggan)
                          ? 'bg-teal-50/70 dark:bg-teal-950/40'
                          : darkMode
                          ? 'border-slate-800 hover:bg-slate-800/50'
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={checkedIds.includes(p.idPelanggan)}
                          onChange={() => handleCheckOne(p.idPelanggan)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-600">
                        {p.idPelanggan}
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        {p.nama}
                        <p className="text-[10px] font-normal text-slate-400">
                          {p.jenisPiutang}
                        </p>
                      </td>
                      <td className="py-2.5 px-3">
                        {p.tarif} / {p.daya.toLocaleString('id-ID')} VA
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {p.jumlahLembar} Lbr
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-extrabold text-rose-600">
                        {formatRupiah(p.totalTagihan)}
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={statusSaatIni}
                          onChange={(e) =>
                            handleUbahStatusKunjungan(p.idPelanggan, e.target.value)
                          }
                          className={`px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                            statusSaatIni === 'Belum Kunjung'
                              ? darkMode
                                ? 'bg-slate-800 border-slate-700 text-slate-300'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                              : statusSaatIni === 'Janji Bayar'
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : statusSaatIni === 'Sudah Segel'
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : 'bg-sky-50 border-sky-200 text-sky-700'
                          }`}
                        >
                          {OPSI_KUNJUNGAN.map((op) => (
                            <option key={op} value={op}>
                              {op}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleKirimWhatsApp(p)}
                          title="Kirim Pesan WhatsApp Penagihan"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" /> WA
                        </button>
                        <button
                          onClick={() => setSelectedPelanggan(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                            darkMode
                              ? 'bg-slate-800 border-slate-700 text-slate-200'
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <Eye className="w-3 h-3 text-teal-600" /> Rincian
                        </button>
                        <button
                          onClick={() => onMarkPaidToday(p.idPelanggan)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Lunas
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500">
            Menampilkan halaman <strong>{currentPage}</strong> dari{' '}
            <strong>{totalPages}</strong> ({filteredData.length.toLocaleString('id-ID')}{' '}
            pelanggan)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setFilters({ ...filters, page: currentPage - 1 })}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 flex items-center gap-1 font-bold cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setFilters({ ...filters, page: currentPage + 1 })}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 flex items-center gap-1 font-bold cursor-pointer"
            >
              Berikutnya <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {checkedIds.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-4 text-xs">
          <span className="font-extrabold text-teal-400">
            {checkedIds.length} Pelanggan Dipilih
          </span>
          <button
            onClick={handleCetakSuratTugasKolektif}
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak Surat Tugas
          </button>
          <button
            onClick={handleCopyTargetKeWaTim}
            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> Salin ke WA Tim
          </button>
          <button
            onClick={handleMarkLunasMassal}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Tandai Lunas Sekaligus
          </button>
          <button
            onClick={() => setCheckedIds([])}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {selectedPelanggan && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-3xl rounded-2xl p-6 shadow-xl max-h-[85vh] overflow-y-auto ${
              darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'
            }`}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h4 className="text-sm font-extrabold">
                  Rincian Kartu Piutang IDPEL: {selectedPelanggan.idPelanggan} —{' '}
                  {selectedPelanggan.nama}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tarif/Daya: {selectedPelanggan.tarif} / {selectedPelanggan.daya} VA |
                  No Agenda Mohon: {selectedPelanggan.noAgendaMohon}
                </p>
              </div>
              <button
                onClick={() => setSelectedPelanggan(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="text-[11px] font-semibold">Sudah Lunas</span>
                <p className="font-extrabold text-sm">
                  {selectedPelanggan.lembarSudahLunas} Lembar (
                  {formatRupiah(selectedPelanggan.rpSudahLunas)})
                </p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
                <span className="text-[11px] font-semibold">Sisa Menunggak</span>
                <p className="font-extrabold text-sm">
                  {selectedPelanggan.jumlahLembar} Lembar (
                  {formatRupiah(selectedPelanggan.totalTagihan)})
                </p>
              </div>
            </div>

            <h5 className="text-xs font-extrabold mb-2 text-rose-600">
              Daftar Lembar Tagihan Belum Lunas ({selectedPelanggan.jumlahLembar} Lembar)
            </h5>
            <table className="w-full text-left text-xs border-collapse mb-4">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2 px-2">No Register</th>
                  <th className="py-2 px-2">Tgl Entri</th>
                  <th className="py-2 px-2">Jatuh Tempo</th>
                  <th className="py-2 px-2">Jenis Piutang</th>
                  <th className="py-2 px-2 text-right">Rp Tagihan</th>
                </tr>
              </thead>
              <tbody>
                {selectedPelanggan.daftarTagihan.map((item) => (
                  <tr
                    key={item.idUnik}
                    className="border-b border-slate-100 dark:border-slate-800"
                  >
                    <td className="py-2 px-2 font-mono">{item.noRegister}</td>
                    <td className="py-2 px-2">{item.tglEntri}</td>
                    <td className="py-2 px-2 font-bold text-amber-600">
                      {item.tglJatuhTempo}
                    </td>
                    <td className="py-2 px-2">{item.jenisPiutang}</td>
                    <td className="py-2 px-2 font-bold text-right">
                      {formatRupiah(item.rpTagihan)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}