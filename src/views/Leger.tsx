import { useAppStore } from '@/store';
import { isPabpMapel, filterTpsForStudent } from '@/lib/agamaUtils';
import { hitungNilaiMapel } from '@/lib/penilaianUtils';
import Tooltip from '@/components/Tooltip';
import { Download, Table } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Leger() {
  const { state } = useAppStore();
  const { siswa, nilai, tujuanPembelajaran, mapel, sekolah } = state;
  const displayedMapel = mapel.filter(m => m.tampilRapor !== false);

  const getNilaiData = (studentId: string, mapelId: string) => {
    const sNilai = nilai[studentId]?.[mapelId];
    const mapelObj = mapel.find(m => m.id === mapelId);
    if (!mapelObj) return null;

    const student = siswa.find(sw => sw.id === studentId);
    const isPabp = isPabpMapel(mapelObj.nama, mapelObj.kode);

    const allMapelTps = tujuanPembelajaran.filter(tp => tp.mapelId === mapelId);
    const mapelTps = isPabp
      ? filterTpsForStudent(allMapelTps, student?.agama, true)
      : allMapelTps;

    return hitungNilaiMapel(mapelObj, mapelTps, sNilai);
  };

  const handleExportLeger = () => {
    const headers = ['No', 'NISN', 'Nama Siswa'];
    displayedMapel.forEach(m => {
      headers.push(m.kode.toUpperCase());
    });
    headers.push('Jumlah', 'Rerata');

    const rows = siswa.map((s, idx) => {
      let total = 0;
      let count = 0;
      const rowData: (string | number)[] = [idx + 1, s.nisn || '', s.nama];

      displayedMapel.forEach(m => {
        const res = getNilaiData(s.id, m.id);
        if (res && res.finalScore !== null) {
          rowData.push(res.finalScore);
          total += res.finalScore;
          count++;
        } else {
          rowData.push('');
        }
      });

      rowData.push(count > 0 ? total : '');
      rowData.push(count > 0 ? (total / count).toFixed(1) : '');
      return rowData;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leger_Nilai');
    XLSX.writeFile(workbook, `Leger_Nilai_${sekolah.nama || 'Sekolah'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <Table size={20} />
            </span>
            <h2 className="text-lg font-bold text-slate-800">Leger Nilai (Rekapitulasi Hasil Belajar)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rekap nilai akhir intrakurikuler seluruh mata pelajaran berbasis asesmen sumatif 2025.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportLeger}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Download size={15} />
          <span>Unduh Leger Excel</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 flex-1 bg-white">
        <div className="overflow-auto w-full h-full">
          <table className="w-full border-collapse text-sm whitespace-nowrap">
            <thead className="bg-slate-100 sticky top-0 z-20">
              <tr className="text-slate-600">
                <th rowSpan={2} className="border border-slate-200 p-3 w-10 text-center sticky left-0 z-30 bg-slate-100">No</th>
                <th rowSpan={2} className="border border-slate-200 p-3 text-left w-52 sticky left-10 z-30 bg-slate-100 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] font-bold text-slate-700">Nama Siswa</th>
                <th colSpan={displayedMapel.length} className="border border-slate-200 p-2 text-center text-[10px] uppercase font-bold tracking-wider text-slate-700">Nilai Rapor Mata Pelajaran</th>
                <th rowSpan={2} className="border border-slate-200 p-3 w-20 text-center font-bold bg-slate-50 text-[10px] uppercase tracking-wider text-slate-700">Jumlah</th>
                <th rowSpan={2} className="border border-slate-200 p-3 w-20 text-center font-bold bg-indigo-50 text-[10px] uppercase tracking-wider text-indigo-950">Rerata</th>
              </tr>
              <tr className="text-slate-600">
                {displayedMapel.map((m) => (
                  <th key={m.id} className="border border-slate-200 p-2 w-16 text-center text-xs font-semibold bg-slate-50 cursor-help group relative">
                    <span className="font-bold text-slate-800">{m.kode.toUpperCase()}</span>
                    <span className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all bg-slate-900 text-white text-[10px] font-normal tracking-normal normal-case rounded px-2.5 py-1.5 top-full mt-1.5 left-1/2 -translate-x-1/2 z-[100] pointer-events-none shadow-xl min-w-max text-center border border-slate-700 before:content-[''] before:absolute before:-top-1 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-b-slate-900">
                      {m.nama} (KKTP: {m.kktp ?? 70})
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {siswa.map((s, i) => {
                let totalScore = 0;
                let countScore = 0;

                const mapelResults = displayedMapel.map(m => {
                  const res = getNilaiData(s.id, m.id);
                  if (res && res.finalScore !== null) {
                    totalScore += res.finalScore;
                    countScore++;
                  }
                  return { mapel: m, res };
                });

                const rataRata = countScore > 0 ? (totalScore / countScore).toFixed(1) : null;

                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="border border-slate-200 p-2.5 text-center sticky left-0 bg-white z-10 font-mono text-slate-400 text-xs">
                      {i + 1}
                    </td>
                    <td className="border border-slate-200 p-2.5 truncate sticky left-10 bg-white z-10 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)] font-semibold text-slate-800 text-xs">
                      {s.nama}
                    </td>
                    
                    {mapelResults.map(({ mapel: m, res }, idx) => {
                      const score = res?.finalScore ?? null;
                      const kktp = m.kktp ?? 70;
                      const isBelow = score !== null && score < kktp;
                      const hasRemedialTp = (res?.tpsBelumTercapaiCount || 0) > 0;

                      return (
                        <td key={idx} className="border border-slate-200 p-2.5 text-center text-xs font-medium">
                          {score !== null ? (
                            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-mono font-bold ${
                              isBelow 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                : 'text-slate-800'
                            }`}>
                              {score}
                              {hasRemedialTp && (
                                <Tooltip content={`${res?.tpsBelumTercapaiCount} TP belum mencapai KKTP (*)`} position="top">
                                  <span className="text-rose-600 font-extrabold text-sm ml-0.5 cursor-help">
                                    *
                                  </span>
                                </Tooltip>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-mono">-</span>
                          )}
                        </td>
                      );
                    })}
                    
                    <td className="border border-slate-200 p-2.5 text-center font-bold text-slate-700 bg-slate-50/40 text-xs font-mono">
                      {countScore > 0 ? totalScore : '-'}
                    </td>
                    <td className="border border-slate-200 p-2.5 text-center font-extrabold text-indigo-700 bg-indigo-50/50 text-xs font-mono">
                      {rataRata !== null ? rataRata : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-3 text-[11px] text-slate-500 flex items-center justify-between">
        <p>
          <span className="text-rose-600 font-bold">*</span> Tanda bintang mengindikasikan adanya TP yang belum mencapai kriteria ketercapaian (Panduan Asesmen 2025 Hal. 55).
        </p>
        <p className="font-medium text-slate-600">Total Siswa: {siswa.length} orang</p>
      </div>
    </div>
  );
}
