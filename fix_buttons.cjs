const fs = require('fs');

const files = [
  'src/views/DataMapel.tsx',
  'src/views/TabManajemenEkskul.tsx', 
  'src/views/TabDataDasarMurid.tsx',
  'src/views/TujuanPembelajaran.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    
    // The previous script accidentally changed flex-row layout of the buttons
    // The buttons are meant to be horizontal on desktop, horizontal on mobile.
    // The regex `<div className="flex flex-col gap-2 mt-4 sm:mt-0">` was replaced with `<div className="flex flex-row sm:flex-col gap-2 mt-4 sm:mt-0">`
    // Let's make sure action buttons in headers always form a horizontal row on mobile
    
    // Specifically looking for the wrapper of the buttons in the header
    code = code.replace(
      /<div className="flex flex-row sm:flex-col gap-2 mt-4 sm:mt-0">/g,
      `<div className="flex flex-row gap-2 mt-4 sm:mt-0">`
    );
    
    // In case the original was flex-col (which stacks vertically)
    code = code.replace(
      /<div className="flex flex-col gap-2 mt-4 sm:mt-0">/g,
      `<div className="flex flex-row gap-2 mt-4 sm:mt-0">`
    );

    // Make sure header sections are flex-col on mobile but row on desktop, 
    // AND buttons are row.
    code = code.replace(
      /<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 md:p-6 bg-white border-b border-gray-200">/g,
      `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 md:p-6 bg-white border-b border-gray-200 gap-4 sm:gap-0">`
    );

    fs.writeFileSync(file, code);
  }
});
