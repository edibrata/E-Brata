const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /import Petunjuk from '@\/views\/Petunjuk';/,
  `import Petunjuk from '@/views/Petunjuk';\nimport PanduanAsesmen from '@/views/PanduanAsesmen';`
);

code = code.replace(
  /\{activeView === 'petunjuk' && <Petunjuk \/>\}/,
  `{activeView === 'petunjuk' && <Petunjuk />}\n          {activeView === 'panduan-asesmen' && <PanduanAsesmen />}`
);

fs.writeFileSync('src/App.tsx', code);
