const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  /export interface Mapel {/,
  `export interface Mapel {
  intervalBatas?: number[]; // [batas1, batas2, batas3, batas4] e.g. [20, 40, 60, 80]`
);

fs.writeFileSync('src/types.ts', code);
