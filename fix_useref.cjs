const fs = require('fs');
let code = fs.readFileSync('src/components/KriteriaKetuntasan.tsx', 'utf8');

if (!code.includes('useRef')) {
  code = code.replace(
    /import React, \{ useState \} from 'react';/,
    `import React, { useState, useRef, useEffect } from 'react';`
  );
} else if (!code.includes('import React, { useState, useRef')) {
    code = code.replace(
        /import React, \{ useState \} from 'react';/,
        `import React, { useState, useRef, useEffect } from 'react';`
      );
}

fs.writeFileSync('src/components/KriteriaKetuntasan.tsx', code);
