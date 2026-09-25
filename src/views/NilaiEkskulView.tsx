import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { 
  Medal, 
  Search, 
  Check, 
  Sparkles, 
  RotateCcw, 
  Info, 
  AlertCircle,
  Award,
  ChevronDown
} from 'lucide-react';
import { get5VariasiEkskul } from '@/lib/penilaianUtils';
import { NilaiEkskul } from '@/types';

export default function NilaiEkskulView() {
  const { state, updateState } = useAppStore();
  const { siswa, ekstrakurikuler = [], nilaiEkskul = {} } = state;

  const [selectedEkskulId, setSelectedEkskulId] = useState<string>(ekstrakurikuler[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedEkskul = useMemo(() => {
    return ekstrakurikuler.find(e => e.id === selectedEkskulId) || ekstrakurikuler[0];
  }, [ekstrakurikuler, selectedEkskulId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return siswa;
    const query = searchQuery.toLowerCase();
    return siswa.filter(s => 
      s.nama.toLowerCase().includes(query) || 
      (s.nisn && s.nisn.includes(query)) ||
      (s.nis && s.nis.includes(query))
    );
  }, [siswa, searchQuery]);

  const handleUpdateNilai = (studentId: string, patch: Partial<NilaiEkskul>) => {
    if (!selectedEkskul) return;
    const currentStudentEkskul = nilaiEkskul[studentId] || {};
    const currentItem = currentStudentEkskul[selectedEkskul.id] || { predikat: '', deskripsi: '' };
    
    const updated = {
      ...nilaiEkskul,
      [studentId]: {
        ...currentStudentEkskul,
        [selectedEkskul.id]: {
          ...currentItem,
          ...patch
        }
      }
    };
    updateState('nilaiEkskul', updated);
  };

  const handlePredikatChange = (studentId: string, predikat: string) => {
    if (!selectedEkskul) return;
    const currentStudentEkskul = nilaiEkskul[studentId] || {};
    const currentItem = currentStudentEkskul[selectedEkskul.id] || { predikat: '', deskripsi: '' };

    let autoDesc = currentItem.deskripsi;
    // Jika deskripsi masih kosong dan predikat dipilih, berikan saran deskripsi otomatis
    if (!autoDesc || autoDesc.trim() === '') {
      if (predikat) {
        const variations = get5VariasiEkskul(selectedEkskul.nama, predikat);
        autoDesc = variations[0] || '';
      }
    }

    handleUpdateNilai(studentId, { predikat, deskripsi: autoDesc });
  };

  const handleFillAllBaik = () => {
    if (!selectedEkskul) return;
    const updated = { ...nilaiEkskul };
    siswa.forEach(s => {
      const studentMap = updated[s.id] ? { ...updated[s.id] } : {};
      const current = studentMap[selectedEkskul.id] || { predikat: '', deskripsi: '' };
      if (!current.predikat) {
        const variations = get5VariasiEkskul(selectedEkskul.nama, 'Baik');
        studentMap[selectedEkskul.id] = {
          predikat: 'Baik',
          deskripsi: variations[0] || `Aktif mengikuti kegiatan ${selectedEkskul.nama} dengan tertib dan menunjukkan perkembangan yang baik.`
        };
        updated[s.id] = studentMap;
      }
    });
    updateState('nilaiEkskul', updated);
    showToast(`Predikat 'Baik' berhasil diisikan ke murid yang belum bernilai!`);
  };

  const handleResetEkskul = () => {
    if (!selectedEkskul) return;
    if (!window.confirm(`Yakin ingin mengosongkan nilai ${selectedEkskul.nama} untuk semua murid di kelas ini?`)) return;
    const updated = { ...nilaiEkskul };
    siswa.forEach(s => {
      if (updated[s.id] && updated[s.id][selectedEkskul.id]) {
        const studentMap = { ...updated[s.id] };
        delete studentMap[selectedEkskul.id];
        updated[s.id] = studentMap;
      }
    });
    updateState('nilaiEkskul', updated);
    showToast(`Nilai ${selectedEkskul.nama} berhasil dikosongkan.`);
  };

  if (!ekstrakurikuler || ekstrakurikuler.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center max-w-xl mx-auto space-y-4">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Medal className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-slate-800">Belum Ada Ekstrakurikuler Terdaftar</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Silakan tambahkan data ekstrakurikuler terlebih dahulu melalui menu <strong>Ekstrakurikuler &rarr; Perencanaan</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in-50 duration-300">
      
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-100 shrink-0">
            <Medal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Input Nilai Ekstrakurikuler
              <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Semester {state.sekolah.semester}
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Pilih kegiatan ekstrakurikuler, tetapkan predikat capaian, serta narasi deskripsi perkembangan murid.
            </p>
          </div>
        </div>

        {/* Pemilihan Kegiatan Ekskul */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={selectedEkskul?.id || ''}
              onChange={(e) => setSelectedEkskulId(e.target.value)}
              className="pl-3.5 pr-8 py-2 border border-slate-300 bg-white font-bold text-xs rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-xs cursor-pointer appearance-none"
            >
              {ekstrakurikuler.map(e => (
                <option key={e.id} value={e.id}>
                  {e.nama} ({e.jenis})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleFillAllBaik}
            className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Isi predikat 'Baik' dan deskripsi otomatis bagi yang masih kosong"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Set Semua 'Baik'</span>
          </button>

          <button
            onClick={handleResetEkskul}
            className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Kosongkan nilai ekskul ini"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari murid / NISN..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 font-medium"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <span>Kegiatan: <strong className="text-amber-800">{selectedEkskul?.nama}</strong></span>
            <span className="text-slate-300">|</span>
            <span>Total: <strong>{filteredStudents.length}</strong> Murid</span>
          </div>
        </div>

        {/* Tabel Data Nilai Ekskul */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4 min-w-[220px]">Nama Peserta Didik</th>
                <th className="py-3 px-3 w-40 text-center">Predikat</th>
                <th className="py-3 px-4 min-w-[360px]">Keterangan Capaian Rapor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Tidak ada data peserta didik yang cocok.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const studentEkskulData = nilaiEkskul[s.id]?.[selectedEkskul?.id || ''] || { predikat: '', deskripsi: '' };
                  const predikat = studentEkskulData.predikat || '';
                  const deskripsi = studentEkskulData.deskripsi || '';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-500 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{s.nama}</p>
                        <p className="text-[10px] font-mono text-slate-400">NISN: {s.nisn || '-'}</p>
                      </td>

                      {/* Dropdown Predikat */}
                      <td className="py-3 px-3 text-center">
                        <select
                          value={predikat}
                          onChange={(e) => handlePredikatChange(s.id, e.target.value)}
                          className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer ${
                            predikat === 'Sangat Baik'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : predikat === 'Baik'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : predikat === 'Cukup'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : predikat === 'Kurang'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-white text-slate-400 border-slate-200'
                          }`}
                        >
                          <option value="">-- Tidak Ikut / Kosong --</option>
                          <option value="Sangat Baik">Sangat Baik (A)</option>
                          <option value="Baik">Baik (B)</option>
                          <option value="Cukup">Cukup (C)</option>
                          <option value="Kurang">Kurang (D)</option>
                        </select>
                      </td>

                      {/* Textarea Deskripsi + Tombol Saran */}
                      <td className="py-3 px-4">
                        <div className="flex gap-2 items-start">
                          <textarea
                            rows={2}
                            value={deskripsi}
                            onChange={(e) => handleUpdateNilai(s.id, { deskripsi: e.target.value })}
                            placeholder={predikat ? "Ketik catatan deskripsi ekskul..." : "Pilih predikat terlebih dahulu..."}
                            disabled={!predikat}
                            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white resize-none disabled:bg-slate-50 disabled:text-slate-400"
                          />
                          {predikat && (
                            <button
                              type="button"
                              onClick={() => {
                                const variations = get5VariasiEkskul(selectedEkskul.nama, predikat);
                                const nextIndex = (deskripsi ? variations.indexOf(deskripsi) + 1 : 0) % variations.length;
                                handleUpdateNilai(s.id, { deskripsi: variations[nextIndex] });
                                showToast(`Variasi narasi diterapkan!`);
                              }}
                              className="px-2.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] flex items-center gap-1 shadow-xs transition cursor-pointer shrink-0 mt-0.5"
                              title="Ganti variasi kalimat deskripsi"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              <span className="hidden sm:inline">Variasi</span>
                            </button>
                          )}
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
