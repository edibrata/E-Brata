const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
code = code.replace(
  /<div className="flex-1 whitespace-nowrap transition-opacity duration-300 flex flex-col justify-center">[\s\S]*?<\/div>/,
  `<div className="flex-1 whitespace-nowrap transition-opacity duration-300 flex flex-col justify-center">
            <h1 className="font-extrabold text-[15px] tracking-tight text-slate-800 flex items-center gap-1.5 leading-none">
              E-Rapor <span className="text-blue-600 font-black">Edi Brata</span>
            </h1>
            <span 
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mt-1 hover:text-blue-800 transition-colors cursor-pointer"
              onClick={onOpenDevProfile}
            >
              v5.0 PRO
            </span>
          </div>`
);
fs.writeFileSync('src/components/Sidebar.tsx', code);
