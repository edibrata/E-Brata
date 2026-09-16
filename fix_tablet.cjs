const fs = require('fs');

// 1. Fix App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');

appCode = appCode.replace(
  /md:hidden/g,
  `lg:hidden`
);

appCode = appCode.replace(
  /window.innerWidth < 768/g,
  `window.innerWidth < 1024`
);

appCode = appCode.replace(
  /window.innerWidth >= 768/g,
  `window.innerWidth >= 1024`
);

appCode = appCode.replace(
  /md:p-8/g,
  `lg:p-8 md:p-6 p-4`
);

fs.writeFileSync('src/App.tsx', appCode);

// 2. Fix Sidebar.tsx
let sidebarCode = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

sidebarCode = sidebarCode.replace(
  /fixed md:sticky/g,
  `fixed lg:sticky`
);

fs.writeFileSync('src/components/Sidebar.tsx', sidebarCode);
