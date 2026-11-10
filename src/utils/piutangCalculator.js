const NAMA_WILAYAH = {
  '54410': 'ULP 54410 - Wilayah Utama',
  '54420': 'ULP 54420 - Wilayah Sektor B',
  '54110': 'ULP 54110 - Wilayah Sektor C',
  '54710': 'ULP 54710 - Wilayah Sektor D',
};

export function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(angka || 0);
}

export function hitungStatistikDashboard(records) {
  const menunggakList = records.filter((r) => r.isMenunggak);
  const lunasList = records.filter((r) => r.isLunas);
  const batalList = records.filter((r) => r.isBatal);

  const totalRupiahMenunggak = menunggakList.reduce((sum, r) => sum + r.rpTagihan, 0);
  const totalRupiahLunas = lunasList.reduce((sum, r) => sum + r.rpTagihan, 0);
  const totalRupiahBatal = batalList.reduce((sum, r) => sum + r.rpTagihan, 0);

  // Deteksi PRR Ragu-Ragu (02/02/2222 atau gerak 41)
  const isPrrAnomali = (r) =>
    r.tglJatuhTempo === '02/02/2222' || r.kodeGerakMasuk.includes('41');

  const menunggakMurniList = menunggakList.filter((r) => !isPrrAnomali(r));
  const totalRupiahMenunggakMurni = menunggakMurniList.reduce((sum, r) => sum + r.rpTagihan, 0);

  // Riwayat angsuran lunas per ID Pelanggan
  const riwayatLunasPerPelanggan = {};
  lunasList.forEach((r) => {
    if (!riwayatLunasPerPelanggan[r.idPelanggan]) {
      riwayatLunasPerPelanggan[r.idPelanggan] = { lembarLunas: 0, rpLunas: 0, daftarLunas: [] };
    }
    riwayatLunasPerPelanggan[r.idPelanggan].lembarLunas += 1;
    riwayatLunasPerPelanggan[r.idPelanggan].rpLunas += r.rpTagihan;
    riwayatLunasPerPelanggan[r.idPelanggan].daftarLunas.push(r);
  });

  // Kelompokkan Pelanggan Menunggak
  const mapPelangganMenunggak = {};
  menunggakList.forEach((r) => {
    if (!mapPelangganMenunggak[r.idPelanggan]) {
      const histLunas = riwayatLunasPerPelanggan[r.idPelanggan] || {
        lembarLunas: 0,
        rpLunas: 0,
        daftarLunas: [],
      };
      mapPelangganMenunggak[r.idPelanggan] = {
        idPelanggan: r.idPelanggan,
        nama: r.nama,
        tarif: r.tarif,
        daya: r.daya,
        unitUp: r.unitUp,
        kodeWilayah: r.kodeWilayah,
        kodePembpp: r.kodePembpp,
        jenisPiutang: r.jenisPiutang,
        statusAngsur: r.statusAngsur,
        kodeGerakMasuk: r.kodeGerakMasuk,
        noAgendaMohon: r.noAgendaMohon,
        jumlahLembar: 0,
        lembarSudahLunas: histLunas.lembarLunas,
        rpSudahLunas: histLunas.rpLunas,
        daftarSudahLunas: histLunas.daftarLunas,
        totalTagihan: 0,
        tglJatuhTempoTerakhir: r.tglJatuhTempo,
        tahunJatuhTempo: r.tahunJatuhTempo,
        isPrrAnomali: isPrrAnomali(r),
        daftarTagihan: [],
        n16: 0,
        n26: 0,
        n27: 0,
        n7: 0,
        r8: 0,
      };
    }

    const p = mapPelangganMenunggak[r.idPelanggan];
    p.jumlahLembar += 1;
    p.totalTagihan += r.rpTagihan;
    p.daftarTagihan.push(r);

    if (r.kodePembpp === 'N16') p.n16 += r.rpTagihan;
    else if (r.kodePembpp === 'N26') p.n26 += r.rpTagihan;
    else if (r.kodePembpp === 'N27') p.n27 += r.rpTagihan;
    else if (r.kodePembpp === 'N7') p.n7 += r.rpTagihan;
    else if (r.kodePembpp === 'R8') p.r8 += r.rpTagihan;
  });

  const pelangganMenunggakArray = Object.values(mapPelangganMenunggak).sort(
    (a, b) => b.totalTagihan - a.totalTagihan
  );

  // Top 50 Prioritas Pareto
  const top50Pareto = pelangganMenunggakArray.slice(0, 50);

  // Kategori Jenis Piutang
  const katN16P2TL = pelangganMenunggakArray.filter((p) => p.n16 > 0 || p.kodePembpp === 'N16');
  const katN27BP = pelangganMenunggakArray.filter((p) => p.n27 > 0 || p.kodePembpp === 'N27');
  const katR8N7 = pelangganMenunggakArray.filter(
    (p) => p.r8 > 0 || p.n7 > 0 || ['R8', 'N7'].includes(p.kodePembpp)
  );
  const katN26PRR = pelangganMenunggakArray.filter(
    (p) => p.n26 > 0 || p.isPrrAnomali || p.kodePembpp === 'N26'
  );

  // Komponen Rupiah
  const komponenRupiah = {
    angsuranP2tl: menunggakList.reduce((s, r) => s + r.rpAngsuranP2tl, 0),
    angsuranBp: menunggakList.reduce((s, r) => s + r.rpAngsuranBp, 0),
    ptl: menunggakList.reduce((s, r) => s + r.rpPtl, 0),
    angsuranPrr: menunggakList.reduce((s, r) => s + r.rpAngsuranPrr, 0),
    angsuranKwh: menunggakList.reduce((s, r) => s + r.rpAngsuranKwh, 0),
    ppjuPpnBk: menunggakList.reduce((s, r) => s + r.rpPpju + r.rpPpn + r.rpBk, 0),
  };

  // Rekap Daya
  const mapDaya = {};
  menunggakList.forEach((r) => {
    const key = r.daya ? `${r.daya} VA` : 'Lainnya';
    if (!mapDaya[key]) {
      mapDaya[key] = { daya: key, nilaiDaya: r.daya || 0, lembar: 0, rupiah: 0, pelangganSet: new Set() };
    }
    mapDaya[key].lembar += 1;
    mapDaya[key].rupiah += r.rpTagihan;
    mapDaya[key].pelangganSet.add(r.idPelanggan);
  });
  const rekapDaya = Object.values(mapDaya)
    .map((d) => ({
      daya: d.daya,
      nilaiDaya: d.nilaiDaya,
      lembar: d.lembar,
      rupiah: d.rupiah,
      jumlahPelanggan: d.pelangganSet.size,
    }))
    .sort((a, b) => b.rupiah - a.rupiah);

  // Rekap Tarif
  const mapTarif = {};
  menunggakList.forEach((r) => {
    const key = r.tarif || 'Lainnya';
    if (!mapTarif[key]) {
      mapTarif[key] = { tarif: key, lembar: 0, rupiah: 0, pelangganSet: new Set() };
    }
    mapTarif[key].lembar += 1;
    mapTarif[key].rupiah += r.rpTagihan;
    mapTarif[key].pelangganSet.add(r.idPelanggan);
  });
  const rekapTarif = Object.values(mapTarif)
    .map((t) => ({
      tarif: t.tarif,
      lembar: t.lembar,
      rupiah: t.rupiah,
      jumlahPelanggan: t.pelangganSet.size,
    }))
    .sort((a, b) => b.rupiah - a.rupiah);

  // Rekap Jenis Piutang
  const mapJenisPiutang = {};
  menunggakList.forEach((r) => {
    const key = r.jenisPiutang || 'Lainnya';
    if (!mapJenisPiutang[key]) {
      mapJenisPiutang[key] = { jenis: key, lembar: 0, rupiah: 0, pelangganSet: new Set() };
    }
    mapJenisPiutang[key].lembar += 1;
    mapJenisPiutang[key].rupiah += r.rpTagihan;
    mapJenisPiutang[key].pelangganSet.add(r.idPelanggan);
  });
  const rekapJenisPiutang = Object.values(mapJenisPiutang)
    .map((j) => ({
      jenis: j.jenis,
      lembar: j.lembar,
      rupiah: j.rupiah,
      jumlahPelanggan: j.pelangganSet.size,
    }))
    .sort((a, b) => b.rupiah - a.rupiah);

  // Rekap Daerah
  const mapDaerah = {};
  records.forEach((r) => {
    const kode = r.kodeWilayah || '54410';
    if (!mapDaerah[kode]) {
      mapDaerah[kode] = {
        kodeWilayah: kode,
        namaWilayah: NAMA_WILAYAH[kode] || `Wilayah Kode ${kode}`,
        lembarMenunggak: 0,
        rupiahMenunggak: 0,
        lembarLunas: 0,
        rupiahLunas: 0,
        pelangganMenunggakSet: new Set(),
      };
    }
    if (r.isMenunggak) {
      mapDaerah[kode].lembarMenunggak += 1;
      mapDaerah[kode].rupiahMenunggak += r.rpTagihan;
      mapDaerah[kode].pelangganMenunggakSet.add(r.idPelanggan);
    } else if (r.isLunas) {
      mapDaerah[kode].lembarLunas += 1;
      mapDaerah[kode].rupiahLunas += r.rpTagihan;
    }
  });
  const rekapDaerah = Object.values(mapDaerah).map((d) => ({
    ...d,
    jumlahPelangganMenunggak: d.pelangganMenunggakSet.size,
  }));

  // Report Harian Lunas
  const mapHarianLunas = {};
  lunasList.forEach((r) => {
    const tgl = r.tglPelunasan !== '-' ? r.tglPelunasan : 'Tanpa Tanggal';
    if (!mapHarianLunas[tgl]) {
      mapHarianLunas[tgl] = {
        tanggal: tgl,
        jumlahTransaksi: 0,
        totalRupiah: 0,
        pelangganSet: new Set(),
      };
    }
    mapHarianLunas[tgl].jumlahTransaksi += 1;
    mapHarianLunas[tgl].totalRupiah += r.rpTagihan;
    mapHarianLunas[tgl].pelangganSet.add(r.idPelanggan);
  });

  const reportHarianList = Object.values(mapHarianLunas)
    .map((h) => ({
      tanggal: h.tanggal,
      jumlahTransaksi: h.jumlahTransaksi,
      jumlahPelanggan: h.pelangganSet.size,
      totalRupiah: h.totalRupiah,
    }))
    .sort((a, b) => b.totalRupiah - a.totalRupiah);

  const filterOptions = {
    wilayahList: Array.from(new Set(records.map((r) => r.kodeWilayah))).filter(Boolean).sort(),
    tarifList: Array.from(new Set(records.map((r) => r.tarif))).filter(Boolean).sort(),
    dayaList: Array.from(new Set(records.map((r) => r.daya))).filter(Boolean).sort((a, b) => a - b),
    jenisList: Array.from(new Set(records.map((r) => r.jenisPiutang))).filter(Boolean).sort(),
  };

  return {
    totalBaris: records.length,
    totalPelangganUnik: new Set(records.map((r) => r.idPelanggan)).size,
    jumlahPelangganMenunggak: pelangganMenunggakArray.length,
    jumlahLembarMenunggak: menunggakList.length,
    totalRupiahMenunggak,
    totalRupiahMenunggakMurni,
    jumlahLembarLunas: lunasList.length,
    totalRupiahLunas,
    jumlahLembarBatal: batalList.length,
    totalRupiahBatal,
    pelangganMenunggakArray,
    top50Pareto,
    menunggakList,
    lunasList,
    batalList,
    katN16P2TL,
    katN27BP,
    katR8N7,
    katN26PRR,
    komponenRupiah,
    rekapDaya,
    rekapTarif,
    rekapJenisPiutang,
    rekapDaerah,
    reportHarianList,
    filterOptions,
  };
}