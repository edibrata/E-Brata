const fs = require('fs');
let code = fs.readFileSync('src/components/KriteriaKetuntasan.tsx', 'utf8');

// Fix the unescaped > character in JSX
code = code.replace(
  /Batas Tuntas: > \{currentIntervals\[2\]\}/g,
  `Batas Tuntas: &gt; {currentIntervals[2]}`
);

code = code.replace(
  /\(>\{tempIntervals\[2\]\}\)/g,
  `(&gt;{tempIntervals[2]})`
);

fs.writeFileSync('src/components/KriteriaKetuntasan.tsx', code);
