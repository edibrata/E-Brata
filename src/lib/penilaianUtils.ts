import { Mapel, TujuanPembelajaran, NilaiMapelSiswa } from '@/types';
import { cleanTpDeskripsi } from './agamaUtils';

export interface KalkulasiNilaiResult {
  naSlm: number | null; // Tingkat 1: Nilai Akhir Sumatif Lingkup Materi
  finalScore: number | null; // Tingkat 2: Nilai Akhir Rapor (Komposit SLM + SAS)
  avgTp: number | null; // Rerata aritmatika TP
  totalTpFilled: number;
  totalTpValid: number;
  tpStatus: Record<string, {
    score: number | null;
    tercapai: boolean;
    isStar: boolean; // ditandai * jika belum mencapai KKTP
  }>;
  tpsTercapaiCount: number;
  tpsBelumTercapaiCount: number;
  deskripsiTertinggi: string;
  deskripsiTerendah: string;
  maxTpItem?: { id: string; score: number };
  minTpItem?: { id: string; score: number };
}

/**
 * Mendapatkan ambang batas ketuntasan (KKTP) dari interval ketercapaian TP.
 * Sesuai Panduan 2025 Bab III hal. 44-45:
 * Siswa tuntas jika mencapai batas minimal kategori "Sudah Mencapai Ketuntasan" (> intervalBatas[2]).
 * Default interval: [20, 40, 60, 80], batas tuntas = intervalBatas[2] + 1 (misal: > 60 => 61, atau nilai batas ke-3).
 */
export function getAmbangBatasKktp(mapel: Mapel): number {
  if (Array.isArray(mapel.intervalBatas) && mapel.intervalBatas.length >= 3) {
    // Batas interval ke-3 adalah batas antara 'Perlu Peningkatan' vs 'Sudah Mencapai Ketuntasan'
    return mapel.intervalBatas[2];
  }
  return mapel.kktp ?? 60;
}

/**
 * Membagi rata bobot seluruh TP secara proporsional agar total tepat 100%
 */
export function hitungDefaultBobotTp(tps: { id: string }[]): Record<string, number> {
  const n = tps.length;
  if (n === 0) return {};
  const base = Math.floor(100 / n);
  const remainder = 100 - (base * n);
  const result: Record<string, number> = {};
  tps.forEach((tp, idx) => {
    result[tp.id] = idx === n - 1 ? base + remainder : base;
  });
  return result;
}

/**
 * Menghitung Nilai Akhir dengan Sistem Pembobotan Dua Tingkat (Two-Tier Weighting):
 * 1. Tingkat 1: Pembobotan internal antar-TP -> NA Sumatif Lingkup Materi (NA-SLM)
 * 2. Tingkat 2: Pembobotan komposit NA-SLM (...%) + SAS (...%) -> Nilai Akhir Rapor
 */
export function hitungNilaiMapel(
  mapel: Mapel,
  validTps: TujuanPembelajaran[],
  nilaiSiswa?: NilaiMapelSiswa
): KalkulasiNilaiResult {
  const kktp = getAmbangBatasKktp(mapel);
  const opsi = mapel.opsiPengolahan || 'rata-rata';
  const pakaiSas = mapel.pakaiSas !== false;
  const rasioSlmSas = mapel.rasioSlmSas || { slm: 75, sas: 25 };

  const tpScores = nilaiSiswa?.tpScores || {};
  const sumatifAkhir = nilaiSiswa?.sumatifAkhir ?? null;

  let totalTpScore = 0;
  let filledTpCount = 0;
  let tpsTercapaiCount = 0;
  let tpsBelumTercapaiCount = 0;

  let maxTp: { id: string; score: number } | null = null;
  let minTp: { id: string; score: number } | null = null;

  const tpStatus: KalkulasiNilaiResult['tpStatus'] = {};

  validTps.forEach(tp => {
    const rawScore = tpScores[tp.id];
    const hasScore = typeof rawScore === 'number' && !isNaN(rawScore);
    const score = hasScore ? rawScore : null;

    const tercapai = hasScore ? score! >= kktp : false;
    const isStar = hasScore ? score! < kktp : false; // belum mencapai kriteria ketuntasan diberi tanda bintang (*)

    if (hasScore) {
      totalTpScore += score!;
      filledTpCount++;
      if (tercapai) tpsTercapaiCount++;
      else tpsBelumTercapaiCount++;

      if (!maxTp || score! > maxTp.score) maxTp = { id: tp.id, score: score! };
      if (!minTp || score! < minTp.score) minTp = { id: tp.id, score: score! };
    }

    tpStatus[tp.id] = {
      score,
      tercapai,
      isStar,
    };
  });

  const avgTp = filledTpCount > 0 ? totalTpScore / filledTpCount : null;

  // ==========================================
  // TINGKAT 1: Hitung NA Sumatif Lingkup Materi (NA-SLM)
  // ==========================================
  let naSlm: number | null = null;

  if (filledTpCount === 0) {
    naSlm = null;
  } else if (opsi === 'pembobotan') {
    // Panduan hal. 57: Opsi Pembobotan internal antar-TP (Total 100%)
    const defaultBobotMap = hitungDefaultBobotTp(validTps);
    const configuredBobot = mapel.bobotTp || {};
    
    let sumWeighted = 0;
    let totalWeightUsed = 0;

    validTps.forEach(tp => {
      const score = tpStatus[tp.id]?.score;
      if (score !== null && score !== undefined) {
        const weight = configuredBobot[tp.id] ?? defaultBobotMap[tp.id] ?? (100 / validTps.length);
        sumWeighted += score * (weight / 100);
        totalWeightUsed += weight;
      }
    });

    if (totalWeightUsed > 0) {
      // Normalisasi jika ada TP yang belum dinilai
      naSlm = Math.round(sumWeighted / (totalWeightUsed / 100));
    }
  } else {
    // Default & Standar Baku: Opsi Rata-Rata SLM (Panduan hal. 58)
    naSlm = avgTp !== null ? Math.round(avgTp) : null;
  }

  // ==========================================
  // TINGKAT 2: Hitung Nilai Akhir Rapor Komposit (NA-SLM + SAS)
  // ==========================================
  let finalScore: number | null = null;

  if (!pakaiSas) {
    // Jika tanpa SAS, NA Rapor 100% diambil dari NA-SLM
    finalScore = naSlm;
  } else {
    // Dengan SAS: pembobotan komposit NA-SLM (%SLM) + SAS (%SAS)
    const hasSlm = naSlm !== null;
    const hasSas = typeof sumatifAkhir === 'number';

    if (hasSlm && hasSas) {
      const slmWeight = rasioSlmSas.slm / 100;
      const sasWeight = rasioSlmSas.sas / 100;
      finalScore = Math.round((naSlm! * slmWeight) + (sumatifAkhir! * sasWeight));
    } else if (hasSlm && !hasSas) {
      // Jika SAS belum diinput, tampilkan sementara nilai dari SLM
      finalScore = naSlm;
    } else if (!hasSlm && hasSas) {
      finalScore = Math.round(sumatifAkhir!);
    } else {
      finalScore = null;
    }
  }

  // Rumusan Deskripsi Resmi Sesuai Panduan 2025 hal. 63-65
  let deskTer = '';
  let deskRendah = '';

  if (maxTp && maxTp.score >= kktp) {
    const tp = validTps.find(t => t.id === maxTp!.id);
    if (tp) {
      const cleanDesc = cleanTpDeskripsi(tp.deskripsi);
      deskTer = `Menunjukkan penguasaan yang sangat baik dalam ${cleanDesc.toLowerCase()}.`;
    }
  }

  if (minTp && minTp.score < kktp) {
    const tp = validTps.find(t => t.id === minTp!.id);
    if (tp) {
      const cleanDesc = cleanTpDeskripsi(tp.deskripsi);
      deskRendah = `Perlu bimbingan dalam ${cleanDesc.toLowerCase()}.`;
    }
  }

  return {
    naSlm,
    finalScore,
    avgTp,
    totalTpFilled: filledTpCount,
    totalTpValid: validTps.length,
    tpStatus,
    tpsTercapaiCount,
    tpsBelumTercapaiCount,
    deskripsiTertinggi: deskTer,
    deskripsiTerendah: deskRendah,
    maxTpItem: maxTp ?? undefined,
    minTpItem: minTp ?? undefined,
  };
}
