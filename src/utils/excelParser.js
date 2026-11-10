import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const DAFTAR_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function deteksiBulanDariNamaFile(fileName) {
  const lower = fileName.toLowerCase();
  for (const bulan of DAFTAR_BULAN) {
    if (lower.includes(bulan.toLowerCase())) return `${bulan} 2026`;
  }
  return `${DAFTAR_BULAN[new Date().getMonth()]} ${new Date().getFullYear()}`;
}

export function normalisasiBaris(row, sourceFile, sheetName, bulanData) {
  const idPel = String(
    row['ID Pelanggan'] || row['IDPEL'] || row['Id Pelanggan'] || ''
  ).trim();

  if (!idPel || idPel === 'undefined' || idPel === 'Grand Total' || idPel === 'Row Labels') {
    return null;
  }

  const rpTagihan = Number(
    String(row['Rp Tagihan'] || row['RP TAGIHAN'] || row['Tagihan'] || 0).replace(/[^0-9.-]+/g, '')
  ) || 0;

  const kodeGerakKeluar = String(row['Kode Gerak Keluar'] || '').trim();
  const tglPelunasan = String(row['Tgl Pelunasan'] || '').trim();
  const isLunas = kodeGerakKeluar.includes('22') || kodeGerakKeluar.toLowerCase().includes('lunas');
  const isBatal = kodeGerakKeluar.includes('31') || kodeGerakKeluar.toLowerCase().includes('batal');
  const isMenunggak = !isLunas && !isBatal;

  const kodeWilayah = idPel.substring(0, 5) || String(row['Unit UP'] || '54410');
  const tglJatuhTempo = String(row['Tgl Jatuh Tempo'] || '-').trim();
  const tahunJatuhTempo = tglJatuhTempo.length >= 4 ? tglJatuhTempo.slice(-4) : '-';

  return {
    idUnik: `${idPel}-${row['No Register'] || ''}-${row['No Agenda'] || ''}-${tglJatuhTempo}`,
    noAgenda: String(row['No Agenda'] || '-').trim(),
    noRegister: String(row['No Register'] || '-').trim(),
    idPelanggan: idPel,
    nama: String(row['Nama'] || row['NAMA'] || 'Pelanggan PLN').trim(),
    kodePembpp: String(row['Kode Pembpp'] || '-').trim(),
    jenisPiutang: String(row['Jenis Piutang'] || 'Lainnya').trim(),
    rpTagihan,
    tglEntri: String(row['Tgl Entri'] || '-').trim(),
    tglJatuhTempo,
    tahunJatuhTempo,
    kodeGerakMasuk: String(row['Kode Gerak Masuk'] || '-').trim(),
    kodeGerakKeluar: kodeGerakKeluar || 'Belum Lunas',
    tglPelunasan: tglPelunasan && tglPelunasan !== 'undefined' ? tglPelunasan : '-',
    unitUp: String(row['Unit UP'] || '54410').trim(),
    kodeWilayah,
    tarif: String(row['Tarif'] || '-').trim(),
    daya: Number(row['Daya'] || 0),
    rpPtl: Number(row['Rp PTL'] || 0),
    rpAngsuranBp: Number(row['Rp Angsuran BP'] || 0),
    rpAngsuranP2tl: Number(row['Rp Angsuran P2TL'] || 0),
    rpAngsuranKwh: Number(row['Rp Angsuran KWH'] || 0),
    rpAngsuranPrr: Number(row['Rp Angsuran PRR'] || 0),
    rpPpn: Number(row['Rp PPN'] || 0),
    rpPpju: Number(row['Rp PPJU'] || 0),
    rpBk: Number(row['Rp BK'] || 0),
    statusPenetapan: String(row['Status Penetapan'] || '-').trim(),
    statusAngsur: String(row['Status Angsur'] || '-').trim(),
    noAgendaMohon: String(row['No Agenda Mohon'] || '-').trim(),
    isLunas,
    isBatal,
    isMenunggak,
    sourceFile,
    sheetName,
    bulanData,
  };
}

export async function parseExcelFile(file, pilihanBulan = 'auto', pilihanKategori = 'auto') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetNames = workbook.SheetNames;

        const bulanTerpilih =
          pilihanBulan === 'auto' ? deteksiBulanDariNamaFile(file.name) : pilihanBulan;
        const kategoriTerpilih =
          pilihanKategori === 'auto' ? 'Database Master Monitoring Piutang' : pilihanKategori;

        const allRows = [];
        const seenKeys = new Set();

        for (const sheetName of sheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonSheet = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          // Lewati sheet pivot seperti Sheet3 yang tidak memiliki kolom ID Pelanggan
          if (jsonSheet.length > 0 && 'Row Labels' in jsonSheet[0]) continue;

          for (const rawRow of jsonSheet) {
            const cleanRow = normalisasiBaris(rawRow, file.name, sheetName, bulanTerpilih);
            if (!cleanRow) continue;

            const dedupKey = `${cleanRow.idPelanggan}_${cleanRow.noAgenda}_${cleanRow.noRegister}_${cleanRow.rpTagihan}`;
            if (!seenKeys.has(dedupKey)) {
              seenKeys.add(dedupKey);
              allRows.push(cleanRow);
            }
          }
        }

        const uniquePelanggan = new Set(allRows.map((r) => r.idPelanggan)).size;
        const pelangganMenunggak = new Set(
          allRows.filter((r) => r.isMenunggak).map((r) => r.idPelanggan)
        ).size;

        resolve({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          bulan: bulanTerpilih,
          kategori: kategoriTerpilih,
          uploadTime: dayjs().format('HH:mm'),
          uploadDate: dayjs().format('DD/MM/YYYY'),
          sheets: sheetNames,
          totalBaris: allRows.length,
          jumlahPelanggan: uniquePelanggan,
          pelangganMenunggak,
          records: allRows,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}