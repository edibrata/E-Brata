import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { 
  Sparkles, 
  Users, 
  Search, 
  Check, 
  MessageSquareQuote, 
  Bot, 
  Flame, 
  Heart, 
  Award, 
  TrendingUp, 
  AlertCircle,
  X,
  Copy,
  Trash2,
  Filter,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { Siswa, DataPendukungSiswa } from '@/types';

export default function GenerateCatatanWali() {
  const { state, updateState } = useAppStore();
  const { siswa, mapel, nilai, dataPendukung = {} } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unfilled' | 'filled'>('all');
  const [selectedStudentForAI, setSelectedStudentForAI] = useState<Siswa | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Helper perhitungan nilai per murid untuk memberikan konteks akurat ke AI
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

  // Update Catatan Wali Kelas saja tanpa mengubah data presensi kehadiran
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

  // Generate 4 Variasi Catatan AI berdasarkan Profil Asli Murid
  const generateAISuggestions = (student: Siswa) => {
    const metric = studentMetrics[student.id] || { average: 75, highestMapel: '-', lowestMapel: '-' };
    const dp = dataPendukung[student.id] || {};
    const totalAbsen = (dp.sakit || 0) + (dp.izin || 0) + (dp.alpa || 0);
    const avg = metric.average;
    const nama = student.nama;

    const list = [
      {
        kategori: 'Apresiasi Prestasi & Dedikasi',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <Award className="w-4 h-4 text-emerald-600" />,
        text: avg >= 80 
          ? `Selamat atas pencapaian prestasi ananda ${nama} yang sangat membanggakan di semester ini. Pertahankan ketekunan, rasa ingin tahu yang tinggi, dan teruslah menjadi inspirasi positif bagi rekan-rekan di kelas.`
          : `Ananda ${nama} menunjukkan kemajuan belajar yang sangat positif dan konsisten. Tingkatkan terus keaktifan dalam berdiskusi serta eksplorasi bakat untuk meraih prestasi yang semakin gemilang.`
      },
      {
        kategori: 'Motivasi Belajar & Kemandirian',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
        text: `Pertahankan semangat belajarmu, ananda ${nama}. Tingkatkan fokus dalam memahami materi yang menantang dan jangan ragu untuk bertanya kepada guru maupun teman sebaya. Ibu/Bapak Guru yakin potensimu akan terus berkembang pesat.`
      },
      {
        kategori: 'Karakter, Adab & Gotong Royong',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon: <Heart className="w-4 h-4 text-indigo-600" />,
        text: `Ananda ${nama} memiliki kepribadian yang santun, ramah, dan senang bekerja sama dengan teman-temannya di kelas. Tetaplah menjadi pribadi yang berakhlak mulia, rendah hati, dan senantiasa peduli terhadap lingkungan sekitar.`
      },
      {
        kategori: totalAbsen > 3 ? 'Kedisiplinan & Kehadiran' : 'Eksplorasi Minat & Bakat',
        badge: totalAbsen > 3 ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-purple-100 text-purple-800 border-purple-200',
        icon: totalAbsen > 3 ? <AlertCircle className="w-4 h-4 text-amber-600" /> : <Flame className="w-4 h-4 text-purple-600" />,
        text: totalAbsen > 3
          ? `Ananda ${nama} memiliki potensi akademik yang sangat baik. Mohon tingkatkan kembali kedisiplinan kehadiran di sekolah pada semester berikutnya agar seluruh rangkaian kegiatan pembelajaran dapat diikuti secara optimal.`
          : `Ananda ${nama} aktif berpartisipasi dalam berbagai kegiatan sekolah. Terus kembangkan minat, bakat, serta literasi membaca melalui pembiasaan positif di sekolah maupun di rumah.`
      }
    ];

    return list;
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

  // Isi serentak catatan yang masih kosong dengan rekomendasi AI otomatis
  const handleFillBatchDefault = () => {
    const updated = { ...dataPendukung };
    let count = 0;
    siswa.forEach(s => {
      const current = updated[s.id] || {};
      if (!current.catatanWaliKelas || !current.catatanWaliKelas.trim()) {
        const metric = studentMetrics[s.id];
        current.catatanWaliKelas = metric && metric.average >= 80
          ? `Selamat atas pencapaian belajar ananda ${s.nama} yang sangat baik di semester ini. Pertahankan ketekunan, rasa ingin tahu yang tinggi, dan akhlak mulia dalam segala kegiatan pembelajaran.`
          : `Pertahankan semangat belajarmu, ananda ${s.nama}. Tingkatkan terus motivasi, keaktifan belajar, dan akhlak mulia dalam setiap aktivitas di sekolah.`;
        updated[s.id] = current;
        count++;
      }
    });
    updateState('dataPendukung', updated);
    showToast(`${count} Catatan Wali Kelas berhasil digenerate otomatis!`);
  };

  const handleClearAllNotes = () => {
    if (!confirm('Apakah Anda yakin ingin mengosongkan semua narasi Catatan Wali Kelas? Data presensi/kehadiran TIDAK akan terhapus.')) {
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
  const progressPercent = siswa.length > 0 ? Math.round((totalCatatanTerisi / siswa.length) * 100) : 0;

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

      {/* Header Panel Utama */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Generate Catatan Wali Kelas
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Bot className="w-3.5 h-3.5" /> AI Powered
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Penyusunan narasi Catatan Wali Kelas rapor secara personal dengan bantuan Asisten Cerdas Kurikulum Merdeka.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleFillBatchDefault}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
            title="Generate narasi otomatis untuk seluruh murid yang catatannya masih kosong"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Isi Serentak Catatan Kosong</span>
          </button>
          
          {totalCatatanTerisi > 0 && (
            <button
              type="button"
              onClick={handleClearAllNotes}
              className="px-3 py-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Kosongkan seluruh teks catatan wali kelas"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500" />
              <span>Kosongkan</span>
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan Statistik & Status Kelengkapan */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Murid Kelas</p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{siswa.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Catatan Sudah Terisi</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">
              {totalCatatanTerisi} <span className="text-xs font-normal text-slate-400">murid</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Catatan Belum Terisi</p>
            <h3 className={`text-2xl font-black mt-0.5 ${totalCatatanKosong > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {totalCatatanKosong} <span className="text-xs font-normal text-slate-400">murid</span>
            </h3>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <MessageSquareQuote className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span>Progres Kelengkapan</span>
            <span className="font-bold text-indigo-700">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Table Toolbar & Filtering */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama murid / NISN..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium"
              />
            </div>
            
            {/* Filter Status */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-md transition ${filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Semua ({siswa.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('unfilled')}
                className={`px-3 py-1.5 rounded-md transition ${filterStatus === 'unfilled' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Belum ({totalCatatanKosong})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('filled')}
                className={`px-3 py-1.5 rounded-md transition ${filterStatus === 'filled' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Selesai ({totalCatatanTerisi})
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Menampilkan <span className="font-bold text-slate-800">{filteredStudents.length}</span> murid
          </div>
        </div>

        {/* Tabel Catatan Wali Kelas (Tanpa Isian Kehadiran) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[240px]">Peserta Didik</th>
                <th className="py-3 px-4 min-w-[420px]">
                  <div className="flex items-center justify-between">
                    <span>Catatan Wali Kelas</span>
                    <span className="text-[10px] font-medium text-slate-500">
                      Dapat diedit langsung atau pilih narasi AI
                    </span>
                  </div>
                </th>
                <th className="py-3 px-4 w-32 text-center">Aksi AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Tidak ada peserta didik yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const dp = dataPendukung[s.id] || {};
                  const metric = studentMetrics[s.id];
                  const hasNote = (dp.catatanWaliKelas || '').trim().length > 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-500 font-bold">
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
                          title="Buka Rekomendasi Catatan AI"
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

      {/* MODAL ASISTEN SARAN CATATAN AI */}
      {selectedStudentForAI && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-900 text-white p-5 flex items-center justify-between border-b border-indigo-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs border border-white/20">
                  <Bot className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    Asisten Catatan AI
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-indigo-950">
                      Rekomendasi Cerdas
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
            <div className="p-6 overflow-y-auto space-y-4">
              
              {/* Profil Analitik Murid (Sebagai Konteks) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-500 font-medium">Rata-rata Nilai:</span>
                  <span className="font-bold text-slate-800">{studentMetrics[selectedStudentForAI.id]?.average || 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Mapel Tertinggi:</span>
                  <span className="font-bold text-indigo-700">{studentMetrics[selectedStudentForAI.id]?.highestMapel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Data Kehadiran:</span>
                  <span className="font-bold text-slate-700">
                    {(() => {
                      const dp = dataPendukung[selectedStudentForAI.id] || {};
                      const s = dp.sakit || 0;
                      const i = dp.izin || 0;
                      const a = dp.alpa || 0;
                      const total = s + i + a;
                      return total === 0 ? 'Hadir Penuh (0 Absen)' : `S:${s}, I:${i}, A:${a} (${total} hari)`;
                    })()}
                  </span>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-600">
                Pilih rekomendasi narasi terbaik yang mencerminkan profil karakter dan capaian murid:
              </p>

              {/* List 4 Pilihan Saran AI */}
              <div className="space-y-3">
                {generateAISuggestions(selectedStudentForAI).map((sug, i) => (
                  <div 
                    key={i} 
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/20 transition-all shadow-xs space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${sug.badge}`}>
                        {sug.icon}
                        {sug.kategori}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyText(sug.text, `sug_${i}`)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                          title="Salin teks narasi"
                        >
                          {copiedId === `sug_${i}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                          <span className="text-[11px]">{copiedId === `sug_${i}` ? 'Tersalin' : 'Salin'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyAISuggestion(selectedStudentForAI.id, sug.text)}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Terapkan</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                      "{sug.text}"
                    </p>
                  </div>
                ))}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Kurikulum Merdeka • Penilaian Karakter & Akademik</span>
              <button
                type="button"
                onClick={() => setSelectedStudentForAI(null)}
                className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
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
