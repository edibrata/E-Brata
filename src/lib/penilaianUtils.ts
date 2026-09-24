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
 * Membersihkan awalan kaku, kode, dan akhiran redundan (seperti 'dengan baik').
 */
export function formatTpUntukNarasi(rawDeskripsi: string): string {
  let text = cleanTpDeskripsi(rawDeskripsi).trim();
  if (!text) return 'materi pembelajaran yang ditetapkan';

  // Hapus kode awalan seperti "TP 1:", "TP 1.1", "1.1.", "1. ", "A.1", dll.
  text = text.replace(/^(TP\s*\d+(\.\d+)?[:.-]?\s*|\d+(\.\d+)+[:.-]?\s*|[A-Z]\.\d+[:.-]?\s*)/i, '').trim();

  // Hapus frasa pembuka baku yang kaku di awal TP
  text = text.replace(/^(peserta\s+didik\s+(mampu|dapat|diharapkan\s+mampu|harus\s+mampu)\s+|siswa\s+(mampu|dapat)\s+|murid\s+(mampu|dapat)\s+)/i, '').trim();

  // Hapus kata kerja modalitas tunggal di awal jika ada
  text = text.replace(/^(mampu|dapat)\s+/i, '').trim();

  // Hapus frasa keterangan berulang di akhir TP agar tidak tabrakan dengan kalimat penjelas template
  text = text.replace(/\s+(dengan\s+(baik|benar|tepat|sempurna|runtut|mandiri)|secara\s+(baik|benar|tepat|mandiri|runtut|konsisten))$/i, '').trim();

  // Hapus tanda baca di akhir seperti titik atau koma
  text = text.replace(/[.;,]+$/, '').trim();

  // Ubah huruf pertama menjadi huruf kecil jika bukan singkatan/akronim (misal: PAI, Pancasila)
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
 * Meninjau kompetensi dari seluruh TP berdasarkan klasifikasi level nilai otentik murid:
 * 1. Kalimat 1: Capaian Saat Ini (Bukti Penguasaan TP Tertinggi/Tuntas yang membawa kata kunci kompetensi)
 * 2. Kalimat 2: Arah Belajar / Saran / Penguatan Spesifik (Pengayaan/Pendalaman/Bantuan Konkret TP Bimbingan)
 */
export function generate5VariasiPpa2025(
  mapel: Mapel,
  validTps: TujuanPembelajaran[],
  maxTp: { id: string; score: number } | null,
  minTp: { id: string; score: number } | null,
  kktp: number,
  allTpScores: Record<string, number | null> = {}
): string[] {
  if (!maxTp || validTps.length === 0) {
    return [
      'Menunjukkan penguasaan capaian kompetensi dengan baik dalam proses pembelajaran. Disarankan untuk terus mempertahankan semangat belajar dan melatih kemandirian.',
      'Mampu mengikuti seluruh alur pembelajaran dengan tertib, terarah, dan konsisten. Dianjurkan untuk terus mengeksplorasi materi pelajaran secara lebih mendalam.',
      'Menunjukkan keaktifan dan perkembangan yang positif dalam kegiatan belajar. Perlu terus didorong untuk mengembangkan pemahaman pada materi tingkat lanjut.',
      'Dapat menyelesaikan tugas-tugas pembelajaran dengan hasil yang memuaskan. Disarankan untuk meningkatkan keluwesan dalam pemecahan masalah kontekstual.',
      'Mengikuti proses pembelajaran secara aktif dengan komitmen belajar yang baik. Diharapkan terus mengulang materi untuk memperkuat ketuntasan kompetensi.'
    ];
  }

  // Klasifikasi seluruh TP berdasarkan level capaian nilai
  const scoredTps = validTps
    .map(tp => {
      const score = allTpScores[tp.id] ?? (tp.id === maxTp.id ? maxTp.score : tp.id === minTp?.id ? minTp.score : null);
      return {
        id: tp.id,
        deskripsi: tp.deskripsi,
        text: formatTpUntukNarasi(tp.deskripsi),
        score
      };
    })
    .filter(t => t.score !== null);

  const highTps = scoredTps.filter(t => t.score! >= 85).sort((a, b) => b.score! - a.score!);
  const goodTps = scoredTps.filter(t => t.score! >= kktp && t.score! < 85).sort((a, b) => b.score! - a.score!);

  const tpMaxItem = validTps.find(t => t.id === maxTp.id);
  const tpMinItem = minTp ? validTps.find(t => t.id === minTp.id) : null;

  const tpMaxText = tpMaxItem ? formatTpUntukNarasi(tpMaxItem.deskripsi) : 'materi pembelajaran';
  const tpMinText = tpMinItem ? formatTpUntukNarasi(tpMinItem.deskripsi) : 'materi pembelajaran';

  // Frasa gabungan dua TP tertinggi untuk menangkap kata kunci multi-kompetensi
  let dualMaxText = tpMaxText;
  if (highTps.length >= 2 && highTps[0].id !== highTps[1].id) {
    dualMaxText = `${highTps[0].text} serta ${highTps[1].text}`;
  } else if (highTps.length === 1 && goodTps.length >= 1 && highTps[0].id !== goodTps[0].id) {
    dualMaxText = `${highTps[0].text} dan ${goodTps[0].text}`;
  } else if (goodTps.length >= 2 && goodTps[0].id !== goodTps[1].id) {
    dualMaxText = `${goodTps[0].text} serta ${goodTps[1].text}`;
  }

  const hasUnderKktp = minTp && minTp.score < kktp && minTp.id !== maxTp.id;

  // =========================================================================
  // KATEGORI 1: SKOR TERTINGGI SANGAT BAIK (>= 85)
  // =========================================================================
  if (maxTp.score >= 85) {
    if (hasUnderKktp) {
      // Sangat Baik pada TP utama, namun ada TP di bawah KKTP yang memerlukan bimbingan konkret
      return [
        `Mampu ${tpMaxText} dengan sangat terampil dan runtut. Meskipun demikian, Ananda masih memerlukan pendampingan terarah dan latihan terbimbing dalam ${tpMinText} guna memperkuat ketuntasan belajar.`,
        `Menunjukkan penguasaan yang sangat baik dalam ${tpMaxText} secara mandiri. Kendati demikian, melalui bimbingan bertahap dan contoh konkret dari guru, diharapkan Ananda semakin mampu ${tpMinText}.`,
        `Cakap dan teliti dalam menguasai materi ${tpMaxText}. Di sisi lain, Ananda memerlukan latihan terfokus dan bimbingan berkala pada capaian ${tpMinText} agar pemahamannya semakin merata.`,
        `Sangat terampil dalam ${dualMaxText}. Namun demikian, latihan mandiri yang disertai pendampingan khusus dalam ${tpMinText} tetap disarankan untuk mengoptimalkan capaiannya.`,
        `Mencapai pemahaman unggul dalam ${tpMaxText}. Walaupun demikian, penguatan konsep dasar dan pendampingan personal dari guru dalam ${tpMinText} tetap diperlukan.`
      ];
    } else {
      // Seluruh TP Tuntas Sangat Baik (Arah belajar / Saran: Pengayaan, Tantangan Baru & Berbagi Wawasan)
      return [
        `Mampu ${dualMaxText} secara runtut dan memperoleh hasil yang tepat. Guna memperluas wawasannya, Ananda dapat diberi tantangan baru untuk membandingkan berbagai strategi penyelesaian dan menilai kekuatan alasannya.`,
        `Sangat terampil dalam ${tpMaxText} serta mampu menjelaskan langkah kerjanya dengan jelas. Untuk mengoptimalkan potensi tersebut, Ananda dapat didorong mengeksplorasi penerapan konsep pada konteks yang lebih luas dan menantang.`,
        `Mampu menyelesaikan materi ${tpMaxText} secara tepat dan mandiri. Sebagai langkah pengayaan, Ananda dapat difasilitasi untuk berbagi strategi penyelesaian serta memandu pengalaman belajar bersama rekan sebaya.`,
        `Menunjukkan penguasaan unggul dan ketelitian tinggi dalam ${dualMaxText}. Sejalan dengan pencapaian tersebut, pemberian materi pengayaan tingkat lanjut sangat disarankan untuk memperdalam kecakapannya.`,
        `Cakap dan mendalam dalam ${tpMaxText} serta konsisten menerapkan strategi yang efektif. Sehubungan dengan hal itu, Ananda dianjurkan untuk terus merefleksikan proses belajar serta mengaitkannya dengan pemecahan masalah nyata.`
      ];
    }
  }

  // =========================================================================
  // KATEGORI 2: SKOR TERTINGGI BAIK / TUNTAS (>= KKTP dan < 85)
  // =========================================================================
  if (maxTp.score >= kktp) {
    if (hasUnderKktp) {
      // Baik pada TP utama, namun ada TP di bawah KKTP yang memerlukan bimbingan konkret
      return [
        `Mampu ${tpMaxText} dengan langkah yang sesuai dan hasil yang tepat. Meskipun demikian, pendampingan bertahap dan latihan terarah dalam ${tpMinText} tetap diperlukan agar mencapai ketuntasan yang merata.`,
        `Menunjukkan penguasaan yang baik dalam ${tpMaxText}. Kendati demikian, melalui latihan terbimbing secara berkala, Ananda diharapkan semakin terampil dalam ${tpMinText}.`,
        `Berhasil memahami capaian ${tpMaxText} dengan baik sesuai tujuan pembelajaran. Di sisi lain, Ananda memerlukan bimbingan khusus dan pengulangan konsep dasar dalam ${tpMinText}.`,
        `Dapat menyelesaikan pembelajaran ${dualMaxText} secara terstruktur. Namun demikian, bimbingan terfokus dan latihan membaca terarah dalam ${tpMinText} tetap disarankan.`,
        `Menunjukkan perkembangan yang baik dalam ${tpMaxText}. Walaupun demikian, penguatan secara berkala dan pendampingan guru dalam menuntaskan capaian ${tpMinText} tetap menjadi perhatian penting.`
      ];
    } else {
      // Seluruh TP Tuntas Baik (Arah belajar / Saran: Pendalaman Alasan Konsep, Konsistensi & Keluwesan)
      return [
        `Mampu ${dualMaxText} dengan langkah yang sesuai dan hasil yang tepat. Sebagai langkah pemantapan, penguatan dalam menjelaskan alasan dan dasar pemikiran yang digunakan disarankan agar pemahamannya semakin mendalam.`,
        `Menunjukkan penguasaan yang baik dalam ${tpMaxText}. Guna memperkuat pemahaman tersebut, latihan dengan konteks yang lebih beragam dianjurkan untuk meningkatkan keluwesan dalam memilih strategi penyelesaian.`,
        `Dapat memahami materi ${tpMaxText} secara terstruktur dan terarah. Sejalan dengan hal itu, Ananda dianjurkan untuk terus melatih konsistensi dan kemandirian dalam proses pengerjaannya.`,
        `Berhasil memahami capaian ${dualMaxText} dengan baik sesuai tujuan pembelajaran. Untuk mengoptimalkan capaian ini, pendalaman berkala disarankan agar pemahaman konsep semakin kokoh dan terintegrasi.`,
        `Tuntas dalam mempelajari ${tpMaxText} dengan keaktifan belajar yang positif. Sehubungan dengan hal itu, Ananda disarankan untuk terus memperbanyak latihan mandiri agar semakin terampil dan percaya diri.`
      ];
    }
  }

  // =========================================================================
  // KATEGORI 3: PERLU BIMBINGAN / BELUM TUNTAS (< KKTP)
  // =========================================================================
  return [
    `Mulai mengenali konsep dasar ${tpMaxText} dengan bantuan guru. Oleh karena itu, pendampingan belajar yang teratur dan latihan bertahap sangat disarankan agar Ananda semakin mampu menyelesaikannya secara mandiri.`,
    `Menunjukkan usaha positif dalam mempelajari ${tpMaxText}. Maka dari itu, penguatan konsep dasar dan bimbingan personal dari guru diperlukan agar mencapai ketuntasan kompetensi yang diharapkan.`,
    `Mulai memahami materi ${tpMaxText} sederhana melalui arahan terbimbing. Sejalan dengan kebutuhan belajar tersebut, dukungan contoh konkret dan latihan berulang disarankan untuk meningkatkan pemahamannya.`,
    `Menunjukkan kemauan belajar dalam ${dualMaxText}. Guna memperkokoh pemahaman dasarnya, pemberian pendampingan intensif serta latihan terarah sangat dianjurkan.`,
    `Mulai berpartisipasi dalam pembelajaran ${tpMaxText}. Melalui pendampingan ini, dengan bantuan terstruktur dan bimbingan bertahap dari guru, kemampuannya diharapkan akan terus bertumbuh dengan baik.`
  ];
}

/**
 * Generator Deskripsi Capaian Kompetensi Rapor Cerdas (Fungsi Tunggal Terpadu)
 */
export function generateDeskripsiPpa2025(
  mapel: Mapel,
  validTps: TujuanPembelajaran[],
  maxTp: { id: string; score: number } | null,
  minTp: { id: string; score: number } | null,
  kktp: number,
  studentSeed: string = '',
  allTpScores: Record<string, number | null> = {}
): { deskripsiTertinggi: string; deskripsiTerendah: string } {
  if (!maxTp || validTps.length === 0) {
    return { deskripsiTertinggi: '', deskripsiTerendah: '' };
  }

  const variations = generate5VariasiPpa2025(mapel, validTps, maxTp, minTp, kktp, allTpScores);
  const seed = getDeterministicSeed(studentSeed + (mapel.id || 'mapel'));
  const chosenIndex = seed % variations.length;

  return {
    deskripsiTertinggi: variations[chosenIndex],
    deskripsiTerendah: ''
  };
}

/**
 * Menghasilkan 5 variasi redaksi deskripsi lengkap untuk Intrakurikuler
 */
export function get5VariasiIntrakurikuler(
  mapel: Mapel,
  validTps: TujuanPembelajaran[],
  maxTp: { id: string; score: number } | null,
  minTp: { id: string; score: number } | null,
  kktp: number,
  allTpScores: Record<string, number | null> = {}
): string[] {
  return generate5VariasiPpa2025(mapel, validTps, maxTp, minTp, kktp, allTpScores);
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
    studentIdOrSeed || (nilaiSiswa ? JSON.stringify(nilaiSiswa) : ''),
    tpScores
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
