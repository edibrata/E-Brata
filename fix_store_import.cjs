const fs = require('fs');
let code = fs.readFileSync('src/components/KriteriaKetuntasan.tsx', 'utf8');

// The store hook is named useAppStore, not useStore
code = code.replace(
  /import \{ useStore \} from '\.\.\/store';/g,
  `import { useAppStore } from '../store';`
);

code = code.replace(
  /const \{ state, updateState \} = useStore\(\);/g,
  `const { state, updateState } = useAppStore();`
);

fs.writeFileSync('src/components/KriteriaKetuntasan.tsx', code);
