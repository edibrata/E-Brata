import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { Printer } from 'lucide-react';

export default function CetakRapor() {
  const { state } = useAppStore();
  const { sekolah, siswa, nilai, tujuanPembelajaran, mapel } = state;
  const displayedMapel = mapel.filter(m => m.tampilRapor !== false);
  const [selectedStudent, setSelectedStudent] = useState<string>(siswa[0]?.id || '');
  const [isTanpaAngka, setIsTanpaAngka] = useState(false);

  // Effect to handle print mode styles
  useEffect(() => {
    const handleBeforePrint = () => {
      document.body.classList.add('print-mode');
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('print-mode');
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const s = siswa.find(s => s.id === selectedStudent);

  const getNilaiDanDeskripsi = (studentId: string, mapelId: string) => {
    const n = nilai[studentId]?.[mapelId];
    if (!n) return { finalScore: null, deskripsiTertinggi: '', deskripsiTerendah: '' };

    const mapelTps = tujuanPembelajaran.filter(tp => tp.mapelId === mapelId);
    let totalTp = 0;
    let countTp = 0;
    let maxTp: { id: string, score: number } | null = null;
    let minTp: { id: string, score: number } | null = null;

    mapelTps.forEach(tp => {
      const score = n.tpScores[tp.id];
      if (typeof score === 'number') {
        totalTp += score;
        countTp++;
        
        if (!maxTp || score > maxTp.score) maxTp = { id: tp.id, score };
        if (!minTp || score < minTp.score) minTp = { id: tp.id, score };
      }
    });

    const avgFormatif = countTp > 0 ? totalTp/countTp : 0;
    const sumatif = n.sumatifAkhir ?? 0;

    let totalComponents = 0;
    let finalScore = 0;

    if (countTp > 0) {
      finalScore += avgFormatif;
      totalComponents++;
    }
    if (n.sumatifAkhir !== null) {
      finalScore += sumatif;
      totalComponents++;
    }

    const finalRata = totalComponents > 0 ? Math.round(finalScore/totalComponents) : null;

    let deskTer = '';
    let deskRendah = '';

    if (maxTp && maxTp.score >= 70) {
      const tp = mapelTps.find(t => t.id === maxTp!.id);
      if (tp) deskTer = `Menunjukkan penguasaan yang sangat baik dalam ${tp.deskripsi.toLowerCase()}.`;
    }
    if (minTp && minTp.score < 70) {
      const tp = mapelTps.find(t => t.id === minTp!.id);
      if (tp) deskRendah = `Perlu bimbingan dalam ${tp.deskripsi.toLowerCase()}.`;
    }

    return { 
      finalScore: finalRata, 
      deskripsiTertinggi: deskTer, 
      deskripsiTerendah: deskRendah 
    };
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Controls - Hidden when printing */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 print:hidden space-y-4">
        <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Cetak Rapor</h2>
        <div className="flex items-end gap-4 max-w-lg">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pilih Siswa</label>
            <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 bg-slate-50 outline-none text-sm font-medium text-slate-700 transition-all cursor-pointer">
              <option value="">-- Pilih Siswa --</option>
              {siswa.map(sw => (
                <option key={sw.id} value={sw.id}>{sw.nama}</option>
              ))}
            </select>
          </div>
          {(sekolah.fase === 'A' || sekolah.kelas === '1' || sekolah.kelas === '2') && (
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" id="tanpaAngka" checked={isTanpaAngka} onChange={e => setIsTanpaAngka(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
              <label htmlFor="tanpaAngka" className="text-xs font-semibold text-slate-700 cursor-pointer">Cetak Rapor Fase A Tanpa Angka</label>
            </div>
          )}
          <button onClick={handlePrint} disabled={!s} className="bg-indigo-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-sm transition-all hover:shadow">
            <Printer size={18} /> Cetak
          </button>
        </div>
      </div>

      {/* Rapor Page - Print area */}
      {s && (
        <div className="rapor-page bg-white p-8 rounded-lg shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">
          
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold uppercase">Laporan Hasil Belajar</h1>
            <h1 className="text-xl font-bold uppercase">(RAPOR)</h1>
          </div>

          {/* Header Info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-8 text-sm">
            <div className="flex">
              <span className="w-32 font-semibold">Nama Peserta Didik</span>
              <span className="w-4">:</span>
              <span className="flex-1 border-b border-dotted border-gray-400 capitalize">{s.nama}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Kelas</span>
              <span className="w-4">:</span>
              <span className="flex-1 border-b border-dotted border-gray-400">{sekolah.kelas}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">NISN</span>
              <span className="w-4">:</span>
              <span className="flex-1 border-b border-dotted border-gray-400">{s.nisn}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Fase</span>
              <span className="w-4">:</span>
              <span className="flex-1 border-b border-dotted border-gray-400">{sekolah.fase}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Sekolah</span>
              <span className="w-4">:</span>
              <span className="flex-1 border-b border-dotted border-gray-400">{sekolah.nama}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Semester</span>
              <span className="w-4">:</span>
              <span className="flex-1 border-b border-dotted border-gray-400">{sekolah.semester}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Alamat</span>
              <span className="w-4">:</span>
              <span className="flex-1 border-b border-dotted border-gray-400">{sekolah.alamat}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold">Tahun Ajaran</span>
              <span className="w-4">:</span>
              <span className="flex-1 border-b border-dotted border-gray-400">{sekolah.tahunAjaran}</span>
            </div>
          </div>

          <div className="font-bold mb-2">A. NILAI AKADEMIK</div>
          
          <table className="w-full border-collapse border border-slate-800 mb-8 text-sm">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-100">
                <th className="border border-slate-800 py-3 px-1 w-10 text-center font-bold text-slate-800 uppercase text-[10px] tracking-wider">No</th>
                <th className="border border-slate-800 py-3 px-3 w-48 text-left font-bold text-slate-800 uppercase text-[10px] tracking-wider">Mata Pelajaran</th>
                {!isTanpaAngka && <th className="border border-slate-800 py-3 px-1 w-16 text-center font-bold text-slate-800 uppercase text-[10px] tracking-wider">Nilai<br/>Akhir</th>}
                <th className="border border-slate-800 py-3 px-3 text-left font-bold text-slate-800 uppercase text-[10px] tracking-wider">Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              {displayedMapel.map((m, idx) => {
                const { finalScore, deskripsiTertinggi, deskripsiTerendah } = getNilaiDanDeskripsi(s.id, m.id);
                
                return (
                  <tr key={m.id} className="even:bg-slate-50/50 print:even:bg-transparent">
                    <td className="border border-slate-800 p-2 text-center align-top font-mono text-xs">{idx + 1}</td>
                    <td className="border border-slate-800 p-2 font-semibold align-top text-slate-800">{m.nama}</td>
                    {!isTanpaAngka && (
                      <td className="border border-slate-800 p-2 text-center font-bold align-top text-slate-800 bg-slate-50/30 print:bg-transparent">
                        {finalScore !== null ? finalScore : ''}
                      </td>
                    )}
                    <td className="border border-slate-800 p-3 text-xs text-justify leading-relaxed align-top space-y-1.5 text-slate-700">
                      {deskripsiTertinggi && <p className="text-emerald-700 font-medium print:text-black">{deskripsiTertinggi}</p>}
                      {deskripsiTerendah && <p className="text-rose-700 font-medium print:text-black">{deskripsiTerendah}</p>}
                      {!deskripsiTertinggi && !deskripsiTerendah && finalScore === null && (
                        <p className="text-slate-400 italic font-medium text-center bg-slate-50 px-2 py-1 rounded print:bg-transparent">Belum ada data nilai</p>
                      )}
                      {!deskripsiTertinggi && !deskripsiTerendah && finalScore !== null && (
                        <p>Capaian kompetensi dalam kategori sangat baik.</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer signatures */}
          <div className="flex justify-between mt-12 text-sm pt-4 font-medium text-slate-800">
            <div className="text-center space-y-16">
              <p>Mengetahui,<br/>Orang Tua/Wali</p>
              <div className="border-b border-slate-800 w-40 mx-auto"></div>
            </div>
            <div className="text-center space-y-16">
              <p>Waringinkurung, ...............................<br/>Wali Kelas</p>
              <div>
                <p className="font-bold underline decoration-1 underline-offset-4">{sekolah.waliKelas}</p>
                <p className="text-slate-600">NIP. {sekolah.nipWaliKelas}</p>
              </div>
            </div>
          </div>
          
          <div className="text-center space-y-16 mt-8 text-sm font-medium text-slate-800">
             <p>Mengetahui,<br/>Kepala Sekolah</p>
             <div>
                <p className="font-bold underline decoration-1 underline-offset-4">{sekolah.kepsek}</p>
                <p className="text-slate-600">NIP. {sekolah.nipKepsek}</p>
             </div>
          </div>

        </div>
      )}
    </div>
  );
}
