const fs = require('fs');
let code = fs.readFileSync('src/components/KriteriaKetuntasan.tsx', 'utf8');

// I will make handlePointerDown handle both mouse and touch events natively without relying strictly on pointer events which might have issues in some iframes, or just use touchAction: 'none' properly. Actually pointer events work well, but let's just make it very robust.

code = code.replace(
  /onPointerDown=\{handlePointerDown\(idx\)\}/g,
  `onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); handlePointerDown(idx)(e); }}`
);

fs.writeFileSync('src/components/KriteriaKetuntasan.tsx', code);
