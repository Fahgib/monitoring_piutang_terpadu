import React, { useRef, useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Trash2,
  Link2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { parseExcelFile } from '../utils/excelParser';
import { fetchGoogleSheetData } from '../utils/googleSheetHelper';

const PILIHAN_BULAN = [
  'Deteksi Otomatis dari Nama File',
  'Januari 2026', 'Februari 2026', 'Maret 2026', 'April 2026',
  'Mei 2026', 'Juni 2026', 'Juli 2026', 'Agustus 2026',
  'September 2026', 'Oktober 2026', 'November 2026', 'Desember 2026',
];

const PILIHAN_KATEGORI = [
  'Deteksi Otomatis dari Nama File',
  '1. Master Monitoring Piutang & Mutasi N',
  '2. Pelanggan Habit (2 Lembar)',
  '3. Tunggakan 3 Lembar & Mutasi N',
];

export default function PageUploadFile({
  uploadedFiles,
  onAddFiles,
  onRemoveFile,
  onUpdateFileMonth,
  darkMode,
}) {
  const fileInputRef = useRef(null);
  const [bulanStep1, setBulanStep1] = useState('auto');
  const [kategoriStep2, setKategoriStep2] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showModalGSheet, setShowModalGSheet] = useState(false);
  const [gSheetUrl, setGSheetUrl] = useState('');

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setLoading(true);
    setErrorMsg('');
    const hasilBaru = [];

    for (const file of files) {
      const sudahAda = uploadedFiles.some(
        (f) => f.fileName.toLowerCase() === file.name.toLowerCase()
      );
      if (sudahAda) {
        setErrorMsg(`File "${file.name}" sudah pernah dimasukkan sebelumnya.`);
        continue;
      }
      try {
        const parsed = await parseExcelFile(file, bulanStep1, kategoriStep2);
        hasilBaru.push(parsed);
      } catch (err) {
        setErrorMsg(`Gagal membaca file ${file.name}: ${err.message}`);
      }
    }

    if (hasilBaru.length > 0) {
      onAddFiles(hasilBaru);
    }
    setLoading(false);
    e.target.value = '';
  };

  const handleConnectGoogleSheet = async (e) => {
    e.preventDefault();
    if (!gSheetUrl.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const parsed = await fetchGoogleSheetData(gSheetUrl, bulanStep1);
      onAddFiles([parsed]);
      setGSheetUrl('');
      setShowModalGSheet(false);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Panel Atas: Input Multi-Bulan */}
      <div
        className={`rounded-2xl border p-6 shadow-xs ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 mb-2">
              Pusat Input Data Multi-Bulan (Januari - Desember)
            </span>
            <h3 className="text-lg font-extrabold">
              Tambah & Cek File Excel yang Sudah Dimasukkan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Anda bebas memasukkan banyak file sekaligus (Januari-Desember). Sistem otomatis mengenali bulan dari nama file atau bisa Anda ubah per kartu di bawah.
            </p>
          </div>

          <button
            onClick={() => setShowModalGSheet(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Link2 className="w-4 h-4" />
            Hubungkan Link Google Sheet
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 3 Langkah Upload */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
              Langkah 1: Pilih Bulan Data
            </label>
            <select
              value={bulanStep1}
              onChange={(e) => setBulanStep1(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="auto">✨ Deteksi Otomatis dari Nama File</option>
              {PILIHAN_BULAN.slice(1).map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
              Langkah 2: Jenis File Excel
            </label>
            <select
              value={kategoriStep2}
              onChange={(e) => setKategoriStep2(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="auto">✨ Deteksi Otomatis dari Nama File</option>
              {PILIHAN_KATEGORI.slice(1).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses File Excel...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Langkah 3: Pilih & Masukan File Excel (Bisa Banyak)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Panel Bawah: Daftar Semua File yang Sudah Masuk */}
      <div
        className={`rounded-2xl border p-6 shadow-xs ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-5">
          <FileSpreadsheet className="w-5 h-5 text-teal-600" />
          <h4 className="text-sm font-extrabold">
            Daftar Semua File yang Sudah Masuk ({uploadedFiles.length} File)
          </h4>
        </div>

        {uploadedFiles.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
            <Sparkles className="w-8 h-8 text-teal-500 mx-auto mb-2" />
            <p className="text-sm font-bold">Belum Ada File Excel yang Dimasukkan</p>
            <p className="text-xs text-slate-400 mt-1">
              Klik tombol "Langkah 3: Pilih & Masukan File Excel" di atas untuk mengunggah file monitoring_piutang.xlsx Anda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition shadow-2xs ${
                  darkMode
                    ? 'bg-slate-800/60 border-slate-700'
                    : 'bg-emerald-50/20 border-emerald-200/80'
                }`}
              >
                <div>
                  {/* Baris Atas Kartu: Dropdown Bulan & Badge Sudah Masuk */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <select
                      value={file.bulan}
                      onChange={(e) => onUpdateFileMonth(file.id, e.target.value)}
                      className="px-3 py-1 rounded-full bg-teal-600 text-white text-[11px] font-bold cursor-pointer focus:outline-none"
                    >
                      {PILIHAN_BULAN.slice(1).map((b) => (
                        <option key={b} value={b} className="text-slate-900 bg-white">
                          {b}
                        </option>
                      ))}
                    </select>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" /> Sudah Masuk
                    </span>
                  </div>

                  {/* Detail File */}
                  <h5 className="text-xs font-extrabold flex items-center gap-1.5 mb-2 truncate">
                    <FileSpreadsheet className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="truncate">{file.fileName}</span>
                  </h5>

                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <p>
                      <span className="text-slate-400">Kategori:</span>{' '}
                      <span className="font-semibold text-teal-700 dark:text-teal-400">
                        {file.kategori}
                      </span>
                    </p>
                    <p>
                      • Jumlah Data:{' '}
                      <span className="font-bold">
                        {file.jumlahPelanggan.toLocaleString('id-ID')} pelanggan
                      </span>{' '}
                      ({file.totalBaris.toLocaleString('id-ID')} baris - Jam {file.uploadTime})
                    </p>
                    <p className="truncate">
                      • Sheet:{' '}
                      <span className="font-medium text-slate-500">
                        {file.sheets.join(', ')}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Tombol Hapus File */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700 flex justify-end">
                  <button
                    onClick={() => onRemoveFile(file.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300 text-[11px] font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Hapus File
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Integrasi Link Google Sheet */}
      {showModalGSheet && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-xl ${
              darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'
            }`}
          >
            <h4 className="text-sm font-extrabold mb-1">
              Hubungkan Link Google Spreadsheet
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Pastikan akses Google Sheet sudah diatur ke "Siapa saja yang memiliki link dapat melihat".
            </p>
            <form onSubmit={handleConnectGoogleSheet} className="space-y-4">
              <input
                type="url"
                required
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={gSheetUrl}
                onChange={(e) => setGSheetUrl(e.target.value)}
                className={`w-full px-3.5 py-2 rounded-xl border text-xs ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-200'
                }`}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModalGSheet(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  {loading ? 'Menghubungkan...' : 'Tarik Data Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}