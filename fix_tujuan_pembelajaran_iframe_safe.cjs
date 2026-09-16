const fs = require('fs');
let code = fs.readFileSync('src/views/TujuanPembelajaran.tsx', 'utf8');

// I will remove window.confirm and alert to make it iframe-safe
code = code.replace(
  /if \(window\.confirm\(\`Apakah Anda yakin ingin memuat \$\{[^}]+\} TP default Pendidikan Pancasila untuk Kelas \$\{[^}]+\} Semester \$\{[^}]+\}\?\`\)\) \{([\s\S]*?updateState\('tujuanPembelajaran', \[\.\.\.state\.tujuanPembelajaran, \.\.\.newTps\]\);[\s\S]*?)\}/,
  `$1`
);

// We need to fix the alerts too. Instead of alert, we will just silently return or perhaps console.error.
// Actually, it's better to just let it return.
code = code.replace(/alert\("Maaf, muat TP otomatis saat ini baru tersedia untuk mata pelajaran Pendidikan Pancasila\."\);/g, `console.warn("Bukan mapel Pancasila");`);
code = code.replace(/alert\("Sistem tidak dapat mendeteksi pengaturan angka Kelas\. Silakan periksa kembali isian di menu Data Dasar -> Profil Sekolah\."\);/g, `console.warn("Kelas tidak terdeteksi");`);
code = code.replace(/alert\(\`Maaf, data TP default untuk Kelas \$\{parsedKelas\} belum tersedia di sistem\.\`\);/g, `console.warn("Data TP default belum tersedia untuk kelas ini");`);
code = code.replace(/alert\(\`Maaf, data TP default untuk Kelas \$\{parsedKelas\} Semester \$\{sem\} belum tersedia di sistem\.\`\);/g, `console.warn("Data TP default belum tersedia untuk semester ini");`);

fs.writeFileSync('src/views/TujuanPembelajaran.tsx', code);
