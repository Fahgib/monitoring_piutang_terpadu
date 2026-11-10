import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  FileCheck2,
  Copy,
  Download,
  Check,
  Calendar,
  PlusCircle,
  X,
  Search,
} from 'lucide-react';
import { formatRupiah } from '../utils/piutangCalculator';

export default function PageReportHarian({
  stats,
  onMarkPaidToday,
  darkMode,
}) {
  const [modeStatus, setModeStatus] = useState('LUNAS'); // LUNAS atau BATAL
  const [ketikTanggal, setKetikTanggal] = useState(''); // Ketik manual misal 31/12/2025
  const [filterJenis, setFilterJenis] = useState('ALL');
  const [filterDaya, setFilterDaya] = useState('ALL');
  const [copied, setCopied] = useState(false);
  const [inputIdPel, setInputIdPel] = useState('');

  const sumberList = modeStatus === 'LUNAS' ? stats.lunasList : stats.batalList;

  // Konversi input kalender YYYY-MM-DD ke DD/MM/YYYY
  const handleKalenderChange = (e) => {
    const val = e.target.value; // YYYY-MM-DD
    if (!val) {
      setKetikTanggal('');
      return;
    }
    const [yyyy, mm, dd] = val.split('-');
    setKetikTanggal(`${dd}/${mm}/${yyyy}`);
  };

  const filteredTransaksi = useMemo(() => {
    return sumberList.filter((t) => {
      if (
        ketikTanggal.trim() !== '' &&
        !t.tglPelunasan.toLowerCase().includes(ketikTanggal.trim().toLowerCase())
      ) {
        return false;
      }
      if (filterJenis !== 'ALL' && t.jenisPiutang !== filterJenis) return false;
      if (filterDaya !== 'ALL' && String(t.daya) !== filterDaya) return false;
      return true;
    });
  }, [sumberList, ketikTanggal, filterJenis, filterDaya]);

  const totalRupiahFiltered = filteredTransaksi.reduce((s, r) => s + r.rpTagihan, 0);

  const handleCopyWhatsApp = () => {
    const judulTanggal = ketikTanggal.trim() ? ketikTanggal : 'Semua Tanggal';
    const text = [
      `*REPORT HARIAN PELUNASAN PIUTANG PLN*`,
      `Periode Tanggal: ${judulTanggal}`,
      `----------------------------------------`,
      `• Total Transaksi Lunas: ${filteredTransaksi.length.toLocaleString('id-ID')} Lembar`,
      `• Total Realisasi Rupiah: ${formatRupiah(totalRupiahFiltered)}`,
      `----------------------------------------`,
      `Rincian 5 Pelunasan Terbesar:`,
      ...filteredTransaksi
        .slice(0, 5)
        .map(
          (r, i) =>
            `${i + 1}. ${r.idPelanggan} - ${r.nama} (${formatRupiah(r.rpTagihan)})`
        ),
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportExcel = () => {
    const dataExport = filteredTransaksi.map((r, i) => ({
      No: i + 1,
      'ID Pelanggan': r.idPelanggan,
      Nama: r.nama,
      'Jenis Piutang': r.jenisPiutang,
      Tarif: r.tarif,
      Daya: r.daya,
      'Rp Tagihan': r.rpTagihan,
      'Tanggal Pelunasan': r.tglPelunasan,
      'Kode Gerak Keluar': r.kodeGerakKeluar,
      'Unit UP': r.unitUp,
    }));
    const ws = XLSX.utils.json_to_sheet(dataExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Report_${modeStatus}`);
    XLSX.writeFile(wb, `Report_${modeStatus}_${ketikTanggal || 'Semua'}.xlsx`);
  };

  const handleQuickMarkLunas = (e) => {
    e.preventDefault();
    if (!inputIdPel.trim()) return;
    onMarkPaidToday(inputIdPel.trim());
    setInputIdPel('');
  };

  const inputClass = `px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 ${
    darkMode
      ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
      : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400'
  }`;

  return (
    <div className="space-y-6">
      <div
        className={`rounded-2xl border p-6 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModeStatus('LUNAS')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition ${
                modeStatus === 'LUNAS'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              22 - Pelunasan On-Line ({stats.jumlahLembarLunas.toLocaleString('id-ID')})
            </button>
            <button
              onClick={() => setModeStatus('BATAL')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition ${
                modeStatus === 'BATAL'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              31 - Pembatalan Piutang ({stats.jumlahLembarBatal.toLocaleString('id-ID')})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyWhatsApp}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Tersalin!' : 'Salin Format WA'}
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Filter Ketik Tanggal Langsung + Kalender, Jenis Piutang, Ketik Daya & Input Lunas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          {/* Kolom Ketik Tanggal + Tombol Kalender */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              <Calendar className="w-3 h-3 inline mr-1" /> Ketik Tanggal / Pilih Kalender
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ketik: 31/12/2025 atau 2025"
                  value={ketikTanggal}
                  onChange={(e) => setKetikTanggal(e.target.value)}
                  className={`w-full pl-8 pr-7 ${inputClass}`}
                />
                {ketikTanggal && (
                  <button
                    onClick={() => setKetikTanggal('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 cursor-pointer"
                    title="Hapus Tanggal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <input
                type="date"
                onChange={handleKalenderChange}
                className={`w-9 px-1.5 py-1.5 rounded-xl border text-xs cursor-pointer ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
                title="Pilih dari Kalender"
              />
            </div>
          </div>

          {/* Filter Jenis Piutang */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Filter Jenis Piutang
            </label>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className={`w-full ${inputClass}`}
            >
              <option value="ALL">Semua Jenis Piutang</option>
              {stats.filterOptions.jenisList.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Daya */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Filter Daya (VA)
            </label>
            <select
              value={filterDaya}
              onChange={(e) => setFilterDaya(e.target.value)}
              className={`w-full ${inputClass}`}
            >
              <option value="ALL">Semua Daya</option>
              {stats.filterOptions.dayaList.map((d) => (
                <option key={d} value={String(d)}>
                  {Number(d).toLocaleString('id-ID')} VA
                </option>
              ))}
            </select>
          </div>

          {/* Update Cepat Pelanggan Lunas Hari Ini */}
          <form onSubmit={handleQuickMarkLunas} className="flex items-end gap-1.5">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Input IDPEL Lunas Hari Ini
              </label>
              <input
                type="text"
                placeholder="Ketik IDPEL..."
                value={inputIdPel}
                onChange={(e) => setInputIdPel(e.target.value)}
                className={`w-full ${inputClass}`}
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Lunas
            </button>
          </form>
        </div>

        {/* Pintasan 6 Tanggal Teratas (Klik Sekali Tanpa Scroll) */}
        {stats.reportHarianList.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">
              Tanggal Terbanyak:
            </span>
            <button
              onClick={() => setKetikTanggal('')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition ${
                ketikTanggal === ''
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Semua Tanggal
            </button>
            {stats.reportHarianList.slice(0, 6).map((h) => (
              <button
                key={h.tanggal}
                onClick={() => setKetikTanggal(h.tanggal)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition ${
                  ketikTanggal === h.tanggal
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {h.tanggal} ({h.jumlahTransaksi})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Ringkasan Angka */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`p-4 rounded-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs text-slate-400">Filter Tanggal Aktif</span>
          <p className="text-base font-extrabold mt-1">
            {ketikTanggal.trim() === '' ? 'Semua Periode Tanggal' : ketikTanggal}
          </p>
        </div>
        <div
          className={`p-4 rounded-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs text-slate-400">Jumlah Lembar Sesuai Filter</span>
          <p className="text-base font-extrabold text-emerald-600 mt-1">
            {filteredTransaksi.length.toLocaleString('id-ID')} Lembar Tagihan
          </p>
        </div>
        <div
          className={`p-4 rounded-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs text-slate-400">Total Nilai Rupiah</span>
          <p className="text-base font-extrabold text-teal-600 mt-1">
            {formatRupiah(totalRupiahFiltered)}
          </p>
        </div>
      </div>

      {/* Tabel Transaksi */}
      <div
        className={`rounded-2xl border p-5 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <FileCheck2 className="w-4 h-4 text-emerald-600" />
          <h4 className="text-sm font-extrabold">
            Daftar Rincian Transaksi ({filteredTransaksi.length.toLocaleString('id-ID')} Baris)
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Tgl Pelunasan</th>
                <th className="py-2.5 px-3">ID Pelanggan</th>
                <th className="py-2.5 px-3">Nama Pelanggan</th>
                <th className="py-2.5 px-3">Tarif / Daya</th>
                <th className="py-2.5 px-3">Jenis Piutang</th>
                <th className="py-2.5 px-3">Kode Gerak Keluar</th>
                <th className="py-2.5 px-3 text-right">Rp Tagihan</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransaksi.slice(0, 100).map((r) => (
                <tr
                  key={r.idUnik}
                  className={`border-b ${
                    darkMode
                      ? 'border-slate-800 hover:bg-slate-800/50'
                      : 'border-slate-100 hover:bg-teal-50/40'
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-emerald-600">
                    {r.tglPelunasan}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold">{r.idPelanggan}</td>
                  <td className="py-2.5 px-3 font-bold">{r.nama}</td>
                  <td className="py-2.5 px-3">
                    {r.tarif} / {r.daya} VA
                  </td>
                  <td className="py-2.5 px-3">{r.jenisPiutang}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      {r.kodeGerakKeluar}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-right">
                    {formatRupiah(r.rpTagihan)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}