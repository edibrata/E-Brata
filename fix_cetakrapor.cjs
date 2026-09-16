const fs = require('fs');
let code = fs.readFileSync('src/views/CetakRapor.tsx', 'utf8');

// Add state for toggle
code = code.replace(
  /const \[selectedStudent, setSelectedStudent\] = useState<string>\(''\);/,
  `const [selectedStudent, setSelectedStudent] = useState<string>('');\n  const [isTanpaAngka, setIsTanpaAngka] = useState(false);`
);

// Update getNilaiDanDeskripsi
const oldLogic = `  const getNilaiDanDeskripsi = (studentId: string, mapelId: string) => {
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
    
    if (maxTp) {
      const tp = mapelTps.find(t => t.id === maxTp!.id);
      if (tp) deskTer = \`Menunjukkan penguasaan yang sangat baik dalam \${tp.deskripsi.toLowerCase()}.\`;
    }
    if (minTp && minTp.score < 70) {
      const tp = mapelTps.find(t => t.id === minTp!.id);
      if (tp) deskRendah = \`Perlu bimbingan dalam \${tp.deskripsi.toLowerCase()}.\`;
    }

    return { 
      finalScore: finalRata, 
      deskripsiTertinggi: deskTer, 
      deskripsiTerendah: deskRendah 
    };
  };`;

const newLogic = `  const getNilaiDanDeskripsi = (studentId: string, mapelId: string) => {
    const n = nilai[studentId]?.[mapelId];
    if (!n) return { finalScore: null, deskripsiTertinggi: '', deskripsiTerendah: '' };
    
    const mapelData = mapel.find(m => m.id === mapelId);
    const intervals = mapelData?.intervalBatas || [20, 40, 60, 80];

    const mapelTps = tujuanPembelajaran.filter(tp => tp.mapelId === mapelId);
    
    const tuntasSangatBaik: string[] = [];
    const tuntasBaik: string[] = [];
    const perluPeningkatan: string[] = [];
    const perluPendampingan: string[] = [];
    const sangatPerluPendampingan: string[] = [];
    
    let totalTp = 0;
    let countTp = 0;
    
    mapelTps.forEach(tp => {
      const score = n.tpScores[tp.id];
      if (typeof score === 'number') {
        totalTp += score;
        countTp++;
        
        const deskripsi = tp.deskripsi.toLowerCase();
        
        if (score <= intervals[0]) sangatPerluPendampingan.push(deskripsi);
        else if (score <= intervals[1]) perluPendampingan.push(deskripsi);
        else if (score <= intervals[2]) perluPeningkatan.push(deskripsi);
        else if (score <= intervals[3]) tuntasBaik.push(deskripsi);
        else tuntasSangatBaik.push(deskripsi);
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
    
    if (tuntasSangatBaik.length > 0) {
        deskTer = \`Sangat baik dalam \${tuntasSangatBaik.join(', ')}.\`;
        if (tuntasBaik.length > 0) {
            deskTer += \` Sudah mencapai ketuntasan untuk \${tuntasBaik.join(', ')}.\`;
        }
    } else if (tuntasBaik.length > 0) {
        deskTer = \`Mencapai kompetensi dengan baik dalam hal \${tuntasBaik.join(', ')}.\`;
    }
    
    if (sangatPerluPendampingan.length > 0) {
        deskRendah = \`Sangat memerlukan pendampingan untuk \${sangatPerluPendampingan.join(', ')}.\`;
    }
    if (perluPendampingan.length > 0) {
        deskRendah += (deskRendah ? ' ' : '') + \`Perlu bimbingan dalam \${perluPendampingan.join(', ')}.\`;
    }
    if (perluPeningkatan.length > 0) {
        deskRendah += (deskRendah ? ' ' : '') + \`Masih perlu peningkatan dalam hal \${perluPeningkatan.join(', ')}.\`;
    }

    return { 
      finalScore: finalRata, 
      deskripsiTertinggi: deskTer, 
      deskripsiTerendah: deskRendah 
    };
  };`;

code = code.replace(oldLogic, newLogic);

// Inject toggle checkbox into UI
code = code.replace(
  /<\/div>\s*<button onClick=\{handlePrint\}/,
  `</div>\n          {(sekolah.fase === 'A' || sekolah.kelas === '1' || sekolah.kelas === '2') && (\n            <div className="flex items-center gap-2 mb-2">\n              <input type="checkbox" id="tanpaAngka" checked={isTanpaAngka} onChange={e => setIsTanpaAngka(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />\n              <label htmlFor="tanpaAngka" className="text-xs font-semibold text-slate-700 cursor-pointer">Cetak Rapor Fase A Tanpa Angka</label>\n            </div>\n          )}\n          <button onClick={handlePrint}`
);

// Update table header to hide Nilai Akhir if isTanpaAngka
code = code.replace(
  /<th className="border border-slate-800 py-3 px-1 w-16 text-center font-bold text-slate-800 uppercase text-\[10px\] tracking-wider">Nilai<br\/>Akhir<\/th>/,
  `{!isTanpaAngka && <th className="border border-slate-800 py-3 px-1 w-16 text-center font-bold text-slate-800 uppercase text-[10px] tracking-wider">Nilai<br/>Akhir</th>}`
);

// Update table body to hide Nilai Akhir if isTanpaAngka
code = code.replace(
  /<td className="border border-slate-800 p-2 text-center font-bold align-top text-slate-800 bg-slate-50\/30 print:bg-transparent">\s*\{finalScore !== null \? finalScore : ''\}\s*<\/td>/,
  `{!isTanpaAngka && (\n                      <td className="border border-slate-800 p-2 text-center font-bold align-top text-slate-800 bg-slate-50/30 print:bg-transparent">\n                        {finalScore !== null ? finalScore : ''}\n                      </td>\n                    )}`
);


fs.writeFileSync('src/views/CetakRapor.tsx', code);
