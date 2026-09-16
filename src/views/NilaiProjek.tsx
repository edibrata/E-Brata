import { useAppStore } from '@/store';
import { NilaiProjek as TNilaiProjek } from '@/types';

export default function NilaiProjek() {
  const { state, updateState } = useAppStore();
  const { siswa, projek, dimensiProjek, nilaiP5 } = state;

  const handleScoreChange = (studentId: string, dimensiId: string, val: TNilaiProjek) => {
    updateState('nilaiP5', {
      ...nilaiP5,
      [studentId]: {
        ...(nilaiP5[studentId] || {}),
        [dimensiId]: val
      }
    });
  };

  const getScore = (studentId: string, dimensiId: string): TNilaiProjek => {
    return nilaiP5[studentId]?.[dimensiId] || '';
  };

  if (projek.length === 0 || dimensiProjek.length === 0) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 text-center">
        <p className="text-gray-500 mb-4">Belum ada Projek atau Dimensi yang didefinisikan.</p>
        <p className="text-sm">Silakan isi Data Projek terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100">Input Nilai Projek Profil Pelajar Pancasila</h2>

      <div className="mb-4 text-xs space-x-4 bg-slate-50/50 p-4 rounded-xl flex flex-wrap border border-slate-100/50">
        <span className="font-bold text-slate-700">Keterangan Penilaian:</span>
        <span className="text-slate-600"><b className="text-slate-800">MB:</b> Mulai Berkembang</span>
        <span className="text-slate-600"><b className="text-slate-800">SB:</b> Sedang Berkembang</span>
        <span className="text-slate-600"><b className="text-slate-800">BSH:</b> Berkembang Sesuai Harapan</span>
        <span className="text-slate-600"><b className="text-slate-800">SAB:</b> Sangat Berkembang</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-auto w-full max-h-[calc(100vh-16rem)]">
          <table className="w-full border-collapse text-sm table-fixed whitespace-nowrap">
            <thead className="bg-slate-100 sticky top-0 z-20">
              <tr className="text-slate-600">
                <th rowSpan={2} className="border border-slate-200 p-3 w-12 text-center bg-slate-100 sticky left-0 z-30">No</th>
                <th rowSpan={2} className="border border-slate-200 p-3 text-left w-48 sticky left-12 z-30 bg-slate-100 shadow-[1px_0_0_0_#e2e8f0]">Nama Siswa</th>
                {projek.map(p => {
                  const dims = dimensiProjek.filter(d => d.projekId === p.id);
                  if (dims.length === 0) return null;
                  return (
                    <th key={p.id} colSpan={dims.length} className="border border-slate-200 p-2 text-center bg-slate-50/80 font-bold uppercase text-[10px] tracking-wider">
                      {p.tema}
                    </th>
                  );
                })}
              </tr>
              <tr className="text-slate-600">
                {projek.map(p => {
                  const dims = dimensiProjek.filter(d => d.projekId === p.id);
                  return dims.map((d, idx) => (
                    <th key={d.id} className="border border-slate-200 p-2 w-24 text-center text-[10px] font-semibold bg-slate-50 cursor-help truncate uppercase tracking-wide group relative">
                      D{idx + 1}: {d.nama.substring(0, 15)}...
                      <span className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all bg-slate-800 text-white text-[10px] font-normal tracking-normal normal-case rounded px-2.5 py-1.5 bottom-full mb-1 left-1/2 -translate-x-1/2 z-[100] pointer-events-none shadow-sm min-w-[200px] whitespace-normal text-center before:absolute before:-bottom-1 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-800">{d.nama}</span>
                    </th>
                  ));
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {siswa.map((s, i) => (
                <tr key={s.id} className="hover:bg-slate-50/30 focus-within:bg-slate-50/50 group transition-colors">
                  <td className="border border-slate-200 p-3 text-center sticky left-0 bg-white z-10 font-mono text-slate-400">{i + 1}</td>
                  <td className="border border-slate-200 p-3 truncate font-medium sticky left-12 bg-white group-hover:bg-slate-50/30 group-focus-within:bg-slate-50/50 z-10 shadow-[1px_0_0_0_#e2e8f0] text-slate-700">{s.nama}</td>
                  
                  {projek.map(p => {
                    const dims = dimensiProjek.filter(d => d.projekId === p.id);
                    return dims.map(d => (
                      <td key={d.id} className="border border-slate-200 p-0 text-center relative max-w-24">
                        <select 
                          value={getScore(s.id, d.id)}
                          onChange={(e) => handleScoreChange(s.id, d.id, e.target.value as TNilaiProjek)}
                          className="w-full h-full p-3 outline-none text-center bg-transparent focus:bg-slate-50 focus:ring-2 focus:ring-inset focus:ring-slate-500/20 appearance-none cursor-pointer font-medium text-slate-700"
                        >
                          <option value=""></option>
                          <option value="MB">MB</option>
                          <option value="SB">SB</option>
                          <option value="BSH">BSH</option>
                          <option value="SAB">SAB</option>
                        </select>
                      </td>
                    ));
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
