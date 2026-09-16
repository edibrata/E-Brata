const fs = require('fs');
let code = fs.readFileSync('src/views/TujuanPembelajaran.tsx', 'utf8');

// Ensure import for defaultTpMatematika is present
if (!code.includes('defaultTpMatematika')) {
  code = code.replace(
    /import \{ defaultTpBahasaIndonesia \} from '\.\.\/data\/defaultTpBahasaIndonesia';/,
    `import { defaultTpBahasaIndonesia } from '../data/defaultTpBahasaIndonesia';\nimport { defaultTpMatematika } from '../data/defaultTpMatematika';`
  );
}

// Update the smart parser logic for 4 mapels
const newLogic = `
    const isPancasila = mapelObj.nama.toLowerCase().includes('pancasila');
    const isInggris = mapelObj.nama.toLowerCase().includes('inggris') || mapelObj.nama.toLowerCase().includes('english');
    const isIndonesia = mapelObj.nama.toLowerCase().includes('indonesia');
    const isMatematika = mapelObj.nama.toLowerCase().includes('matematika') || mapelObj.nama.toLowerCase().includes('math');

    if (!isPancasila && !isInggris && !isIndonesia && !isMatematika) {
      showNotif("Maaf, muat TP otomatis saat ini baru tersedia untuk mapel: Pancasila, Bahasa Inggris, Bahasa Indonesia, dan Matematika.", "error");
      return;
    }

    const { kelas, semester } = state.sekolah;
    
    let sem = "1";
    if (String(semester).toLowerCase().includes('genap') || String(semester).includes('2')) {
      sem = "2";
    }

    let parsedKelas = String(kelas).replace(/[^0-9]/g, '');
    
    // Fallback if roman numerals or words are used
    const kelasStr = String(kelas).toLowerCase();
    if (!parsedKelas) {
      if (kelasStr.includes('satu') || kelasStr.includes('i') && !kelasStr.includes('ii') && !kelasStr.includes('iii') && !kelasStr.includes('iv') && !kelasStr.includes('vi') && !kelasStr.includes('ix')) parsedKelas = '1';
      else if (kelasStr.includes('dua') || kelasStr.includes('ii') && !kelasStr.includes('iii') && !kelasStr.includes('vii') && !kelasStr.includes('viii')) parsedKelas = '2';
      else if (kelasStr.includes('tiga') || kelasStr.includes('iii') && !kelasStr.includes('viii')) parsedKelas = '3';
      else if (kelasStr.includes('empat') || kelasStr.includes('iv')) parsedKelas = '4';
      else if (kelasStr.includes('lima') || kelasStr.includes('v') && !kelasStr.includes('iv') && !kelasStr.includes('vi') && !kelasStr.includes('vii') && !kelasStr.includes('viii')) parsedKelas = '5';
      else if (kelasStr.includes('enam') || kelasStr.includes('vi') && !kelasStr.includes('vii') && !kelasStr.includes('viii')) parsedKelas = '6';
      else if (kelasStr.includes('tujuh') || kelasStr.includes('vii') && !kelasStr.includes('viii')) parsedKelas = '7';
      else if (kelasStr.includes('delapan') || kelasStr.includes('viii')) parsedKelas = '8';
      else if (kelasStr.includes('sembilan') || kelasStr.includes('ix')) parsedKelas = '9';
      else if (kelasStr.includes('sepuluh') || kelasStr.includes('x') && !kelasStr.includes('xi') && !kelasStr.includes('xii')) parsedKelas = '10';
      else if (kelasStr.includes('sebelas') || kelasStr.includes('xi') && !kelasStr.includes('xii')) parsedKelas = '11';
      else if (kelasStr.includes('dua belas') || kelasStr.includes('xii')) parsedKelas = '12';
    }

    if (!parsedKelas) {
      showNotif("Sistem tidak dapat mendeteksi Kelas. Silakan periksa isian di menu Data Dasar.", "error");
      return;
    }

    let kelasData;
    if (isPancasila) kelasData = defaultTpPancasila[parsedKelas];
    if (isInggris) kelasData = defaultTpBahasaInggris[parsedKelas];
    if (isIndonesia) kelasData = defaultTpBahasaIndonesia[parsedKelas];
    if (isMatematika) kelasData = defaultTpMatematika[parsedKelas];

    if (!kelasData) {
      showNotif(\`Maaf, data TP default untuk Kelas \${parsedKelas} belum tersedia.\`, "error");
      return;
    }

    const tpsToInject = kelasData[sem];
    if (!tpsToInject || tpsToInject.length === 0) {
      showNotif(\`Maaf, data TP default untuk Kelas \${parsedKelas} Semester \${sem} belum tersedia.\`, "error");
      return;
    }
`;

code = code.replace(/const isPancasila = mapelObj\.nama\.toLowerCase\(\)\.includes\('pancasila'\);[\s\S]*?const tpsToInject = kelasData\[sem\];\s*if \(!tpsToInject \|\| tpsToInject\.length === 0\) \{\s*showNotif\(\`Maaf, data TP default untuk Kelas \$\{parsedKelas\} Semester \$\{sem\} belum tersedia\.\`, "error"\);\s*return;\s*\}/, newLogic);

fs.writeFileSync('src/views/TujuanPembelajaran.tsx', code);
