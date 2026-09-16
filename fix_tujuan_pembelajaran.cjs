const fs = require('fs');
let code = fs.readFileSync('src/views/TujuanPembelajaran.tsx', 'utf8');

// Add Sparkles to lucide-react import
code = code.replace(
  /import \{ Plus, Trash2, Upload, Download, Target \} from 'lucide-react';/,
  `import { Plus, Trash2, Upload, Download, Target, Sparkles } from 'lucide-react';`
);

// Add import for default data
code = code.replace(
  /import \{ KriteriaKetuntasan \} from '\.\.\/components\/KriteriaKetuntasan';/,
  `import { KriteriaKetuntasan } from '../components/KriteriaKetuntasan';\nimport { defaultTpPancasila } from '@/data/defaultTpPancasila';`
);

// Add handleGenerateDefaultTp before handleDownloadTemplate
const generateLogic = `  const handleGenerateDefaultTp = () => {
    if (!selectedMapel) return;
    const mapelObj = mapel.find(m => m.id === selectedMapel);
    if (!mapelObj) return;

    if (!mapelObj.nama.toLowerCase().includes('pancasila')) {
      alert("Maaf, muat TP otomatis (Kurikulum Nasional) saat ini baru tersedia untuk mata pelajaran Pendidikan Pancasila.");
      return;
    }

    const { kelas, semester } = state.sekolah;
    
    let sem = "1";
    if (String(semester).toLowerCase() === 'genap' || String(semester) === '2') {
      sem = "2";
    }

    const kelasData = defaultTpPancasila[String(kelas)];
    if (!kelasData) {
      alert(\`Maaf, data TP default untuk Kelas \${kelas} belum tersedia.\`);
      return;
    }

    const tpsToInject = kelasData[sem];
    if (!tpsToInject || tpsToInject.length === 0) {
      alert(\`Maaf, data TP default untuk Kelas \${kelas} Semester \${semester} belum tersedia.\`);
      return;
    }

    if (window.confirm(\`Apakah Anda yakin ingin memuat \${tpsToInject.length} TP default Pendidikan Pancasila untuk Kelas \${kelas} Semester \${semester}?\`)) {
      let indexCounter = 0;
      const newTps = tpsToInject.map(item => ({
        id: 'tp_' + Date.now() + '_' + (indexCounter++),
        mapelId: selectedMapel,
        kode: item.kode,
        deskripsi: item.deskripsi
      }));

      updateState('tujuanPembelajaran', [...state.tujuanPembelajaran, ...newTps]);
    }
  };

  const handleDownloadTemplate = () => {`;

code = code.replace(/  const handleDownloadTemplate = \(\) => \{/, generateLogic);

// Add the button in the UI next to handleAdd
const buttonHtml = `<button 
              onClick={handleGenerateDefaultTp} 
              className="w-8 h-8 flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg shadow-sm border border-amber-200 transition focus:outline-none group/tooltip relative"
            >
              <Sparkles className="w-4 h-4" />
              <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 top-full mt-1.5 right-0 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-top-1 before:right-3 before:border-4 before:border-transparent before:border-b-slate-800">
                Muat TP Default (KurNas)
              </span>
            </button>
            <button 
              onClick={handleAdd}`;

code = code.replace(/<button \s*onClick=\{handleAdd\}/, buttonHtml);

fs.writeFileSync('src/views/TujuanPembelajaran.tsx', code);
