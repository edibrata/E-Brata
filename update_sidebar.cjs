const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(
  /\{ id: 'petunjuk', label: 'Petunjuk Penggunaan', icon: <Lightbulb size=\{18\} \/> \},/,
  `{ id: 'panduan-asesmen', label: 'Panduan Asesmen 2025', icon: <BookOpen size={18} /> },\n        { id: 'petunjuk', label: 'Petunjuk Penggunaan', icon: <Lightbulb size={18} /> },`
);

fs.writeFileSync('src/components/Sidebar.tsx', code);
