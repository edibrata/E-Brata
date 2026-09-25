// Referensi Resmi:
// 1. Keputusan Kepala BSKAP No. 058/H/KR/2025 tentang Alur Perkembangan Kompetensi
// 2. Panduan Kokurikuler PAUD, Dikdas, dan Dikmen (BSKAP Kemendikdasmen 2025)

export interface SubdimensiDeskriptor {
  name: string;
  berk: string;
  cakap: string;
  mahir: string;
  // Intisari ringkas dan natural untuk narasi rapor yang mengalir
  ringkasKuat: string; // saat dicapai di level Mahir / Cakap
  ringkasLatih: string; // saat berada di level Berkembang (rekomendasi)
}

export type DimensiKokurikulerNama = 
  | 'Keimanan & Ketakwaan'
  | 'Kewargaan'
  | 'Penalaran Kritis'
  | 'Kreativitas'
  | 'Kolaborasi'
  | 'Kemandirian'
  | 'Kesehatan'
  | 'Komunikasi';

export const DAFTAR_8_DIMENSI: DimensiKokurikulerNama[] = [
  'Keimanan & Ketakwaan',
  'Kewargaan',
  'Penalaran Kritis',
  'Kreativitas',
  'Kolaborasi',
  'Kemandirian',
  'Kesehatan',
  'Komunikasi'
];

export const BENTUK_KOKURIKULER_OPTIONS = [
  { value: 'kolaboratif', label: 'Pembelajaran Kolaboratif Lintas Disiplin Ilmu' },
  { value: 'g7kaih', label: 'Gerakan 7 Kebiasaan Anak Indonesia Hebat (7 KAIH)' },
  { value: 'lainnya', label: 'Cara Lainnya (Kearifan Lokal / Ciri Khas Sekolah)' }
];

export const BANK_SUBDIMENSI_SD: Record<DimensiKokurikulerNama, SubdimensiDeskriptor[]> = {
  'Keimanan & Ketakwaan': [
    {
      name: 'Hubungan dengan Tuhan Yang Maha Esa',
      berk: 'Mengenal ajaran Tuhan Yang Maha Esa melalui cerita, doa, dan praktek ibadah sesuai agamanya serta mulai memahami nilai kebaikan dalam kehidupan nyata.',
      cakap: 'Membiasakan diri melaksanakan ajaran Tuhan Yang Maha Esa dalam kehidupan nyata secara konsisten dengan bimbingan orang tua dan guru serta mampu mensyukurinya.',
      mahir: 'Melaksanakan ibadah secara mandiri sesuai ajaran Tuhan Yang Maha Esa secara konsisten dalam kehidupan nyata serta menjadi contoh dalam beribadah dan sikap religius di sekolah dan keluarga.',
      ringkasKuat: 'taat beribadah dan mengamalkan nilai-nilai kebaikan',
      ringkasLatih: 'menjaga konsistensi ibadah dan pengamalan nilai kebaikan sehari-hari'
    },
    {
      name: 'Hubungan dengan sesama Manusia',
      berk: 'Mengenal dan mencoba bersikap jujur, peduli, dan tanggung jawab dengan bimbingan.',
      cakap: 'Membiasakan bersikap jujur, adil, peduli, dan bertanggung jawab dalam interaksi dalam kehidupan nyata.',
      mahir: 'Mampu mengajak teman sebaya untuk peduli terhadap sesama serta menunjukkan inisiatif dalam menjaga kebaikan bersama di sekolah dan lingkungan.',
      ringkasKuat: 'bersikap jujur, peduli, dan menghargai sesama',
      ringkasLatih: 'meningkatkan kepedulian dan kebiasaan berbagi peran dengan sesama'
    },
    {
      name: 'Hubungan dengan Lingkungan Alam',
      berk: 'Menunjukkan pemahaman kebersihan lingkungan dan kelestarian alam dengan bimbingan.',
      cakap: 'Membiasakan menjaga kebersihan lingkungan dan kelestarian alam secara konsisten dan mandiri.',
      mahir: 'Menjadi contoh bagi teman dalam kepedulian lingkungan serta mampu menunjukkan inisiatif dalam menjaga kebersihan lingkungan dan kelestarian alam.',
      ringkasKuat: 'inisiatif menjaga kebersihan dan kelestarian lingkungan',
      ringkasLatih: 'membiasakan diri merawat kebersihan dan keasrian lingkungan'
    }
  ],
  'Kewargaan': [
    {
      name: 'Kewargaan Lokal',
      berk: 'Menunjukkan kesadaran atas aturan, norma, dan nilai sosial budaya yang berlaku di keluarga, satuan pendidikan, dan masyarakat.',
      cakap: 'Berperilaku sesuai aturan, norma, dan nilai sosial budaya yang berlaku di keluarga, satuan pendidikan, dan masyarakat dengan bimbingan.',
      mahir: 'Berperilaku sesuai aturan, norma, dan nilai sosial budaya yang berlaku di keluarga, satuan pendidikan, dan masyarakat secara mandiri.',
      ringkasKuat: 'menaati tata tertib serta menghormati norma sosial budaya di lingkungannya',
      ringkasLatih: 'mematuhi aturan dan tata tertib bersama secara konsisten'
    },
    {
      name: 'Kewargaan Nasional',
      berk: 'Menunjukkan kesadaran atas aturan, norma, dan nilai sosial budaya yang berlaku di lingkup nasional.',
      cakap: 'Berperilaku sesuai aturan, norma, dan nilai sosial budaya yang berlaku di lingkup nasional dengan bimbingan.',
      mahir: 'Berperilaku sesuai aturan, norma, dan nilai sosial budaya yang berlaku di lingkup nasional secara mandiri.',
      ringkasKuat: 'menunjukkan rasa bangga dan cinta tanah air',
      ringkasLatih: 'memperkuat pemahaman norma berbangsa dan rasa cinta tanah air'
    },
    {
      name: 'Kewargaan Global',
      berk: 'Mengenali keberadaan negara lain di dunia dan simbol-simbolnya.',
      cakap: 'Mengenal aturan, norma, dan nilai sosial budaya yang berlaku di lingkup global untuk menguatkan wawasan kebangsaan.',
      mahir: 'Berperilaku sesuai aturan, norma, dan nilai sosial budaya yang berlaku di lingkup global dan menghargai keberagamannya dengan tetap menjaga identitas diri dan budaya nasional.',
      ringkasKuat: 'menghargai keberagaman budaya dengan tetap menjaga identitas nasional',
      ringkasLatih: 'menghargai perbedaan dan keragaman di sekitarnya'
    }
  ],
  'Penalaran Kritis': [
    {
      name: 'Penyampaian Argumentasi',
      berk: 'Menyampaikan argumen sederhana namun belum tepat.',
      cakap: 'Menyampaikan argumen sederhana secara runtut disertai alasan.',
      mahir: 'Menyampaikan argumen sederhana secara runtut disertai alasan secara mandiri.',
      ringkasKuat: 'menyampaikan gagasan dan alasan secara runtut serta logis',
      ringkasLatih: 'berlatih menyampaikan pendapat dengan alasan yang runtut dan percaya diri'
    },
    {
      name: 'Pengambilan Keputusan',
      berk: 'Mengambil keputusan namun belum logis dan belum berdasarkan informasi yang relevan.',
      cakap: 'Mengambil keputusan secara logis berdasarkan informasi yang relevan.',
      mahir: 'Mengambil keputusan secara logis berdasarkan informasi yang relevan secara mandiri.',
      ringkasKuat: 'mengambil keputusan secara tepat berdasarkan pertimbangan informasi yang relevan',
      ringkasLatih: 'belajar menimbang informasi sebelum mengambil keputusan bersama'
    },
    {
      name: 'Penyelesaian Masalah',
      berk: 'Menyelesaikan masalah sederhana dan menghasilkan solusi namun kurang tepat.',
      cakap: 'Menyelesaikan masalah sederhana dan menghasilkan solusi yang tepat sesuai dengan konteks.',
      mahir: 'Menyelesaikan masalah sederhana dan menghasilkan solusi yang tepat sesuai dengan konteks secara mandiri.',
      ringkasKuat: 'menganalisis persoalan dan menemukan alternatif solusi yang tepat',
      ringkasLatih: 'meningkatkan ketelitian dalam memecahkan tantangan atau persoalan belajar'
    }
  ],
  'Kreativitas': [
    {
      name: 'Gagasan baru',
      berk: 'Menyampaikan gagasan secara sederhana meskipun belum runtut.',
      cakap: 'Menyampaikan gagasan sederhana dengan jelas dan runtut.',
      mahir: 'Menyampaikan beberapa gagasan sederhana dengan logis, jelas dan relevan.',
      ringkasKuat: 'mencetuskan ide-ide baru yang orisinal dan kreatif',
      ringkasLatih: 'mengembangkan keberanian menuangkan gagasan-gagasan baru'
    },
    {
      name: 'Fleksibilitas Berpikir',
      berk: 'Menemukan solusi masalah sederhana yang ditemui di lingkungan kelas dengan bantuan orang dewasa.',
      cakap: 'Menemukan solusi alternatif dengan mengadaptasi berbagai gagasan.',
      mahir: 'Menemukan beberapa solusi alternatif dan memberikan umpan balik pada alternatif solusinya.',
      ringkasKuat: 'adaptif mencari cara-cara baru dalam menghadapi tantangan',
      ringkasLatih: 'mencoba berbagai sudut pandang alternatif saat beraktivitas'
    },
    {
      name: 'Karya',
      berk: 'Membuat tindakan dan/atau karya sederhana yang kreatif sesuai minat dan kesukaannya.',
      cakap: 'Membuat tindakan dan/atau karya sederhana yang kreatif dengan berbagai ide yang sesuai minat dan kesukaannya.',
      mahir: 'Membuat tindakan dan/atau karya sederhana yang kreatif dengan berbagai ide yang sesuai minat dan kesukaannya serta mengkritisi tindakan dan/atau karya yang dihasilkan.',
      ringkasKuat: 'menghasilkan karya kreatif yang rapi dan bermakna',
      ringkasLatih: 'menyelesaikan karya kreatif dengan lebih tekun dan rapi'
    }
  ],
  'Kolaborasi': [
    {
      name: 'Peduli',
      berk: 'Mulai menunjukkan kepedulian pada teman sebaya dan anggota keluarga dengan bimbingan guru dan orang tua di lingkungan satuan pendidikan dan keluarga.',
      cakap: 'Menunjukkan kepedulian secara konsisten pada teman sebaya dan anggota keluarga dengan bimbingan guru dan orang tua di lingkungan satuan pendidikan dan keluarga.',
      mahir: 'Menunjukkan inisiatif kepedulian secara konsisten pada teman sebaya dan anggota keluarga di lingkungan satuan pendidikan dan keluarga.',
      ringkasKuat: 'menunjukkan kepedulian dan kepekaan sosial terhadap teman',
      ringkasLatih: 'meningkatkan kepekaan dan kepedulian terhadap kebutuhan teman sekitar'
    },
    {
      name: 'Berbagi',
      berk: 'Mulai berbagi hal yang dianggap penting dan berharga kepada teman sebaya dan anggota keluarga dengan bimbingan guru dan orang tua.',
      cakap: 'Berbagi hal yang dianggap penting dan berharga kepada teman atau anggota keluarga dengan bimbingan guru dan orang tua.',
      mahir: 'Menunjukkan inisiatif untuk berbagi hal yang dianggap penting dan berharga kepada teman atau anggota keluarga.',
      ringkasKuat: 'berinisiatif berbagi peran dan sumber daya demi kebaikan bersama',
      ringkasLatih: 'membiasakan diri saling berbagi peran dan sumber daya dalam kelompok'
    },
    {
      name: 'Kerja sama',
      berk: 'Mulai bekerjasama dengan teman sebaya dan anggota keluarga dengan bimbingan guru dan orang tua di lingkungan satuan pendidikan dan keluarga.',
      cakap: 'Bekerjasama dengan teman sebaya dan anggota keluarga dengan bimbingan guru dan orang tua di lingkungan satuan pendidikan dan keluarga.',
      mahir: 'Menunjukkan inisiatif untuk bekerjasama dengan teman sebaya dan anggota keluarga dengan bimbingan guru dan orang tua di lingkungan satuan pendidikan dan keluarga.',
      ringkasKuat: 'aktif bekerja sama dan kompak dalam menjalankan tugas kelompok',
      ringkasLatih: 'lebih aktif terlibat dan bekerja sama dalam tugas kelompok'
    }
  ],
  'Kemandirian': [
    {
      name: 'Bertanggung Jawab',
      berk: 'Melakukan upaya mencapai tujuan pembelajaran sesuai arahan.',
      cakap: 'Berlatih menetapkan tujuan pembelajaran untuk dirinya.',
      mahir: 'Berlatih mencapai tujuan pembelajaran yang telah ditentukan sendiri secara tepat waktu.',
      ringkasKuat: 'disiplin dan bertanggung jawab menyelesaikan tugas secara tepat waktu',
      ringkasLatih: 'meningkatkan kedisiplinan dan tanggung jawab menyelesaikan tugas tepat waktu'
    },
    {
      name: 'Kepemimpinan',
      berk: 'Menjalankan peran yang diberikan dalam konteks pembelajaran sesuai arahan.',
      cakap: 'Menjalankan peran yang diberikan dalam konteks pembelajaran dengan arahan minimal.',
      mahir: 'Berinisiatif untuk menjalankan peran dalam konteks pembelajaran secara otonom.',
      ringkasKuat: 'berinisiatif menjalankan peran mandiri dan memimpin kelompok',
      ringkasLatih: 'mengambil inisiatif dan peran aktif dalam dinamika kegiatan kelompok'
    },
    {
      name: 'Pengembangan Diri',
      berk: 'Mengenal minat dan bakat sebagai potensi diri dengan bimbingan penuh.',
      cakap: 'Mengenal minat dan bakat sebagai potensi diri dan mengeksplorasi berbagai kegiatan pengembangan diri dengan bimbingan.',
      mahir: 'Mengenal minat dan bakat sebagai potensi diri dan mengeksplorasi berbagai kegiatan pengembangan diri dengan bimbingan minimal.',
      ringkasKuat: 'mengenali potensi diri dan bersemangat mengembangkan bakatnya',
      ringkasLatih: 'mengenali minat serta tekun mengeksplorasi potensi dirinya'
    }
  ],
  'Kesehatan': [
    {
      name: 'Hidup bersih dan sehat',
      berk: 'Berperilaku hidup bersih dan sehat dengan memperhatikan dan menjaga kebersihan diri namun masih perlu bimbingan.',
      cakap: 'Berperilaku hidup bersih dan sehat dengan memperhatikan dan menjaga kebersihan diri dengan bimbingan minimal.',
      mahir: 'Mengajak orang lain untuk bersama-sama berperilaku hidup bersih dan sehat dengan memperhatikan dan menjaga kebersihan diri secara otonom dan teratur.',
      ringkasKuat: 'menjaga kebersihan diri dan mempraktikkan pola hidup sehat',
      ringkasLatih: 'membiasakan menjaga kebersihan diri dan kerapian secara mandiri'
    },
    {
      name: 'Kebugaran, kesehatan fisik, dan kesehatan mental',
      berk: 'Berperilaku sehat fisik dan mental, menjaga kebugaran dengan berolahraga secara teratur, menerapkan pola makan sehat dan bergizi seimbang, serta mengendalikan emosi dengan bimbingan penuh.',
      cakap: 'Berperilaku sehat fisik dan mental, menjaga kebugaran dengan berolahraga secara teratur, menerapkan pola makan sehat dan bergizi seimbang, serta mengendalikan emosi dengan bimbingan.',
      mahir: 'Mengajak teman sebaya agar berperilaku sehat secara fisik dan mental, menjaga kebugaran dengan berolahraga secara teratur, menerapkan pola makan sehat dan bergizi seimbang, serta mengendalikan emosi dengan bimbingan minimal.',
      ringkasKuat: 'menjaga kebugaran fisik melalui olahraga teratur dan kebiasaan sehat',
      ringkasLatih: 'menjaga kebugaran jasmani dengan rutin berolahraga dan istirahat teratur'
    },
    {
      name: 'Kesehatan Lingkungan',
      berk: 'Berperan aktif meningkatkan kesehatan lingkungan rumah dan sekolah dengan bimbingan penuh.',
      cakap: 'Berperan aktif meningkatkan kesehatan lingkungan rumah dan sekolah.',
      mahir: 'Mengajak teman sebaya untuk meningkatkan kesehatan lingkungan rumah dan sekolah.',
      ringkasKuat: 'aktif memelihara kesehatan dan keasrian lingkungan sekolah',
      ringkasLatih: 'berperan lebih aktif menjaga kebersihan lingkungan bersama'
    }
  ],
  'Komunikasi': [
    {
      name: 'Menyimak',
      berk: 'Mendengarkan secara aktif sejumlah teks lisan sederhana yang dipilih untuk mendapatkan informasi eksplisit dan implisit.',
      cakap: 'Mendengarkan secara aktif sejumlah teks lisan sederhana yang dipilih untuk mendapatkan informasi eksplisit dan implisit, dan memberikan tanggapan sederhana.',
      mahir: 'Mendengarkan secara aktif sejumlah teks lisan sederhana yang dipilih untuk mendapatkan informasi eksplisit dan implisit, dan memberikan tanggapan sederhana dan kritis.',
      ringkasKuat: 'menyimak penjelasan dengan fokus serta merespons secara tepat',
      ringkasLatih: 'meningkatkan konsentrasi saat menyimak instruksi dan penjelasan'
    },
    {
      name: 'Berbicara',
      berk: 'Menyampaikan, menggali, dan menanggapi secara lisan berbagai jenis informasi melalui teks lisan sederhana namun belum tepat dan lancar.',
      cakap: 'Menyampaikan, menggali, dan menanggapi secara lisan berbagai jenis informasi melalui teks lisan sederhana secara cukup tepat, lancar, dan efektif.',
      mahir: 'Menyampaikan, menggali, dan menanggapi secara lisan berbagai jenis informasi melalui teks lisan sederhana secara benar, tepat, lancar, dan efektif.',
      ringkasKuat: 'berkomunikasi lisan dengan santun, lugas, dan percaya diri',
      ringkasLatih: 'berlatih berbicara dan menyampaikan pendapat secara lebih percaya diri'
    },
    {
      name: 'Membaca',
      berk: 'Membaca secara aktif sejumlah teks tertulis sederhana yang dipilih untuk mendapatkan informasi eksplisit dan implisit.',
      cakap: 'Membaca secara aktif sejumlah teks tertulis sederhana yang dipilih untuk mendapatkan informasi eksplisit dan implisit, dan memberikan tanggapan sederhana.',
      mahir: 'Membaca secara aktif sejumlah teks tertulis sederhana yang dipilih untuk mendapatkan informasi eksplisit dan implisit, dan memberikan tanggapan sederhana dan kritis.',
      ringkasKuat: 'memahami pesan bacaan dengan baik dan kritis',
      ringkasLatih: 'meningkatkan minat membaca serta memahami isi teks bacaan'
    },
    {
      name: 'Menulis',
      berk: 'Menyampaikan, menggali, dan menanggapi secara lisan berbagai jenis informasi melalui teks tertulis sederhana namun belum tepat dan lancar.',
      cakap: 'Menyampaikan, menggali, dan menanggapi secara lisan berbagai jenis informasi melalui teks tertulis sederhana secara cukup tepat, lancar, dan efektif.',
      mahir: 'Menyampaikan, menggali, dan menanggapi secara lisan berbagai jenis informasi melalui teks tertulis sederhana secara benar, tepat, lancar, dan efektif.',
      ringkasKuat: 'menuangkan gagasan dalam bentuk tulisan yang rapi dan terstruktur',
      ringkasLatih: 'berlatih menuliskan ide atau refleksi kegiatan secara lebih terstruktur'
    }
  ]
};

export const SKALA_KOKURIKULER: Record<string, { label: string; score: number; color: string }> = {
  'M': { label: 'Mahir (M)', score: 3, color: 'text-sky-700 bg-sky-50 border-sky-300' },
  'C': { label: 'Cakap (C)', score: 2, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  'B': { label: 'Berkembang (B)', score: 1, color: 'text-amber-700 bg-amber-50 border-amber-300' },
  // Dukungan data kompatibilitas lama
  'SAB': { label: 'Mahir (M)', score: 3, color: 'text-sky-700 bg-sky-50 border-sky-300' },
  'BSH': { label: 'Cakap (C)', score: 2, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  'SB': { label: 'Cakap (C)', score: 2, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
  'MB': { label: 'Berkembang (B)', score: 1, color: 'text-amber-700 bg-amber-50 border-amber-300' }
};

export function normalisasiSkala(val?: string): 'M' | 'C' | 'B' | '' {
  if (!val) return '';
  const upper = val.toUpperCase().trim();
  if (upper === 'M' || upper === 'SAB' || upper === '3') return 'M';
  if (upper === 'C' || upper === 'BSH' || upper === 'SB' || upper === '2') return 'C';
  if (upper === 'B' || upper === 'MB' || upper === 'BB' || upper === '1') return 'B';
  return '';
}

export interface InputItemSintesis {
  dimName: string;
  subdimName: string;
  score: 'M' | 'C' | 'B';
}

/**
 * Format nama kegiatan yang bersih, tanpa pengulangan kata "kegiatan" dan tanpa nested quotes
 */
export function formatDaftarKegiatanClean(kegiatanInput: string | string[]): string {
  const rawList = Array.isArray(kegiatanInput) ? kegiatanInput : [kegiatanInput];
  const cleaned = rawList
    .map(k => {
      if (!k) return '';
      // Bersihkan jika ada kata "kegiatan kokurikuler" atau quotes yang terbawa
      return k
        .replace(/kegiatan\s*kokurikuler/gi, '')
        .replace(/kegiatan/gi, '')
        .replace(/["“”'']/g, '')
        .trim();
    })
    .filter(Boolean);

  // Buang duplikasi nama kegiatan
  const unique = Array.from(new Set(cleaned));

  if (unique.length === 0) return 'kegiatan kokurikuler';
  if (unique.length === 1) return `kegiatan kokurikuler '${unique[0]}'`;
  if (unique.length === 2) return `kegiatan kokurikuler '${unique[0]}' dan '${unique[1]}'`;
  return `kegiatan kokurikuler '${unique.slice(0, -1).join("', '")}', dan '${unique[unique.length - 1]}'`;
}

/**
 * Mesin peracik narasi kokurikuler kompilasi tunggal (Panduan Kokurikuler BSKAP 2025 Hal. 56 & 73).
 * Menggabungkan seluruh kegiatan semesteran menjadi 1 narasi komprehensif, padat, dan mengalir alami.
 */
export function generateVariasiNarasiKokurikuler(
  studentName: string,
  kegiatanInput: string | string[],
  scores: InputItemSintesis[]
): string[] {
  const sebutanKegiatan = formatDaftarKegiatanClean(kegiatanInput);
  const cleanScores = scores.filter(s => s.score && ['M', 'C', 'B'].includes(s.score));

  // Default jika belum ada nilai asesmen
  if (cleanScores.length === 0) {
    return [
      `Selama mengikuti ${sebutanKegiatan}, Ananda ${studentName} menunjukkan partisipasi aktif dan kemauan belajar yang baik. Teruslah pertahankan semangat belajar positif ini.`,
      `Ananda ${studentName} telah mengikuti seluruh rangkaian ${sebutanKegiatan} dengan penuh tanggung jawab. Dukungan berkelanjutan akan membantu Ananda semakin berkembang optimal.`,
      `Sepanjang ${sebutanKegiatan}, Ananda ${studentName} memperlihatkan adaptabilitas dan kerja sama yang baik dalam setiap aktivitas pembelajaran.`,
      `Keterlibatan Ananda ${studentName} dalam ${sebutanKegiatan} menunjukkan antusiasme positif yang patut diapresiasi.`,
      `Ananda ${studentName} menunjukkan komitmen belajar yang baik selama mengikuti ${sebutanKegiatan} dan berinteraksi positif dengan teman sebayanya.`
    ];
  }

  // 1. Agregasi & Deduplikasi per Dimensi
  const dimMap: Record<string, {
    mahirSubs: SubdimensiDeskriptor[];
    cakapSubs: SubdimensiDeskriptor[];
    berkSubs: SubdimensiDeskriptor[];
  }> = {};

  cleanScores.forEach(item => {
    if (!dimMap[item.dimName]) {
      dimMap[item.dimName] = { mahirSubs: [], cakapSubs: [], berkSubs: [] };
    }
    const list = BANK_SUBDIMENSI_SD[item.dimName as DimensiKokurikulerNama] || [];
    const descriptor = list.find(s => s.name === item.subdimName) || {
      name: item.subdimName,
      berk: 'berkembang dengan bimbingan',
      cakap: 'berkembang secara konsisten',
      mahir: 'menunjukkan penguasaan mandiri',
      ringkasKuat: `menunjukkan capaian baik dalam ${item.subdimName.toLowerCase()}`,
      ringkasLatih: `membiasakan ${item.subdimName.toLowerCase()}`
    };

    const targetList = item.score === 'M' 
      ? dimMap[item.dimName].mahirSubs 
      : item.score === 'C' 
      ? dimMap[item.dimName].cakapSubs 
      : dimMap[item.dimName].berkSubs;

    // Deduplikasi agar subdimensi yang sama tidak masuk dua kali
    if (!targetList.some(s => s.name === descriptor.name)) {
      targetList.push(descriptor);
    }
  });

  // Hitung rata-rata nilai untuk menentukan nuansa keseluruhan
  const totalPoints = cleanScores.reduce((acc, curr) => {
    if (curr.score === 'M') return acc + 3;
    if (curr.score === 'C') return acc + 2;
    return acc + 1;
  }, 0);
  const avg = totalPoints / cleanScores.length;

  // 1. Agregasi & Penentuan Status Dominan per Dimensi
  interface DimSummary {
    dimName: string;
    level: 'M' | 'C' | 'B';
    strongPhrase: string;
    growthPhrase: string;
  }

  const dimSummaries: DimSummary[] = [];

  Object.entries(dimMap).forEach(([dimName, data]) => {
    const hasMahir = data.mahirSubs.length > 0;
    const hasCakap = data.cakapSubs.length > 0;

    // Tentukan level dominan dimensi ini
    let level: 'M' | 'C' | 'B' = 'C';
    if (hasMahir) {
      level = 'M';
    } else if (hasCakap) {
      level = 'C';
    } else {
      level = 'B';
    }

    const strongItems = [...data.mahirSubs, ...data.cakapSubs];
    let strongPhrase = '';
    if (strongItems.length > 0) {
      const phrases = strongItems.map(s => s.ringkasKuat);
      strongPhrase = phrases.length === 1 ? phrases[0] : `${phrases[0]} serta ${phrases[1]}`;
    }

    let growthPhrase = '';
    if (data.berkSubs.length > 0) {
      growthPhrase = data.berkSubs[0].ringkasLatih;
    }

    dimSummaries.push({
      dimName,
      level,
      strongPhrase,
      growthPhrase
    });
  });

  // MUTUAL EXCLUSION:
  // Dimensi Kuat: yang dominan M atau C
  const strongDims = dimSummaries.filter(d => (d.level === 'M' || d.level === 'C') && d.strongPhrase);
  // Dimensi Bimbingan: HANYA yang murni di level B (tidak boleh ada dimensi yang dipuji sekaligus dikritik)
  const growthDims = dimSummaries.filter(d => d.level === 'B' && d.growthPhrase);

  const strengthSentences: string[] = strongDims.map(d => `pada dimensi ${d.dimName}, Ananda ${d.strongPhrase}`);
  const growthPoints: string[] = growthDims.map(d => `pada dimensi ${d.dimName} untuk ${d.growthPhrase}`);

  // Susun 5 Variasi Narasi yang Berkelas, Alami, dan Mengalir (Tanpa Kontradiksi & Repetisi)
  const variations: string[] = [];

  // VARIASI 1: Gaya Pembuka Partisipatif & Apresiatif
  {
    const p1 = `Selama mengikuti ${sebutanKegiatan}, Ananda ${studentName} menunjukkan perkembangan karakter yang membanggakan.`;
    const p2 = strengthSentences.length > 0 
      ? `${strengthSentences.slice(0, 2).map((s, idx) => idx === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : `Sementara ${s}`).join('. ')}.`
      : `Ananda aktif berpartisipasi dan menunjukkan kerja sama yang baik.`;
    const p3 = growthPoints.length > 0 
      ? `Pendampingan berkelanjutan diarahkan ${growthPoints.slice(0, 2).join(' dan ')} secara lebih konsisten.`
      : `Pertahankan pencapaian positif ini dan teruslah menjadi teladan kebaikan bagi lingkungan sekitarmu.`;
    const p4 = `Dukungan hangat dari guru dan orang tua akan semakin memantapkan kemandirian belajarnya.`;
    variations.push(`${p1} ${p2} ${p3} ${p4}`.replace(/\s+/g, ' ').trim());
  }

  // VARIASI 2: Gaya Langsung Berbasis Kompetensi
  {
    const p1 = `Ananda ${studentName} berpartisipasi aktif dalam ${sebutanKegiatan} dengan komitmen belajar yang sangat baik.`;
    const p2 = strengthSentences.length > 0
      ? `Keunggulan terlihat saat ${strengthSentences[0]}, didukung ketekunan positif dalam setiap aktivitas.`
      : `Ananda menunjukkan semangat belajar dan kedisiplinan yang terus bertumbuh.`;
    const p3 = growthPoints.length > 0
      ? `Untuk kemajuan berikutnya, Ananda didorong ${growthPoints[0]} agar potensinya semakin optimal.`
      : `Komitmen dan sikap positif ini menjadi bekal berharga bagi Ananda untuk terus meraih kemajuan belajar yang gemilang.`;
    const p4 = `Kami sangat mengapresiasi proses dan capaian positif yang diraih Ananda di semester ini.`;
    variations.push(`${p1} ${p2} ${p3} ${p4}`.replace(/\s+/g, ' ').trim());
  }

  // VARIASI 3: Gaya Karakter & Pertumbuhan
  {
    const p1 = `Perkembangan karakter Ananda ${studentName} melalui ${sebutanKegiatan} memperlihatkan kematangan sikap yang positif.`;
    const p2 = strengthSentences.length > 1
      ? `${strengthSentences[0].charAt(0).toUpperCase() + strengthSentences[0].slice(1)}, serta ${strengthSentences[1]}.`
      : strengthSentences.length === 1
      ? `${strengthSentences[0].charAt(0).toUpperCase() + strengthSentences[0].slice(1)} secara tertata dan bertanggung jawab.`
      : `Ananda mampu menyesuaikan diri dengan baik dalam berbagai aktivitas terprogram.`;
    const p3 = growthPoints.length > 0
      ? `Fokus pembiasaan selanjutnya adalah mendampingi Ananda ${growthPoints[0]} dalam keseharian.`
      : `Teruslah berkarya dengan tekun dan percaya diri dalam menghadapi tantangan belajar berikutnya.`;
    const p4 = `Sinergi sekolah dan keluarga akan terus menguatkan proses tumbuh kembang Ananda.`;
    variations.push(`${p1} ${p2} ${p3} ${p4}`.replace(/\s+/g, ' ').trim());
  }

  // VARIASI 4: Gaya Reflektif & Adaptif
  {
    const p1 = `Melalui serangkaian ${sebutanKegiatan}, Ananda ${studentName} memperlihatkan antusiasme yang tinggi dan adaptabilitas belajar yang solid.`;
    const p2 = strengthSentences.length > 0
      ? `Ananda terbukti handal karena ${strengthSentences[0]}, mencerminkan profil pelajar yang tangguh.`
      : `Ananda senantiasa menunjukkan kesungguhan dalam menuntaskan setiap tugas.`;
    const p3 = growthPoints.length > 0
      ? `Bimbingan terarah akan membantu Ananda ${growthPoints[0]} agar semakin mandiri.`
      : `Langkah positif ini menjadi pijakan kuat untuk terus menumbuhkan potensi diri secara mandiri.`;
    const p4 = `Keuletan dan tanggung jawab yang ditunjukkan patut diapresiasi setinggi-tingginya.`;
    variations.push(`${p1} ${p2} ${p3} ${p4}`.replace(/\s+/g, ' ').trim());
  }

  // VARIASI 5: Gaya Humanis & Edukatif Ringkas
  {
    const p1 = `Secara keseluruhan, Ananda ${studentName} telah menuntaskan ${sebutanKegiatan} dengan hasil yang menggembirakan.`;
    const p2 = strengthSentences.length > 0
      ? `Capaian yang paling menonjol tampak saat ${strengthSentences.slice(0, 2).join(', serta ')}.`
      : `Keterlibatan aktif Ananda memberikan warna positif dalam kelompoknya.`;
    const p3 = growthPoints.length > 0
      ? `Dengan latihan yang konsisten, Ananda dapat semakin mantap ${growthPoints[0]}.`
      : `Pertahankan ketekunan ini dan teruslah melangkah dengan semangat kebaikan.`;
    const p4 = `Kami bangga atas usaha dan kemajuan nyata yang ditunjukkan Ananda selama proses belajar.`;
    variations.push(`${p1} ${p2} ${p3} ${p4}`.replace(/\s+/g, ' ').trim());
  }

  return variations;
}
