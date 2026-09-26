import { useState } from 'react';
import { useAppStore } from '@/store';
import { 
  BANK_SUBDIMENSI_SD, 
  DimensiKokurikulerNama, 
  normalisasiSkala,
  SKALA_KOKURIKULER 
} from '@/data/kokurikuler2025';
import { ClipboardCheck, Info, Check, RotateCcw, ChevronDown, X } from 'lucide-react';
import Tooltip from '@/components/Tooltip';

export default function NilaiProjek() {
  const { state, updateState } = useAppStore();
  const { siswa, projek, dimensiProjek, nilaiP5 } = state;

  const [selectedProjekId, setSelectedProjekId] = useState<string>(projek[0]?.id || '');
  const [activeDeskriptorModal, setActiveDeskriptorModal] = useState<{
    dimName: string;
    subName: string;
    deskriptor: { berk: string; cakap: string; mahir: string };
  } | null>(null);

  const activeProjek = projek.find(p => p.id === selectedProjekId) || projek[0];

  if (projek.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-xs border border-slate-200 text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
          <ClipboardCheck size={24} />
        </div>
        <h2 className="text-sm font-bold text-slate-700">Belum Ada Perencanaan Kegiatan Kokurikuler</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Silakan buat perencanaan kegiatan dan pilih dimensi/subdimensi terlebih dahulu di sub menu <b>Perencanaan Kokurikuler</b>.
        </p>
      </div>
    );
  }

  // Kumpulkan dimensi dan subdimensi untuk projek aktif
  const currentDims = dimensiProjek.filter(d => d.projekId === (activeProjek?.id || ''));

  // Bangun daftar kolom subdimensi yang akan dinilai
  interface ColItem {
    dimId: string;
    dimName: string;
    subName: string;
    subKey: string;
    deskriptor?: { berk: string; cakap: string; mahir: string };
  }

  const columns: ColItem[] = [];
  currentDims.forEach(d => {
    const list = BANK_SUBDIMENSI_SD[d.nama as DimensiKokurikulerNama] || [];
    const subNames = d.subdimensi && d.subdimensi.length > 0 ? d.subdimensi : [d.nama];
    subNames.forEach(sName => {
      const desc = list.find(s => s.name === sName);
      columns.push({
        dimId: d.id,
        dimName: d.nama,
        subName: sName,
        subKey: `${d.id}__${sName}`,
        deskriptor: desc
      });
    });
  });

  const getStudentScore = (studentId: string, col: ColItem): 'M' | 'C' | 'B' | '' => {
    const raw = nilaiP5[studentId]?.[col.subKey] || nilaiP5[studentId]?.[col.dimId] || '';
    return normalisasiSkala(raw);
  };

  const handleScoreChange = (studentId: string, col: ColItem, val: 'M' | 'C' | 'B' | '') => {
    updateState('nilaiP5', {
      ...nilaiP5,
      [studentId]: {
        ...(nilaiP5[studentId] || {}),
        [col.subKey]: val,
        // sinkronisasi fallback untuk kompatibilitas ke dimensi lama
        [col.dimId]: val
      }
    });
  };

  const handleBatchFill = (val: 'M' | 'C' | '') => {
    if (!activeProjek) return;
    const updated = { ...nilaiP5 };
    siswa.forEach(s => {
      const studentMap = { ...(updated[s.id] || {}) };
      columns.forEach(col => {
        studentMap[col.subKey] = val;
        studentMap[col.dimId] = val;
      });
      updated[s.id] = studentMap;
    });
    updateState('nilaiP5', updated);
  };

  return (
    <div className="space-y-4 relative">
      {/* Floating Modal Deskriptor Capaian Subdimensi (Bebas dari Clipping Overflow) */}
      {activeDeskriptorModal && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setActiveDeskriptorModal(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full inline-block">
                  Dimensi: {activeDeskriptorModal.dimName}
                </span>
                <h3 className="text-sm font-bold text-slate-800 leading-snug">
                  {activeDeskriptorModal.subName}
                </h3>
              </div>
              <Tooltip content="Tutup pratinjau deskriptor" position="left">
                <button
                  type="button"
                  onClick={() => setActiveDeskriptorModal(null)}
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1.5 rounded-lg transition-colors cursor-pointer"
                  aria-label="Tutup"
                >
                  <X size={16} />
                </button>
              </Tooltip>
            </div>

            {/* 3 Tingkat Uraian Capaian Resmi Kepka BSKAP 058/2025 */}
            <div className="p-5 space-y-3 text-xs leading-relaxed max-h-[70vh] overflow-y-auto">
              <div className="p-3 rounded-lg bg-amber-50/70 border-l-4 border-amber-400 text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                  Berkembang (B) - Menuju Standar:
                </div>
                <p className="text-[11px] text-amber-900/90 leading-normal pl-4">
                  {activeDeskriptorModal.deskriptor.berk}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/70 border-l-4 border-emerald-400 text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  Cakap (C) - Standar Kelulusan:
                </div>
                <p className="text-[11px] text-emerald-900/90 leading-normal pl-4">
                  {activeDeskriptorModal.deskriptor.cakap}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-sky-50/70 border-l-4 border-sky-400 text-sky-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-sky-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                  Mahir (M) - Melampaui Standar:
                </div>
                <p className="text-[11px] text-sky-900/90 leading-normal pl-4">
                  {activeDeskriptorModal.deskriptor.mahir}
                </p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDeskriptorModal(null)}
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Compact Header */}
      <div className="bg-white px-5 py-3 rounded-xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm">
            <ClipboardCheck size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 tracking-tight">Input Nilai Kokurikuler</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                Skala M | C | B
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector Kegiatan jika lebih dari 1 */}
          {projek.length > 1 && (
            <div className="relative">
              <select
                value={activeProjek?.id}
                onChange={(e) => setSelectedProjekId(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg pl-3 pr-8 py-1.5 outline-none focus:ring-1 focus:ring-sky-500 appearance-none cursor-pointer"
              >
                {projek.map((p, idx) => (
                  <option key={p.id} value={p.id}>
                    Kegiatan {idx + 1}: {p.tema}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
            <Tooltip content="Isi semua murid dengan predikat Cakap (C)" position="bottom">
              <button
                type="button"
                onClick={() => handleBatchFill('C')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-colors cursor-pointer"
              >
                <Check size={12} />
                <span>Isi Cakap (C)</span>
              </button>
            </Tooltip>
            <Tooltip content="Isi semua murid dengan predikat Mahir (M)" position="bottom">
              <button
                type="button"
                onClick={() => handleBatchFill('M')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-bold border border-sky-200 transition-colors cursor-pointer"
              >
                <Check size={12} />
                <span>Isi Mahir (M)</span>
              </button>
            </Tooltip>
            <Tooltip content="Kosongkan nilai kegiatan ini untuk seluruh murid" position="bottom">
              <button
                type="button"
                onClick={() => handleBatchFill('')}
                className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                aria-label="Kosongkan nilai"
              >
                <RotateCcw size={13} />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Legend Skala 3 Tingkat */}
      <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
        <span className="font-bold text-slate-600">Panduan Skala Capaian (Kepka BSKAP 058/2025):</span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
            <b className="text-amber-800">B:</b> Berkembang (Menuju standar)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <b className="text-emerald-800">C:</b> Cakap (Standar kelulusan)
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
            <b className="text-sky-800">M:</b> Mahir (Melampaui standar)
          </span>
        </div>
      </div>

      {/* Tabel Asesmen Matriks */}
      {columns.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-xs border border-slate-200 text-center space-y-2">
          <p className="text-xs text-slate-500">
            Kegiatan <b>&quot;{activeProjek?.tema}&quot;</b> belum memiliki dimensi dan subdimensi sasaran.
          </p>
          <p className="text-[11px] text-slate-400">
            Silakan buka sub menu <b>Perencanaan Kokurikuler</b> untuk menambahkan dimensi dan mencentang subdimensi.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-auto w-full min-h-[220px] max-h-[calc(100vh-17rem)] overflow-y-auto">
            <table className="w-full border-collapse text-xs whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-700 sticky top-0 z-20 shadow-xs border-b border-slate-200">
                {/* Header Baris 1: Dimensi */}
                <tr>
                  <th 
                    rowSpan={2} 
                    className="border border-slate-200 p-2.5 w-12 text-center bg-slate-100 sticky left-0 z-30 font-bold"
                  >
                    No
                  </th>
                  <th 
                    rowSpan={2} 
                    className="border border-slate-200 p-2.5 text-center min-w-[200px] sticky left-12 z-30 bg-slate-100 shadow-[1px_0_0_0_#e2e8f0] font-bold"
                  >
                    Nama Murid
                  </th>
                  {currentDims.map(d => {
                    const subCount = (d.subdimensi && d.subdimensi.length > 0) ? d.subdimensi.length : 1;
                    return (
                      <th
                        key={d.id}
                        colSpan={subCount}
                        className="border border-slate-200 p-2 text-center bg-sky-50/70 font-bold text-sky-900 text-[11px] uppercase tracking-wider"
                      >
                        {d.nama}
                      </th>
                    );
                  })}
                </tr>

                {/* Header Baris 2: Subdimensi Interaktif */}
                <tr>
                  {columns.map(col => (
                    <th
                      key={col.subKey}
                      className="border border-slate-200 p-1.5 min-w-[140px] max-w-[200px] text-center font-semibold bg-slate-50 text-[11px] text-slate-700"
                    >
                      <Tooltip content="Klik untuk melihat uraian capaian (Berkembang, Cakap, Mahir)" position="top" className="w-full">
                        <button
                          type="button"
                          onClick={() => col.deskriptor && setActiveDeskriptorModal({
                            dimName: col.dimName,
                            subName: col.subName,
                            deskriptor: col.deskriptor
                          })}
                          className="inline-flex items-center justify-center gap-1.5 w-full hover:text-sky-700 hover:bg-sky-50 px-2 py-1 rounded-md transition-colors cursor-pointer group"
                        >
                          <span className="truncate">{col.subName}</span>
                          <Info size={13} className="text-sky-500 group-hover:text-sky-700 shrink-0" />
                        </button>
                      </Tooltip>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {siswa.map((student, sIdx) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-slate-50/50 focus-within:bg-sky-50/20 transition-colors"
                  >
                    <td className="border border-slate-200 p-2 text-center sticky left-0 bg-white z-10 font-mono text-slate-400">
                      {sIdx + 1}
                    </td>
                    <td className="border border-slate-200 p-2 font-medium sticky left-12 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0] text-slate-800 truncate">
                      {student.nama}
                    </td>

                    {columns.map(col => {
                      const score = getStudentScore(student.id, col);
                      const style = score ? SKALA_KOKURIKULER[score]?.color : 'text-slate-400 bg-transparent';

                      return (
                        <td 
                          key={col.subKey} 
                          className="border border-slate-200 p-0 text-center relative"
                        >
                          <select
                            value={score}
                            onChange={(e) => handleScoreChange(student.id, col, e.target.value as any)}
                            className={`w-full h-full p-2 outline-none text-center font-bold text-xs appearance-none cursor-pointer transition-colors ${style} focus:ring-2 focus:ring-sky-500/30 focus:ring-inset`}
                          >
                            <option value="" className="text-slate-400 font-normal">-</option>
                            <option value="M" className="text-sky-700 font-bold">M (Mahir)</option>
                            <option value="C" className="text-emerald-700 font-bold">C (Cakap)</option>
                            <option value="B" className="text-amber-700 font-bold">B (Berkembang)</option>
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
