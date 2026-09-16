const fs = require('fs');
let code = fs.readFileSync('src/views/TujuanPembelajaran.tsx', 'utf8');

// Add import
code = code.replace(
  /import { Mapel, TujuanPembelajaran } from '\.\.\/types';/,
  `import { Mapel, TujuanPembelajaran } from '../types';\nimport { KriteriaKetuntasan } from '../components/KriteriaKetuntasan';`
);

// Inject KriteriaKetuntasan just after the header
code = code.replace(
  /<\/div>\s*<div className="overflow-auto bg-white rounded-b-2xl border-t border-gray-200"/,
  `</div>\n      {selectedMapel && <KriteriaKetuntasan mapelId={selectedMapel} />}\n      <div className="overflow-auto bg-white rounded-b-2xl border-t border-gray-200"`
);

fs.writeFileSync('src/views/TujuanPembelajaran.tsx', code);
