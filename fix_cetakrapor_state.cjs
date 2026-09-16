const fs = require('fs');
let code = fs.readFileSync('src/views/CetakRapor.tsx', 'utf8');

if (!code.includes('const [isTanpaAngka, setIsTanpaAngka] = useState(false);')) {
  code = code.replace(
    /const \[selectedStudent, setSelectedStudent\] = useState<string>\(siswa\[0\]\?\.id \|\| ''\);/,
    `const [selectedStudent, setSelectedStudent] = useState<string>(siswa[0]?.id || '');\n  const [isTanpaAngka, setIsTanpaAngka] = useState(false);`
  );
}

fs.writeFileSync('src/views/CetakRapor.tsx', code);
