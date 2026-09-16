const fs = require('fs');
let code = fs.readFileSync('src/views/DashboardView.tsx', 'utf8');

code = code.replace(
  /<div className="p-0">/,
  `<div className="p-0 overflow-x-auto">`
);

fs.writeFileSync('src/views/DashboardView.tsx', code);
