const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(
  /<div className="flex-1 whitespace-nowrap transition-opacity duration-300 flex flex-col justify-center gap-0.5">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<nav/,
  `<div className="flex-1 whitespace-nowrap transition-opacity duration-300 flex flex-col justify-center -space-y-0.5">
            <h1 className="font-extrabold text-[15px] tracking-tight text-slate-800 flex items-center gap-1.5 leading-none">
              E-Rapor <span className="text-blue-600 font-black">Edi Brata</span>
            </h1>
            <div>
              <span 
                className="text-[9px] font-black text-white bg-gradient-to-r from-blue-700 to-blue-500 px-1.5 rounded shadow-sm uppercase tracking-widest leading-none hover:opacity-90 transition-opacity cursor-pointer inline-block"
                onClick={onOpenDevProfile}
                style={{ paddingTop: '2px', paddingBottom: '2px' }}
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
