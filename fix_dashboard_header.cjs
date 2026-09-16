const fs = require('fs');
let code = fs.readFileSync('src/views/DashboardView.tsx', 'utf8');

code = code.replace(
  /<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">/,
  `<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-4">`
);

// We need to fix the inner part
const innerPattern = `<div className="flex items-center gap-5">\\s*<div className="w-16 h-16 bg-blue-50 border border-blue-200 rounded flex items-center justify-center text-blue-700">\\s*<GraduationCap size=\\{36\\} \\/>\\s*<\\/div>\\s*<div>\\s*<h1 className="text-xl font-bold text-slate-800 leading-tight">\\s*\\{sekolah\\.nama \\|\\| 'NAMA SEKOLAH BELUM DIATUR'\\}\\s*<\\/h1>\\s*<p className="text-slate-500 text-sm flex items-center gap-2 mt-1">\\s*<span className="font-semibold text-slate-700">NPSN:<\\/span> \\{sekolah\\.npsn \\|\\| '-'\\}\\s*<span className="text-slate-300">\\|<\\/span>\\s*<span className="font-semibold text-slate-700">Kepala Sekolah:<\\/span> \\{sekolah\\.kepsek \\|\\| '-'\\}\\s*<\\/p>\\s*<\\/div>\\s*<\\/div>`;

const replacement = `<div className="flex items-start sm:items-center gap-4 w-full md:w-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 border border-blue-200 rounded flex items-center justify-center text-blue-700 shrink-0">
              <GraduationCap size={32} className="sm:w-9 sm:h-9" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight truncate">
                {sekolah.nama || 'NAMA SEKOLAH BELUM DIATUR'}
              </h1>
              <div className="text-slate-500 text-[11px] sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700">NPSN:</span> {sekolah.npsn || '-'}
                </div>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <div className="flex items-center sm:items-start gap-1 flex-wrap">
                  <span className="font-semibold text-slate-700">Kepala Sekolah:</span> <span className="line-clamp-1 break-words">{sekolah.kepsek || '-'}</span>
                </div>
              </div>
            </div>
          </div>`;

code = code.replace(new RegExp(innerPattern), replacement);

code = code.replace(
  /<div className="bg-slate-100 px-4 py-2 rounded border border-slate-200 text-right">/,
  `<div className="bg-slate-100 px-4 py-2 rounded border border-slate-200 text-left sm:text-right w-full md:w-auto mt-2 md:mt-0">`
);

fs.writeFileSync('src/views/DashboardView.tsx', code);
