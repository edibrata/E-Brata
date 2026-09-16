const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

code = code.replace(
  /<div className="flex items-center gap-4">/,
  `<div className="flex items-center gap-2 sm:gap-4">`
);

code = code.replace(
  /<div className="flex items-center gap-6">/,
  `<div className="flex items-center gap-2 sm:gap-4 md:gap-6">`
);

code = code.replace(
  /<p className="text-white font-bold text-\[11px\] sm:text-sm md:text-base flex items-center gap-1 sm:gap-2">/g,
  `<p className="text-white font-bold text-[11px] sm:text-sm md:text-base flex items-center gap-1.5">`
);

code = code.replace(
  /Aplikasi Rapor Kurikulum Merdeka/,
  `<span className="hidden sm:inline">Aplikasi Rapor Kurikulum Merdeka</span><span className="sm:hidden">E-Rapor KM</span>`
);

code = code.replace(
  /<div className="text-right hidden md:block border-l border-blue-600 pl-6">/,
  `<div className="text-right hidden lg:block border-l border-blue-600 pl-6">`
);

fs.writeFileSync('src/components/Header.tsx', code);
