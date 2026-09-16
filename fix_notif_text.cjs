const fs = require('fs');
let code = fs.readFileSync('src/views/TujuanPembelajaran.tsx', 'utf8');

// Update success message to be dynamic
code = code.replace(
  /showNotif\(\`Berhasil memuat \$\{newTps\.length\} TP default Pendidikan Pancasila!\`, "success"\);/,
  `showNotif(\`Berhasil memuat \${newTps.length} TP default \${mapelObj.nama}!\`, "success");`
);

fs.writeFileSync('src/views/TujuanPembelajaran.tsx', code);
