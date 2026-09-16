const fs = require('fs');
let code = fs.readFileSync('src/views/TujuanPembelajaran.tsx', 'utf8');

if (!code.includes('Sparkles')) {
  // wait, Sparkles IS in the code as a component (<Sparkles className... />).
  // Need to check if it's in the import.
}

code = code.replace(
  /import \{ Plus, Trash2, Target, Download, Upload \} from 'lucide-react';/,
  `import { Plus, Trash2, Target, Download, Upload, Sparkles } from 'lucide-react';`
);

fs.writeFileSync('src/views/TujuanPembelajaran.tsx', code);
