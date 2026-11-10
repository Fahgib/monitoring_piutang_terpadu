import React, { useState, useMemo } from 'react';
import {
  Users,
  Wallet,
  Zap,
  CheckCircle,
  TrendingUp,
  Layers,
  Receipt,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { formatRupiah, hitungStatistikDashboard } from '../utils/piutangCalculator';
import FilterBar from '../components/FilterBar';

const WARNA_CHART = ['#0d9488', '#0284c7', '#f59e0b', '#e11d48', '#7c3aed', '#10b981'];

const INITIAL_FILTERS = {
  wilayah: 'ALL',
  tarif: 'ALL',
  daya: 'ALL',
  jenisPiutang: 'ALL',
  statusAngsur: 'ALL',
  sortBy: 'tagihan_desc',
  page: 1,
};

export default function PageRingkasanGrafik({ records, statsGlobal, darkMode }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filters.wilayah !== 'ALL' && r.kodeWilayah !== filters.wilayah) return false;
      if (filters.tarif !== 'ALL' && r.tarif !== filters.tarif) return false;
      if (filters.daya !== 'ALL' && String(r.daya) !== filters.daya) return false;
      if (filters.jenisPiutang !== 'ALL' && r.jenisPiutang !== filters.jenisPiutang)
        return false;
      if (filters.statusAngsur === 'ANGSURAN' && r.statusAngsur !== 'ANGSURAN')
        return false;
      if (filters.statusAngsur === 'TUNAI' && r.statusAngsur !== 'TUNAI') return false;
      if (filters.statusAngsur === 'PRR_41' && !r.kodeGerakMasuk.includes('41'))
        return false;
      if (
        filters.statusAngsur === 'JT_2025_2026' &&
        !['2025', '2026'].includes(r.tahunJatuhTempo)
      )
        return false;
      if (
        filters.statusAngsur === 'JT_LAMA' &&
        Number(r.tahunJatuhTempo) > 2024
      )
        return false;
      return true;
    });
  }, [records, filters]);

  const stats = useMemo(
    () => hitungStatistikDashboard(filteredRecords),
    [filteredRecords]
  );

  const kpiCards = [
    {
      title: 'Total Rupiah Tunggakan Aktif',
      value: formatRupiah(stats.totalRupiahMenunggak),
      sub: `${stats.jumlahLembarMenunggak.toLocaleString('id-ID')} Lembar Tagihan Belum Lunas`,
      icon: Wallet,
      color: 'text-rose-600 bg-rose-50',
    },
    {
      title: 'Jumlah Pelanggan Menunggak',
      value: `${stats.jumlahPelangganMenunggak.toLocaleString('id-ID')} IDPEL`,
      sub: `Dari total ${stats.totalPelangganUnik.toLocaleString('id-ID')} pelanggan sesuai filter`,
      icon: Users,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      title: 'Realisasi Pelunasan (22 - Lunas)',
      value: formatRupiah(stats.totalRupiahLunas),
      sub: `${stats.jumlahLembarLunas.toLocaleString('id-ID')} Lembar Tagihan Sudah Lunas`,
      icon: CheckCircle,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      title: 'Dominasi Daya Menunggak',
      value: stats.rekapDaya[0]?.daya || '-',
      sub: stats.rekapDaya[0]
        ? `${stats.rekapDaya[0].jumlahPelanggan} Pelanggan (${formatRupiah(stats.rekapDaya[0].rupiah)})`
        : 'Belum ada data',
      icon: Zap,
      color: 'text-sky-600 bg-sky-50',
    },
  ];

  const rincianKomponen = [
    { label: 'Rp Angsuran P2TL', nilai: stats.komponenRupiah.angsuranP2tl },
    { label: 'Rp Angsuran BP (Sambung Baru)', nilai: stats.komponenRupiah.angsuranBp },
    { label: 'Rp PTL (Kompensasi UJL/Prabayar)', nilai: stats.komponenRupiah.ptl },
    { label: 'Rp Angsuran PRR (Ragu-Ragu)', nilai: stats.komponenRupiah.angsuranPrr },
    { label: 'Rp Angsuran KWH', nilai: stats.komponenRupiah.angsuranKwh },
    { label: 'Rp PPJU + PPN + BeaKeterlambatan', nilai: stats.komponenRupiah.ppjuPpnBk },
  ];

  return (
    <div className="space-y-6">
      {/* Bilah Filter Universal */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        options={statsGlobal.filterOptions}
        onReset={() => setFilters(INITIAL_FILTERS)}
        darkMode={darkMode}
        totalHasil={stats.jumlahPelangganMenunggak}
      />

      {/* 4 Kartu KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k, idx) => {
          const Icon = k.icon;
          return (
            <div
              key={idx}
              className={`rounded-2xl border p-5 shadow-2xs ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400">{k.title}</span>
                <div className={`p-2 rounded-xl ${k.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg font-extrabold tracking-tight">{k.value}</p>
              <p className="text-[11px] text-slate-500 mt-1">{k.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Rincian Komponen Tagihan Sesuai Kolom Excel */}
      <div
        className={`rounded-2xl border p-5 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-4 h-4 text-teal-600" />
          <h4 className="text-sm font-extrabold">
            Bedah Komponen Rupiah Tunggakan Aktif (Sesuai Kolom Rincian Excel)
          </h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {rincianKomponen.map((item) => (
            <div
              key={item.label}
              className={`p-3.5 rounded-xl border ${
                darkMode
                  ? 'bg-slate-800/60 border-slate-700'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <p className="text-[11px] text-slate-400 font-semibold">{item.label}</p>
              <p className="text-xs font-extrabold text-teal-600 mt-1">
                {formatRupiah(item.nilai)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Grafik Daya & Jenis Piutang */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className={`rounded-2xl border p-5 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <h4 className="text-sm font-extrabold">
              Distribusi Rupiah Tunggakan per Kelompok Daya (VA)
            </h4>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.rekapDaya.slice(0, 8)}>
                <XAxis dataKey="daya" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Jt`}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(value) => formatRupiah(value)} />
                <Bar dataKey="rupiah" radius={[6, 6, 0, 0]}>
                  {stats.rekapDaya.slice(0, 8).map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={WARNA_CHART[index % WARNA_CHART.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-5 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-teal-600" />
            <h4 className="text-sm font-extrabold">
              Proporsi Tunggakan Berdasarkan Jenis Piutang
            </h4>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.rekapJenisPiutang}
                  dataKey="rupiah"
                  nameKey="jenis"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ name, percent }) =>
                    `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {stats.rekapJenisPiutang.map((_, index) => (
                    <Cell
                      key={`pie-${index}`}
                      fill={WARNA_CHART[index % WARNA_CHART.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatRupiah(value)} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabel Rekap Daya & Golongan Tarif */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className={`rounded-2xl border p-5 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h4 className="text-sm font-extrabold mb-4">
            Rekapitulasi Tunggakan per Kelompok Daya (VA)
          </h4>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2 px-3">Daya</th>
                  <th className="py-2 px-3">Pelanggan</th>
                  <th className="py-2 px-3">Lembar</th>
                  <th className="py-2 px-3">Total Rupiah</th>
                </tr>
              </thead>
              <tbody>
                {stats.rekapDaya.map((item) => (
                  <tr
                    key={item.daya}
                    className={`border-b ${
                      darkMode
                        ? 'border-slate-800 hover:bg-slate-800/50'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-teal-600">{item.daya}</td>
                    <td className="py-2 px-3 font-semibold">{item.jumlahPelanggan} IDPEL</td>
                    <td className="py-2 px-3">{item.lembar} Lembar</td>
                    <td className="py-2 px-3 font-bold">{formatRupiah(item.rupiah)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-5 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h4 className="text-sm font-extrabold mb-4">
            Rekapitulasi Tunggakan per Golongan Tarif
          </h4>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2 px-3">Tarif</th>
                  <th className="py-2 px-3">Pelanggan</th>
                  <th className="py-2 px-3">Lembar</th>
                  <th className="py-2 px-3">Total Rupiah</th>
                </tr>
              </thead>
              <tbody>
                {stats.rekapTarif.map((item) => (
                  <tr
                    key={item.tarif}
                    className={`border-b ${
                      darkMode
                        ? 'border-slate-800 hover:bg-slate-800/50'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-sky-600">{item.tarif}</td>
                    <td className="py-2 px-3 font-semibold">{item.jumlahPelanggan} IDPEL</td>
                    <td className="py-2 px-3">{item.lembar} Lembar</td>
                    <td className="py-2 px-3 font-bold">{formatRupiah(item.rupiah)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}