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
  Info
} from 'lucide-react';

interface DashboardViewProps {
  onOpenDevProfile?: () => void;
}

export default function DashboardView({ onOpenDevProfile }: DashboardViewProps) {
  const { state } = useAppStore();
  const { sekolah, siswa } = state;
  const totalSiswa = siswa?.length || 0;

  const isSetupComplete = Boolean(
    sekolah.nama && 
    sekolah.npsn && 
    sekolah.kepsek
  );
  
  const isMuridAda = totalSiswa > 0;

  const stats = [
    {
      label: 'Total Mapel',
      value: state.mapel?.length.toString() || '0',
      icon: <BookOpen size={64} />,
      bg: 'bg-gradient-to-br from-blue-700 to-blue-500',
    },
    {
      label: 'Total Rombel',
      value: totalSiswa > 0 ? (Math.floor(totalSiswa / 28) + 1).toString() : '0',
      icon: <Users size={64} />,
      bg: 'bg-gradient-to-br from-emerald-700 to-emerald-500',
    },
    {
      label: 'Peserta Didik',
      value: totalSiswa.toString(),
      icon: <Users size={64} />,
      bg: 'bg-gradient-to-br from-amber-600 to-amber-400',
    },
    {
      label: 'Total Tujuan Pembelajaran',
      value: state.tujuanPembelajaran?.length.toString() || '0',
      icon: <School size={64} />,
      bg: 'bg-gradient-to-br from-rose-700 to-rose-500',
    }
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      {/* Panel Identitas Sekolah */}
      <div className="mb-6 bg-white border border-slate-200 shadow-sm rounded-md p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-4">
          <div className="flex items-start sm:items-center gap-4 w-full md:w-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 border border-blue-200 rounded flex items-center justify-center text-blue-700 shrink-0">
              <GraduationCap size={32} className="sm:w-9 sm:h-9" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight truncate">
                {sekolah.nama || 'NAMA SEKOLAH BELUM DIATUR'}
              </h1>
              <div className="text-slate-500 text-[11px] sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700">NPSN:</span> {sekolah.npsn || '-'}
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center sm:items-start gap-1 flex-wrap">
                  <span className="font-semibold text-slate-700">Kepala Sekolah:</span> <span className="line-clamp-1 break-words">{sekolah.kepsek || '-'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-100 px-4 py-2 rounded border border-slate-200 text-left sm:text-right w-full md:w-auto mt-2 md:mt-0">
            <p className="text-xs text-slate-500 uppercase font-semibold">Tahun Ajaran Aktif</p>
            <p className="text-sm font-bold text-blue-700">{sekolah.tahunAjaran || '-'} - SMT {sekolah.semester || '-'}</p>
          </div>
        </div>
      </div>

      {/* Widget Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {stats.map((stat, idx) => (
          <div key={idx} className={`${stat.bg} rounded-md p-5 text-white shadow-sm relative overflow-hidden flex flex-col justify-between group`}>
            <div className="relative z-10 flex flex-col">
              <h3 className="text-4xl font-bold mb-1">{stat.value}</h3>
              <p className="text-sm font-medium opacity-90">{stat.label}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-20 transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-300 pointer-events-none">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Validasi Data */}
        <div className="lg:col-span-2 bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
           <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
             <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
               <Activity size={16} className="text-blue-600" />
               Status Validasi Data
             </h3>
           </div>
           
           <div className="p-0 overflow-x-auto">
             <table className="w-full text-left border-collapse text-[10px] sm:text-sm sm:whitespace-nowrap">
               <thead>
                 <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                   <th className="py-2 px-1 sm:px-4 font-semibold w-8 sm:w-12 text-center">No</th>
                   <th className="py-2 px-1 sm:px-4 font-semibold leading-tight"><span className="hidden sm:inline">Kategori Data</span><span className="sm:hidden">Kategori</span></th>
                   <th className="py-2 px-1 sm:px-4 font-semibold leading-tight"><span className="hidden sm:inline">Status Kesiapan</span><span className="sm:hidden">Status</span></th>
                   <th className="py-2 px-1 sm:px-4 font-semibold text-center sm:text-left">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 <tr className="hover:bg-slate-50 transition-colors">
                   <td className="py-2 px-1 sm:px-4 text-center text-slate-500">1</td>
                   <td className="py-2 px-1 sm:px-4 font-medium text-slate-800 leading-tight whitespace-normal sm:whitespace-nowrap">Identitas Sekolah</td>
                   <td className="py-2 px-1 sm:px-4">
                     {isSetupComplete ? (
                       <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-emerald-100 text-emerald-700 text-[9px] sm:text-xs font-bold">
                         <CheckCircle2 size={12} /> Valid
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-rose-100 text-rose-700 text-[9px] sm:text-xs font-bold">
                         <AlertTriangle size={12} /> Invalid
                       </span>
                     )}
                   </td>
                   <td className="py-2 px-1 sm:px-4">
                     {!isSetupComplete && (
                       <button className="text-[10px] sm:text-xs bg-rose-600 whitespace-nowrap text-white px-2 sm:px-3 py-1 rounded hover:bg-rose-700 font-semibold shadow-sm">
                         Perbaiki
                       </button>
                     )}
                   </td>
                 </tr>
                 <tr className="hover:bg-slate-50 transition-colors">
                   <td className="py-2 px-1 sm:px-4 text-center text-slate-500">2</td>
                   <td className="py-2 px-1 sm:px-4 font-medium text-slate-800 leading-tight whitespace-normal sm:whitespace-nowrap">Peserta Didik</td>
                   <td className="py-2 px-1 sm:px-4">
                     {isMuridAda ? (
                       <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-emerald-100 text-emerald-700 text-[9px] sm:text-xs font-bold">
                         <CheckCircle2 size={12} /> Valid
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-amber-100 text-amber-700 text-[9px] sm:text-xs font-bold">
                         <AlertTriangle size={12} /> Warning
                       </span>
                     )}
                   </td>
                   <td className="py-2 px-1 sm:px-4">
                     {!isMuridAda && (
                       <button className="text-[10px] sm:text-xs bg-amber-500 whitespace-nowrap text-white px-2 sm:px-3 py-1 rounded hover:bg-amber-600 font-semibold shadow-sm">
                         Isi Data
                       </button>
                     )}
                   </td>
                 </tr>
                 <tr className="hover:bg-slate-50 transition-colors">
                   <td className="py-2 px-1 sm:px-4 text-center text-slate-500">3</td>
                   <td className="py-2 px-1 sm:px-4 font-medium text-slate-800 leading-tight whitespace-normal sm:whitespace-nowrap">Tujuan Pembelajaran</td>
                   <td className="py-2 px-1 sm:px-4">
                     <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-slate-100 text-slate-600 text-[9px] sm:text-xs font-bold">
                       <Info size={12} /> Belum Dicek
                     </span>
                   </td>
                   <td className="py-2 px-1 sm:px-4">
                     <button className="text-[10px] sm:text-xs bg-slate-200 whitespace-nowrap text-slate-700 px-2 sm:px-3 py-1 rounded hover:bg-slate-300 font-semibold shadow-sm">
                       Cek Data
                     </button>
                   </td>
                 </tr>
                 <tr className="hover:bg-slate-50 transition-colors">
                   <td className="py-2 px-1 sm:px-4 text-center text-slate-500">4</td>
                   <td className="py-2 px-1 sm:px-4 font-medium text-slate-800 leading-tight whitespace-normal sm:whitespace-nowrap">Nilai Ekstrakurikuler</td>
                   <td className="py-2 px-1 sm:px-4">
                     <span className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-slate-100 text-slate-600 text-[9px] sm:text-xs font-bold">
                       <Info size={12} /> Belum Dicek
                     </span>
                   </td>
                   <td className="py-2 px-1 sm:px-4">
                     <button className="text-[10px] sm:text-xs bg-slate-200 whitespace-nowrap text-slate-700 px-2 sm:px-3 py-1 rounded hover:bg-slate-300 font-semibold shadow-sm">
                       Cek Data
                     </button>
                   </td>
                 </tr>
               </tbody>
             </table>
           </div>
        </div>

        {/* Panel Informasi */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden flex flex-col">
           <div className="bg-blue-700 px-4 py-3 border-b border-blue-800">
             <h3 className="text-sm font-bold text-white flex items-center gap-2">
               <Lightbulb size={16} />
               Aktivitas Sinkronisasi
             </h3>
           </div>
           <div className="p-4 flex-1">
             <ul className="space-y-4">
               <li className="border-b border-slate-100 pb-3">
                 <p className="text-xs font-bold text-slate-400 mb-1">12 September 2026</p>
                 <h4 className="text-sm font-semibold text-blue-700 mb-1 cursor-pointer hover:underline">Sinkronisasi Data Siswa Berhasil</h4>
                 <p className="text-xs text-slate-600 line-clamp-2">Data master peserta didik telah berhasil disinkronkan dengan database pusat E-Rapor.</p>
               </li>
               <li className="border-b border-slate-100 pb-3">
                 <p className="text-xs font-bold text-slate-400 mb-1">05 Agustus 2026</p>
                 <h4 className="text-sm font-semibold text-blue-700 mb-1 cursor-pointer hover:underline">Status Sinkronisasi Master Mapel</h4>
                 <p className="text-xs text-slate-600 line-clamp-2">Data master mata pelajaran Kurikulum Merdeka telah berhasil diverifikasi dan aktif.</p>
               </li>
             </ul>
             <button className="w-full mt-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded hover:bg-slate-200 transition-colors">
               Lakukan Sinkronisasi Ulang
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
