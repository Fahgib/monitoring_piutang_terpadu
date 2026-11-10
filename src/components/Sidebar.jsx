import React from 'react';
import {
  FileSpreadsheet,
  LayoutGrid,
  FileCheck2,
  Users,
  ShieldAlert,
  Wrench,
  CreditCard,
  AlertOctagon,
  Coins,
  Table2,
  MapPin,
  Map,
  CheckCircle2,
  Plus,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  uploadedFiles,
  stats,
  darkMode,
}) {
  const menuUtama = [
    {
      id: 'upload',
      label: 'Cek & Upload File Excel',
      icon: FileSpreadsheet,
      badge: uploadedFiles.length,
      badgeColor: 'bg-teal-700 text-white',
    },
    {
      id: 'ringkasan',
      label: 'Dashboard & Komponen Rp',
      icon: LayoutGrid,
    },
    {
      id: 'pivot-sheet3',
      label: 'Rekap Pivot (Sheet 3)',
      icon: Table2,
      badge: stats.jumlahPelangganMenunggak,
      badgeColor: 'bg-purple-100 text-purple-700 font-bold',
    },
    {
      id: 'reportharian',
      label: 'Report Harian & Lunas',
      icon: FileCheck2,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-100 text-emerald-700 font-bold',
    },
  ];

  // Kelima Jenis Piutang sesuai Filter Excel: N16, N26, N27, N7, R8
  const menuKategori = [
    {
      id: 'menunggak',
      label: 'Semua Tunggakan Aktif',
      icon: Users,
      badge: stats.jumlahPelangganMenunggak,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold',
    },
    {
      id: 'kat-n16',
      label: 'N16 - TS P2TL',
      icon: ShieldAlert,
      badge: stats.katN16P2TL.length,
      badgeColor: 'bg-rose-100 text-rose-700 font-bold',
    },
    {
      id: 'kat-n26',
      label: 'N26 - Angsuran PRR',
      icon: AlertOctagon,
      badge: stats.katN26PRR.length,
      badgeColor: 'bg-orange-100 text-orange-800 font-bold',
    },
    {
      id: 'kat-n27',
      label: 'N27 - Angsuran BP',
      icon: Wrench,
      badge: stats.katN27BP.length,
      badgeColor: 'bg-sky-100 text-sky-700 font-bold',
    },
    {
      id: 'kat-n7',
      label: 'N7 - Kompensasi UJL',
      icon: Coins,
      badge: stats.katN7UJL.length,
      badgeColor: 'bg-teal-100 text-teal-800 font-bold',
    },
    {
      id: 'kat-r8',
      label: 'R8 - Piutang Prabayar',
      icon: CreditCard,
      badge: stats.katR8Prabayar.length,
      badgeColor: 'bg-indigo-100 text-indigo-700 font-bold',
    },
  ];

  const menuWilayah = [
    {
      id: 'daerah',
      label: 'Lingkup Daerah & Tarif',
      icon: MapPin,
    },
    {
      id: 'maps',
      label: 'Lacak Lokasi Maps',
      icon: Map,
      badge: 'MAPS',
      badgeColor: 'bg-blue-100 text-blue-700 font-bold',
    },
  ];

  const renderItem = (item) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => setActiveTab(item.id)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
          isActive
            ? 'bg-teal-600 text-white shadow-xs'
            : darkMode
            ? 'text-slate-300 hover:bg-slate-800'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <Icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </div>
        {item.badge !== undefined && (
          <span
            className={`px-2 py-0.5 text-[10px] rounded-full ${
              isActive ? 'bg-teal-800 text-white' : item.badgeColor
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`w-64 shrink-0 border-r flex flex-col justify-between min-h-screen select-none ${
        darkMode
          ? 'bg-slate-900 border-slate-800 text-white'
          : 'bg-white border-slate-200 text-slate-800'
      }`}
    >
      <div className="p-4 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <img
            src="/logo-pln.jpeg"
            alt="Logo PLN"
            className="w-10 h-10 rounded-lg object-contain bg-white p-0.5 border border-slate-200 shadow-2xs shrink-0"
          />
          <div>
            <h1 className="text-xs font-extrabold tracking-wide">PT PLN (PERSERO)</h1>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
              UP3 Jatinegara
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            1. Pusat Data & Rekapitulasi
          </p>
          {menuUtama.map(renderItem)}
        </div>

        <div className="space-y-1">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            2. Jenis Piutang & Penagihan
          </p>
          {menuKategori.map(renderItem)}
        </div>

        <div className="space-y-1">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            3. Kewilayahan & Peta
          </p>
          {menuWilayah.map(renderItem)}
        </div>
      </div>

      <div
        className={`p-3 m-3 rounded-xl border ${
          darkMode
            ? 'bg-slate-800/60 border-slate-700'
            : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold">
            File Masuk ({uploadedFiles.length})
          </span>
          <button
            onClick={() => setActiveTab('upload')}
            className="text-[11px] font-bold text-teal-600 hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Tambah File
          </button>
        </div>

        {uploadedFiles.length === 0 ? (
          <p className="text-[11px] text-slate-400 py-1">Belum ada file dimasukkan</p>
        ) : (
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {uploadedFiles.map((f) => (
              <div
                key={f.id}
                className={`flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg border ${
                  darkMode
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate font-semibold">{f.fileName}</span>
                </div>
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-teal-50 text-teal-700 font-bold shrink-0">
                  {f.bulan.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}