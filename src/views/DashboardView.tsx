import { useMemo } from 'react';
import { useAppStore } from '@/store';
import { 
  School, 
  Users, 
  BookOpen, 
  Activity, 
  CheckCircle2, 
  Award, 
  Lightbulb,
  ArrowRight,
  MapPin,
  GraduationCap,
  AlertTriangle,
  Info,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  Sparkles,
  HeartHandshake
} from 'lucide-react';

interface DashboardViewProps {
  onOpenDevProfile?: () => void;
  onNavigate?: (view: string) => void;
}

export default function DashboardView({ onOpenDevProfile, onNavigate }: DashboardViewProps) {
  const { state } = useAppStore();
  const { sekolah, siswa, mapel, nilai, tujuanPembelajaran, dataPendukung = {} } = state;
  const totalSiswa = siswa?.length || 0;
  const totalMapel = mapel?.length || 0;

  const isSetupComplete = Boolean(
    sekolah.nama && 
    sekolah.npsn && 
    sekolah.kepsek?.trim() &&
    sekolah.nipKepsek?.trim() &&
    (sekolah.waKepalaSekolah?.trim() || (sekolah as any)?.waKepsek?.trim()) &&
    sekolah.waliKelas?.trim() &&
    sekolah.nipWaliKelas?.trim() &&
    (sekolah.waGuru?.trim() || (sekolah as any)?.waWaliKelas?.trim())
  );
  
  const isMuridAda = totalSiswa > 0;

  // Analitik & Statistik Kelas Komprehensif
  const classAnalytics = useMemo(() => {
    if (!totalSiswa || !totalMapel) {
      return {
        classAverage: 0,
        mapelAverages: [],
        predikatCounts: { sangatBaik: 0, baik: 0, cukup: 0, perluBimbingan: 0 },
        ketuntasanRate: 0,
        topStudents: [],
        needAttentionStudents: []
      };
    }

    const studentAverages: { student: typeof siswa[0]; avg: number }[] = [];
    const mapelStats: Record<string, { total: number; count: number }> = {};

    mapel.forEach(m => {
      mapelStats[m.id] = { total: 0, count: 0 };
    });

    let totalClassScores = 0;
    let totalScoreEntries = 0;
    let totalPassingEntries = 0;

    const predikatCounts = {
      sangatBaik: 0, // >= 85
      baik: 0,       // 75 - 84
      cukup: 0,      // 70 - 74
      perluBimbingan: 0 // < 70
    };

    siswa.forEach(s => {
      let sTotal = 0;
      let sCount = 0;

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
            sTotal += finalScore;
            sCount++;
            mapelStats[m.id].total += finalScore;
            mapelStats[m.id].count += 1;

            totalClassScores += finalScore;
            totalScoreEntries++;

            const kktp = m.kktp || 70;
            if (finalScore >= kktp) {
              totalPassingEntries++;
            }

            if (finalScore >= 85) predikatCounts.sangatBaik++;
            else if (finalScore >= 75) predikatCounts.baik++;
            else if (finalScore >= 70) predikatCounts.cukup++;
            else predikatCounts.perluBimbingan++;
          }
        }
      });

      const sAvg = sCount > 0 ? Math.round(sTotal / sCount) : 0;
      if (sCount > 0) {
        studentAverages.push({ student: s, avg: sAvg });
      }
    });

    const classAverage = totalScoreEntries > 0 ? Math.round(totalClassScores / totalScoreEntries) : 0;
    const ketuntasanRate = totalScoreEntries > 0 ? Math.round((totalPassingEntries / totalScoreEntries) * 100) : 0;

    const mapelAverages = mapel.map(m => {
      const st = mapelStats[m.id];
      const avg = st && st.count > 0 ? Math.round(st.total / st.count) : 0;
      return {
        id: m.id,
        nama: m.nama,
        avg,
        kktp: m.kktp || 70,
        count: st ? st.count : 0
      };
    }).sort((a, b) => b.avg - a.avg);

    studentAverages.sort((a, b) => b.avg - a.avg);
    const topStudents = studentAverages.slice(0, 3);
    const needAttentionStudents = [...studentAverages].reverse().filter(s => s.avg > 0 && s.avg < 75).slice(0, 3);

    return {
      classAverage,
      mapelAverages,
      predikatCounts,
      ketuntasanRate,
      topStudents,
      needAttentionStudents
    };
  }, [siswa, mapel, nilai, totalSiswa, totalMapel]);

  const stats = [
    {
      label: 'Peserta Didik',
      value: totalSiswa.toString(),
      sub: `Fase ${sekolah.fase || '-'} (Kelas ${sekolah.kelas || '-'})`,
      icon: <Users size={56} />,
      bg: 'bg-gradient-to-br from-blue-700 to-blue-500',
    },
    {
      label: 'Mata Pelajaran',
      value: totalMapel.toString(),
      sub: `${tujuanPembelajaran?.length || 0} Total TP Aktif`,
      icon: <BookOpen size={56} />,
      bg: 'bg-gradient-to-br from-indigo-700 to-indigo-500',
    },
    {
      label: 'Rata-rata Kelas',
      value: classAnalytics.classAverage > 0 ? classAnalytics.classAverage.toString() : '-',
      sub: `Ketuntasan: ${classAnalytics.ketuntasanRate}%`,
      icon: <TrendingUp size={56} />,
      bg: 'bg-gradient-to-br from-emerald-700 to-emerald-500',
    },
    {
      label: 'Catatan Rapor Terisi',
      value: siswa.filter(s => (dataPendukung[s.id]?.catatanWaliKelas || '').trim().length > 0).length.toString(),
      sub: `dari ${totalSiswa} Siswa`,
      icon: <Sparkles size={56} />,
      bg: 'bg-gradient-to-br from-amber-600 to-amber-500',
    }
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-6">
      
      {/* Panel Identitas Sekolah */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start sm:items-center gap-4 w-full md:w-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-blue-700 shrink-0 shadow-xs">
              <GraduationCap size={32} className="sm:w-9 sm:h-9" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight truncate">
                {sekolah.nama || 'NAMA SEKOLAH BELUM DIATUR'}
              </h1>
              <div className="text-slate-500 text-[11px] sm:text-xs flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700">NPSN:</span> {sekolah.npsn || '-'}
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700">Wali Kelas:</span> <span className="font-medium text-slate-800">{sekolah.waliKelas || '-'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-left sm:text-right w-full md:w-auto">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Tahun Ajaran & Semester</p>
            <p className="text-xs sm:text-sm font-black text-blue-700">{sekolah.tahunAjaran || '-'} (Semester {sekolah.semester || '-'})</p>
          </div>
        </div>
      </div>

      {/* Widget Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className={`${stat.bg} rounded-xl p-5 text-white shadow-sm relative overflow-hidden flex flex-col justify-between group`}>
            <div className="relative z-10 flex flex-col">
              <span className="text-xs font-semibold opacity-90">{stat.label}</span>
              <h3 className="text-3xl sm:text-4xl font-black my-1">{stat.value}</h3>
              <p className="text-[11px] opacity-80 font-medium truncate">{stat.sub}</p>
            </div>
            <div className="absolute -right-3 -bottom-3 opacity-20 transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300 pointer-events-none">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================= */}
      {/* SECTION: RINGKASAN KELAS & ANALITIK AKADEMIK (OPSI 1)     */}
      {/* ========================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/30 flex items-center justify-center border border-indigo-400/30">
              <BarChart3 className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                Ringkasan Analitik Performa Kelas
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-slate-950">
                  Real-time
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Visualisasi ketercapaian kompetensi dan evaluasi agregat peserta didik.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Grafik Horizontal Rata-rata per Mapel */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Rata-Rata Nilai per Mata Pelajaran
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">KKTP Standar: 70</span>
            </div>

            {classAnalytics.mapelAverages.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                Belum ada data nilai yang diinput di menu Penilaian.
              </div>
            ) : (
              <div className="space-y-3">
                {classAnalytics.mapelAverages.map(item => {
                  const percent = Math.min(100, Math.max(0, item.avg));
                  const isHigh = item.avg >= 85;
                  const isMedium = item.avg >= 75;
                  const isPass = item.avg >= item.kktp;

                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 truncate pr-2 max-w-[240px]">
                          {item.nama}
                        </span>
                        <div className="flex items-center gap-2 font-mono shrink-0">
                          <span className={`font-bold ${isHigh ? 'text-emerald-700' : isMedium ? 'text-blue-700' : isPass ? 'text-amber-700' : 'text-rose-700'}`}>
                            {item.avg > 0 ? item.avg : '-'}
                          </span>
                          <span className="text-[10px] text-slate-400">/ 100</span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isHigh 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                              : isMedium 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500' 
                              : isPass 
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-500' 
                              : 'bg-gradient-to-r from-rose-500 to-red-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Distribusi Predikat & Sorotan Kelas */}
          <div className="lg:col-span-5 space-y-5 border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-emerald-600" />
                Distribusi Sebaran Capaian
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Sangat Baik (A)</span>
                  <p className="text-xl font-black text-emerald-800 mt-0.5">{classAnalytics.predikatCounts.sangatBaik}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">Nilai 85 - 100</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">Baik (B)</span>
                  <p className="text-xl font-black text-blue-800 mt-0.5">{classAnalytics.predikatCounts.baik}</p>
                  <p className="text-[10px] text-blue-600 font-medium">Nilai 75 - 84</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">Cukup (C)</span>
                  <p className="text-xl font-black text-amber-800 mt-0.5">{classAnalytics.predikatCounts.cukup}</p>
                  <p className="text-[10px] text-amber-600 font-medium">Nilai 70 - 74</p>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-rose-700 uppercase">Perlu Bimbingan</span>
                  <p className="text-xl font-black text-rose-800 mt-0.5">{classAnalytics.predikatCounts.perluBimbingan}</p>
                  <p className="text-[10px] text-rose-600 font-medium">Nilai &lt; 70</p>
                </div>
              </div>
            </div>

            {/* Sorotan Capaian Murid */}
            {classAnalytics.topStudents.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  <Award className="w-4 h-4 text-amber-500" />
                  Murid Capaian Tertinggi Kelas
                </div>
                <div className="space-y-1.5">
                  {classAnalytics.topStudents.map((item, idx) => (
                    <div key={item.student.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-700 font-medium truncate">
                        {idx + 1}. {item.student.nama}
                      </span>
                      <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                        Rata-rata: {item.avg}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Status Validasi Data & Kesiapan Rapor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
             <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
               <Activity size={16} className="text-blue-600" />
               Status Validasi & Kelengkapan Data
             </h3>
           </div>
           
           <div className="p-0 overflow-x-auto">
             <table className="w-full text-left border-collapse text-[10px] sm:text-xs sm:whitespace-nowrap">
               <thead>
                 <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                   <th className="py-2.5 px-3 font-semibold w-8 text-center">No</th>
                   <th className="py-2.5 px-4 font-semibold">Kategori Data</th>
                   <th className="py-2.5 px-4 font-semibold">Status Kesiapan</th>
                   <th className="py-2.5 px-4 font-semibold text-center">Keterangan</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 <tr className="hover:bg-slate-50 transition-colors">
                   <td className="py-2.5 px-3 text-center text-slate-500">1</td>
                   <td className="py-2.5 px-4 font-medium text-slate-800">Identitas Sekolah & Kepala Sekolah</td>
                   <td className="py-2.5 px-4">
                     {isSetupComplete ? (
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                         <CheckCircle2 size={12} /> Lengkap
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                         <AlertTriangle size={12} /> Belum Lengkap
                       </span>
                     )}
                   </td>
                   <td className="py-2.5 px-4 text-center text-slate-500 font-medium text-[11px]">
                     {sekolah.nama ? `${sekolah.nama} (${sekolah.npsn})` : 'Data dasar belum diisi'}
                   </td>
                 </tr>
                 <tr className="hover:bg-slate-50 transition-colors">
                   <td className="py-2.5 px-3 text-center text-slate-500">2</td>
                   <td className="py-2.5 px-4 font-medium text-slate-800">Data Master Peserta Didik</td>
                   <td className="py-2.5 px-4">
                     {isMuridAda ? (
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                         <CheckCircle2 size={12} /> Siap ({totalSiswa} Siswa)
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">
                         <AlertTriangle size={12} /> Belum Ada Murid
                       </span>
                     )}
                   </td>
                   <td className="py-2.5 px-4 text-center text-slate-500 font-medium text-[11px]">
                     Kelas {sekolah.kelas} - Rombel {sekolah.ruangRombel || 'A'}
                   </td>
                 </tr>
                 <tr className="hover:bg-slate-50 transition-colors">
                   <td className="py-2.5 px-3 text-center text-slate-500">3</td>
                   <td className="py-2.5 px-4 font-medium text-slate-800">Tujuan Pembelajaran (TP)</td>
                   <td className="py-2.5 px-4">
                     {tujuanPembelajaran && tujuanPembelajaran.length > 0 ? (
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                         <CheckCircle2 size={12} /> {tujuanPembelajaran.length} TP Terdaftar
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                         <Info size={12} /> Belum Ditambahkan
                       </span>
                     )}
                   </td>
                   <td className="py-2.5 px-4 text-center text-slate-500 font-medium text-[11px]">
                     {totalMapel} Mapel Aktif
                   </td>
                 </tr>
                 <tr className="hover:bg-slate-50 transition-colors">
                   <td className="py-2.5 px-3 text-center text-slate-500">4</td>
                   <td className="py-2.5 px-4 font-medium text-slate-800">Catatan Wali Kelas</td>
                   <td className="py-2.5 px-4">
                     <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                       <Sparkles size={12} /> AI Terintegrasi
                     </span>
                   </td>
                   <td className="py-2.5 px-4 text-center text-slate-500 font-medium text-[11px]">
                     Menu Output & Cetak
                   </td>
                 </tr>
               </tbody>
             </table>
           </div>
        </div>

        {/* Panel Panduan & Sinkronisasi */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
           <div className="bg-blue-700 px-4 py-3 border-b border-blue-800">
             <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
               <Lightbulb size={16} />
               Alur Ringkas Pengolahan Rapor
             </h3>
           </div>
           <div className="p-4 flex-1 text-xs space-y-3">
             <div className="flex gap-2.5 items-start">
               <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
               <p className="text-slate-600">Pastikan <strong>Data Dasar</strong> sekolah dan <strong>Data Murid</strong> telah lengkap.</p>
             </div>
             <div className="flex gap-2.5 items-start">
               <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
               <p className="text-slate-600">Input nilai sumatif harian/TP dan SAS di menu <strong>Nilai Intrakurikuler</strong>.</p>
             </div>
             <div className="flex gap-2.5 items-start">
               <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
               <p className="text-slate-600">Isi kehadiran di <strong>Data Murid (Data Pendukung)</strong> dan sesuaikan <strong>Catatan Wali Kelas (AI)</strong> di menu <strong>Output & Cetak</strong>.</p>
             </div>
             <div className="flex gap-2.5 items-start">
               <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
               <p className="text-slate-600">Pratinjau dan ekspor dokumen di menu <strong>Output / Cetak Terpadu</strong>.</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
