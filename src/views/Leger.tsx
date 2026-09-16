import { useAppStore } from '@/store';

export default function Leger() {
  const { state } = useAppStore();
  const { siswa, nilai, tujuanPembelajaran, mapel } = state;
  const displayedMapel = mapel.filter(m => m.tampilRapor !== false);

  const getNilaiAkhir = (studentId: string, mapelId: string) => {
    const s = nilai[studentId]?.[mapelId];
    if (!s) return null;

    const mapelTps = tujuanPembelajaran.filter(tp => tp.mapelId === mapelId);
    let totalTp = 0;
    let countTp = 0;

    mapelTps.forEach(tp => {
      const score = s.tpScores[tp.id];
      if (typeof score === 'number') {
        totalTp += score;
        countTp++;
      }
    });

    const avgFormatif = countTp > 0 ? totalTp/countTp : 0;
    const sumatif = s.sumatifAkhir ?? 0;

    if (countTp === 0 && s.sumatifAkhir === null) return null;

    // Sederhananya, jika nilai salah satu kosong, kita hitung rata-rata dari yang ada
    let totalComponents = 0;
    let finalScore = 0;

    if (countTp > 0) {
      finalScore += avgFormatif;
      totalComponents++;
    }
    if (s.sumatifAkhir !== null) {
      finalScore += sumatif;
      totalComponents++;
    }

    if (totalComponents === 0) return null;
    return Math.round(finalScore/totalComponents);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-8rem)]">
      <h2 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100 shrink-0">Leger Nilai (Rekapitulasi)</h2>

      <div className="overflow-hidden rounded-xl border border-slate-200 flex-1">
        <div className="overflow-auto w-full h-full">
          <table className="w-full border-collapse text-sm whitespace-nowrap">
            <thead className="bg-slate-100 sticky top-0 z-20">
              <tr className="text-slate-600">
                <th rowSpan={2} className="border border-slate-200 p-3 w-10 text-center sticky left-0 z-30 bg-slate-100">No</th>
                <th rowSpan={2} className="border border-slate-200 p-3 text-left w-48 sticky left-10 z-30 bg-slate-100 shadow-[1px_0_0_0_#e2e8f0]">Nama Siswa</th>
                <th colSpan={displayedMapel.length} className="border border-slate-200 p-2 text-center text-[10px] uppercase font-bold tracking-wider">Nilai Rapor Mata Pelajaran</th>
                <th rowSpan={2} className="border border-slate-200 p-3 w-20 text-center font-bold bg-slate-50 text-[10px] uppercase tracking-wider">Jumlah</th>
                <th rowSpan={2} className="border border-slate-200 p-3 w-20 text-center font-bold bg-slate-50 text-[10px] uppercase tracking-wider">Rerata</th>
              </tr>
              <tr className="text-slate-600">
                {displayedMapel.map((m) => (
                  <th key={m.id} className="border border-slate-200 p-2 w-16 text-center text-xs font-semibold bg-slate-50 cursor-help group relative">
                    {m.kode.toUpperCase()}
                    <span className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all bg-slate-800 text-white text-[10px] font-normal tracking-normal normal-case rounded px-2.5 py-1.5 bottom-full mb-1 left-1/2 -translate-x-1/2 z-[100] pointer-events-none shadow-sm min-w-max text-center before:absolute before:-bottom-1 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-800">{m.nama}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {siswa.map((s, i) => {
                let totalScore = 0;
                let countScore = 0;

                const mapelScores = displayedMapel.map(m => {
                  const final = getNilaiAkhir(s.id, m.id);
                  if (final !== null) {
                    totalScore += final;
                    countScore++;
                  }
                  return final;
                });

                const rataRata = countScore > 0 ? (totalScore/countScore).toFixed(1) : null;
                const bulatRata = countScore > 0 ? Math.round(totalScore/countScore) : null;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="border border-slate-200 p-3 text-center sticky left-0 bg-white z-10 font-mono text-slate-400">{i + 1}</td>
                    <td className="border border-slate-200 p-3 truncate sticky left-10 bg-white z-10 shadow-[1px_0_0_0_#e2e8f0] font-medium">{s.nama}</td>
                    
                    {mapelScores.map((score, idx) => (
                      <td key={idx} className="border border-slate-200 p-3 text-center text-slate-700">
                        {score !== null ? score : <span className="text-slate-300">-</span>}
                      </td>
                    ))}
                    
                    <td className="border border-slate-200 p-3 text-center font-bold text-slate-500 bg-slate-50/30">
                      {totalScore || '-'}
                    </td>
                    <td className="border border-slate-200 p-3 text-center font-bold text-slate-950 bg-slate-50/30">
                      {bulatRata !== null ? bulatRata : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
