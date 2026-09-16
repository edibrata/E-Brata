const fs = require('fs');
let code = fs.readFileSync('src/views/DashboardView.tsx', 'utf8');

// Update table to use whitespace-nowrap and smaller text on mobile
code = code.replace(
  /<table className="w-full text-left border-collapse text-sm">/,
  `<table className="w-full text-left border-collapse text-xs sm:text-sm whitespace-nowrap">`
);

// Reduce padding in th
code = code.replace(
  /<th className="py-2 px-4 font-semibold w-12 text-center">No<\/th>/,
  `<th className="py-2 px-2 sm:px-4 font-semibold w-8 sm:w-12 text-center">No</th>`
);
code = code.replace(
  /<th className="py-2 px-4 font-semibold">Kategori Data<\/th>/,
  `<th className="py-2 px-2 sm:px-4 font-semibold">Kategori Data</th>`
);
code = code.replace(
  /<th className="py-2 px-4 font-semibold">Status Kesiapan<\/th>/,
  `<th className="py-2 px-2 sm:px-4 font-semibold">Status Kesiapan</th>`
);
code = code.replace(
  /<th className="py-2 px-4 font-semibold">Aksi<\/th>/,
  `<th className="py-2 px-2 sm:px-4 font-semibold text-center sm:text-left">Aksi</th>`
);

// Reduce padding in td
code = code.replace(
  /className="py-3 px-4 text-center text-slate-500"/g, 
  'className="py-2 px-2 sm:px-4 text-center text-slate-500"'
);
code = code.replace(
  /className="py-3 px-4 font-medium text-slate-800"/g, 
  'className="py-2 px-2 sm:px-4 font-medium text-slate-800"'
);
code = code.replace(
  /<td className="py-3 px-4">/g, 
  '<td className="py-2 px-2 sm:px-4">'
);

// Make badges and buttons slightly smaller on mobile
code = code.replace(
  /className="inline-flex items-center gap-1\.5 px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold"/g,
  'className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] sm:text-xs font-bold"'
);
code = code.replace(
  /className="inline-flex items-center gap-1\.5 px-2 py-1 rounded bg-rose-100 text-rose-700 text-xs font-bold"/g,
  'className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-rose-100 text-rose-700 text-[10px] sm:text-xs font-bold"'
);
code = code.replace(
  /className="inline-flex items-center gap-1\.5 px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-bold"/g,
  'className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-amber-100 text-amber-700 text-[10px] sm:text-xs font-bold"'
);
code = code.replace(
  /className="inline-flex items-center gap-1\.5 px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold"/g,
  'className="inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-slate-100 text-slate-600 text-[10px] sm:text-xs font-bold"'
);

// Buttons
code = code.replace(
  /className="text-xs bg-rose-600 text-white px-3 py-1 rounded hover:bg-rose-700 font-semibold shadow-sm"/g,
  'className="text-[10px] sm:text-xs bg-rose-600 text-white px-2 sm:px-3 py-1 rounded hover:bg-rose-700 font-semibold shadow-sm"'
);
code = code.replace(
  /className="text-xs bg-amber-500 text-white px-3 py-1 rounded hover:bg-amber-600 font-semibold shadow-sm"/g,
  'className="text-[10px] sm:text-xs bg-amber-500 text-white px-2 sm:px-3 py-1 rounded hover:bg-amber-600 font-semibold shadow-sm"'
);
code = code.replace(
  /className="text-xs bg-slate-200 text-slate-700 px-3 py-1 rounded hover:bg-slate-300 font-semibold shadow-sm"/g,
  'className="text-[10px] sm:text-xs bg-slate-200 text-slate-700 px-2 sm:px-3 py-1 rounded hover:bg-slate-300 font-semibold shadow-sm"'
);

fs.writeFileSync('src/views/DashboardView.tsx', code);
