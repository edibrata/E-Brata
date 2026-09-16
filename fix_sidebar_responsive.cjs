const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Ensure sidebar is fixed on mobile, sticky on desktop, and has z-40
code = code.replace(
  /<aside className={`sidebar bg-white border-r border-slate-200 text-slate-800 flex flex-col h-screen sticky top-0 shadow-sm overflow-hidden transition-all duration-300 \$\{isOpen \? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0'\}`}>/,
  `<aside className={\`sidebar bg-white border-r border-slate-200 text-slate-800 flex flex-col h-screen fixed md:sticky top-0 z-40 shadow-sm overflow-hidden transition-all duration-300 \${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0'}\`}>`
);

fs.writeFileSync('src/components/Sidebar.tsx', code);
