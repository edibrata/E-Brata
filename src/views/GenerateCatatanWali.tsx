import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { 
  Sparkles, 
  Search, 
  Check, 
  MessageSquareQuote, 
  Bot, 
  Award, 
  TrendingUp, 
  AlertCircle,
  X,
  Copy,
  Trash2,
  BookOpen,
  Compass,
  Medal,
  Crown,
  CalendarCheck2,
  Lock,
  Unlock,
  Shuffle,
  RotateCcw
} from 'lucide-react';
import { Siswa } from '@/types';
import Tooltip from '@/components/Tooltip';
import AutoResizeTextarea from '@/components/AutoResizeTextarea';

export default function GenerateCatatanWali() {
  const { state, updateState } = useAppStore();
  const { 
    siswa, 
    mapel, 
    nilai, 
    ekstrakurikuler = [], 
    nilaiEkskul = {}, 
    projek = [], 
    dimensiProjek = [], 
    nilaiP5 = {}, 
    dataPendukung = {},
    lockedCatatanWali = {}
  } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unfilled' | 'filled'>('all');
  const [selectedStudentForAI, setSelectedStudentForAI] = useState<Siswa | null>(null);
  const [modalCategoryTab, setModalCategoryTab] = useState<'v5' | 'v1' | 'v2' | 'v3' | 'v4' | 'all'>('v5');
  const [catatanWaliVariationIndex, setCatatanWaliVariationIndex] = useState<Record<string, number>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Helper perhitungan metrik akademik per murid (Intrakurikuler)
  const studentMetrics = useMemo(() => {
    const metrics: Record<string, { average: number; highestMapel: string; lowestMapel: string; completedMapelCount: number }> = {};
    
    siswa.forEach(s => {
      let totalScore = 0;
      let count = 0;
      let highest = { name: '-', score: -1 };
      let lowest = { name: '-', score: 101 };

      mapel.forEach(m => {
        const studentMapelNilai = nilai[s.id]?.[m.id];
        if (studentMapelNilai) {
          const tpVals = Object.values(studentMapelNilai.tpScores || {}).filter((v): v is number => typeof v === 'number');
          let finalScore: number | null = null;
          if (tpVals.length > 0) {
            const avgTp = tpVals.reduce((a, b) => a + b, 0) / tpVals.length;
            if (studentMapelNilai.sumatifAkhir !== null && studentMapelNilai.sumatifAkhir !== undefined) {
              finalScore = Math.round((avgTp * 0.75) + (studentMapelNilai.sumatifAkhir * 0.25));
            } else {
              finalScore = Math.round(avgTp);
            }
          } else if (studentMapelNilai.sumatifAkhir !== null && studentMapelNilai.sumatifAkhir !== undefined) {
            finalScore = studentMapelNilai.sumatifAkhir;
          }

          if (finalScore !== null) {
            totalScore += finalScore;
            count++;
            if (finalScore > highest.score) {
              highest = { name: m.nama, score: finalScore };
            }
            if (finalScore < lowest.score) {
              lowest = { name: m.nama, score: finalScore };
            }
          }
        }
      });

      const average = count > 0 ? Math.round(totalScore / count) : 0;
      metrics[s.id] = {
        average,
        highestMapel: highest.score >= 0 ? `${highest.name} (${highest.score})` : 'Belum Ada',
        lowestMapel: lowest.score <= 100 ? `${lowest.name} (${lowest.score})` : 'Belum Ada',
        completedMapelCount: count
      };
    });

    return metrics;
  }, [siswa, mapel, nilai]);

  // Helper mengekstrak data komprehensif 4 pilar per murid
  const getStudentFourPillarsData = (studentId: string) => {
    // 1. Pilar Intrakurikuler
    const metric = studentMetrics[studentId] || { average: 75, highestMapel: 'Umum', lowestMapel: '-', completedMapelCount: 0 };
    
    // 2. Pilar Ekstrakurikuler
    const studentEkskuls: Array<{ nama: string; predikat: string; deskripsi?: string }> = [];
    if (nilaiEkskul && nilaiEkskul[studentId]) {
      ekstrakurikuler.forEach(e => {
        const ne = nilaiEkskul[studentId]?.[e.id];
        if (ne && ne.predikat && ne.predikat !== '-') {
          studentEkskuls.push({
            nama: e.nama,
            predikat: ne.predikat,
            deskripsi: ne.deskripsi
          });
        }
      });
    }

    // 3. Pilar Kokurikuler (Karakter & Dimensi Profil Lulusan)
    const studentProjekNilai = nilaiP5?.[studentId] || {};
    const strongDimensi: string[] = [];
    dimensiProjek.forEach(d => {
      const val = studentProjekNilai[d.id];
      if (val === 'SAB' || val === 'BSH') {
        strongDimensi.push(d.nama);
      }
    });
    const projectThemes = projek.map(p => p.tema).filter(Boolean);

    // 4. Pilar Kehadiran
    const dp = dataPendukung[studentId] || {};
    const sakit = dp.sakit || 0;
    const izin = dp.izin || 0;
    const alpa = dp.alpa || 0;
    const totalAbsen = sakit + izin + alpa;

    return {
      metric,
      ekskuls: studentEkskuls,
      strongDimensi,
      projectThemes,
      kehadiran: { sakit, izin, alpa, totalAbsen }
    };
  };

  // Update Catatan Wali Kelas saja tanpa mengganggu data presensi
  const updateStudentCatatan = (studentId: string, catatanWaliKelas: string) => {
    const current = dataPendukung[studentId] || {};
    const updated = {
      ...dataPendukung,
      [studentId]: {
        ...current,
        catatanWaliKelas
      }
    };
    updateState('dataPendukung', updated);
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Generator 25 Variasi Catatan AI Berbasis Sintesis Komprehensif 4 Pilar & Data Murid
  const generateAISuggestions = (student: Siswa) => {
    const { metric, ekskuls, strongDimensi, projectThemes, kehadiran } = getStudentFourPillarsData(student.id);
    
    // Ambil sapaan personal yang hangat, ringkas, dan hemat karakter (1-2 kata pertama, maks 15 karakter)
    const nameParts = (student.nama || '').trim().split(/\s+/);
    const shortName = nameParts.length > 1 && (nameParts[0].length + nameParts[1].length <= 14)
      ? `${nameParts[0]} ${nameParts[1]}` 
      : nameParts[0] || 'Murid';

    const avg = metric.average;
    const highMapel = metric.highestMapel !== 'Belum Ada' ? metric.highestMapel.replace(/\s*\(\d+\)$/, '') : 'mata pelajaran utama';
    const lowMapel = metric.lowestMapel !== 'Belum Ada' && metric.lowestMapel !== metric.highestMapel 
      ? metric.lowestMapel.replace(/\s*\(\d+\)$/, '') 
      : null;
    
    // 1. Data Riil Ekstrakurikuler
    const mainEkskul = ekskuls.length > 0 ? ekskuls[0] : null;
    const ekskulPhrase = mainEkskul 
      ? `kegiatan ${mainEkskul.nama}` 
      : 'kegiatan minat bakat';

    // 2. Data Riil Kokurikuler (Dimensi Profil Lulusan & Tema)
    const temaStr = projectThemes.length > 0 ? `tema "${projectThemes[0]}"` : 'Kokurikuler';
    const dimensiStr = strongDimensi.length > 0 
      ? strongDimensi[0]
      : 'kemandirian';

    // 3. Data Riil Presensi / Kehadiran
    const isNolAbsen = kehadiran.totalAbsen === 0;
    const isAbsenSedang = kehadiran.totalAbsen > 0 && kehadiran.totalAbsen <= 3;
    const isAbsenBanyak = kehadiran.totalAbsen > 3;

    // Helper frasa presensi ringkas & padat
    const presensiPhrase = isNolAbsen
      ? 'disiplin hadir 100%'
      : isAbsenSedang
        ? 'kehadiran baik'
        : 'perlu tingkatkan kehadiran';

    // =========================================================================
    // DEFINISI 5 SUDUT PANDANG SINTESIS HOLISTIK X 5 SUB-VARIAN (130 - 165 KARAKTER)
    // =========================================================================

    const categories = [
      // --- KATEGORI 5: SINTESIS PARIPURNA (HARMONISASI UTUH 4 PILAR: INTRA, KOKU, EKSTRA, PRESENSI) ---
      {
        id: 'v5' as const,
        nomor: 'Varian 5',
        kategori: 'Sintesis Paripurna (Pesan Utuh 4 Pilar)',
        badge: 'bg-gradient-to-r from-amber-100 to-indigo-100 text-indigo-950 border-amber-300 font-bold',
        icon: <Crown className="w-4 h-4 text-amber-600" />,
        deskripsiKategori: 'Sintesis naratif mengalir dan berbobot memadukan Intrakurikuler, Kokurikuler, Ekstrakurikuler, dan Presensi',
        isMaster: true,
        items: [
          {
            id: 'v5-sub1',
            subNomor: '5.1',
            judulSub: 'Harmonisasi Naratif & Apresiasi Mengalir',
            gaya: 'Gaya Naratif Mengalir',
            text: `Ketekunan ananda ${shortName} dalam ${highMapel} berpadu indah dengan ${isNolAbsen ? 'kedisiplinan hadir 100%' : 'kehadiran yang baik'} di kelas. Keaktifan pada ${ekskulPhrase} serta projek kokurikuler membuktikan potensinya yang terus mekar. Rawat terus nyala semangat ini!`,
            ringkasan: 'Naratif organis merajut ketekunan akademik, ketertiban presensi, dinamika projek, dan ekskul'
          },
          {
            id: 'v5-sub2',
            subNomor: '5.2',
            judulSub: 'Refleksi Karakter & Kepemimpinan Teladan',
            gaya: 'Gaya Reflektif Kepemimpinan',
            text: `Ananda ${shortName} tumbuh menjadi pribadi tangguh; unggul dalam ${highMapel}, berdaya nalar kritis saat projek, dan antusias di ${ekskulPhrase}. Didukung ${presensiPhrase}, teruslah melangkah menjadi insan teladan yang menginspirasi sesama.`,
            ringkasan: 'Pesan kepemimpinan dan kematangan bernalar menghubungkan capaian akademik dan keaktifan non-akademik'
          },
          {
            id: 'v5-sub3',
            subNomor: '5.3',
            judulSub: 'Harmonisasi Bakat & Disiplin Belajar',
            gaya: 'Gaya Harmonisasi Bakat',
            text: `Keseimbangan yang membanggakan ditunjukkan ananda ${shortName} melalui penguasaan ${highMapel}, dedikasi pada projek ${dimensiStr}, serta talenta ${ekskulPhrase}. Pertahankan ${presensiPhrase} ini dan sambutlah semester baru dengan optimisme tinggi!`,
            ringkasan: 'Harmonisasi penguasaan materi, karakter dimensi projek, minat bakat ekskul, dan presensi'
          },
          {
            id: 'v5-sub4',
            subNomor: '5.4',
            judulSub: 'Kesiapan Transformatif & Visioner',
            gaya: 'Gaya Visioner Transformatif',
            text: `Didukung ${presensiPhrase}, ananda ${shortName} menunjukkan pemahaman kuat pada ${highMapel} sekaligus aktif berkolaborasi di projek kokurikuler dan ${ekskulPhrase}. Jadikan capaian berharga ini pijakan meraih prestasi yang lebih luas!`,
            ringkasan: 'Dorongan visioner memperluas potensi melalui kolaborasi projek, ekskul, dan prestasi kelas'
          },
          {
            id: 'v5-sub5',
            subNomor: '5.5',
            judulSub: 'Sinergi Perkembangan & Afirmasi Utuh',
            gaya: 'Gaya Afirmasi Sinergis',
            text: `Perkembangan ananda ${shortName} semester ini sangat memuaskan, baik pada capaian ${highMapel}, kepedulian dalam projek ${dimensiStr}, maupun kreativitas di ${ekskulPhrase}. Teruslah ${isNolAbsen ? 'tertib hadir' : 'menjaga kehadiran'} dan pupuk rasa percaya dirimu!`,
            ringkasan: 'Afirmasi komprehensif mengapresiasi pencapaian multidimensi siswa secara hangat dan bermakna'
          }
        ]
      },

      // --- KATEGORI 1: APRESIASI KETEKUNAN & PRESTASI BELAJAR (HOLISTIK AKADEMIK) ---
      {
        id: 'v1' as const,
        nomor: 'Varian 1',
        kategori: 'Apresiasi Ketekunan & Prestasi Belajar',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <Award className="w-4 h-4 text-emerald-600" />,
        deskripsiKategori: 'Apresiasi penguasaan materi akademik yang diselaraskan dengan ketekunan, karakter, dan kehadiran',
        items: [
          {
            id: 'v1-sub1',
            subNomor: '1.1',
            judulSub: 'Apresiasi Penguasaan Materi & Keteladanan Belajar',
            gaya: 'Gaya Apresiatif Formal',
            text: `Selamat atas capaian ananda ${shortName} pada ${highMapel}. Didukung kehadiran yang baik, rawat terus semangat belajarmu dan tetaplah rendah hati menggapai prestasi!`,
            ringkasan: 'Apresiasi penguasaan materi terbaik, keteladanan sikap, dan konsistensi presensi'
          },
          {
            id: 'v1-sub2',
            subNomor: '1.2',
            judulSub: 'Dedikasi Belajar & Keaktifan di Ruang Kelas',
            gaya: 'Gaya Naratif Mengalir',
            text: `Dedikasi belajar ananda ${shortName} membuahkan hasil positif pada ${highMapel}. Tingkatkan keaktifan berdiskusi agar pemahaman konsepmu semakin mendalam di semester baru.`,
            ringkasan: 'Penggambaran proses ketekunan belajar di kelas dan keaktifan pengembangan diri'
          },
          {
            id: 'v1-sub3',
            subNomor: '1.3',
            judulSub: 'Kematangan Bernalar & Sinergi Belajar di Rumah',
            gaya: 'Gaya Reflektif Kemitraan',
            text: `Daya nalar ananda ${shortName} pada ${highMapel} berkembang sangat baik. Terus pertahankan komunikasi belajar yang aktif di kelas dan di rumah demi capaian optimal.`,
            ringkasan: 'Refleksi kematangan daya nalar dan apresiasi pendampingan keluarga di rumah'
          },
          {
            id: 'v1-sub4',
            subNomor: '1.4',
            judulSub: 'Eksplorasi Potensi Akademik Berkelanjutan',
            gaya: 'Gaya Motivasi Edukatif',
            text: `Keberhasilan ananda ${shortName} pada ${highMapel} adalah modal berharga. Jadikan capaian ini pemantik semangat mengeksplorasi wawasan baru dengan daya nalar kritis.`,
            ringkasan: 'Motivasi edukatif untuk terus mengeksplorasi ilmu pengetahuan secara luas'
          },
          {
            id: 'v1-sub5',
            subNomor: '1.5',
            judulSub: 'Rekapitulasi Kemajuan Belajar Positif',
            gaya: 'Gaya Ringkas Padat',
            text: `Pencapaian belajar ananda ${shortName} semester ini sangat baik pada ${highMapel}. Teruslah berkarya, asah potensi dirimu, dan raih prestasi yang lebih gemilang!`,
            ringkasan: 'Pernyataan ringkas dan padat capaian akademik berpadu karakter positif'
          }
        ]
      },

      // --- KATEGORI 2: KETELADANAN KARAKTER & KEMITRAAN KELUARGA (HOLISTIK KARAKTER) ---
      {
        id: 'v2' as const,
        nomor: 'Varian 2',
        kategori: 'Keteladanan Karakter & Budi Pekerti',
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: <Compass className="w-4 h-4 text-indigo-600" />,
        deskripsiKategori: 'Penguatan budi pekerti luhur dan kepemimpinan yang berpadu dengan capaian belajar serta kemitraan orang tua',
        items: [
          {
            id: 'v2-sub1',
            subNomor: '2.1',
            judulSub: 'Kepribadian Berakhlak Mulia & Empati Sosial',
            gaya: 'Gaya Apresiatif Formal',
            text: `Ananda ${shortName} menunjukkan akhlak mulia dan peduli sesama. Padukan keluhuran budi ini dengan ketekunan belajar ${highMapel} agar selalu menjadi insan teladan.`,
            ringkasan: 'Apresiasi budi pekerti luhur, kepedulian sosial, dan keluhuran sikap siswa'
          },
          {
            id: 'v2-sub2',
            subNomor: '2.2',
            judulSub: 'Kepemimpinan, Kolaborasi & Jiwa Gotong Royong',
            gaya: 'Gaya Naratif Kolaboratif',
            text: `Jiwa gotong royong dan kemandirian ananda ${shortName} tumbuh sangat baik di sekolah. Rawat terus kepedulian sosial ini sebagai bekal menjadi pribadi yang berintegritas.`,
            ringkasan: 'Penekanan pada kemampuan kolaborasi, kekompakan, dan jiwa kepemimpinan'
          },
          {
            id: 'v2-sub3',
            subNomor: '2.3',
            judulSub: 'Kematangan Sikap & Keselarasan Rumah-Sekolah',
            gaya: 'Gaya Reflektif Kemitraan',
            text: `Kematangan budi pekerti dan tanggung jawab ananda ${shortName} mencerminkan teladan baik keluarga. Terima kasih kepada orang tua; mari terus dampingi pembiasaan positif ananda.`,
            ringkasan: 'Refleksi kematangan sikap mandiri dan keselarasan pembiasaan rumah-sekolah'
          },
          {
            id: 'v2-sub4',
            subNomor: '2.4',
            judulSub: 'Pengamalan Karakter Menuju Keteladanan Nyata',
            gaya: 'Gaya Motivasi Edukatif',
            text: `Integritas dan sikap santun ananda ${shortName} menjadi fondasi kokoh dalam belajar. Teruslah berbuat kebaikan dan jadilah pribadi yang membawa manfaat bagi sesama.`,
            ringkasan: 'Dorongan menerapkan keluhuran budi pekerti dalam kehidupan sehari-hari'
          },
          {
            id: 'v2-sub5',
            subNomor: '2.5',
            judulSub: 'Profil Kepribadian Santun & Mandiri',
            gaya: 'Gaya Ringkas Padat',
            text: `Ananda ${shortName} berkepribadian santun, mandiri, dan berakhlak mulia serta tekun belajar di kelas. Terus pupuk sikap terpuji ini dalam setiap langkah kehidupanmu.`,
            ringkasan: 'Catatan ringkas kepribadian santun, mandiri, dan bertanggung jawab'
          }
        ]
      },

      // --- KATEGORI 3: KESEIMBANGAN DAYA PIKIR & PENGEMBANGAN TALENTA (HOLISTIK POTENSI DIRI) ---
      {
        id: 'v3' as const,
        nomor: 'Varian 3',
        kategori: 'Keseimbangan Belajar & Pengembangan Talenta',
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: <Medal className="w-4 h-4 text-purple-600" />,
        deskripsiKategori: 'Harmonisasi antara pencapaian ilmu pengetahuan di kelas dan pengasahan bakat non-akademik',
        items: [
          {
            id: 'v3-sub1',
            subNomor: '3.1',
            judulSub: 'Harmonisasi Prestasi Belajar & Sportivitas Bakat',
            gaya: 'Gaya Apresiatif Formal',
            text: `Keseimbangan yang baik ditunjukkan ananda ${shortName} dalam belajar ${highMapel} dan mengasah bakat pada ${ekskulPhrase}. Terus asah potensimu membentuk mental juara tangguh!`,
            ringkasan: 'Apresiasi keseimbangan antara prestasi akademik dan keterlibatan aktif ekstrakurikuler'
          },
          {
            id: 'v3-sub2',
            subNomor: '3.2',
            judulSub: 'Kegigihan, Manajemen Waktu & Daya Tahan Mental',
            gaya: 'Gaya Naratif Inspiratif',
            text: `Kemampuan ananda ${shortName} membagi waktu antara pelajaran ${highMapel} dan minat bakat patut diapresiasi. Pertahankan disiplin ini agar prestasi terus berjalan selaras.`,
            ringkasan: 'Inspirasi kematangan manajemen waktu dan ketahanan mental belajar'
          },
          {
            id: 'v3-sub3',
            subNomor: '3.3',
            judulSub: 'Pengembangan Potensi Multidimensi & Kemitraan',
            gaya: 'Gaya Reflektif Kemitraan',
            text: `Tumbuh kembang bakat ananda ${shortName} yang diimbangi hasil belajar baik mencerminkan dukungan luar biasa keluarga. Mari terus dampingi minat ananda agar tersalurkan optimal.`,
            ringkasan: 'Refleksi pengembangan talenta anak bersama pendampingan orang tua'
          },
          {
            id: 'v3-sub4',
            subNomor: '3.4',
            judulSub: 'Mentalitas Juara & Karakter Berani Berekspresi',
            gaya: 'Gaya Motivasi Edukatif',
            text: `Jadikan wadah ${ekskulPhrase} sebagai sarana melatih keberanian ananda ${shortName}. Padukan dengan ketekunan belajar di kelas demi menggapai cita-cita luhur.`,
            ringkasan: 'Dorongan memupuk jiwa kepemimpinan, keberanian berekspresi, dan mental juara'
          },
          {
            id: 'v3-sub5',
            subNomor: '3.5',
            judulSub: 'Rangkuman Keseimbangan Potensi Diri',
            gaya: 'Gaya Ringkas Padat',
            text: `Ananda ${shortName} aktif memadukan prestasi belajar ${highMapel} dengan pengembangan potensi diri. Kembangkan terus bakatmu dengan percaya diri dan tetap disiplin di kelas.`,
            ringkasan: 'Catatan ringkas keterpaduan belajar akademik dan keaktifan bakat'
          }
        ]
      },

      // --- KATEGORI 4: PEMBIMBINGAN EDUKATIF, REFLEKSI & PENINGKATAN KOMITMEN (HOLISTIK PEMBINAAN) ---
      {
        id: 'v4' as const,
        nomor: 'Varian 4',
        kategori: 'Pembimbingan Edukatif & Peningkatan Komitmen',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
        deskripsiKategori: 'Bimbingan konstruktif dan motivasi ramah berdasarkan data kehadiran dan area yang perlu ditingkatkan',
        items: [
          {
            id: 'v4-sub1',
            subNomor: '4.1',
            judulSub: 'Bimbingan Kedisiplinan Kehadiran & Optimalisasi Waktu',
            gaya: 'Gaya Pembinaan Edukatif',
            text: isAbsenBanyak
              ? `Ananda ${shortName} berpotensi besar; di semester baru disarankan lebih menjaga kesehatan dan meningkatkan kehadiran tepat waktu agar pembelajaran berlangsung optimal.`
              : `Kedisiplinan kehadiran ananda ${shortName} di sekolah sangat baik. Pertahankan komitmen hadir dan keaktifan di kelas sebagai fondasi meraih prestasi lebih tinggi di semester depan.`,
            ringkasan: 'Bimbingan ramah terkait kedisiplinan presensi dan optimalisasi waktu belajar'
          },
          {
            id: 'v4-sub2',
            subNomor: '4.2',
            judulSub: 'Peningkatan Fokus & Daya Juang Belajar',
            gaya: 'Gaya Naratif Edukatif',
            text: lowMapel
              ? `Ananda ${shortName} unggul pada ${highMapel}; di semester baru luangkan waktu latihan mandiri pada ${lowMapel} agar pemahaman konsep semakin merata dan meningkat.`
              : `Ananda ${shortName} memiliki potensi besar; tingkatkan fokus dan jangan ragu bertanya di kelas agar penguasaan kompetensimu semakin mendalam di semester baru.`,
            ringkasan: 'Dorongan meningkatkan pemahaman materi dan keaktifan diskusi kelas'
          },
          {
            id: 'v4-sub3',
            subNomor: '4.3',
            judulSub: 'Refleksi Evaluatif Menuju Perbaikan Berkelanjutan',
            gaya: 'Gaya Reflektif Kemitraan',
            text: `Semester ini menjadi ruang pendewasaan berharga bagi ananda ${shortName}. Jadikan setiap proses belajar sebagai pijakan menyusun target baru bersama bimbingan guru dan orang tua.`,
            ringkasan: 'Refleksi evaluasi diri yang konstruktif dan membangun kemitraan belajar'
          },
          {
            id: 'v4-sub4',
            subNomor: '4.4',
            judulSub: 'Penanaman Rasa Percaya Diri & Potensi Tumbuh',
            gaya: 'Gaya Motivasi Afirmatif',
            text: `Percayalah pada potensi besar ananda ${shortName}. Bangkitkan rasa percaya diri dan teruslah berikhtiar; dengan ketekunan belajar, ananda pasti mampu meraih prestasi terbaik.`,
            ringkasan: 'Penanaman rasa percaya diri, daya juang, dan afirmasi potensi positif anak'
          },
          {
            id: 'v4-sub5',
            subNomor: '4.5',
            judulSub: 'Pesan Hangat & Harapan Kemajuan Semester Baru',
            gaya: 'Gaya Ringkas Ramah',
            text: `Tetaplah bersemangat, rendah hati, dan tekun belajar ananda ${shortName}. Rawat rasa ingin tahumu dan buktikan kemampuanmu meraih kemajuan gemilang di semester mendatang!`,
            ringkasan: 'Pesan afirmasi positif singkat, ramah, dan memotivasi'
          }
        ]
      }
    ];

    // Buat flat list dari 25 variasi agar dapat diputar secara berurutan / acak
    const flatSuggestions: Array<{
      id: string;
      kategoriId: 'v5' | 'v1' | 'v2' | 'v3' | 'v4';
      nomor: string;
      subNomor: string;
      kategori: string;
      judulSub: string;
      gaya: string;
      badge: string;
      icon: React.ReactNode;
      text: string;
      ringkasan: string;
      isMaster?: boolean;
    }> = [];

    categories.forEach(cat => {
      cat.items.forEach(item => {
        flatSuggestions.push({
          id: item.id,
          kategoriId: cat.id,
          nomor: cat.nomor,
          subNomor: item.subNomor,
          kategori: cat.kategori,
          judulSub: item.judulSub,
          gaya: item.gaya,
          badge: cat.badge,
          icon: cat.icon,
          text: item.text,
          ringkasan: item.ringkasan,
          isMaster: cat.isMaster
        });
      });
    });

    return {
      categories,
      flatSuggestions,
      masterParipurnaItems: categories.find(c => c.id === 'v5')?.items || []
    };
  };

  // Helper Indikator Keterbacaan & Ambang Batas Karakter Cetak PDF Rapor
  const getReadabilityBadge = (text: string) => {
    const len = (text || '').trim().length;
    if (len === 0) return null;
    if (len <= 180) {
      return {
        len,
        badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        dotClass: 'bg-emerald-500',
        label: `${len} karakter`,
        status: 'Optimal di PDF (~10pt)',
        isWarning: false
      };
    }
    if (len <= 230) {
      return {
        len,
        badgeClass: 'text-blue-700 bg-blue-50 border-blue-200',
        dotClass: 'bg-blue-500',
        label: `${len} karakter`,
        status: 'Aman di PDF (~9.5pt)',
        isWarning: false
      };
    }
    if (len <= 260) {
      return {
        len,
        badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
        dotClass: 'bg-amber-500',
        label: `${len} karakter`,
        status: 'Cukup Aman (~8.5-9pt)',
        isWarning: false
      };
    }
    return {
      len,
      badgeClass: 'text-rose-700 bg-rose-50 border-rose-200',
      dotClass: 'bg-rose-500',
      label: `${len} karakter`,
      status: 'Panjang (Font <8pt)',
      isWarning: true
    };
  };

  // Status apakah pernah disintesis sebelumnya
  const hasSynthesizedAnyCatatan = useMemo(() => {
    return siswa.some(s => (dataPendukung[s.id]?.catatanWaliKelas || '').trim().length > 0);
  }, [siswa, dataPendukung]);

  // Toggle kunci status catatan wali kelas per murid
  const handleToggleLockCatatanWali = (studentId: string) => {
    const currentLocked = !!lockedCatatanWali?.[studentId];
    const newLocked = !currentLocked;
    updateState('lockedCatatanWali', {
      ...lockedCatatanWali,
      [studentId]: newLocked
    });
    showToast(newLocked ? 'Catatan murid ini dikunci (terproteksi)' : 'Kunci catatan dibuka');
  };

  const handleApplyAISuggestion = (studentId: string, text: string, varianIndex?: number) => {
    if (lockedCatatanWali?.[studentId]) {
      showToast('Catatan murid ini terkunci. Buka kunci untuk menerapkan variasi baru.');
      return;
    }
    updateStudentCatatan(studentId, text);
    if (varianIndex !== undefined) {
      setCatatanWaliVariationIndex(prev => ({
        ...prev,
        [studentId]: varianIndex
      }));
    }
    setSelectedStudentForAI(null);
    showToast('Variasi catatan berhasil diterapkan!');
  };

  // Putar 25 variasi secara langsung (inline) per murid
  const handleCycleVariasiSatuan = (student: Siswa) => {
    if (lockedCatatanWali?.[student.id]) {
      showToast('Catatan murid ini terkunci. Buka kunci untuk memvariasikan.');
      return;
    }
    const { flatSuggestions } = generateAISuggestions(student);
    const currIdx = catatanWaliVariationIndex[student.id] ?? -1;
    const nextIdx = (currIdx + 1) % flatSuggestions.length;
    
    setCatatanWaliVariationIndex(prev => ({
      ...prev,
      [student.id]: nextIdx
    }));

    const selectedItem = flatSuggestions[nextIdx];
    updateStudentCatatan(student.id, selectedItem.text);
    showToast(`Variasi ${selectedItem.subNomor} (${selectedItem.gaya}) diterapkan untuk ${student.nama}`);
  };

  // Reset catatan per satuan murid
  const handleResetCatatanSatuan = (studentId: string, nama: string) => {
    if (lockedCatatanWali?.[studentId]) {
      showToast('Catatan murid ini terkunci. Buka kunci untuk mereset.');
      return;
    }
    updateStudentCatatan(studentId, '');
    setCatatanWaliVariationIndex(prev => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
    showToast(`Catatan ${nama} dikosongkan.`);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Teks disalin ke clipboard');
  };

  // Sintesis / Sintesis Ulang serentak 1 kelas (Mendistribusikan 25 sub-varian & melewati murid yang terkunci)
  const handleSintesisSemuaCatatanWali = () => {
    const updated = { ...dataPendukung };
    const newIdxMap = { ...catatanWaliVariationIndex };
    let processedCount = 0;
    let lockedCount = 0;

    siswa.forEach((s, sIdx) => {
      // 1. Lewati murid yang dikunci
      if (lockedCatatanWali?.[s.id]) {
        lockedCount++;
        return;
      }

      const current = updated[s.id] || {};
      const { masterParipurnaItems, flatSuggestions } = generateAISuggestions(s);
      
      let nextIdx: number;
      if (newIdxMap[s.id] !== undefined) {
        nextIdx = (newIdxMap[s.id] + 1) % flatSuggestions.length;
      } else {
        // Distribusi variasi awal 1-5 sub-varian Paripurna agar tidak kembar di satu kelas
        nextIdx = sIdx % masterParipurnaItems.length;
      }
      
      newIdxMap[s.id] = nextIdx;
      const targetText = flatSuggestions[nextIdx]?.text || masterParipurnaItems[0]?.text;

      current.catatanWaliKelas = targetText;
      updated[s.id] = current;
      processedCount++;
    });

    setCatatanWaliVariationIndex(newIdxMap);
    updateState('dataPendukung', updated);
    showToast(
      `${hasSynthesizedAnyCatatan ? 'Sintesis Ulang' : 'Sintesis'} Catatan Wali Kelas berhasil memvariasikan narasi untuk ${processedCount} murid` +
      (lockedCount > 0 ? ` (${lockedCount} murid terkunci dilewati)` : '')
    );
  };

  const handleClearAllNotes = () => {
    if (!confirm('Apakah Anda yakin ingin mengosongkan teks Catatan Wali Kelas untuk murid yang tidak terkunci? Data presensi dan catatan murid terkunci TIDAK akan terhapus.')) {
      return;
    }
    const updated = { ...dataPendukung };
    let resetCount = 0;
    let lockedCount = 0;

    siswa.forEach(s => {
      if (lockedCatatanWali?.[s.id]) {
        lockedCount++;
        return;
      }
      const current = updated[s.id] || {};
      updated[s.id] = {
        ...current,
        catatanWaliKelas: ''
      };
      resetCount++;
    });
    updateState('dataPendukung', updated);
    showToast(`Catatan Wali Kelas dikosongkan untuk ${resetCount} murid` + (lockedCount > 0 ? ` (${lockedCount} murid terkunci dipertahankan)` : ''));
  };

  const totalCatatanTerisi = siswa.filter(s => (dataPendukung[s.id]?.catatanWaliKelas || '').trim().length > 0).length;
  const totalCatatanKosong = siswa.length - totalCatatanTerisi;

  const filteredStudents = useMemo(() => {
    return siswa.filter(s => {
      const isFilled = (dataPendukung[s.id]?.catatanWaliKelas || '').trim().length > 0;
      if (filterStatus === 'filled' && !isFilled) return false;
      if (filterStatus === 'unfilled' && isFilled) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        s.nama.toLowerCase().includes(query) ||
        (s.nisn && s.nisn.includes(query)) ||
        (s.nis && s.nis.includes(query))
      );
    });
  }, [siswa, dataPendukung, filterStatus, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in-50 duration-300">
      
      {/* Toast Notifikasi */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Single Compact Header: Satu Baris Terpadu & Super Ramping */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Sisi Kiri: Judul + Segmented Filter Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-800 flex items-center whitespace-nowrap">
              Catatan Wali Kelas
            </h1>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Segmented Filter Pill (Navigasi Filter + Indikator Kelengkapan) */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200/60">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({siswa.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('unfilled')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                filterStatus === 'unfilled'
                  ? 'bg-white text-amber-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Belum Terisi ({totalCatatanKosong})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('filled')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                filterStatus === 'filled'
                  ? 'bg-white text-emerald-700 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sudah Terisi ({totalCatatanTerisi})
            </button>
          </div>
        </div>

        {/* Sisi Kanan: Aksi + Kotak Pencarian Sejajar */}
        <div className="flex flex-wrap items-center gap-2 justify-end flex-1 sm:flex-initial">
          {/* Tombol Sintesis / Sintesis Ulang */}
          <Tooltip 
            content={hasSynthesizedAnyCatatan ? "Sintesis ulang catatan seluruh murid 1 kelas (murid terkunci dilindungi)" : "Sintesis catatan wali kelas untuk seluruh murid (Sintesis 4 Pilar)"} 
            position="bottom"
          >
            <button
              type="button"
              onClick={handleSintesisSemuaCatatanWali}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{hasSynthesizedAnyCatatan ? 'Sintesis Ulang' : 'Sintesis'}</span>
            </button>
          </Tooltip>

          {/* Tombol Kosongkan / Reset */}
          {totalCatatanTerisi > 0 && (
            <Tooltip content="Kosongkan teks catatan wali kelas untuk murid yang tidak terkunci" position="bottom">
              <button
                type="button"
                onClick={handleClearAllNotes}
                className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                aria-label="Kosongkan catatan"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
              </button>
            </Tooltip>
          )}

          {/* Kotak Pencarian Ramping */}
          <div className="relative w-44 sm:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari murid..."
              className="w-full pl-8 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium"
            />
            {searchQuery && (
              <Tooltip content="Hapus pencarian" position="top">
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Bersihkan pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Tabel Data Catatan Wali Kelas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-17rem)] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 shadow-xs border-b border-slate-200">
              <tr className="bg-slate-100 text-slate-700 font-bold">
                <th className="py-3 px-3 text-center w-12 bg-slate-100">No</th>
                <th className="py-3 px-4 text-center w-72 bg-slate-100">Profil Murid & Capaian</th>
                <th className="py-3 px-4 text-center bg-slate-100">Narasi Catatan Wali Kelas</th>
                <th className="py-3 px-3 text-center w-64 min-w-[220px] bg-slate-100">Aksi & Putar Variasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Tidak ada murid yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const metric = studentMetrics[s.id];
                  const dp = dataPendukung[s.id] || {};
                  const isLocked = !!lockedCatatanWali?.[s.id];
                  const currentNote = dp.catatanWaliKelas || '';
                  const hasNote = currentNote.trim().length > 0;
                  const fourPillars = getStudentFourPillarsData(s.id);
                  const varIdx = catatanWaliVariationIndex[s.id];

                  return (
                    <tr key={s.id} className={`transition-colors ${isLocked ? 'bg-amber-50/20' : 'hover:bg-slate-50/70'}`}>
                      <td className="py-3 px-3 text-center font-medium text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          {s.fotoBase64 ? (
                            <img 
                              src={s.fotoBase64} 
                              alt={s.nama} 
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5" 
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs border border-slate-200 shrink-0 mt-0.5">
                              {s.nama.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{s.nama}</p>
                            <p className="text-[10px] font-mono text-slate-400">
                              NISN: {s.nisn || '-'} {s.nis ? `| NIS: ${s.nis}` : ''}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                Rata-rata: {metric?.average || 0}
                              </span>
                              {metric && metric.highestMapel !== 'Belum Ada' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 truncate max-w-[140px]" title={`Mapel Unggulan: ${metric.highestMapel}`}>
                                  ⭐ {metric.highestMapel}
                                </span>
                              )}
                              {fourPillars.ekskuls.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100 truncate max-w-[140px]" title={`Ekskul: ${fourPillars.ekskuls.map(e => e.nama).join(', ')}`}>
                                  🏆 {fourPillars.ekskuls[0].nama}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Kolom Narasi Catatan Wali Kelas */}
                      <td className="py-3 px-4">
                        <div className="relative">
                          <AutoResizeTextarea
                            minRows={3}
                            value={currentNote}
                            onChange={(e) => {
                              if (isLocked) {
                                showToast('Catatan murid ini terkunci. Buka kunci untuk mengedit.');
                                return;
                              }
                              updateStudentCatatan(s.id, e.target.value);
                            }}
                            readOnly={isLocked}
                            placeholder="Klik 'Sintesis' atau 'Variasi' untuk memunculkan catatan wali kelas..."
                            className={`w-full px-3 py-2 border rounded-xl text-xs leading-relaxed transition resize-y ${
                              isLocked
                                ? 'bg-slate-100/70 border-amber-300 text-slate-700 cursor-not-allowed'
                                : hasNote
                                  ? 'bg-white border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                                  : 'border-dashed border-slate-300 bg-slate-50/40 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500'
                            }`}
                          />
                          {isLocked ? (
                            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1">
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-0.5 shadow-2xs">
                                <Lock className="w-3 h-3 text-amber-700" /> Terkunci
                              </span>
                            </div>
                          ) : hasNote ? (
                            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1">
                              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5 shadow-2xs">
                                <Check className="w-3 h-3" /> Tersimpan
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {/* Indikator Keterbacaan & Jumlah Karakter untuk Cetak PDF */}
                        {(() => {
                          const readability = getReadabilityBadge(currentNote);
                          if (!readability) return null;
                          return (
                            <div className="flex items-center justify-between mt-1 px-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${readability.badgeClass}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${readability.dotClass}`} />
                                  <span>{readability.label}</span>
                                  <span className="opacity-40">•</span>
                                  <span>{readability.status}</span>
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 italic hidden sm:inline">
                                Target Ideal: 160–210 kar
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Kolom Aksi Terpadu: Kunci, Putar Variasi Inline, Pilihan Modal, Reset, Copy (1 Baris Rapi & Center) */}
                      <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1.5 flex-nowrap">
                          {/* 1. Tombol Kunci Satuan */}
                          <Tooltip content={isLocked ? "Buka kuncian catatan murid ini" : "Kunci catatan murid ini agar terlindungi saat Sintesis Ulang"} position="top">
                            <button
                              type="button"
                              onClick={() => handleToggleLockCatatanWali(s.id)}
                              className={`p-1.5 rounded-lg border transition cursor-pointer active:scale-95 shadow-2xs shrink-0 ${
                                isLocked 
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' 
                                  : 'bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200'
                              }`}
                              aria-label="Kunci Catatan"
                            >
                              {isLocked ? <Lock size={13} className="text-amber-700" /> : <Unlock size={13} />}
                            </button>
                          </Tooltip>

                          {/* 2. Tombol Putar 25 Variasi Narasi Inline */}
                          <Tooltip content={isLocked ? "Buka kunci terlebih dahulu untuk memvariasikan" : "Putar ke variasi narasi berikutnya"} position="top">
                            <button
                              type="button"
                              onClick={() => handleCycleVariasiSatuan(s)}
                              disabled={isLocked}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors border shadow-2xs shrink-0 whitespace-nowrap ${
                                isLocked 
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 active:scale-95 cursor-pointer'
                              }`}
                            >
                              <Shuffle size={12} />
                              <span>Variasi</span>
                            </button>
                          </Tooltip>

                          {/* 3. Tombol Buka Modal 25 Pilihan Lengkap */}
                          <Tooltip content={isLocked ? "Buka kunci terlebih dahulu" : "Buka asisten pilihan 25 variasi narasi lengkap"} position="top">
                            <button
                              type="button"
                              onClick={() => {
                                if (isLocked) {
                                  showToast('Catatan murid ini terkunci. Buka kunci untuk memvariasikan.');
                                  return;
                                }
                                setSelectedStudentForAI(s);
                              }}
                              disabled={isLocked}
                              className={`p-1.5 rounded-lg border transition cursor-pointer active:scale-95 shadow-2xs shrink-0 ${
                                isLocked
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                              }`}
                              aria-label="Pilih Variasi AI"
                            >
                              <Sparkles size={13} />
                            </button>
                          </Tooltip>

                          {/* 4. Tombol Reset Satuan */}
                          <Tooltip content="Kosongkan catatan murid ini" position="top">
                            <button
                              type="button"
                              onClick={() => handleResetCatatanSatuan(s.id, s.nama)}
                              disabled={isLocked || !hasNote}
                              className={`p-1.5 rounded-lg border transition shrink-0 ${
                                isLocked || !hasNote
                                  ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-slate-200 cursor-pointer active:scale-95'
                              }`}
                              aria-label="Reset Catatan"
                            >
                              <RotateCcw size={13} />
                            </button>
                          </Tooltip>

                          {/* 5. Tombol Salin */}
                          <Tooltip content="Salin narasi catatan murid ini" position="top">
                            <button
                              type="button"
                              onClick={() => handleCopyText(currentNote, s.id)}
                              disabled={!hasNote}
                              className={`p-1.5 rounded-lg border transition shrink-0 ${
                                !hasNote
                                  ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-slate-200 cursor-pointer active:scale-95'
                              }`}
                              aria-label="Salin Teks"
                            >
                              {copiedId === s.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ASISTEN SARAN CATATAN AI (5 VARIAN KOMPREHENSIF) */}
      {selectedStudentForAI && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-indigo-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
                  <Bot className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    Pilihan Variasi Catatan
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-indigo-950">
                      Sintesis 4 Pilar
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Pilih salah satu dari 5 variasi narasi untuk: <strong className="text-white">{selectedStudentForAI.nama}</strong>
                  </p>
                </div>
              </div>
              <Tooltip content="Tutup jendela variasi" position="left">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForAI(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                  aria-label="Tutup modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5">
              
              {/* Profil Konteks 4 Pilar Murid */}
              {(() => {
                const data4P = getStudentFourPillarsData(selectedStudentForAI.id);
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center gap-1 text-slate-500 font-medium text-[10px]">
                        <BookOpen className="w-3 h-3 text-indigo-600" />
                        <span>1. Intrakurikuler</span>
                      </div>
                      <p className="font-bold text-slate-800 mt-0.5 truncate" title={`Rata-rata: ${data4P.metric.average} (${data4P.metric.highestMapel})`}>
                        Rerata: {data4P.metric.average} <span className="font-normal text-slate-500 text-[10px]">({data4P.metric.highestMapel.replace(/\s*\(\d+\)$/, '')})</span>
                      </p>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center gap-1 text-slate-500 font-medium text-[10px]">
                        <Compass className="w-3 h-3 text-blue-600" />
                        <span>2. Kokurikuler</span>
                      </div>
                      <p className="font-bold text-slate-800 mt-0.5 truncate" title={data4P.strongDimensi.length > 0 ? `Dimensi: ${data4P.strongDimensi.join(', ')}` : 'Dimensi Berkembang'}>
                        {data4P.strongDimensi.length > 0 ? data4P.strongDimensi[0] : (data4P.projectThemes[0] || 'Karakter Baik')}
                      </p>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center gap-1 text-slate-500 font-medium text-[10px]">
                        <Medal className="w-3 h-3 text-purple-600" />
                        <span>3. Ekstrakurikuler</span>
                      </div>
                      <p className="font-bold text-slate-800 mt-0.5 truncate" title={data4P.ekskuls.length > 0 ? data4P.ekskuls.map(e => `${e.nama} (${e.predikat})`).join(', ') : 'Pengembangan Diri'}>
                        {data4P.ekskuls.length > 0 ? `${data4P.ekskuls[0].nama} (${data4P.ekskuls[0].predikat})` : 'Aktif Ekskul'}
                      </p>
                    </div>

                    <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center gap-1 text-slate-500 font-medium text-[10px]">
                        <CalendarCheck2 className="w-3 h-3 text-emerald-600" />
                        <span>4. Kehadiran</span>
                      </div>
                      <p className="font-bold text-slate-800 mt-0.5 truncate">
                        {data4P.kehadiran.totalAbsen === 0 
                          ? <span className="text-emerald-700">Hadir Penuh (0 Absen)</span> 
                          : `S:${data4P.kehadiran.sakit}, I:${data4P.kehadiran.izin}, A:${data4P.kehadiran.alpa}`}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Navigasi Tab Kategori Variasi (5 Kategori x 5 Sub-Varian) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalCategoryTab('v5')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    modalCategoryTab === 'v5'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-200" />
                  <span>Varian 5: Paripurna (5)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalCategoryTab('v1')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    modalCategoryTab === 'v1'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Varian 1: Prestasi Belajar (5)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalCategoryTab('v2')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    modalCategoryTab === 'v2'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Varian 2: Karakter & Budi (5)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalCategoryTab('v3')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    modalCategoryTab === 'v3'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Medal className="w-3.5 h-3.5 text-purple-200" />
                  <span>Varian 3: Talenta & Minat (5)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalCategoryTab('v4')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    modalCategoryTab === 'v4'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-blue-200" />
                  <span>Varian 4: Pembimbingan (5)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalCategoryTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    modalCategoryTab === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Semua (25)</span>
                </button>
              </div>

              {/* List Sub-Variasi Narasi Sesuai Tab Aktif */}
              <div className="space-y-3">
                {(() => {
                  const { categories, flatSuggestions } = generateAISuggestions(selectedStudentForAI);
                  
                  if (modalCategoryTab === 'all') {
                    return flatSuggestions.map((item, flatIdx) => (
                      <div 
                        key={item.id} 
                        className={`p-3.5 sm:p-4 rounded-xl border transition-all shadow-2xs space-y-2 group ${
                          item.isMaster
                            ? 'border-amber-300 bg-amber-50/20 ring-1 ring-amber-500/20'
                            : 'border-slate-200 hover:border-indigo-200 bg-white hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${item.badge}`}>
                              {item.icon}
                              {item.subNomor}: {item.judulSub}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded bg-slate-100 shrink-0 hidden sm:inline-block">
                              {item.gaya}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Tooltip content="Salin teks narasi ke clipboard" position="top">
                              <button
                                type="button"
                                onClick={() => handleCopyText(item.text, item.id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                              >
                                {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                                <span className="text-[11px]">{copiedId === item.id ? 'Tersalin' : 'Salin'}</span>
                              </button>
                            </Tooltip>
                            <button
                              type="button"
                              onClick={() => handleApplyAISuggestion(selectedStudentForAI.id, item.text, flatIdx)}
                              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer active:scale-95 ${
                                item.isMaster
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Terapkan</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                          "{item.text}"
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="italic">ℹ️ {item.ringkasan}</span>
                          {(() => {
                            const r = getReadabilityBadge(item.text);
                            if (!r) return null;
                            return (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border ${r.badgeClass}`}>
                                <span className={`w-1 h-1 rounded-full ${r.dotClass}`} />
                                <span>{r.len} kar • {r.status}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    ));
                  }

                  const activeCat = categories.find(c => c.id === modalCategoryTab) || categories[0];
                  return activeCat.items.map((subItem, sIdx) => {
                    const flatIdx = flatSuggestions.findIndex(f => f.id === subItem.id);
                    return (
                      <div 
                        key={subItem.id} 
                        className={`p-3.5 sm:p-4 rounded-xl border transition-all shadow-2xs space-y-2 group ${
                          activeCat.isMaster
                            ? 'border-indigo-300 bg-gradient-to-br from-indigo-50/60 via-white to-amber-50/40 ring-1 ring-indigo-500/20'
                            : 'border-slate-200 hover:border-indigo-200 bg-white hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${activeCat.badge}`}>
                              {activeCat.icon}
                              {subItem.subNomor}: {subItem.judulSub}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 hidden sm:inline-block">
                              {subItem.gaya}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Tooltip content="Salin teks narasi ke clipboard" position="top">
                              <button
                                type="button"
                                onClick={() => handleCopyText(subItem.text, subItem.id)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                              >
                                {copiedId === subItem.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                                <span className="text-[11px]">{copiedId === subItem.id ? 'Tersalin' : 'Salin'}</span>
                              </button>
                            </Tooltip>
                            <button
                              type="button"
                              onClick={() => handleApplyAISuggestion(selectedStudentForAI.id, subItem.text, flatIdx >= 0 ? flatIdx : sIdx)}
                              className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer active:scale-95 ${
                                activeCat.isMaster
                                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                                  : 'bg-slate-800 hover:bg-slate-900 text-white'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Terapkan</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                          "{subItem.text}"
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="italic">ℹ️ {subItem.ringkasan}</span>
                          {(() => {
                            const r = getReadabilityBadge(subItem.text);
                            if (!r) return null;
                            return (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border ${r.badgeClass}`}>
                                <span className={`w-1 h-1 rounded-full ${r.dotClass}`} />
                                <span>{r.len} kar • {r.status}</span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="flex items-center gap-1 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Sintesis 4 Pilar: Intrakurikuler, Kokurikuler, Ekstrakurikuler & Kehadiran
              </span>
              <button
                type="button"
                onClick={() => setSelectedStudentForAI(null)}
                className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
