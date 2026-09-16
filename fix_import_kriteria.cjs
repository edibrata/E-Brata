const fs = require('fs');
let code = fs.readFileSync('src/views/TujuanPembelajaran.tsx', 'utf8');

// The previous script might have failed to add the import correctly 
// if it used a regex that didn't match.
// Let's force it at the top of the file.

if (!code.includes('import { KriteriaKetuntasan }')) {
  code = code.replace(
    /import \{ useState, useRef, useEffect \} from 'react';/,
    `import { useState, useRef, useEffect } from 'react';\nimport { KriteriaKetuntasan } from '../components/KriteriaKetuntasan';`
  );
}

fs.writeFileSync('src/views/TujuanPembelajaran.tsx', code);
