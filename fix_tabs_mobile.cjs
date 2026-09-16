const fs = require('fs');
const files = [
  'src/views/DataSekolah.tsx',
  'src/views/DataMapel.tsx',
  'src/views/DataEkstrakurikuler.tsx',
  'src/views/DataSiswa.tsx',
  'src/views/DataProjek.tsx',
  'src/views/TujuanPembelajaran.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Fix tabs layout to wrap on mobile instead of squishing text
    code = code.replace(
      /<div className="flex border-b border-gray-200 sticky top-0 z-10 bg-white">/g,
      `<div className="flex flex-row overflow-x-auto border-b border-gray-200 sticky top-0 z-10 bg-white scrollbar-hide">`
    );
    
    // More targeted replacements for different variants of the flex wrapper
    code = code.replace(
      /className="flex bg-slate-50\/50"/g,
      `className="flex flex-row overflow-x-auto bg-slate-50/50 scrollbar-hide"`
    );
    
    // Fix button sizing to not squish
    code = code.replace(
      /className={`flex-1 sm:flex-initial flex items-center/g,
      `className={\`whitespace-nowrap flex items-center`
    );
    
    // Additional button wrapper fixes if flex-1 exists without sm:flex-initial
    code = code.replace(
      /className={`flex-1 flex items-center/g,
      `className={\`whitespace-nowrap flex items-center`
    );

    // Specifically for DataSiswa and DataEkstrakurikuler which might use different classes
    code = code.replace(
      /className={`flex-1 sm:flex-initial flex items-center justify-center gap-2/g,
      `className={\`whitespace-nowrap flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6`
    );

    // Fix table headers to not break to next line on mobile
    code = code.replace(
      /<th className="py-3 px-4 font-semibold w-16 text-center text-slate-400">GESER<\/th>/g,
      `<th className="py-3 px-3 sm:px-4 font-semibold w-12 sm:w-16 text-center text-slate-400 text-[10px] sm:text-xs">GESER</th>`
    );
    
    // Fix action buttons in lists to be in a row and not stack awkwardly
    code = code.replace(
      /<div className="flex flex-col gap-2 mt-4 sm:mt-0">/g,
      `<div className="flex flex-row sm:flex-col gap-2 mt-4 sm:mt-0">`
    );
    
    fs.writeFileSync(file, code);
  }
});
