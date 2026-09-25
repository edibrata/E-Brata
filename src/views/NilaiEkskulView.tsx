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
  ChevronDown,
  X
} from 'lucide-react';
import { get5VariasiEkskul } from '@/lib/penilaianUtils';
import { NilaiEkskul } from '@/types';
import Tooltip from '@/components/Tooltip';

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

      {/* Single Compact Header: Satu Baris Terpadu & Super Ramping */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Sisi Kiri: Judul + Dropdown Ekskul + Status Ringkas */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Medal className="w-4 h-4" />
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-800 flex items-center whitespace-nowrap">
              Input Nilai Ekstrakurikuler
            </h1>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Selector Kegiatan Ekskul Ramping */}
          <div className="relative">
            <select
              value={selectedEkskul?.id || ''}
              onChange={(e) => setSelectedEkskulId(e.target.value)}
              className="pl-3 pr-7 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-xs rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-2xs cursor-pointer appearance-none transition"
            >
              {ekstrakurikuler.map(e => (
                <option key={e.id} value={e.id}>
                  {e.nama} ({e.jenis})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Sisi Kanan: Aksi Ikon + Tooltip Tailwind & Kotak Pencarian Sejajar */}
        <div className="flex flex-wrap items-center gap-2 justify-end flex-1 sm:flex-initial">
          {/* Tombol Set Semua 'Baik' - Ikon + Tooltip Tailwind CSS */}
          <Tooltip content="Isi Otomatis 'Baik' bagi Murid yang Masih Kosong" position="top">
            <button
              type="button"
              onClick={handleFillAllBaik}
              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer active:scale-95 flex items-center justify-center shadow-2xs"
              aria-label="Set Semua 'Baik'"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </button>
          </Tooltip>

          {/* Tombol Reset - Ikon + Tooltip Tailwind CSS */}
          <Tooltip content="Kosongkan Predikat Nilai Ekstrakurikuler Ini untuk Seluruh Murid" position="top">
            <button
              type="button"
              onClick={handleResetEkskul}
              className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition cursor-pointer active:scale-95 flex items-center justify-center shadow-2xs"
              aria-label="Kosongkan Nilai Ekskul"
            >
              <RotateCcw className="w-4 h-4 text-slate-400 hover:text-rose-500" />
            </button>
          </Tooltip>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Kotak Pencarian Ramping Sejajar */}
          <div className="relative w-44 sm:w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari murid..."
              className="w-full pl-8 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 font-medium"
            />
            {searchQuery && (
              <Tooltip content="Hapus kata kunci pencarian" position="top">
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

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tabel Data Nilai Ekskul - Murni Input Nilai / Predikat */}
        <div className="overflow-x-auto max-h-[calc(100vh-17rem)] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100 shadow-xs border-b border-slate-200">
              <tr className="bg-slate-100 text-slate-700 font-bold">
                <th className="py-3 px-3 w-14 text-center bg-slate-100">No</th>
                <th className="py-3 px-4 min-w-[240px] bg-slate-100">Nama Peserta Didik</th>
                <th className="py-3 px-4 w-44 text-center bg-slate-100">NISN</th>
                <th className="py-3 px-4 w-60 text-center bg-slate-100">Predikat Capaian</th>
                <th className="py-3 px-4 w-44 text-center bg-slate-100">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Tidak ada data peserta didik yang cocok.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => {
                  const studentEkskulData = nilaiEkskul[s.id]?.[selectedEkskul?.id || ''] || { predikat: '', deskripsi: '' };
                  const predikat = studentEkskulData.predikat || '';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3 text-center font-mono text-slate-500 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{s.nama}</p>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500 text-[11px]">
                        {s.nisn || '-'}
                      </td>

                      {/* Dropdown Predikat */}
                      <td className="py-3.5 px-4 text-center">
                        <select
                          value={predikat}
                          onChange={(e) => handlePredikatChange(s.id, e.target.value)}
                          className={`w-full max-w-[220px] px-3 py-1.5 border rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer shadow-2xs transition-all ${
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
                          <option value="">-- Tidak Mengikuti --</option>
                          <option value="Sangat Baik">Sangat Baik (A)</option>
                          <option value="Baik">Baik (B)</option>
                          <option value="Cukup">Cukup (C)</option>
                          <option value="Kurang">Kurang (D)</option>
                        </select>
                      </td>

                      {/* Status Keikutsertaan */}
                      <td className="py-3.5 px-4 text-center">
                        {predikat ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" /> Aktif Mengikuti
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-400">
                            Tidak Ikut
                          </span>
                        )}
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
