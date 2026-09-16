const fs = require('fs');
let code = fs.readFileSync('src/views/TujuanPembelajaran.tsx', 'utf8');

// I need to find the actual import block and ensure it's there
if (!code.includes('import { KriteriaKetuntasan }')) {
  // Let's just prepend it to the file
  code = `import { KriteriaKetuntasan } from '../components/KriteriaKetuntasan';\n` + code;
}

fs.writeFileSync('src/views/TujuanPembelajaran.tsx', code);
