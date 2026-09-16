const fs = require('fs');
let code = fs.readFileSync('src/views/TujuanPembelajaran.tsx', 'utf8');

// Ensure import for defaultTpIpas is present
if (!code.includes('defaultTpIpas')) {
  code = code.replace(
    /import \{ defaultTpMatematika \} from '\.\.\/data\/defaultTpMatematika';/,
    `import { defaultTpMatematika } from '../data/defaultTpMatematika';\nimport { defaultTpIpas } from '../data/defaultTpIpas';`
  );
}

// Update the smart parser logic for 5 mapels
const newLogic = `
    const isPancasila = mapelObj.nama.toLowerCase().includes('pancasila');
    const isInggris = mapelObj.nama.toLowerCase().includes('inggris') || mapelObj.nama.toLowerCase().includes('english');
    const isIndonesia = mapelObj.nama.toLowerCase().includes('indonesia');
    const isMatematika = mapelObj.nama.toLowerCase().includes('matematika') || mapelObj.nama.toLowerCase().includes('math');
    const isIpas = mapelObj.nama.toLowerCase().includes('ipas') || mapelObj.nama.toLowerCase().includes('ilmu pengetahuan alam') || mapelObj.nama.toLowerCase().includes('sains') || mapelObj.nama.toLowerCase().includes('sosial');

    if (!isPancasila && !isInggris && !isIndonesia && !isMatematika && !isIpas) {
      showNotif("Maaf, muat TP otomatis saat ini baru tersedia untuk mapel: Pancasila, B. Inggris, B. Indonesia, Matematika, dan IPAS.", "error");
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
    if (isIpas) kelasData = defaultTpIpas[parsedKelas];

    if (!kelasData) {
      if (isIpas && parseInt(parsedKelas) > 6) {
        showNotif(\`Maaf, mata pelajaran IPAS hanya diajarkan di jenjang SD (Kelas 3-6).\`, "error");
      } else {
        showNotif(\`Maaf, data TP default untuk Kelas \${parsedKelas} belum tersedia.\`, "error");
      }
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
