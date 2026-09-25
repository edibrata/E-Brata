import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { 
  CalendarCheck2, 
  Users, 
  Search, 
  Check, 
  RotateCcw, 
  AlertCircle,
  AlertTriangle,
  Clock,
  HeartPulse,
  CalendarDays,
  X
} from 'lucide-react';
import Tooltip from '@/components/Tooltip';
import { Siswa, DataPendukungSiswa } from '@/types';

export default function DataPendukung() {
  const { state, updateState } = useAppStore();
  const { siswa, dataPendukung = {} } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return siswa;
    const query = searchQuery.toLowerCase();
    return siswa.filter(s => 
      s.nama.toLowerCase().includes(query) || 
      (s.nisn && s.nisn.includes(query)) ||
      (s.nis && s.nis.includes(query))
    );
  }, [siswa, searchQuery]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const updateStudentKehadiran = (studentId: string, field: 'sakit' | 'izin' | 'alpa', value: number) => {
    const current = dataPendukung[studentId] || {};
    const updated = {
      ...dataPendukung,
      [studentId]: {
        ...current,
        [field]: value
      }
    };
    updateState('dataPendukung', updated);
  };

  // Reset massal semua murid ke 0 (Hadir Penuh)
  const executeResetAll = () => {
    const updated = { ...dataPendukung };
    siswa.forEach(s => {
      const current = updated[s.id] || {};
      updated[s.id] = {
        ...current,
        sakit: 0,
        izin: 0,
        alpa: 0
      };
    });
    updateState('dataPendukung', updated);
    setShowResetAllConfirm(false);
    showToast('Semua data kehadiran berhasil diatur ke 0 hari (Hadir Penuh).');
  };

  // Reset per satuan murid ke 0 (Hadir Penuh)
  const handleResetSiswa = (studentId: string, nama: string) => {
    const current = dataPendukung[studentId] || {};
    const updated = {
      ...dataPendukung,
      [studentId]: {
        ...current,
        sakit: 0,
        izin: 0,
        alpa: 0
      }
    };
    updateState('dataPendukung', updated);
    showToast(`Kehadiran ${nama} diatur ke 0 hari (Hadir Penuh).`);
  };

  // Statistik Kehadiran Kelas
  const stats = useMemo(() => {
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlpa = 0;
    let muridHadirPenuh = 0;

    siswa.forEach(s => {
      const dp = dataPendukung[s.id] || {};
      const sVal = dp.sakit || 0;
      const iVal = dp.izin || 0;
      const aVal = dp.alpa || 0;
      totalSakit += sVal;
      totalIzin += iVal;
      totalAlpa += aVal;

      if (sVal === 0 && iVal === 0 && aVal === 0) {
        muridHadirPenuh++;
      }
    });

    const totalKetidakhadiran = totalSakit + totalIzin + totalAlpa;
    const totalEfektifEstimasi = siswa.length * 110; // estimasi 110 hari efektif per semester
    const rateKehadiran = totalEfektifEstimasi > 0
      ? Math.max(0, Math.min(100, ((totalEfektifEstimasi - totalKetidakhadiran) / totalEfektifEstimasi) * 100))
      : 100;

    return {
      totalSakit,
      totalIzin,
      totalAlpa,
      totalKetidakhadiran,
      muridHadirPenuh,
      rateKehadiran: rateKehadiran.toFixed(1)
    };
  }, [siswa, dataPendukung]);

  return (
    <div className="w-full space-y-4 animate-in fade-in-50 duration-200">
      
      {/* Toast Notifikasi */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Modal Konfirmasi Reset Massal (Bebas Blokir Browser) */}
      {showResetAllConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-slate-800">
                  Reset Kehadiran Seluruh Murid?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Tindakan ini akan mengatur ulang data <strong>Sakit</strong>, <strong>Izin</strong>, dan <strong>Alpa</strong> untuk seluruh murid (<span className="font-bold text-slate-700">{siswa.length} orang</span>) menjadi <strong>0 hari (Hadir Penuh)</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetAllConfirm(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeResetAll}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer shadow-sm active:scale-95"
              >
                Ya, Reset Semua ke 0
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Info Banner + Compact Stats Terpadu & Pencarian */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-3.5 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Judul & Ikon */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-100 shrink-0">
            <CalendarCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight whitespace-nowrap">
              Rekapitulasi Kehadiran Murid
            </h2>
          </div>
        </div>

        {/* Blok Statistik Kompak (Ikon + Inisial) + Tombol Reset + Cari Murid Sejajar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* M: Total Murid */}
          <Tooltip content={`Total Murid: ${siswa.length} orang`} position="bottom">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold cursor-default select-none shadow-2xs">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>M: {siswa.length}</span>
            </div>
          </Tooltip>

          {/* S: Sakit */}
          <Tooltip content={`Total Sakit (S): ${stats.totalSakit} hari`} position="bottom">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50/70 text-blue-700 border border-blue-200 text-xs font-bold cursor-default select-none shadow-2xs">
              <HeartPulse className="w-3.5 h-3.5 text-blue-500" />
              <span>S: {stats.totalSakit}</span>
            </div>
          </Tooltip>

          {/* I: Izin */}
          <Tooltip content={`Total Izin (I): ${stats.totalIzin} hari`} position="bottom">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50/70 text-indigo-700 border border-indigo-200 text-xs font-bold cursor-default select-none shadow-2xs">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
              <span>I: {stats.totalIzin}</span>
            </div>
          </Tooltip>

          {/* A: Alpa */}
          <Tooltip content={`Total Alpa (A): ${stats.totalAlpa} hari (tanpa keterangan)`} position="bottom">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50/70 text-amber-700 border border-amber-200 text-xs font-bold cursor-default select-none shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>A: {stats.totalAlpa}</span>
            </div>
          </Tooltip>

          {/* K: Kehadiran */}
          <Tooltip content={`Tingkat Kehadiran Kelas: ${stats.rateKehadiran}%`} position="bottom">
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50/70 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-default select-none shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>K: {stats.rateKehadiran}%</span>
            </div>
          </Tooltip>

          {/* Tombol Ikon Reset Semua dengan Tooltip Tailwind */}
          <Tooltip content="Reset Semua Kehadiran ke 0 Hari (Hadir Penuh)" position="bottom">
            <button
              type="button"
              onClick={() => setShowResetAllConfirm(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors shadow-2xs active:scale-95 cursor-pointer shrink-0"
              aria-label="Reset Semua Kehadiran ke 0 Hari"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </Tooltip>

          {/* Input Cari Murid dipindahkan ke samping setelah reset */}
          <div className="relative w-44 sm:w-56 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari murid / NISN..."
              className="w-full pl-8 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabel Pengisian Kehadiran */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">

        {/* Tabel Data */}
        <div className="overflow-x-auto max-h-[calc(100vh-17rem)] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 shadow-xs border-b border-slate-200">
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 text-center bg-slate-100">No</th>
                <th className="py-3 px-4 min-w-[220px] bg-slate-100">Nama Peserta Didik</th>
                <th className="py-3 px-3 w-28 text-center bg-blue-100/70 border-x border-slate-200">
                  <div className="flex flex-col items-center">
                    <span>Sakit (S)</span>
                    <span className="text-[9px] font-normal text-slate-500 lowercase">hari</span>
                  </div>
                </th>
                <th className="py-3 px-3 w-28 text-center bg-indigo-50/50 border-r border-slate-200">
                  <div className="flex flex-col items-center">
                    <span>Izin (I)</span>
                    <span className="text-[9px] font-normal text-slate-500 lowercase">hari</span>
                  </div>
                </th>
                <th className="py-3 px-3 w-32 text-center bg-amber-50/50 border-r border-slate-200">
                  <div className="flex flex-col items-center">
                    <span>Alpa (A)</span>
                    <span className="text-[9px] font-normal text-slate-500 lowercase">tanpa keterangan</span>
                  </div>
                </th>
                <th className="py-3 px-3 w-28 text-center">Total Absen</th>
                <th className="py-3 px-4 w-44 text-center">Status & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Tidak ada data peserta didik yang cocok.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const dp = dataPendukung[s.id] || {};
                  const sVal = dp.sakit ?? 0;
                  const iVal = dp.izin ?? 0;
                  const aVal = dp.alpa ?? 0;
                  const totalAbsen = sVal + iVal + aVal;

                  let badgeStatus = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Hadir Prima
                    </span>
                  );
                  if (aVal > 3) {
                    badgeStatus = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Perlu Perhatian
                      </span>
                    );
                  } else if (totalAbsen > 5) {
                    badgeStatus = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Cukup
                      </span>
                    );
                  } else if (totalAbsen > 0) {
                    badgeStatus = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Baik
                      </span>
                    );
                  }

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {s.fotoBase64 ? (
                            <img 
                              src={s.fotoBase64} 
                              alt={s.nama} 
                              className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0" 
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px] border border-slate-200 shrink-0">
                              {s.nama.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{s.nama}</p>
                            <p className="text-[10px] font-mono text-slate-400">
                              NISN: {s.nisn || '-'} {s.nis ? `| NIS: ${s.nis}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Sakit */}
                      <td className="py-2.5 px-3 text-center bg-blue-50/20 border-x border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={dp.sakit ?? 0}
                          onChange={(e) => updateStudentKehadiran(s.id, 'sakit', Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 px-2 py-1 text-center font-mono font-semibold border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                        />
                      </td>

                      {/* Izin */}
                      <td className="py-2.5 px-3 text-center bg-indigo-50/20 border-r border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={dp.izin ?? 0}
                          onChange={(e) => updateStudentKehadiran(s.id, 'izin', Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-16 px-2 py-1 text-center font-mono font-semibold border border-slate-200 rounded-md text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                        />
                      </td>

                      {/* Tanpa Keterangan / Alpa */}
                      <td className="py-2.5 px-3 text-center bg-amber-50/20 border-r border-slate-100">
                        <input
                          type="number"
                          min="0"
                          max="180"
                          value={dp.alpa ?? 0}
                          onChange={(e) => updateStudentKehadiran(s.id, 'alpa', Math.max(0, parseInt(e.target.value) || 0))}
                          className={`w-16 px-2 py-1 text-center font-mono font-semibold border rounded-md text-xs focus:ring-2 bg-white ${
                            (dp.alpa ?? 0) > 0 
                              ? 'border-amber-400 text-amber-700 focus:ring-amber-500/20 focus:border-amber-500' 
                              : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
                          }`}
                        />
                      </td>

                      {/* Total Absen */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                        <span className={`px-2 py-0.5 rounded text-xs ${totalAbsen > 0 ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}>
                          {totalAbsen} hari
                        </span>
                      </td>

                      {/* Status Kehadiran & Reset Satuan */}
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {badgeStatus}
                          <Tooltip content={`Reset kehadiran ${s.nama} ke 0 hari (Hadir Penuh)`} position="left">
                            <button
                              type="button"
                              onClick={() => handleResetSiswa(s.id, s.nama)}
                              className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer active:scale-90"
                              aria-label={`Reset kehadiran ${s.nama}`}
                            >
                              <RotateCcw className="w-3 h-3" />
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
    </div>
  );
}
