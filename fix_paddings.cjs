const fs = require('fs');
const glob = require('glob'); // Need to check if available, if not, just list files

const files = [
  'src/views/DashboardView.tsx',
  'src/views/DataMapel.tsx',
  'src/views/InputNilai.tsx',
  'src/views/KotakSampah.tsx',
  'src/views/Leger.tsx',
  'src/views/NilaiProjek.tsx',
  'src/views/CetakRapor.tsx',
  'src/views/DataSiswa.tsx',
  'src/views/DataSekolah.tsx',
  'src/views/KegiatanAkademik.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    // replace p-6 or p-8 with p-4 sm:p-6
    code = code.replace(/className="bg-white p-6/g, 'className="bg-white p-4 sm:p-6');
    fs.writeFileSync(file, code);
  }
});
