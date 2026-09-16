import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';

export default function InputNilai() {
  const { state, updateState } = useAppStore();
  const { siswa, mapel, tujuanPembelajaran, nilai } = state;
  const [selectedMapel, setSelectedMapel] = useState<string>('');

  useEffect(() => {
    if (mapel.length > 0 && !selectedMapel) {
      setSelectedMapel(mapel[0].id);
    }
  }, [mapel, selectedMapel]);
  const mapelTps = tujuanPembelajaran.filter(tp => tp.mapelId === selectedMapel);
  const selectedMapelData = mapel.find(m => m.id === selectedMapel);
  const intervalBatas = selectedMapelData?.intervalBatas || [20, 40, 60, 80];

  const getScoreColorClass = (scoreStr: string | number) => {
    if (scoreStr === '' || scoreStr === null || scoreStr === undefined) return 'bg-transparent text-slate-800';
    const score = Number(scoreStr);
    if (isNaN(score)) return 'bg-transparent text-slate-800';
    if (score <= intervalBatas[0]) return 'bg-rose-50 text-rose-700 font-bold focus:bg-rose-100';
    if (score <= intervalBatas[1]) return 'bg-orange-50 text-orange-700 font-bold focus:bg-orange-100';
    if (score <= intervalBatas[2]) return 'bg-amber-50 text-amber-700 font-bold focus:bg-amber-100';
    if (score <= intervalBatas[3]) return 'bg-emerald-50 text-emerald-700 font-bold focus:bg-emerald-100';
    return 'bg-teal-50 text-teal-700 font-bold focus:bg-teal-100';
  };

  const handleScoreChange = (studentId: string, type: 'tp' | 'sumatifAkhir', tpId: string | undefined, val: string) => {
    // Hindari tipe data string, cegah nilai NaN (Not a Number) dan nilai di luar 0-100
    const rawVal = val.trim();
    const numVal = rawVal === '' ? null : parseFloat(rawVal);
    
    if (numVal !== null && (isNaN(numVal) || numVal < 0 || numVal > 100)) return;

    const studentScores = nilai[studentId] || {};
    const mapelScores = studentScores[selectedMapel] || { tpScores: {}, sumatifAkhir: null };

    if (type === 'tp' && tpId) {
      mapelScores.tpScores = { ...mapelScores.tpScores, [tpId]: numVal };
    } else if (type === 'sumatifAkhir') {
      mapelScores.sumatifAkhir = numVal;
    }

    updateState('nilai', {
      ...nilai,
      [studentId]: {
        ...studentScores,
        [selectedMapel]: mapelScores,
      }
    });
  };

  const getScore = (studentId: string, type: 'tp' | 'sumatifAkhir', tpId?: string) => {
    const s = nilai[studentId]?.[selectedMapel];
    if (!s) return '';
    if (type === 'tp' && tpId) return s.tpScores[tpId] ?? '';
    if (type === 'sumatifAkhir') return s.sumatifAkhir ?? '';
    return '';
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">Input Nilai Akademik</h2>

      <div className="mb-6 max-w-xs">
        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mata Pelajaran</label>
        <select value={selectedMapel} onChange={(e) => setSelectedMapel(e.target.value)} className="w-full border border-slate-200 rounded-lg bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20">
          {mapel.map(m => (
            <option key={m.id} value={m.id}>{m.nama}</option>
          ))}
        </select>
      </div>

      {mapelTps.length === 0 ? (
        <div className="p-4 bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-sm">
          Silakan tambahkan Tujuan Pembelajaran (TP) terlebih dahulu untuk mata pelajaran ini di menu "Tujuan Pembelajaran".
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 flex-1">
          <div className="overflow-auto w-full">
            <table className="w-full border-collapse text-sm whitespace-nowrap">
              <thead className="bg-slate-100 sticky top-0 z-10">
                <tr className="text-slate-600">
                  <th rowSpan={2} className="border border-slate-200 p-3 w-12 text-center bg-slate-100">No</th>
                  <th rowSpan={2} className="border border-slate-200 p-3 text-left w-48 bg-slate-100 sticky left-0 z-10 shadow-[1px_0_0_0_#e2e8f0]">Nama Siswa</th>
                  <th colSpan={mapelTps.length} className="border border-slate-200 p-2 text-center text-[10px] bg-slate-50 font-bold uppercase tracking-wider">Nilai Formatif (NA Sumatif Materi)</th>
                  <th rowSpan={2} className="border border-slate-200 p-2 text-center w-24 bg-slate-50 text-[10px] font-bold uppercase tracking-wider">Sumatif<br/>Akhir Sem.</th>
                </tr>
                <tr className="text-slate-600">
                  {mapelTps.map((tp, idx) => (
                    <th key={tp.id} className="border border-slate-200 p-2 w-16 text-center text-xs font-medium bg-slate-50 cursor-help group relative">
                      TP {idx + 1}
                      <span className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all bg-slate-800 text-white text-[10px] font-normal tracking-normal normal-case rounded px-2.5 py-1.5 bottom-full mb-1 left-1/2 -translate-x-1/2 z-[100] pointer-events-none shadow-sm min-w-[200px] whitespace-normal text-left before:absolute before:-bottom-1 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-800">{tp.deskripsi || 'Tidak ada deskripsi'}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {siswa.map((s, i) => (
                  <tr key={s.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="border border-slate-200 p-3 text-center font-mono text-slate-400">{i + 1}</td>
                    <td className="border border-slate-200 p-3 truncate font-medium sticky left-0 bg-white group-hover:bg-slate-50/30 group-focus-within:bg-slate-50/30 z-10 shadow-[1px_0_0_0_#e2e8f0]">{s.nama}</td>
                    {mapelTps.map(tp => (
                      <td key={tp.id} className="border border-slate-200 p-0 text-center relative focus-within:bg-white">
                        <input 
                          type="number" 
                          min="0" max="100"
                          value={getScore(s.id, 'tp', tp.id)} 
                          onChange={(e) => handleScoreChange(s.id, 'tp', tp.id, e.target.value)}
                          className={`w-full h-full p-2 outline-none text-center transition-colors ${getScoreColorClass(getScore(s.id, 'tp', tp.id))}`} 
                        />
                      </td>
                    ))}
                    <td className="border border-slate-200 p-0 text-center font-semibold relative bg-slate-50/30 focus-within:bg-white">
                      <input 
                        type="number" 
                        min="0" max="100"
                        value={getScore(s.id, 'sumatifAkhir')} 
                        onChange={(e) => handleScoreChange(s.id, 'sumatifAkhir', undefined, e.target.value)}
                        className="w-full h-full p-2 outline-none text-center bg-transparent focus:bg-white text-slate-950 font-bold focus:shadow-inner" 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center text-[11px] text-slate-500">
            <p>Petunjuk: Gunakan tombol <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-sm font-bold mx-1">TAB</kbd> untuk berpindah kolom dengan cepat.</p>
          </div>
        </div>
      )}
    </div>
  );
}
