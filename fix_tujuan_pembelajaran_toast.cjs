const fs = require('fs');
let code = fs.readFileSync('src/views/TujuanPembelajaran.tsx', 'utf8');

// Add AlertCircle to lucide-react import
code = code.replace(
  /import \{ Plus, Trash2, Target, Download, Upload, Sparkles \} from 'lucide-react';/,
  `import { Plus, Trash2, Target, Download, Upload, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';`
);

// Inject state for notification inside the component
code = code.replace(
  /const \[selectedMapel, setSelectedMapel\] = useState<string>\(''\);/,
  `const [selectedMapel, setSelectedMapel] = useState<string>('');\n  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);`
);

// Inject a helper function to show notification
const showNotifCode = `
  const showNotif = (message: string, type: 'error' | 'success' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };
`;
code = code.replace(
  /const fileInputRef = useRef<HTMLInputElement>\(null\);/,
  `const fileInputRef = useRef<HTMLInputElement>(null);\n${showNotifCode}`
);

// Replace console.warn with showNotif in the handleGenerateDefaultTp function
// Also add success notification
code = code.replace(
  /console\.warn\("Bukan mapel Pancasila"\);/g,
  `showNotif("Maaf, muat TP otomatis saat ini baru tersedia untuk mapel Pendidikan Pancasila.", "error");`
);
code = code.replace(
  /console\.warn\("Kelas tidak terdeteksi"\);/g,
  `showNotif("Sistem tidak dapat mendeteksi Kelas. Silakan periksa isian di menu Data Dasar.", "error");`
);
code = code.replace(
  /console\.warn\("Data TP default belum tersedia untuk kelas ini"\);/g,
  `showNotif(\`Maaf, data TP default untuk Kelas \${parsedKelas} belum tersedia.\`, "error");`
);
code = code.replace(
  /console\.warn\("Data TP default belum tersedia untuk semester ini"\);/g,
  `showNotif(\`Maaf, data TP default untuk Kelas \${parsedKelas} Semester \${sem} belum tersedia.\`, "error");`
);
code = code.replace(
  /updateState\('tujuanPembelajaran', \[\.\.\.state\.tujuanPembelajaran, \.\.\.newTps\]\);/,
  `updateState('tujuanPembelajaran', [...state.tujuanPembelajaran, ...newTps]);\n      showNotif(\`Berhasil memuat \${newTps.length} TP default Pendidikan Pancasila!\`, "success");`
);

// Render the toast notification component inside the return block
const toastHtml = `
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={\`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border \${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}\`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-rose-500" />}
            <p className="text-xs font-bold">{notification.message}</p>
          </div>
        </div>
      )}
`;

code = code.replace(
  /<div className="w-full animate-in fade-in duration-200">/,
  `<div className="w-full animate-in fade-in duration-200">\n${toastHtml}`
);

fs.writeFileSync('src/views/TujuanPembelajaran.tsx', code);
