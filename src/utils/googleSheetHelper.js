import Papa from 'papaparse';
import dayjs from 'dayjs';
import { normalisasiBaris } from './excelParser';

export function ubahKeCsvUrl(googleSheetUrl) {
  try {
    const match = googleSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return null;
    const sheetId = match[1];
    const gidMatch = googleSheetUrl.match(/[#&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  } catch {
    return null;
  }
}

export async function fetchGoogleSheetData(googleSheetUrl, bulan = 'Semua Bulan') {
  const csvUrl = ubahKeCsvUrl(googleSheetUrl);
  if (!csvUrl) {
    throw new Error('Format link Google Spreadsheet tidak valid. Pastikan link memiliki akses publik (Anyone with the link).');
  }

  return new Promise((resolve, reject) => {
    Papa.parse(csvUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const namaSumber = 'Google Spreadsheet Live';
        const records = [];
        const bulanAktif = bulan === 'auto' ? `Live ${dayjs().format('MMMM YYYY')}` : bulan;

        results.data.forEach((rawRow) => {
          const clean = normalisasiBaris(rawRow, namaSumber, 'GoogleSheet', bulanAktif);
          if (clean) records.push(clean);
        });

        const uniquePelanggan = new Set(records.map((r) => r.idPelanggan)).size;

        resolve({
          id: `gsheet-${Date.now()}`,
          fileName: 'Google Spreadsheet (Sinkronisasi Live)',
          fileSize: 'Cloud Live',
          bulan: bulanAktif,
          kategori: 'Sinkronisasi Google Sheet',
          uploadTime: dayjs().format('HH:mm'),
          uploadDate: dayjs().format('DD/MM/YYYY'),
          sheets: ['GoogleSheet_Main'],
          totalBaris: records.length,
          jumlahPelanggan: uniquePelanggan,
          records,
        });
      },
      error: (err) => {
        reject(new Error('Gagal mengunduh Google Sheet: ' + err.message));
      },
    });
  });
}