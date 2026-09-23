import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store';
import { 
  X, 
  SlidersHorizontal, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  ShieldCheck, 
  Layers
} from 'lucide-react';

interface ModalKktpProps {
  isOpen: boolean;
  onClose: () => void;
  mapelId: string;
  onSuccess?: (message: string) => void;
  onSelectMapel?: (mapelId: string) => void;
}

// Multi-Thumb Slider Component
const MultiThumbSlider = ({ 
  values, 
  onChange 
}: { 
  values: number[]; 
  onChange: (v: number[]) => void; 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const handlePointerDown = (index: number) => (e: React.PointerEvent) => {
    setDraggingIdx(index);
    e.preventDefault();
  };

  useEffect(() => {
    if (draggingIdx === null) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let percentage = ((e.clientX - rect.left) / rect.width) * 100;
      percentage = Math.round(Math.max(0, Math.min(100, percentage)));

      const min = draggingIdx === 0 ? 1 : values[draggingIdx - 1] + 1;
      const max = draggingIdx === 3 ? 99 : values[draggingIdx + 1] - 1;
      const clamped = Math.max(min, Math.min(max, percentage));

      if (clamped !== values[draggingIdx]) {
        const newValues = [...values];
        newValues[draggingIdx] = clamped;
        onChange(newValues);
      }
    };

    const handlePointerUp = () => {
      setDraggingIdx(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingIdx, values, onChange]);

  return (
    <div className="relative w-full h-16 flex items-center select-none px-3" ref={containerRef}>
      {/* 5 Colored Zones */}
      <div className="absolute inset-y-4 left-3 right-3 rounded-xl overflow-hidden flex shadow-inner border border-slate-200/80">
        <div 
          className="bg-rose-200/90 hover:bg-rose-300/80 transition-all duration-75 flex items-center justify-center text-[9px] font-bold text-rose-800/60 overflow-hidden" 
          style={{ width: `${values[0]}%` }}
        >
          {values[0] >= 12 && 'Bimbingan'}
        </div>
        <div 
          className="bg-orange-200/90 hover:bg-orange-300/80 transition-all duration-75 flex items-center justify-center text-[9px] font-bold text-orange-800/60 overflow-hidden" 
          style={{ width: `${values[1] - values[0]}%` }}
        >
          {values[1] - values[0] >= 12 && 'Remedial'}
        </div>
        <div 
          className="bg-amber-200/90 hover:bg-amber-300/80 transition-all duration-75 flex items-center justify-center text-[9px] font-bold text-amber-800/60 overflow-hidden" 
          style={{ width: `${values[2] - values[1]}%` }}
        >
          {values[2] - values[1] >= 12 && 'Hampir'}
        </div>
        <div 
          className="bg-emerald-200/90 hover:bg-emerald-300/80 transition-all duration-75 flex items-center justify-center text-[9px] font-bold text-emerald-800/70 overflow-hidden" 
          style={{ width: `${values[3] - values[2]}%` }}
        >
          {values[3] - values[2] >= 12 && 'Tuntas'}
        </div>
        <div 
          className="bg-teal-200/90 hover:bg-teal-300/80 transition-all duration-75 flex items-center justify-center text-[9px] font-bold text-teal-800/70 overflow-hidden" 
          style={{ width: `${100 - values[3]}%` }}
        >
          {100 - values[3] >= 10 && 'Pengayaan'}
        </div>
      </div>

      {/* 4 Thumbs */}
      {values.map((val, idx) => (
        <div
          key={idx}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            handlePointerDown(idx)(e);
          }}
          className={`absolute top-1/2 -translate-y-1/2 -ml-3.5 w-7 h-7 rounded-full bg-white border flex items-center justify-center transition-transform shadow-md z-10 cursor-grab hover:scale-110 active:cursor-grabbing hover:border-indigo-500 ${
            draggingIdx === idx
              ? 'border-indigo-600 scale-125 z-20 shadow-lg cursor-grabbing ring-4 ring-indigo-100'
              : 'border-slate-300'
          }`}
          style={{ left: `calc(${val}% + 12px)`, touchAction: 'none' }}
        >
          <div className="flex gap-[2px]">
            <div className="w-[1.5px] h-3 bg-slate-400 rounded-full" />
            <div className="w-[1.5px] h-3 bg-slate-400 rounded-full" />
          </div>

          <div
            className={`absolute -bottom-6 w-9 text-center text-[10px] font-black transition-colors ${
              draggingIdx === idx ? 'text-indigo-700 scale-110' : 'text-slate-700'
            }`}
          >
            {val}
          </div>
        </div>
      ))}

      {/* 0 and 100 markers */}
      <div className="absolute -bottom-2 left-1 text-[9px] font-bold text-slate-400">0</div>
      <div className="absolute -bottom-2 right-1 text-[9px] font-bold text-slate-400">100</div>
    </div>
  );
};

export const ModalKktp: React.FC<ModalKktpProps> = ({
  isOpen,
  onClose,
  mapelId,
  onSuccess,
  onSelectMapel
}) => {
  const { state, updateState } = useAppStore();
  const mapelList = state.mapel;
  
  const [selectedMapelId, setSelectedMapelId] = useState<string>(mapelId);

  const defaultIntervals = [20, 40, 60, 80];

  const currentMapel = mapelList.find(m => m.id === selectedMapelId) || mapelList.find(m => m.id === mapelId) || mapelList[0];
  const initialIntervals = currentMapel?.intervalBatas || defaultIntervals;

  const [tempIntervals, setTempIntervals] = useState<number[]>([...initialIntervals]);
  const [applyToAll, setApplyToAll] = useState<boolean>(false);

  // Sync when mapelId or modal opens
  useEffect(() => {
    if (isOpen && mapelId) {
      setSelectedMapelId(mapelId);
      const targetMapel = mapelList.find(m => m.id === mapelId);
      if (targetMapel) {
        setTempIntervals([...(targetMapel.intervalBatas || defaultIntervals)]);
      }
      setApplyToAll(false);
    }
  }, [isOpen, mapelId, mapelList]);

  if (!isOpen || !currentMapel) return null;

  // Handler ganti mapel via dropdown di dalam modal
  const handleMapelChange = (newMapelId: string) => {
    setSelectedMapelId(newMapelId);
    const targetMapel = mapelList.find(m => m.id === newMapelId);
    if (targetMapel) {
      setTempIntervals([...(targetMapel.intervalBatas || defaultIntervals)]);
    }
    onSelectMapel?.(newMapelId);
  };

  // Validation: 0 < v0 < v1 < v2 < v3 < 100
  const isValid = 
    tempIntervals[0] > 0 &&
    tempIntervals[0] < tempIntervals[1] &&
    tempIntervals[1] < tempIntervals[2] &&
    tempIntervals[2] < tempIntervals[3] &&
    tempIntervals[3] < 100;

  const handleInputChange = (index: number, valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val)) return;
    const clamped = Math.max(1, Math.min(99, val));
    const next = [...tempIntervals];
    next[index] = clamped;
    setTempIntervals(next);
  };

  const handleApplyPreset = (preset: number[]) => {
    setTempIntervals([...preset]);
  };

  const handleSave = () => {
    if (!isValid) return;

    if (applyToAll) {
      const updatedList = mapelList.map(m => ({
        ...m,
        intervalBatas: [...tempIntervals],
        kktp: tempIntervals[2] // ambang batas tuntas (kategori 3)
      }));
      updateState('mapel', updatedList);
      onSuccess?.(`Interval KKTP berhasil diterapkan serentak ke SELURUH (${mapelList.length}) mata pelajaran!`);
    } else {
      const updatedList = mapelList.map(m => 
        m.id === currentMapel.id 
          ? { ...m, intervalBatas: [...tempIntervals], kktp: tempIntervals[2] } 
          : m
      );
      updateState('mapel', updatedList);
      onSuccess?.(`Interval KKTP untuk mata pelajaran ${currentMapel.nama} berhasil diperbarui!`);
    }

    onClose();
  };

  const presets = [
    { label: 'Standar Baku Panduan (20, 40, 60, 80)', values: [20, 40, 60, 80], desc: 'Tuntas > 60' },
    { label: 'Skala 70 (35, 55, 70, 85)', values: [35, 55, 70, 85], desc: 'Tuntas > 70' },
    { label: 'Skala 75 (45, 60, 75, 88)', values: [45, 60, 75, 88], desc: 'Tuntas > 75' },
    { label: 'Skala 80 (55, 70, 80, 92)', values: [55, 70, 80, 92], desc: 'Tuntas > 80' },
  ];

  const batasTuntas = tempIntervals[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Pengaturan Interval Ketercapaian (KKTP)
              </h2>
              <p className="text-[11px] text-slate-400">
                Kriteria Ketercapaian Tujuan Pembelajaran • Panduan Kurikulum Merdeka (2025/2026)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Active Mapel Dropdown Selector + Ambang Tuntas */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs shrink-0">
                {currentMapel.kode.substring(0, 3)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label htmlFor="modal-mapel-select" className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                    Mata Pelajaran:
                  </label>
                  {applyToAll && (
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                      Mode Semua Mapel
                    </span>
                  )}
                </div>
                <select
                  id="modal-mapel-select"
                  value={selectedMapelId}
                  disabled={applyToAll}
                  onChange={(e) => handleMapelChange(e.target.value)}
                  className={`w-full text-xs font-bold rounded-lg px-2.5 py-1.5 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer truncate transition border ${
                    applyToAll
                      ? 'bg-slate-100/90 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-800 border-indigo-200 hover:border-indigo-400'
                  }`}
                >
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama} ({m.kode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-indigo-200/80 shadow-2xs shrink-0 self-start sm:self-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-700">Ambang Tuntas:</span>
              <span className="text-xs font-black font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                &gt; {batasTuntas}
              </span>
            </div>
          </div>

          {/* Opsi Terapkan ke Seluruh Mapel */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer accent-indigo-600"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-xs text-slate-800 block flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Terapkan interval KKTP ini ke SEMUA mata pelajaran sekaligus
                </span>
                <span className="text-[11px] text-slate-500 block leading-relaxed">
                  {applyToAll 
                    ? `Perubahan ini akan disimpan serentak ke seluruh ${mapelList.length} mata pelajaran di kelas ini.` 
                    : `Jika tidak dicentang, pengaturan hanya berlaku untuk ${currentMapel.nama}.`}
                </span>
              </div>
            </label>
          </div>

          {/* Presets Cepat */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Pilihan Cepat Standar (Presets):
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presets.map((p) => {
                const isSelected = 
                  tempIntervals[0] === p.values[0] &&
                  tempIntervals[1] === p.values[1] &&
                  tempIntervals[2] === p.values[2] &&
                  tempIntervals[3] === p.values[3];

                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p.values)}
                    className={`p-2 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-200'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-bold text-[11px] block">{p.desc}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {p.values.join(' • ')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Multi-Thumb Slider */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800">
                Visual Rentang Skala Nilai (0 - 100)
              </h4>
              <span className="text-[11px] text-slate-500">
                Geser bulatan atau ketik angka di bawah
              </span>
            </div>

            {/* Slider */}
            <MultiThumbSlider values={tempIntervals} onChange={setTempIntervals} />

            {/* 5 Kategori Status Capaian & Input Angka */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center pt-2">
              {/* Kategori 1: Perlu Bimbingan */}
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 flex flex-col items-center">
                <span className="text-[10px] font-bold text-rose-800 leading-tight">
                  Perlu Bimbingan
                </span>
                <span className="text-[9px] text-rose-600 font-medium mt-0.5">
                  0 - {tempIntervals[0]}
                </span>
                <div className="mt-2 flex items-center justify-center">
                  <input
                    type="number"
                    min="1"
                    max={tempIntervals[1] - 1}
                    value={tempIntervals[0]}
                    onChange={(e) => handleInputChange(0, e.target.value)}
                    className="w-12 text-center text-xs font-black bg-white border border-rose-300 rounded-lg py-1 text-rose-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Kategori 2: Remedial Sebagian */}
              <div className="p-2 rounded-xl bg-orange-50 border border-orange-200 flex flex-col items-center">
                <span className="text-[10px] font-bold text-orange-800 leading-tight">
                  Remedial Sebagian
                </span>
                <span className="text-[9px] text-orange-600 font-medium mt-0.5">
                  {tempIntervals[0] + 1} - {tempIntervals[1]}
                </span>
                <div className="mt-2 flex items-center justify-center">
                  <input
                    type="number"
                    min={tempIntervals[0] + 1}
                    max={tempIntervals[2] - 1}
                    value={tempIntervals[1]}
                    onChange={(e) => handleInputChange(1, e.target.value)}
                    className="w-12 text-center text-xs font-black bg-white border border-orange-300 rounded-lg py-1 text-orange-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Kategori 3: Perlu Peningkatan */}
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center">
                <span className="text-[10px] font-bold text-amber-800 leading-tight">
                  Perlu Peningkatan
                </span>
                <span className="text-[9px] text-amber-600 font-medium mt-0.5">
                  {tempIntervals[1] + 1} - {tempIntervals[2]}
                </span>
                <div className="mt-2 flex items-center justify-center">
                  <input
                    type="number"
                    min={tempIntervals[1] + 1}
                    max={tempIntervals[3] - 1}
                    value={tempIntervals[2]}
                    onChange={(e) => handleInputChange(2, e.target.value)}
                    className="w-12 text-center text-xs font-black bg-white border border-amber-300 rounded-lg py-1 text-amber-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-amber-500 ring-2 ring-amber-400/40"
                  />
                </div>
              </div>

              {/* Kategori 4: Tuntas */}
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col items-center">
                <span className="text-[10px] font-bold text-emerald-800 leading-tight">
                  Sudah Tuntas
                </span>
                <span className="text-[9px] text-emerald-600 font-medium mt-0.5">
                  {tempIntervals[2] + 1} - {tempIntervals[3]}
                </span>
                <div className="mt-2 flex items-center justify-center">
                  <input
                    type="number"
                    min={tempIntervals[2] + 1}
                    max="99"
                    value={tempIntervals[3]}
                    onChange={(e) => handleInputChange(3, e.target.value)}
                    className="w-12 text-center text-xs font-black bg-white border border-emerald-300 rounded-lg py-1 text-emerald-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Kategori 5: Pengayaan */}
              <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 flex flex-col items-center">
                <span className="text-[10px] font-bold text-teal-800 leading-tight">
                  Pengayaan
                </span>
                <span className="text-[9px] text-teal-600 font-medium mt-0.5">
                  &gt; {tempIntervals[3]}
                </span>
                <div className="mt-2 flex items-center justify-center py-1 text-xs font-bold text-teal-700">
                  s.d. 100
                </div>
              </div>
            </div>

            {!isValid && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-center">
                ⚠️ Nilai batas harus berurutan naik (1 &lt; Batas 1 &lt; Batas 2 &lt; Batas 3 &lt; Batas 4 &lt; 100).
              </p>
            )}
          </div>

          {/* Catatan Panduan 2025 */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Ketentuan Ketuntasan (Panduan Hal. 40-45):</strong> Murid dinyatakan tuntas pada TP atau Nilai Akhir jika nilainya melebihi batas kategori ketiga (<strong>&gt; {tempIntervals[2]}</strong>). Nilai di bawah atau sama dengan ambang ini akan ditandai tanda bintang (*) sebagai indikasi perlunya pembimbingan remedial.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {applyToAll ? (
              <span className="text-indigo-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Menerapkan ke semua ({mapelList.length}) mata pelajaran
              </span>
            ) : (
              <span>Khusus mapel: <strong>{currentMapel.nama}</strong></span>
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isValid}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{applyToAll ? 'Terapkan ke Semua Mapel' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalKktp;
