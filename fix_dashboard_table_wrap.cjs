const fs = require('fs');
let code = fs.readFileSync('src/views/DashboardView.tsx', 'utf8');

// Allow wrapping on mobile, smaller base text
code = code.replace(
  /<table className="w-full text-left border-collapse text-xs sm:text-sm whitespace-nowrap">/,
  `<table className="w-full text-left border-collapse text-[10px] sm:text-sm sm:whitespace-nowrap">`
);

// Reduce padding aggressively for mobile
code = code.replace(/px-2 sm:px-4/g, "px-1 sm:px-4");

// Shorten headers on mobile
code = code.replace(
  /<th className="py-2 px-1 sm:px-4 font-semibold">Kategori Data<\/th>/,
  `<th className="py-2 px-1 sm:px-4 font-semibold leading-tight"><span className="hidden sm:inline">Kategori Data</span><span className="sm:hidden">Kategori</span></th>`
);
code = code.replace(
  /<th className="py-2 px-1 sm:px-4 font-semibold">Status Kesiapan<\/th>/,
  `<th className="py-2 px-1 sm:px-4 font-semibold leading-tight"><span className="hidden sm:inline">Status Kesiapan</span><span className="sm:hidden">Status</span></th>`
);

// Allow wrapping in Kategori Data cell
code = code.replace(
  /className="py-2 px-1 sm:px-4 font-medium text-slate-800"/g,
  'className="py-2 px-1 sm:px-4 font-medium text-slate-800 leading-tight whitespace-normal sm:whitespace-nowrap"'
);

// Ensure actions and badges don't wrap internally but can wrap relative to other text if needed
code = code.replace(
  /className="text-\[10px\] sm:text-xs bg-rose-600/g,
  'className="text-[10px] sm:text-xs bg-rose-600 whitespace-nowrap'
);
code = code.replace(
  /className="text-\[10px\] sm:text-xs bg-amber-500/g,
  'className="text-[10px] sm:text-xs bg-amber-500 whitespace-nowrap'
);
code = code.replace(
  /className="text-\[10px\] sm:text-xs bg-slate-200/g,
  'className="text-[10px] sm:text-xs bg-slate-200 whitespace-nowrap'
);

// Make the text in the table slightly smaller on mobile
code = code.replace(
  /text-\[10px\] sm:text-xs font-bold"/g,
  'text-[9px] sm:text-xs font-bold"'
);


fs.writeFileSync('src/views/DashboardView.tsx', code);
