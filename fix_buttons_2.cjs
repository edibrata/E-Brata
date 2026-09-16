const fs = require('fs');

const files = [
  'src/views/DataMapel.tsx',
  'src/views/TabManajemenEkskul.tsx', 
  'src/views/TabDataDasarMurid.tsx',
  'src/views/TujuanPembelajaran.tsx',
  'src/views/DataSiswa.tsx',
  'src/views/DataEkstrakurikuler.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Some buttons were wrapped in `<div className="flex flex-col sm:flex-row gap-2">`
    code = code.replace(
      /<div className="flex flex-col sm:flex-row gap-2">/g,
      `<div className="flex flex-row gap-2 mt-4 sm:mt-0">`
    );

    // Make sure the header wrap adds gap for mobile so title and buttons aren't squished
    code = code.replace(
      /justify-between items-start sm:items-center p-5 md:p-6/g,
      `justify-between items-start sm:items-center p-4 sm:p-5 md:p-6 gap-4 sm:gap-0`
    );

    fs.writeFileSync(file, code);
  }
});
