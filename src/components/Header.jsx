import React from 'react';
import { Search, Calendar, Moon, Sun, RotateCw } from 'lucide-react';

export default function Header({
  searchQuery,
  setSearchQuery,
  selectedMonth,
  setSelectedMonth,
  availableMonths,
  darkMode,
  setDarkMode,
  onResetFilter,
}) {
  return (
    <header
      className={`sticky top-0 z-20 border-b px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 ${
        darkMode
          ? 'bg-slate-900/95 border-slate-800 text-white'
          : 'bg-white/95 border-slate-200 text-slate-800'
      } backdrop-blur-md`}
    >
      <div>
        <h2 className="text-base font-bold tracking-tight">
          Dashboard Monitoring Piutang & Langganan Menunggak PLN
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pantau pelanggan menunggak, rincian daya, lingkup daerah, dan report pelunasan harian secara langsung
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Kolom Pencarian Global */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari IDPEL / Nama / No Agenda..."
            className={`pl-8 pr-3 py-1.5 text-xs rounded-xl border w-60 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Filter Bulan */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-teal-600" />
          <span className="text-slate-400">Filter Bulan:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="font-semibold bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="ALL">
              Semua Bulan ({availableMonths.length} Bulan Aktif)
            </option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Mode Gelap / Terang */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span>{darkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
        </button>

        {/* Tombol Reset Pencarian & Filter */}
        <button
          onClick={onResetFilter}
          title="Reset Filter & Pencarian"
          className={`p-2 rounded-xl border transition ${
            darkMode
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}