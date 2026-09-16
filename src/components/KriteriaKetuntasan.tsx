import React, { useState, useRef, useEffect } from 'react';
import { Mapel } from '../types';
import { useAppStore } from '../store';
import { Info, Settings2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  mapelId: string;
}


const MultiThumbSlider = ({ values, onChange, disabled }: { values: number[], onChange: (v: number[]) => void, disabled?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const handlePointerDown = (index: number) => (e: React.PointerEvent) => {
    if (disabled) return;
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
      <div className="absolute inset-y-4 left-3 right-3 rounded-lg overflow-hidden flex shadow-inner">
         <div className="bg-rose-200/90 transition-all duration-75" style={{ width: `${values[0]}%` }} />
         <div className="bg-orange-200/90 transition-all duration-75" style={{ width: `${values[1] - values[0]}%` }} />
         <div className="bg-amber-200/90 transition-all duration-75" style={{ width: `${values[2] - values[1]}%` }} />
         <div className="bg-emerald-200/90 transition-all duration-75" style={{ width: `${values[3] - values[2]}%` }} />
         <div className="bg-teal-200/90 transition-all duration-75" style={{ width: `${100 - values[3]}%` }} />
      </div>

      {values.map((val, idx) => (
        <div
          key={idx}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handlePointerDown(idx)(e); }}
          className={`absolute top-1/2 -translate-y-1/2 -ml-3 w-6 h-6 rounded-full bg-white border flex items-center justify-center transition-transform shadow-md z-10 ${disabled ? 'cursor-default opacity-90 border-slate-200' : 'cursor-grab hover:scale-110 active:cursor-grabbing hover:border-indigo-500'} ${draggingIdx === idx ? 'border-indigo-600 scale-125 z-20 shadow-lg cursor-grabbing ring-4 ring-indigo-100' : 'border-slate-300'}`}
          style={{ left: `calc(${val}% + 12px)`, touchAction: 'none' }}
        >
          <div className="flex gap-[2px]">
             <div className="w-[1.5px] h-2.5 bg-slate-300 rounded-full" />
             <div className="w-[1.5px] h-2.5 bg-slate-300 rounded-full" />
          </div>
          
          <div className={`absolute -bottom-7 w-8 text-center text-[11px] font-bold transition-colors ${draggingIdx === idx ? 'text-indigo-700 scale-110' : 'text-slate-600'}`}>
             {val}
          </div>
        </div>
      ))}
      
      {/* 0 and 100 markers */}
      <div className="absolute -bottom-3 left-0 text-[10px] font-bold text-slate-400">0</div>
      <div className="absolute -bottom-3 right-0 text-[10px] font-bold text-slate-400">100</div>
    </div>
  );
};

export const KriteriaKetuntasan: React.FC<Props> = ({ mapelId }) => {
  const { state, updateState } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const mapelList = state.mapel;
  const mapelIndex = mapelList.findIndex(m => m.id === mapelId);
  const mapel = mapelList[mapelIndex];
  
  if (!mapel) return null;

  const defaultIntervals = [20, 40, 60, 80];
  const currentIntervals = mapel.intervalBatas || defaultIntervals;
  
  const [tempIntervals, setTempIntervals] = useState<number[]>([...currentIntervals]);

  const handleSave = () => {
    const newMapelList = [...mapelList];
    newMapelList[mapelIndex] = { ...mapel, intervalBatas: tempIntervals };
    updateState('mapel', newMapelList);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempIntervals([...currentIntervals]);
    setIsEditing(false);
  };

  const handleChange = (index: number, value: string) => {
    const val = parseInt(value, 10);
    if (isNaN(val)) return;
    
    const newIntervals = [...tempIntervals];
    newIntervals[index] = val;
    setTempIntervals(newIntervals);
  };

  // Helper to validate if intervals are strictly increasing and within 1-99
  const isValid = tempIntervals[0] > 0 && 
                  tempIntervals[0] < tempIntervals[1] &&
                  tempIntervals[1] < tempIntervals[2] &&
                  tempIntervals[2] < tempIntervals[3] &&
                  tempIntervals[3] < 100;

  return (
    <div className="bg-slate-50 border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-indigo-600" />
          <h3 className="text-[12px] font-bold text-slate-800">Pengaturan Interval Ketercapaian (KKTP)</h3>
          {!isExpanded && <span className="text-[11px] text-slate-500 font-medium ml-2 border px-2 py-0.5 rounded-full bg-white">Batas Tuntas: &gt; {currentIntervals[2]}</span>}
        </div>
        <button className="text-slate-400 hover:text-slate-600">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm mb-4">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
              <div className="text-[11px] text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-700 mb-1">Panduan Penetapan Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)</p>
                <p className="mb-2">
                  Sesuai <b>Panduan Pembelajaran dan Asesmen Edisi Revisi 2025</b>, aplikasi ini menggunakan <b>Rentang Interval Nilai</b> untuk mengonversi angka sumatif menjadi deskripsi kualitatif di rapor.
                </p>
                <p className="mb-2 italic text-slate-500">
                  "Kriteria yang digunakan untuk menentukan apakah murid telah mencapai tujuan pembelajaran dapat dikembangkan pendidik dengan menggunakan... skala atau interval nilai" (Hal. 40).
                </p>
                <p>
                  Sistem telah mengatur interval default (berdasarkan contoh baku panduan Hal. 44-45). Anda berhak menyesuaikan batas angka di bawah ini khusus untuk mata pelajaran <b>{mapel.nama}</b> sesuai tingkat kesulitan materi. Nilai di atas batas kuning (&gt;{tempIntervals[2]}) dianggap <b>TUNTAS</b>.
                </p>
                <p className="mt-3 text-indigo-700 font-semibold">
                  👉 <span className="cursor-pointer hover:underline" onClick={() => { const btn = document.querySelector('[aria-label="Panduan Asesmen 2025"]') || document.evaluate('//button[contains(., "Panduan Asesmen 2025")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; if(btn) btn.click(); }}>Baca penjelasan lengkap tentang Panduan Penilaian 2025 di sini.</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-bold text-slate-700">Interval Nilai & Status Capaian</h4>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded hover:bg-indigo-100 transition-colors"
                >
                  Sesuaikan Interval
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={handleCancel}
                    className="text-[10px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={!isValid}
                    className="text-[10px] font-bold text-white bg-emerald-600 px-3 py-1 rounded hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-[10px] mb-6">
              <div className="font-bold text-rose-700">Belum<br/>(Bimbingan)</div>
              <div className="font-bold text-orange-600">Belum<br/>(Remedial Sebagian)</div>
              <div className="font-bold text-amber-600">Hampir<br/>(Perlu Peningkatan)</div>
              <div className="font-bold text-emerald-600">Sudah<br/>(Tuntas)</div>
              <div className="font-bold text-teal-700">Sudah<br/>(Pengayaan)</div>
            </div>

            <MultiThumbSlider 
              values={isEditing ? tempIntervals : currentIntervals} 
              onChange={setTempIntervals} 
              disabled={!isEditing} 
            />
            
            {isEditing && !isValid && (
              <p className="text-[10px] text-rose-500 mt-3 font-medium text-center">
                Rentang angka harus berurutan membesar dan berada di antara 1 - 99.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
