import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  MapPin,
  ExternalLink,
  Compass,
  Download,
  Search,
  Building2,
  Navigation,
} from 'lucide-react';
import { formatRupiah } from '../utils/piutangCalculator';

export default function PageLingkupDaerah({ activeTab, stats, darkMode }) {
  const [selectedWilayah, setSelectedWilayah] = useState('ALL');
  const [selectedTarif, setSelectedTarif] = useState('ALL');
  const [ketikCariWilayah, setKetikCariWilayah] = useState('');
  const [mapSearchTarget, setMapSearchTarget] = useState('PT PLN (Persero) ULP 54410');
  const [customMapInput, setCustomMapInput] = useState('');

  // Filter pelanggan berdasarkan wilayah, tarif, dan ketik pencarian
  const pelangganWilayah = useMemo(() => {
    return stats.pelangganMenunggakArray.filter((p) => {
      if (selectedWilayah !== 'ALL' && p.kodeWilayah !== selectedWilayah) return false;
      if (selectedTarif !== 'ALL' && p.tarif !== selectedTarif) return false;
      if (ketikCariWilayah.trim() !== '') {
        const q = ketikCariWilayah.toLowerCase();
        return (
          p.idPelanggan.toLowerCase().includes(q) ||
          p.nama.toLowerCase().includes(q) ||
          p.jenisPiutang.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [stats.pelangganMenunggakArray, selectedWilayah, selectedTarif, ketikCariWilayah]);

  const handleExportWilayah = () => {
    const rows = pelangganWilayah.map((p, i) => ({
      No: i + 1,
      'Kode Wilayah': p.kodeWilayah,
      'ID Pelanggan': p.idPelanggan,
      'Nama Pelanggan': p.nama,
      Tarif: p.tarif,
      'Daya (VA)': p.daya,
      'Jenis Piutang': p.jenisPiutang,
      'Lembar Menunggak': p.jumlahLembar,
      'Total Rp Tunggakan': p.totalTagihan,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Wilayah');
    XLSX.writeFile(wb, `Data_Lingkup_Daerah_${selectedWilayah}.xlsx`);
  };

  // ============================================================================
  // TAMPILAN 1: MENU LINGKUP DAERAH & TARIF (activeTab === 'daerah')
  // ============================================================================
  if (activeTab === 'daerah') {
    return (
      <div className="space-y-6">
        {/* 4 Kartu Ringkasan Kode Wilayah / ULP */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.rekapDaerah.map((daerah) => (
            <div
              key={daerah.kodeWilayah}
              onClick={() =>
                setSelectedWilayah(
                  selectedWilayah === daerah.kodeWilayah ? 'ALL' : daerah.kodeWilayah
                )
              }
              className={`rounded-2xl border p-5 cursor-pointer transition ${
                selectedWilayah === daerah.kodeWilayah
                  ? 'ring-2 ring-teal-500 border-teal-500'
                  : darkMode
                  ? 'bg-slate-900 border-slate-800 hover:bg-slate-800/70'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700">
                  Kode Wilayah: {daerah.kodeWilayah}
                </span>
                <MapPin className="w-4 h-4 text-teal-600" />
              </div>
              <h4 className="text-xs font-extrabold mb-3">{daerah.namaWilayah}</h4>
              <div className="space-y-1 text-xs">
                <p className="flex justify-between">
                  <span className="text-slate-400">Pelanggan Menunggak:</span>
                  <span className="font-bold">{daerah.jumlahPelangganMenunggak} IDPEL</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">Lembar Menunggak:</span>
                  <span className="font-semibold">{daerah.lembarMenunggak} Lembar</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-slate-400">Lembar Sudah Lunas:</span>
                  <span className="font-semibold text-emerald-600">
                    {daerah.lembarLunas} Lembar
                  </span>
                </p>
                <p className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Rp Tunggakan:</span>
                  <span className="font-extrabold text-rose-600">
                    {formatRupiah(daerah.rupiahMenunggak)}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Kartu Sebaran Golongan Tarif */}
        <div
          className={`rounded-2xl border p-5 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-extrabold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              Pilih & Filter Berdasarkan Golongan Tarif PLN
            </h4>
            {selectedTarif !== 'ALL' && (
              <button
                onClick={() => setSelectedTarif('ALL')}
                className="text-xs font-bold text-teal-600 hover:underline cursor-pointer"
              >
                Reset Filter Tarif
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
            {stats.rekapTarif.map((t) => (
              <button
                key={t.tarif}
                onClick={() =>
                  setSelectedTarif(selectedTarif === t.tarif ? 'ALL' : t.tarif)
                }
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  selectedTarif === t.tarif
                    ? 'bg-teal-600 text-white border-teal-600'
                    : darkMode
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <p className="text-xs font-extrabold">{t.tarif}</p>
                <p
                  className={`text-[10px] mt-0.5 ${
                    selectedTarif === t.tarif ? 'text-teal-100' : 'text-slate-400'
                  }`}
                >
                  {t.jumlahPelanggan} IDPEL
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Tabel Rincian Pelanggan per Lingkup Daerah & Tarif */}
        <div
          className={`rounded-2xl border p-5 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="text-sm font-extrabold">
                Daftar Pelanggan Wilayah: {selectedWilayah} | Tarif: {selectedTarif} (
                {pelangganWilayah.length.toLocaleString('id-ID')} Pelanggan)
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ketik IDPEL / Nama di wilayah ini..."
                  value={ketikCariWilayah}
                  onChange={(e) => setKetikCariWilayah(e.target.value)}
                  className={`pl-8 pr-3 py-1.5 rounded-xl border text-xs w-60 ${
                    darkMode
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <button
                onClick={handleExportWilayah}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export Wilayah
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Wilayah</th>
                  <th className="py-2.5 px-3">ID Pelanggan</th>
                  <th className="py-2.5 px-3">Nama Pelanggan</th>
                  <th className="py-2.5 px-3">Golongan Tarif</th>
                  <th className="py-2.5 px-3">Daya (VA)</th>
                  <th className="py-2.5 px-3">Jenis Piutang</th>
                  <th className="py-2.5 px-3">Lembar</th>
                  <th className="py-2.5 px-3 text-right">Total Tunggakan</th>
                </tr>
              </thead>
              <tbody>
                {pelangganWilayah.slice(0, 50).map((p) => (
                  <tr
                    key={p.idPelanggan}
                    className={`border-b ${
                      darkMode
                        ? 'border-slate-800 hover:bg-slate-800/50'
                        : 'border-slate-100 hover:bg-teal-50/40'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold">{p.kodeWilayah}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-600">
                      {p.idPelanggan}
                    </td>
                    <td className="py-2.5 px-3 font-bold">{p.nama}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 font-bold">
                        {p.tarif}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{p.daya.toLocaleString('id-ID')} VA</td>
                    <td className="py-2.5 px-3">{p.jenisPiutang}</td>
                    <td className="py-2.5 px-3">{p.jumlahLembar} Lembar</td>
                    <td className="py-2.5 px-3 font-extrabold text-rose-600 text-right">
                      {formatRupiah(p.totalTagihan)}
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

  // ============================================================================
  // TAMPILAN 2: MENU LACAK LOKASI MAPS (activeTab === 'maps')
  // ============================================================================
  const handleCustomMapSearch = (e) => {
    e.preventDefault();
    if (!customMapInput.trim()) return;
    setMapSearchTarget(customMapInput.trim());
  };

  return (
    <div className="space-y-6">
      {/* Bar Pencarian Lokasi Peta Langsung */}
      <div
        className={`rounded-2xl border p-5 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <Navigation className="w-4 h-4 text-teal-600" />
              Pusat Pelacakan Peta & Rute Kunjungan Lapangan (Google Maps)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ketik nama jalan, daerah, nama pelanggan, atau pilih langsung dari daftar target di kiri bawah
            </p>
          </div>

          <form onSubmit={handleCustomMapSearch} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ketik alamat / lokasi di Google Maps..."
              value={customMapInput}
              onChange={(e) => setCustomMapInput(e.target.value)}
              className={`px-3.5 py-2 rounded-xl border text-xs w-72 ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
            >
              Cari di Peta
            </button>
          </form>
        </div>
      </div>

      {/* Daftar Target Eksekusi & Peta Interaktif Besar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className={`lg:col-span-5 rounded-2xl border p-5 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-extrabold flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-600" />
              Daftar Target Kunjungan Lapangan
            </h4>
            <select
              value={selectedWilayah}
              onChange={(e) => setSelectedWilayah(e.target.value)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="ALL">Semua Wilayah</option>
              {stats.filterOptions.wilayahList.map((w) => (
                <option key={w} value={w}>
                  Wilayah {w}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Ketik Nama / IDPEL untuk mencari pelanggan..."
            value={ketikCariWilayah}
            onChange={(e) => setKetikCariWilayah(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border text-xs mb-3 ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-slate-50 border-slate-200'
            }`}
          />

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {pelangganWilayah.slice(0, 40).map((p) => (
              <div
                key={p.idPelanggan}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                  darkMode
                    ? 'border-slate-800 hover:bg-slate-800/60'
                    : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="truncate">
                  <p className="text-xs font-bold truncate">
                    {p.nama}{' '}
                    <span className="font-mono text-teal-600">({p.idPelanggan})</span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Wilayah {p.kodeWilayah} • {p.daya} VA •{' '}
                    <span className="font-bold text-rose-600">
                      {formatRupiah(p.totalTagihan)}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setMapSearchTarget(`${p.nama} Jakarta PLN`)}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-bold cursor-pointer"
                  >
                    Lacak Peta
                  </button>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      p.nama + ' ' + p.idPelanggan
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-teal-600"
                    title="Buka Navigasi Rute di Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peta Interaktif Ukuran Besar */}
        <div
          className={`lg:col-span-7 rounded-2xl border p-5 flex flex-col ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-extrabold">
              Lokasi Peta Aktif:{' '}
              <span className="text-teal-600">{mapSearchTarget}</span>
            </h4>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                mapSearchTarget
              )}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
            >
              Buka Rute Petunjuk Arah <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="flex-1 min-h-[460px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <iframe
              title="Peta Pelanggan PLN"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '460px' }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                mapSearchTarget
              )}&output=embed`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}