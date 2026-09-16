const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

code = code.replace(
  /<p className="text-white font-bold text-sm md:text-base flex items-center gap-2">/,
  `<p className="text-white font-bold text-[11px] sm:text-sm md:text-base flex items-center gap-1 sm:gap-2">`
);

code = code.replace(
  /<span \n              className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-\[10px\] font-bold bg-blue-800 text-blue-100 border border-blue-600 uppercase tracking-widest cursor-pointer hover:bg-blue-900 transition-colors"\n              onClick={onOpenDevProfile}\n            >\n              <img src="https:\/\/raw.githubusercontent.com\/edibrata\/image\/main\/FotoEdiBrata.jpg" className="w-3 h-3 rounded-full object-cover" \/> \n              Edi Brata\n            <\/span>/,
  `<span 
              className="inline-flex items-center gap-1.5 px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-bold bg-blue-800 text-blue-100 border border-blue-600 uppercase tracking-widest cursor-pointer hover:bg-blue-900 transition-colors"
              onClick={onOpenDevProfile}
            >
              <img src="https://raw.githubusercontent.com/edibrata/image/main/FotoEdiBrata.jpg" className="w-4 h-4 sm:w-3 sm:h-3 rounded-full object-cover" /> 
              <span className="hidden sm:inline">Edi Brata</span>
            </span>`
);

code = code.replace(
  /<div className="flex items-center gap-1.5 px-3 py-1 text-\[11px\] font-medium rounded-full bg-blue-800 border border-blue-600 cursor-default group relative">/,
  `<div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 text-[11px] font-medium rounded-full bg-blue-800 border border-blue-600 cursor-default group relative">`
);

code = code.replace(
  /<span className="text-blue-100">Tersimpan<\/span>/,
  `<span className="text-blue-100 hidden sm:inline">Tersimpan</span>`
);

code = code.replace(
  /<span className="text-white">Menyimpan...<\/span>/,
  `<span className="text-white hidden sm:inline">Menyimpan...</span>`
);

code = code.replace(
  /<span className="text-rose-200">Offline<\/span>/,
  `<span className="text-rose-200 hidden sm:inline">Offline</span>`
);

fs.writeFileSync('src/components/Header.tsx', code);
