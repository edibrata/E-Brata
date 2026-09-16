const fs = require('fs');
let code = fs.readFileSync('src/views/TujuanPembelajaran.tsx', 'utf8');

const logicMatch = code.match(/const handleGenerateDefaultTp = \(\) => \{[\s\S]*?const handleDownloadTemplate = \(\) => \{/);

if (logicMatch) {
  console.log("LOGIC FOUND");
  console.log(logicMatch[0].substring(0, 500));
} else {
  console.log("LOGIC NOT FOUND");
}
