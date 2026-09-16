const fs = require('fs');
let code = fs.readFileSync('src/views/TujuanPembelajaran.tsx', 'utf8');

// The issue might be the path resolution for @/data/defaultTpPancasila
// Let's use relative path just to be safe
code = code.replace(
  /import \{ defaultTpPancasila \} from '@\/data\/defaultTpPancasila';/,
  `import { defaultTpPancasila } from '../data/defaultTpPancasila';`
);

fs.writeFileSync('src/views/TujuanPembelajaran.tsx', code);
