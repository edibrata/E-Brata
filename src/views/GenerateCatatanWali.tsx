import { useState, useMemo } from 'react';
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
  CalendarCheck2
} from 'lucide-react';
import { Siswa } from '@/types';

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
    dataPendukung = {} 
  } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unfilled' | 'filled'>('all');
  const [selectedStudentForAI, setSelectedStudentForAI] = useState<Siswa | null>(null);
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

  // Generator 5 Variasi Catatan AI Berbasis Sintesis 4 Pilar
  const generateAISuggestions = (student: Siswa) => {
    const { metric, ekskuls, strongDimensi, projectThemes, kehadiran } = getStudentFourPillarsData(student.id);
    const nama = student.nama;
    const avg = metric.average;
    const highMapel = metric.highestMapel !== 'Belum Ada' ? metric.highestMapel.replace(/\s*\(\d+\)$/, '') : 'mata pelajaran utama';
    
    // Data ekskul
    const mainEkskul = ekskuls.length > 0 ? ekskuls[0] : null;
    const ekskulPhrase = mainEkskul 
      ? `kegiatan ekstrakurikuler ${mainEkskul.nama} dengan predikat ${mainEkskul.predikat}` 
      : 'berbagai kegiatan ekstrakurikuler dan pengembangan minat bakat di sekolah';

    // Data kokurikuler (karakter & profil lulusan)
    const temaStr = projectThemes.length > 0 ? `tema "${projectThemes[0]}"` : 'pembelajaran Kokurikuler';
    const dimensiStr = strongDimensi.length > 0 
      ? `dimensi ${strongDimensi.slice(0, 2).join(' dan ')}`
      : 'kemandirian, gotong royong, dan nalar kritis';

    // --- VARIAN 1: Apresiasi Akademik & Disiplin Belajar (Intrakurikuler & Kehadiran) ---
    const textVarian1 = avg >= 80
      ? (kehadiran.totalAbsen === 0
        ? `Selamat atas pencapaian prestasi ananda ${nama} yang sangat membanggakan di semester ini, khususnya keunggulan pada bidang ${highMapel}. Didukung kedisiplinan hadir penuh di kelas, ketekunanmu patut menjadi teladan bagi rekan-rekan sekelas.`
        : `Ananda ${nama} meraih pencapaian belajar yang sangat baik di semester ini, terutama pada mata pelajaran ${highMapel}. Pertahankan ketekunan ini dan terus rawat semangat belajarmu untuk mempertahankan prestasi gemilang.`)
      : (kehadiran.totalAbsen > 3
        ? `Ananda ${nama} menunjukkan kemajuan belajar yang positif pada mata pelajaran ${highMapel}. Tingkatkan konsistensi kehadiran dan keaktifan di kelas pada semester mendatang agar pemahaman materi semakin optimal.`
        : `Ananda ${nama} menunjukkan proses belajar yang tekun dan bersungguh-sungguh. Terus pupuk rasa ingin tahu dan jangan ragu untuk aktif berdiskusi di kelas demi meraih capaian kompetensi yang semakin tinggi.`);

    // --- VARIAN 2: Penguatan Karakter & Kokurikuler (Dimensi Profil Lulusan) ---
    const textVarian2 = `Melalui pelaksanaan pembelajaran Kokurikuler ${temaStr}, ananda ${nama} menunjukkan perkembangan karakter yang sangat baik, khususnya pada ${dimensiStr}. Sikap santun, kepedulian sosial, dan tanggung jawab yang ditunjukkan menjadi bukti nyata terbentuknya profil pelajar yang berakhlak mulia.`;

    // --- VARIAN 3: Minat Bakat & Ekstrakurikuler ---
    const textVarian3 = mainEkskul
      ? `Ananda ${nama} menunjukkan antusiasme dan komitmen yang membanggakan dalam mengasah potensi non-akademik melalui ${ekskulPhrase}. Keterlibatan aktif ini turut menumbuhkan jiwa sportivitas, kepercayaan diri, dan kepemimpinan yang berharga.`
      : `Ananda ${nama} memiliki minat dan energi positif yang sangat baik di luar ruang kelas. Terus kembangkan potensi diri, kreativitas, dan kepemimpinan melalui kegiatan ekstrakurikuler serta pembiasaan positif di sekolah.`;

    // --- VARIAN 4: Pembinaan, Refleksi & Motivasi Masa Depan ---
    const textVarian4 = kehadiran.totalAbsen > 3
      ? `Ananda ${nama} adalah pribadi yang cerdas dan berpotensi besar. Di semester mendatang, fokuskan perhatian untuk menjaga kesehatan dan meningkatkan kedisiplinan kehadiran di sekolah agar seluruh materi pembelajaran dapat diserap secara menyeluruh dan bermakna.`
      : `Pertahankan semangat belajar dan sikap positif yang telah ananda ${nama} tunjukkan sepanjang semester ini. Jadikan setiap tantangan belajar baru sebagai peluang untuk semakin mandiri, bernalar kritis, dan menggapai prestasi terbaik.`;

    // --- VARIAN 5: Kompilasi Paripurna (Cerdas & Menyeluruh — Sintesis 4 Pilar) ---
    const intraOpening = avg >= 80
      ? `Ananda ${nama} menunjukkan pencapaian akademik yang membanggakan di semester ini, terutama pada penguasaan bidang ${highMapel}.`
      : `Ananda ${nama} menunjukkan perkembangan belajar yang konsisten dan positif, dengan antusiasme tinggi pada bidang ${highMapel}.`;

    const kokuBridge = `Dalam kegiatan Kokurikuler ${temaStr}, ananda membuktikan kematangan karakter nyata melalui penguatan ${dimensiStr}.`;

    const ekstraBridge = mainEkskul
      ? `Potensi tersebut kian lengkap dengan keaktifannya pada ${ekskulPhrase}.`
      : `Keaktifan belajarnya juga berpadu harmonis dengan partisipasi aktif dalam kegiatan pengembangan diri dan minat bakat.`;

    const hadirClosing = kehadiran.totalAbsen === 0
      ? `Dengan komitmen kedisiplinan dan kehadiran penuh 100%, Ibu/Bapak Guru yakin ananda akan terus tumbuh menjadi pribadi berprestasi dan berkarakter mulia di masa depan.`
      : kehadiran.totalAbsen <= 3
        ? `Didukung kedisiplinan presensi yang terjaga baik, teruslah melangkah dengan penuh percaya diri dan rendah hati menyongsong semester berikutnya.`
        : `Dengan meningkatkan komitmen kedisiplinan kehadiran di semester depan, Ibu/Bapak Guru optimis potensi besar ananda akan berkembang semakin gemilang.`;

    const textVarian5 = `${intraOpening} ${kokuBridge} ${ekstraBridge} ${hadirClosing}`;

    return [
      {
        id: 'v1',
        nomor: 'Varian 1',
        kategori: 'Apresiasi Akademik & Presensi',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <Award className="w-4 h-4 text-emerald-600" />,
        text: textVarian1,
        ringkasan: 'Fokus capaian intrakurikuler & komitmen kedisiplinan kelas'
      },
      {
        id: 'v2',
        nomor: 'Varian 2',
        kategori: 'Karakter & Profil Lulusan (Kokurikuler)',
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: <Compass className="w-4 h-4 text-indigo-600" />,
        text: textVarian2,
        ringkasan: 'Fokus dimensi karakter nyata & kegiatan Kokurikuler'
      },
      {
        id: 'v3',
        nomor: 'Varian 3',
        kategori: 'Minat Bakat & Ekstrakurikuler',
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: <Medal className="w-4 h-4 text-purple-600" />,
        text: textVarian3,
        ringkasan: 'Fokus talenta, keaktifan ekskul & jiwa kepemimpinan'
      },
      {
        id: 'v4',
        nomor: 'Varian 4',
        kategori: 'Pembinaan & Motivasi Masa Depan',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
        text: textVarian4,
        ringkasan: 'Fokus pembinaan kedisiplinan, refleksi diri & dorongan ke depan'
      },
      {
        id: 'v5',
        nomor: 'Varian 5',
        kategori: 'Kompilasi Paripurna (Sintesis 4 Pilar)',
        badge: 'bg-gradient-to-r from-amber-100 to-indigo-100 text-indigo-950 border-amber-300 font-bold',
        icon: <Crown className="w-4 h-4 text-amber-600" />,
        text: textVarian5,
        ringkasan: 'Sintesis cerdas terpadu 4 pilar: Akademik, Kokurikuler, Ekskul, dan Presensi',
        isMaster: true
      }
    ];
  };

  const handleApplyAISuggestion = (studentId: string, text: string) => {
    updateStudentCatatan(studentId, text);
    setSelectedStudentForAI(null);
    showToast('Catatan AI berhasil diterapkan!');
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Teks disalin ke clipboard');
  };

  // Isi serentak catatan yang masih kosong dengan Varian 5 (Kompilasi Cerdas 4 Pilar)
  const handleFillBatchDefault = () => {
    const updated = { ...dataPendukung };
    let count = 0;
    siswa.forEach(s => {
      const current = updated[s.id] || {};
      if (!current.catatanWaliKelas || !current.catatanWaliKelas.trim()) {
        const suggestions = generateAISuggestions(s);
        const masterVarian = suggestions.find(sug => sug.id === 'v5') || suggestions[0];
        current.catatanWaliKelas = masterVarian.text;
        updated[s.id] = current;
        count++;
      }
    });
    updateState('dataPendukung', updated);
    showToast(`${count} Catatan Wali Kelas berhasil digenerate dengan Sintesis Komprehensif 4 Pilar!`);
  };

  const handleClearAllNotes = () => {
    if (!confirm('Apakah Anda yakin ingin mengosongkan semua teks Catatan Wali Kelas? Data presensi/kehadiran TIDAK akan terhapus.')) {
      return;
    }
    const updated = { ...dataPendukung };
    siswa.forEach(s => {
      const current = updated[s.id] || {};
      updated[s.id] = {
        ...current,
        catatanWaliKelas: ''
      };
    });
    updateState('dataPendukung', updated);
    showToast('Semua Catatan Wali Kelas telah dikosongkan.');
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
          {/* Tombol Isi Serentak */}
          <button
            type="button"
            onClick={handleFillBatchDefault}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95 whitespace-nowrap"
            title="Generate narasi otomatis untuk seluruh murid yang catatannya masih kosong (Sintesis 4 Pilar)"
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Isi Serentak Catatan Kosong</span>
          </button>

          {/* Tombol Kosongkan / Reset */}
          {totalCatatanTerisi > 0 && (
            <button
              type="button"
              onClick={handleClearAllNotes}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
              title="Kosongkan seluruh teks catatan wali kelas"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
            </button>
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
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabel Data Catatan Wali Kelas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-4 w-72">Profil Murid & Capaian</th>
                <th className="py-3 px-4">Narasi Catatan Wali Kelas</th>
                <th className="py-3 px-4 text-center w-36">Saran AI</th>
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
                  const hasNote = (dp.catatanWaliKelas || '').trim().length > 0;
                  const fourPillars = getStudentFourPillarsData(s.id);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
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
                          <textarea
                            rows={3}
                            value={dp.catatanWaliKelas || ''}
                            onChange={(e) => updateStudentCatatan(s.id, e.target.value)}
                            placeholder="Ketik catatan rapor di sini, atau klik tombol 'Saran AI' di sebelah kanan untuk memilih narasi kurikulum merdeka..."
                            className={`w-full px-3 py-2 border rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white resize-y transition ${
                              hasNote ? 'border-slate-200 text-slate-800' : 'border-dashed border-amber-300 bg-amber-50/10 placeholder:text-slate-400'
                            }`}
                          />
                          {hasNote && (
                            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1">
                              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> Tersimpan
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Tombol Aksi Saran AI */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForAI(s)}
                          className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer active:scale-95 group"
                          title="Buka Rekomendasi Catatan Cerdas AI (5 Varian)"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
                          <span>Saran AI</span>
                        </button>
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
                    Asisten Catatan AI
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-indigo-950">
                      Sintesis 4 Pilar
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Saran narasi Kurikulum Merdeka untuk: <strong className="text-white">{selectedStudentForAI.nama}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForAI(null)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
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

              <div className="flex items-center justify-between text-xs pt-1">
                <p className="font-bold text-slate-700">
                  Pilih salah satu dari 5 rekomendasi narasi di bawah ini:
                </p>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Varian 1–4 Tematik • Varian 5 Paripurna
                </span>
              </div>

              {/* List 5 Rekomendasi Narasi AI */}
              <div className="space-y-3">
                {generateAISuggestions(selectedStudentForAI).map((sug) => (
                  <div 
                    key={sug.id} 
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all shadow-2xs space-y-2 group ${
                      sug.isMaster
                        ? 'border-indigo-300 bg-gradient-to-br from-indigo-50/60 via-white to-amber-50/40 ring-1 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-indigo-200 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${sug.badge}`}>
                          {sug.icon}
                          {sug.nomor}: {sug.kategori}
                        </span>
                        {sug.isMaster && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.2 rounded-full bg-amber-400 text-amber-950 shrink-0 hidden sm:inline-block">
                            ⭐ Paling Direkomendasikan
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyText(sug.text, sug.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                          title="Salin teks narasi"
                        >
                          {copiedId === sug.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                          <span className="text-[11px]">{copiedId === sug.id ? 'Tersalin' : 'Salin'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyAISuggestion(selectedStudentForAI.id, sug.text)}
                          className={`px-3 py-1 rounded-lg font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer active:scale-95 ${
                            sug.isMaster
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
                      "{sug.text}"
                    </p>

                    <p className="text-[10px] text-slate-400 italic">
                      ℹ️ {sug.ringkasan}
                    </p>
                  </div>
                ))}
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
