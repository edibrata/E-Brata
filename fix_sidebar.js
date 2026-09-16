const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
code = code.replace(
  /<h1 className="font-extrabold text-base tracking-tight text-slate-800 flex items-center gap-1.5 leading-none">[\s\S]*?<\/div>/,
  `<h1 className="font-extrabold text-sm tracking-tight text-slate-800 flex items-center gap-1.5 leading-none">
              E-Rapor <span className="text-blue-600 font-black">Edi Brata</span>
            </h1>
            <span 
              className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none mt-1 hover:text-blue-800 transition-colors cursor-pointer"
              onClick={onOpenDevProfile}
            >
              v5.0 PRO
            </span>
          </div>`
);
fs.writeFileSync('src/components/Sidebar.tsx', code);
