const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Kita kembalikan ke struktur kolom agar teksnya dua baris, tetapi memastikan spasi antara barisnya rapat.
code = code.replace(
  /<div className="flex-1 whitespace-nowrap transition-opacity duration-300 flex items-center justify-between">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<nav/,
  `<div className="flex-1 whitespace-nowrap transition-opacity duration-300 flex flex-col justify-center gap-0.5">
            <h1 className="font-extrabold text-[15px] tracking-tight text-slate-800 flex items-center gap-1.5 leading-none">
              E-Rapor <span className="text-blue-600 font-black">Edi Brata</span>
            </h1>
            <div>
              <span 
                className="text-[9px] font-black text-white bg-gradient-to-r from-blue-700 to-blue-500 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-widest leading-none hover:opacity-90 transition-opacity cursor-pointer inline-block"
                onClick={onOpenDevProfile}
              >
                v5.0 PRO
              </span>
            </div>
          </div>
        </div>
      </div>
            
      <nav`
);

fs.writeFileSync('src/components/Sidebar.tsx', code);
