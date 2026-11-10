import React, { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import PageUploadFile from './pages/PageUploadFile';
import PageRingkasanGrafik from './pages/PageRingkasanGrafik';
import PageReportHarian from './pages/PageReportHarian';
import PageKategoriTunggakan from './pages/PageKategoriTunggakan';
import PageLingkupDaerah from './pages/PageLingkupDaerah';
import { hitungStatistikDashboard } from './utils/piutangCalculator';
import { CheckCircle2, Sparkles, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedFiles, setUploadedFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('pln_piutang_files');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [darkMode, setDarkMode] = useState(false);
  const [notifRekonsiliasi, setNotifRekonsiliasi] = useState(null);

  // Simpan otomatis ke localStorage agar tidak hilang saat browser di-refresh
  useEffect(() => {
    try {
      localStorage.setItem('pln_piutang_files', JSON.stringify(uploadedFiles));
    } catch (e) {
      console.error('Gagal menyimpan ke localStorage:', e);
    }
  }, [uploadedFiles]);

  const handleAddFiles = (newFiles) => {
    setUploadedFiles((prev) => {
      // Fitur Rekonsiliasi Otomatis (Auto-Detect Perubahan Lunas)
      const dataLamaIdPel = new Set(prev.flatMap((f) => f.records.map((r) => r.idPelanggan)));
      let jumlahPelangganBaruLunas = 0;

      if (prev.length > 0) {
        newFiles.forEach((nf) => {
          nf.records.forEach((nr) => {
            if (dataLamaIdPel.has(nr.idPelanggan) && nr.isLunas) {
              jumlahPelangganBaruLunas++;
            }
          });
        });
        if (jumlahPelangganBaruLunas > 0) {
          setNotifRekonsiliasi(
            `Rekonsiliasi Otomatis: Ditemukan ${jumlahPelangganBaruLunas} transaksi pelanggan yang kini berstatus Lunas pada file baru!`
          );
        }
      }

      return [...prev, ...newFiles];
    });
  };

  const handleRemoveFile = (fileId) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleUpdateFileMonth = (fileId, bulanBaru) => {
    setUploadedFiles((prev) =>
      prev.map((f) => {
        if (f.id !== fileId) return f;
        return {
          ...f,
          bulan: bulanBaru,
          records: f.records.map((r) => ({ ...r, bulanData: bulanBaru })),
        };
      })
    );
  };

  const handleMarkPaidToday = (idPelangganTarget) => {
    const tglHariIni = dayjs().format('DD/MM/YYYY');
    setUploadedFiles((prev) =>
      prev.map((f) => ({
        ...f,
        records: f.records.map((r) => {
          if (r.idPelanggan === idPelangganTarget && r.isMenunggak) {
            return {
              ...r,
              isMenunggak: false,
              isLunas: true,
              kodeGerakKeluar: '22 - Pelunasan Harian (Live)',
              tglPelunasan: tglHariIni,
            };
          }
          return r;
        }),
      }))
    );
  };

  const availableMonths = useMemo(() => {
    return Array.from(new Set(uploadedFiles.map((f) => f.bulan)));
  }, [uploadedFiles]);

  const filteredRecords = useMemo(() => {
    const semuaBaris = uploadedFiles.flatMap((f) => f.records);
    return semuaBaris.filter((r) => {
      const cocokBulan = selectedMonth === 'ALL' || r.bulanData === selectedMonth;
      if (!cocokBulan) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.idPelanggan.toLowerCase().includes(q) ||
        r.nama.toLowerCase().includes(q) ||
        r.noAgenda.toLowerCase().includes(q) ||
        r.noRegister.toLowerCase().includes(q) ||
        r.jenisPiutang.toLowerCase().includes(q)
      );
    });
  }, [uploadedFiles, selectedMonth, searchQuery]);

  const stats = useMemo(
    () => hitungStatistikDashboard(filteredRecords),
    [filteredRecords]
  );

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div
        className={`flex min-h-screen font-sans ${
          darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
        }`}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          uploadedFiles={uploadedFiles}
          stats={stats}
          darkMode={darkMode}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            availableMonths={availableMonths}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onResetFilter={() => {
              setSearchQuery('');
              setSelectedMonth('ALL');
            }}
          />

          {/* Banner Notifikasi Rekonsiliasi Otomatis */}
          {notifRekonsiliasi && (
            <div className="mx-6 mt-4 p-4 rounded-2xl bg-emerald-500 text-white flex items-center justify-between shadow-md text-xs font-bold">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>{notifRekonsiliasi}</span>
              </div>
              <button
                onClick={() => setNotifRekonsiliasi(null)}
                className="p-1 rounded-lg hover:bg-emerald-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <main className="p-6 flex-1">
            {activeTab === 'upload' && (
              <PageUploadFile
                uploadedFiles={uploadedFiles}
                onAddFiles={handleAddFiles}
                onRemoveFile={handleRemoveFile}
                onUpdateFileMonth={handleUpdateFileMonth}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'ringkasan' && (
              <PageRingkasanGrafik
                records={filteredRecords}
                statsGlobal={stats}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'reportharian' && (
              <PageReportHarian
                stats={stats}
                onMarkPaidToday={handleMarkPaidToday}
                darkMode={darkMode}
              />
            )}

            {[
              'pivot-sheet3',
              'menunggak',
              'kat-n16',
              'kat-n27',
              'kat-r8n7',
              'kat-n26prr',
            ].includes(activeTab) && (
              <PageKategoriTunggakan
                activeTab={activeTab}
                stats={stats}
                onMarkPaidToday={handleMarkPaidToday}
                darkMode={darkMode}
              />
            )}

            {['daerah', 'maps'].includes(activeTab) && (
              <PageLingkupDaerah
                activeTab={activeTab}
                stats={stats}
                darkMode={darkMode}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}