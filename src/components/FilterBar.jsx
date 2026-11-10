import React from 'react';
import { Filter, RotateCcw, ArrowUpDown, Calendar } from 'lucide-react';

export default function FilterBar({
  filters,
  setFilters,
  options,
  onReset,
  darkMode,
  totalHasil = 0,
}) {
  const inputClass = `px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition ${
    darkMode
      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400'
      : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400'
  }`;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-2xs ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-teal-700 dark:text-teal-400">
          <Filter className="w-4 h-4" />
          <span>
            Filter & Penyaringan Cepat ({totalHasil.toLocaleString('id-ID')} Data Sesuai)
          </span>
        </div>
        <button
          onClick={onReset}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
            darkMode
              ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <RotateCcw className="w-3 h-3" /> Reset Filter
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Filter Wilayah */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
            Kode Wilayah / UP
          </label>
          <select
            value={filters.wilayah}
            onChange={(e) => setFilters({ ...filters, wilayah: e.target.value, page: 1 })}
            className={`w-full ${inputClass}`}
          >
            <option value="ALL">Semua Wilayah</option>
            {options.wilayahList.map((w) => (
              <option key={w} value={w}>
                Wilayah {w}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Tarif */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
            Golongan Tarif
          </label>
          <select
            value={filters.tarif}
            onChange={(e) => setFilters({ ...filters, tarif: e.target.value, page: 1 })}
            className={`w-full ${inputClass}`}
          >
            <option value="ALL">Semua Tarif</option>
            {options.tarifList.map((t) => (
              <option key={t} value={t}>
                Tarif {t}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Daya */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
            Daya Listrik (VA)
          </label>
          <select
            value={filters.daya}
            onChange={(e) => setFilters({ ...filters, daya: e.target.value, page: 1 })}
            className={`w-full ${inputClass}`}
          >
            <option value="ALL">Semua Daya</option>
            {options.dayaList.map((d) => (
              <option key={d} value={String(d)}>
                {Number(d).toLocaleString('id-ID')} VA
              </option>
            ))}
          </select>
        </div>

        {/* Ketik Tanggal / Tahun Jatuh Tempo Langsung */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
            <Calendar className="w-3 h-3 inline mr-0.5" /> Ketik Tgl / Tahun JT
          </label>
          <input
            type="text"
            placeholder="Misal: 20/12/2025 atau 2025"
            value={filters.ketikJatuhTempo || ''}
            onChange={(e) =>
              setFilters({ ...filters, ketikJatuhTempo: e.target.value, page: 1 })
            }
            className={`w-full ${inputClass}`}
          />
        </div>

        {/* Filter Skema Angsuran */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
            Skema Pembayaran
          </label>
          <select
            value={filters.statusAngsur}
            onChange={(e) =>
              setFilters({ ...filters, statusAngsur: e.target.value, page: 1 })
            }
            className={`w-full ${inputClass}`}
          >
            <option value="ALL">Semua Status</option>
            <option value="ANGSURAN">Status: ANGSURAN</option>
            <option value="TUNAI">Status: TUNAI</option>
            <option value="PRR_41">Gerak 41: Ragu-Ragu</option>
          </select>
        </div>

        {/* Pengurutan Data */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> Urutkan Data
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value, page: 1 })}
            className={`w-full ${inputClass}`}
          >
            <option value="tagihan_desc">Rp Tagihan Terbesar</option>
            <option value="tagihan_asc">Rp Tagihan Terkecil</option>
            <option value="lembar_desc">Lembar Terbanyak</option>
            <option value="nama_asc">Nama Pelanggan (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
}