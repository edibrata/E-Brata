const fs = require('fs');
let code = fs.readFileSync('src/views/InputNilai.tsx', 'utf8');

// Inject the interval logic
code = code.replace(
  /const mapelTps = tujuanPembelajaran\.filter\(tp => tp\.mapelId === selectedMapel\);/,
  `const mapelTps = tujuanPembelajaran.filter(tp => tp.mapelId === selectedMapel);\n  const selectedMapelData = mapel.find(m => m.id === selectedMapel);\n  const intervalBatas = selectedMapelData?.intervalBatas || [20, 40, 60, 80];\n\n  const getScoreColorClass = (scoreStr: string | number) => {\n    if (scoreStr === '' || scoreStr === null || scoreStr === undefined) return 'bg-transparent text-slate-800';\n    const score = Number(scoreStr);\n    if (isNaN(score)) return 'bg-transparent text-slate-800';\n    if (score <= intervalBatas[0]) return 'bg-rose-50 text-rose-700 font-bold focus:bg-rose-100';\n    if (score <= intervalBatas[1]) return 'bg-orange-50 text-orange-700 font-bold focus:bg-orange-100';\n    if (score <= intervalBatas[2]) return 'bg-amber-50 text-amber-700 font-bold focus:bg-amber-100';\n    if (score <= intervalBatas[3]) return 'bg-emerald-50 text-emerald-700 font-bold focus:bg-emerald-100';\n    return 'bg-teal-50 text-teal-700 font-bold focus:bg-teal-100';\n  };`
);

// Apply color class to input
code = code.replace(
  /className="w-full h-full p-2 outline-none text-center bg-transparent focus:bg-white"/g,
  'className={`w-full h-full p-2 outline-none text-center transition-colors ${getScoreColorClass(getScore(s.id, \'tp\', tp.id))}`}'
);

// Add tooltip to input 
// Actually, title might be annoying. Let's keep it clean. Just the color is enough as instructed.
// But wait, the sumatif akhir doesn't need to be colored or does it? It says "di tabel input nilai". I'll just color the TPs.

fs.writeFileSync('src/views/InputNilai.tsx', code);
