const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
code = code.replace(
  /<div className="flex items-center gap-3 w-full">[\s\S]*?<\/div>\s*<\/div>\s*<nav/,
  `<div className="flex items-center gap-3 w-full">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white font-bold font-sans shrink-0 overflow-hidden border border-blue-200 cursor-pointer transition-transform duration-200 hover:scale-110">
            <img src="https://raw.githubusercontent.com/edibrata/image/main/FotoEdiBrata.jpg" alt="Edi Brata" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 whitespace-nowrap transition-opacity duration-300 flex items-center justify-between">
            <h1 className="font-extrabold text-[15px] tracking-tight text-slate-800 flex items-center gap-1.5 leading-none">
              E-Rapor <span className="text-blue-600 font-black">Edi Brata</span>
            </h1>
            <span 
              className="text-[9px] font-black text-white bg-gradient-to-r from-blue-700 to-blue-500 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-widest leading-none hover:opacity-90 transition-opacity cursor-pointer"
              onClick={onOpenDevProfile}
            >
              v5.0 PRO
            </span>
          </div>
        </div>
      </div>
            
      <nav`
);
fs.writeFileSync('src/components/Sidebar.tsx', code);
