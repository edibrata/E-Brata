import { Mapel, TujuanPembelajaran, NilaiMapelSiswa } from '@/types';
import { cleanTpDeskripsi } from './agamaUtils';

export interface KalkulasiNilaiResult {
  naSlm: number | null; // Tingkat 1: Nilai Akhir Sumatif Lingkup Materi
  finalScore: number | null; // Tingkat 2: Nilai Akhir Rapor (Komposit SLM + SAS)
  avgTp: number | null; // Rerata aritmatika TP
  totalTpFilled: number;
  totalTpValid: number;
  isSasMissing: boolean; // true jika mapel pakai SAS namun nilai SAS belum diisi
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
 * Merapikan redaksi teks TP agar menyatu secara alami ke dalam struktur kalimat deskripsi.
 */
export function formatTpUntukNarasi(rawDeskripsi: string): string {
  let text = cleanTpDeskripsi(rawDeskripsi).trim();
  if (!text) return 'tujuan pembelajaran yang ditetapkan';

  // Hapus kode awalan seperti "TP 1:", "TP 1.1", "1.1.", "1. "
  text = text.replace(/^(TP\s*\d+(\.\d+)?[:.-]?\s*|\d+(\.\d+)+[:.-]?\s*)/i, '').trim();

  // Hapus frasa pembuka baku yang kaku jika ada di awal TP
  text = text.replace(/^(peserta\s+didik\s+(mampu|dapat|diharapkan\s+mampu)\s+|siswa\s+(mampu|dapat)\s+)/i, '').trim();

  // Hapus tanda baca di akhir seperti titik atau koma
  text = text.replace(/[.;,]+$/, '').trim();

  // Ubah huruf pertama menjadi huruf kecil jika bukan singkatan/akronim
  if (text.length > 1 && !/^[A-Z]{2,}/.test(text)) {
    text = text.charAt(0).toLowerCase() + text.slice(1);
  }

  return text;
}

/**
 * Hash deterministik sederhana untuk menghasilkan variasi redaksi alami antar-murid tanpa monoton.
 */
function getDeterministicSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generator Deskripsi Capaian Kompetensi Rapor Cerdas
 * Sesuai Panduan Pembelajaran dan Asesmen (PPA) Edisi Revisi 2025 (Hlm. 62–65)
 * Formula: Capaian Saat Ini (Bukti TP Konkret) + Arah Belajar / Tindak Lanjut Kohesif
 */
export function generateDeskripsiPpa2025(
  mapel: Mapel,
  validTps: TujuanPembelajaran[],
  maxTp: { id: string; score: number } | null,
  minTp: { id: string; score: number } | null,
  kktp: number,
  studentSeed: string = ''
): { deskripsiTertinggi: string; deskripsiTerendah: string } {
  if (!maxTp || validTps.length === 0) {
    return { deskripsiTertinggi: '', deskripsiTerendah: '' };
  }

  const seed = getDeterministicSeed(studentSeed + (mapel.id || 'mapel'));
  const tpMax = validTps.find(t => t.id === maxTp.id);
  const tpMin = minTp ? validTps.find(t => t.id === minTp.id) : null;

  const tpMaxText = tpMax ? formatTpUntukNarasi(tpMax.deskripsi) : 'materi pembelajaran';
  const tpMinText = tpMin ? formatTpUntukNarasi(tpMin.deskripsi) : 'materi pembelajaran';

  const hasMinUnderKktp = minTp && minTp.score < kktp && minTp.id !== maxTp.id;
  const idx = seed % 5;

  let deskripsiTertinggi = '';
  let deskripsiTerendah = '';

  if (hasMinUnderKktp) {
    // Skenario A: Ada TP Tertinggi dan ada TP yang perlu bimbingan khusus (< KKTP)
    // Disusun dengan konjungsi transisi kohesif dan luwes
    if (maxTp.score >= 85) {
      const narasiList = [
        `Menunjukkan penguasaan yang sangat baik dalam ${tpMaxText}, namun masih memerlukan pendampingan berkelanjutan dalam ${tpMinText}.`,
        `Sangat terampil dan mandiri dalam ${tpMaxText}, serta perlu latihan terarah untuk mengoptimalkan pemahaman pada ${tpMinText}.`,
        `Mencapai pemahaman yang sangat mendalam dalam ${tpMaxText}, dengan ruang bimbingan bertahap pada materi ${tpMinText}.`,
        `Unggul dan aktif dalam ${tpMaxText}, namun disarankan untuk terus didampingi dalam memperkuat capaian ${tpMinText}.`,
        `Menunjukkan capaian sangat memuaskan dalam ${tpMaxText}, serta perlu penguatan konsep dasar pada ${tpMinText}.`
      ];
      deskripsiTertinggi = narasiList[idx];
    } else if (maxTp.score >= kktp) {
      const narasiList = [
        `Mampu menguasai materi ${tpMaxText} dengan baik, namun masih memerlukan bimbingan terarah dalam ${tpMinText}.`,
        `Menunjukkan pemahaman yang baik dalam ${tpMaxText}, serta perlu pendampingan berkala untuk meningkatkan penguasaan pada ${tpMinText}.`,
        `Dapat menyelesaikan pembelajaran ${tpMaxText} secara tepat, dengan ruang latihan tambahan pada ${tpMinText}.`,
        `Mencapai ketuntasan yang baik dalam ${tpMaxText}, serta disarankan untuk terus memperkuat pemahaman pada ${tpMinText}.`,
        `Berhasil memahami capaian ${tpMaxText} dengan baik, namun memerlukan perhatian khusus dalam menyelesaikan ${tpMinText}.`
      ];
      deskripsiTertinggi = narasiList[idx];
    } else {
      const narasiList = [
        `Mulai menunjukkan pemahaman awal dalam ${tpMaxText}, namun masih memerlukan pendampingan intensif dalam ${tpMinText}.`,
        `Menunjukkan usaha belajar yang positif dalam ${tpMaxText}, serta membutuhkan bimbingan bertahap pada ${tpMinText}.`,
        `Mulai mengenali konsep dasar ${tpMaxText} dengan bantuan guru, serta perlu latihan terarah pada ${tpMinText}.`,
        `Berkembang dalam memahami ${tpMaxText}, namun memerlukan dukungan terpadu pada capaian ${tpMinText}.`,
        `Menunjukkan kemauan belajar dalam ${tpMaxText}, serta disarankan mendapat penguatan berkelanjutan pada ${tpMinText}.`
      ];
      deskripsiTertinggi = narasiList[idx];
    }
  } else {
    // Skenario B: Seluruh TP Tuntas / Dikuasai dengan Baik
    if (maxTp.score >= 85) {
      const narasiList = [
        `Sangat terampil dalam ${tpMaxText} serta mampu menjelaskan langkah penyelesaiannya secara runtut dan mandiri.`,
        `Menunjukkan penguasaan yang sangat baik dalam ${tpMaxText}, memperoleh hasil yang tepat, dan mampu mengemukakan alasannya secara jelas.`,
        `Mampu menyelesaikan dan menguasai materi ${tpMaxText} secara tepat serta siap melanjutkan ke materi pengayaan yang lebih kompleks.`,
        `Cakap dan mendalam dalam ${tpMaxText} serta menunjukkan inisiatif belajar dan ketelitian yang tinggi.`,
        `Menunjukkan pemahaman unggul dalam ${tpMaxText} serta konsisten dalam menerapkan strategi penyelesaian yang efektif.`
      ];
      deskripsiTertinggi = narasiList[idx];
    } else if (maxTp.score >= kktp) {
      const narasiList = [
        `Mampu ${tpMaxText} dengan langkah yang sesuai dan hasil yang tepat pada sebagian besar kegiatan belajar.`,
        `Menunjukkan penguasaan yang baik dalam ${tpMaxText} serta konsisten dalam menyelesaikan tugas-tugas pembelajaran.`,
        `Dapat memahami dan menyelesaikan materi ${tpMaxText} secara terstruktur sesuai tujuan pembelajaran yang ditetapkan.`,
        `Mencapai penguasaan yang baik dalam ${tpMaxText} serta disarankan untuk terus melatih keluwesan dalam pemecahan masalah.`,
        `Berhasil menyelesaikan capaian ${tpMaxText} secara baik dan terarah dengan kemandirian yang semakin meningkat.`
      ];
      deskripsiTertinggi = narasiList[idx];
    } else {
      const narasiList = [
        `Mulai menunjukkan pemahaman awal dalam ${tpMaxText} dan disarankan untuk terus memperbanyak latihan terarah.`,
        `Menunjukkan perkembangan dalam ${tpMaxText}, dengan bimbingan berkelanjutan diharapkan pemahamannya semakin kokoh.`,
        `Dapat menyelesaikan ${tpMaxText} sederhana dengan bantuan dan arahan guru secara bertahap.`,
        `Mulai mengenali konsep dasar ${tpMaxText} dan bersedia mengikuti proses bimbingan untuk mencapai ketuntasan.`,
        `Menunjukkan usaha positif dalam mempelajari ${tpMaxText} dengan dukungan dan latihan terarah.`
      ];
      deskripsiTertinggi = narasiList[idx];
    }
  }

  return { deskripsiTertinggi, deskripsiTerendah };
}

/**
 * Menghasilkan 5 variasi redaksi deskripsi lengkap untuk Intrakurikuler
 */
export function get5VariasiIntrakurikuler(
  mapel: Mapel,
  validTps: TujuanPembelajaran[],
  maxTp: { id: string; score: number } | null,
  minTp: { id: string; score: number } | null,
  kktp: number
): string[] {
  if (!maxTp || validTps.length === 0) {
    return [
      'Menunjukkan penguasaan capaian kompetensi dengan baik dalam proses pembelajaran.',
      'Mampu mengikuti seluruh alur pembelajaran dengan baik, tertib, dan terarah.',
      'Menunjukkan keaktifan dan perkembangan yang positif dalam kegiatan belajar.',
      'Dapat menyelesaikan tugas-tugas pembelajaran dengan hasil yang memuaskan.',
      'Mengikuti proses pembelajaran secara aktif dengan komitmen belajar yang baik.'
    ];
  }

  const tpMax = validTps.find(t => t.id === maxTp.id);
  const tpMin = minTp ? validTps.find(t => t.id === minTp.id) : null;
  const tpMaxText = tpMax ? formatTpUntukNarasi(tpMax.deskripsi) : 'materi pembelajaran';
  const tpMinText = tpMin ? formatTpUntukNarasi(tpMin.deskripsi) : 'materi pembelajaran';
  const hasMinUnderKktp = minTp && minTp.score < kktp && minTp.id !== maxTp.id;

  if (hasMinUnderKktp) {
    if (maxTp.score >= 85) {
      return [
        `Menunjukkan penguasaan yang sangat baik dalam ${tpMaxText}, namun masih memerlukan pendampingan berkelanjutan dalam ${tpMinText}.`,
        `Sangat terampil dan mandiri dalam ${tpMaxText}, serta perlu latihan terarah untuk mengoptimalkan pemahaman pada ${tpMinText}.`,
        `Mencapai pemahaman yang sangat mendalam dalam ${tpMaxText}, dengan ruang bimbingan bertahap pada materi ${tpMinText}.`,
        `Unggul dan aktif dalam ${tpMaxText}, namun disarankan untuk terus didampingi dalam memperkuat capaian ${tpMinText}.`,
        `Menunjukkan capaian sangat memuaskan dalam ${tpMaxText}, serta perlu penguatan konsep dasar pada ${tpMinText}.`
      ];
    } else if (maxTp.score >= kktp) {
      return [
        `Mampu menguasai materi ${tpMaxText} dengan baik, namun masih memerlukan bimbingan terarah dalam ${tpMinText}.`,
        `Menunjukkan pemahaman yang baik dalam ${tpMaxText}, serta perlu pendampingan berkala untuk meningkatkan penguasaan pada ${tpMinText}.`,
        `Dapat menyelesaikan pembelajaran ${tpMaxText} secara tepat, dengan ruang latihan tambahan pada ${tpMinText}.`,
        `Mencapai ketuntasan yang baik dalam ${tpMaxText}, serta disarankan untuk terus memperkuat pemahaman pada ${tpMinText}.`,
        `Berhasil memahami capaian ${tpMaxText} dengan baik, namun memerlukan perhatian khusus dalam menyelesaikan ${tpMinText}.`
      ];
    } else {
      return [
        `Mulai menunjukkan pemahaman awal dalam ${tpMaxText}, namun masih memerlukan pendampingan intensif dalam ${tpMinText}.`,
        `Menunjukkan usaha belajar yang positif dalam ${tpMaxText}, serta membutuhkan bimbingan bertahap pada ${tpMinText}.`,
        `Mulai mengenali konsep dasar ${tpMaxText} dengan bantuan guru, serta perlu latihan terarah pada ${tpMinText}.`,
        `Berkembang dalam memahami ${tpMaxText}, namun memerlukan dukungan terpadu pada capaian ${tpMinText}.`,
        `Menunjukkan kemauan belajar dalam ${tpMaxText}, serta disarankan mendapat penguatan berkelanjutan pada ${tpMinText}.`
      ];
    }
  }

  // Jika semua tuntas
  if (maxTp.score >= 85) {
    return [
      `Sangat terampil dalam ${tpMaxText} serta mampu menjelaskan langkah penyelesaiannya secara runtut dan mandiri.`,
      `Menunjukkan penguasaan yang sangat baik dalam ${tpMaxText}, memperoleh hasil yang tepat, dan mampu mengemukakan alasannya secara jelas.`,
      `Mampu menyelesaikan dan menguasai materi ${tpMaxText} secara tepat serta siap melanjutkan ke materi pengayaan yang lebih kompleks.`,
      `Cakap dan mendalam dalam ${tpMaxText} serta menunjukkan inisiatif belajar dan ketelitian yang tinggi.`,
      `Menunjukkan pemahaman unggul dalam ${tpMaxText} serta konsisten dalam menerapkan strategi penyelesaian yang efektif.`
    ];
  } else if (maxTp.score >= kktp) {
    return [
      `Mampu ${tpMaxText} dengan langkah yang sesuai dan hasil yang tepat pada sebagian besar kegiatan belajar.`,
      `Menunjukkan penguasaan yang baik dalam ${tpMaxText} serta konsisten dalam menyelesaikan tugas-tugas pembelajaran.`,
      `Dapat memahami dan menyelesaikan materi ${tpMaxText} secara terstruktur sesuai tujuan pembelajaran yang ditetapkan.`,
      `Mencapai penguasaan yang baik dalam ${tpMaxText} serta disarankan untuk terus melatih keluwesan dalam pemecahan masalah.`,
      `Berhasil menyelesaikan capaian ${tpMaxText} secara baik dan terarah dengan kemandirian yang semakin meningkat.`
    ];
  } else {
    return [
      `Mulai menunjukkan pemahaman awal dalam ${tpMaxText} dan disarankan untuk terus memperbanyak latihan terarah.`,
      `Menunjukkan perkembangan dalam ${tpMaxText}, dengan bimbingan berkelanjutan diharapkan pemahamannya semakin kokoh.`,
      `Dapat menyelesaikan ${tpMaxText} sederhana dengan bantuan dan arahan guru secara bertahap.`,
      `Mulai mengenali konsep dasar ${tpMaxText} dan bersedia mengikuti proses bimbingan untuk mencapai ketuntasan.`,
      `Menunjukkan usaha positif dalam mempelajari ${tpMaxText} dengan dukungan dan latihan terarah.`
    ];
  }
}

/**
 * Menghasilkan 5 variasi redaksi untuk Ekstrakurikuler
 */
export function get5VariasiEkskul(ekskulNama: string, predikat: string): string[] {
  const isA = predikat.includes('A') || predikat.toLowerCase().includes('sangat');
  const isC = predikat.includes('C') || predikat.toLowerCase().includes('cukup');

  if (isA) {
    return [
      `Sangat aktif, berdisiplin tinggi, dan menunjukkan keterampilan luar biasa serta kepemimpinan positif dalam kegiatan ${ekskulNama}.`,
      `Menunjukkan antusiasme yang luar biasa, berprestasi, dan mampu menjadi teladan bagi teman-teman dalam kegiatan ${ekskulNama}.`,
      `Sangat terampil dan konsisten menunjukkan kemajuan teknik serta kerja sama tim yang solid dalam ${ekskulNama}.`,
      `Berperan sangat aktif, kreatif, dan berinisiatif tinggi dalam setiap sesi latihan dan unjuk bakat ${ekskulNama}.`,
      `Menunjukkan komitmen tinggi dan penguasaan materi/teknik yang sangat matang dalam mengikuti seluruh agenda ${ekskulNama}.`
    ];
  }

  if (isC) {
    return [
      `Cukup aktif mengikuti kegiatan ${ekskulNama}, perlu lebih disiplin dan meningkatkan keterlibatan dalam setiap latihan.`,
      `Mengikuti kegiatan ${ekskulNama} dengan cukup baik, perlu terus dimotivasi agar lebih percaya diri dan konsisten.`,
      `Mulai mengenal teknik dasar dalam ${ekskulNama}, disarankan lebih rajin berlatih untuk mengembangkan potensi.`,
      `Hadir dalam kegiatan ${ekskulNama}, diharapkan lebih aktif berpartisipasi dan fokus dalam menerima arahan pembina.`,
      `Perlu pendampingan berkala untuk memupuk minat dan meningkatkan keaktifan dalam kegiatan ${ekskulNama}.`
    ];
  }

  // Default: Baik (B)
  return [
    `Aktif mengikuti kegiatan ${ekskulNama} dengan tertib dan menunjukkan perkembangan keterampilan yang baik.`,
    `Mampu mengikuti arahan pembina dengan baik serta menunjukkan semangat belajar yang konsisten dalam ${ekskulNama}.`,
    `Berpartisipasi aktif dalam kegiatan ${ekskulNama} dan mampu bekerja sama dengan rekan kelompok secara baik.`,
    `Menunjukkan kehadiran yang teratur dan peningkatan kemampuan yang stabil dalam kegiatan ${ekskulNama}.`,
    `Terampil dalam mempraktikkan materi dasar ${ekskulNama} dan memiliki potensi yang terus berkembang.`
  ];
}

/**
 * Menghasilkan 5 variasi redaksi untuk Kokurikuler (Projek Penguatan Karakter)
 */
export function get5VariasiKokurikuler(temaProjek: string, deskripsiProjek?: string): string[] {
  const tema = temaProjek || 'Tema Kokurikuler';
  return [
    `Menunjukkan partisipasi aktif dalam projek "${tema}", berkembang sangat baik dalam dimensi yang diamati serta konsisten menunjukkan kepedulian dan kerja sama nyata.`,
    `Mampu merefleksikan dan menerapkan nilai-nilai karakter dalam projek "${tema}" secara mandiri, berinisiatif tinggi, dan berkontribusi positif dalam kelompok.`,
    `Berkembang sangat baik dalam menyelesaikan tahapan projek "${tema}", menunjukkan rasa ingin tahu tinggi, kreatif, dan solutif dalam menyelesaikan tantangan.`,
    `Menunjukkan etos kerja dan komitmen positif selama pelaksanaan projek "${tema}", serta mampu berkolaborasi aktif dan menghargai pandangan teman sekelompok.`,
    `Telah menginternalisasi nilai-nilai karakter utama dalam tema "${tema}" dengan baik, menunjukkan tanggung jawab dan kemandirian dalam berkarya.`
  ];
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
  nilaiSiswa?: NilaiMapelSiswa,
  studentIdOrSeed?: string
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
  const isSasMissing = pakaiSas && (sumatifAkhir === null || sumatifAkhir === undefined || isNaN(sumatifAkhir));

  if (!pakaiSas) {
    // Jika tanpa SAS, NA Rapor 100% diambil dari NA-SLM
    finalScore = naSlm;
  } else {
    // Dengan SAS: pembobotan komposit NA-SLM (%SLM) + SAS (%SAS)
    const hasSlm = naSlm !== null;
    const hasSas = typeof sumatifAkhir === 'number' && !isNaN(sumatifAkhir);

    const slmWeight = (rasioSlmSas.slm ?? 75) / 100;
    const sasWeight = (rasioSlmSas.sas ?? 25) / 100;

    if (hasSlm) {
      const sasScore = hasSas ? sumatifAkhir! : 0;
      finalScore = Math.round((naSlm! * slmWeight) + (sasScore * sasWeight));
    } else if (hasSas) {
      finalScore = Math.round(sumatifAkhir! * sasWeight);
    } else {
      finalScore = null;
    }
  }

  // ==========================================
  // RUMUSAN DESKRIPSI RESMI PPA 2025 (Hlm. 62-65)
  // ==========================================
  const { deskripsiTertinggi, deskripsiTerendah } = generateDeskripsiPpa2025(
    mapel,
    validTps,
    maxTp,
    minTp,
    kktp,
    studentIdOrSeed || (nilaiSiswa ? JSON.stringify(nilaiSiswa) : '')
  );

  return {
    naSlm,
    finalScore,
    avgTp,
    totalTpFilled: filledTpCount,
    totalTpValid: validTps.length,
    isSasMissing,
    tpStatus,
    tpsTercapaiCount,
    tpsBelumTercapaiCount,
    deskripsiTertinggi,
    deskripsiTerendah,
    maxTpItem: maxTp ?? undefined,
    minTpItem: minTp ?? undefined,
  };
}
