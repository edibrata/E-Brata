const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Handle sidebar closing on mobile
code = code.replace(
  /<Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} onOpenDevProfile={\(\) => setShowDevProfileModal\(true\)} \/>/,
  `{isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <Sidebar 
        activeView={activeView} 
        setActiveView={(v) => { 
          setActiveView(v); 
          if (window.innerWidth < 768) setIsSidebarOpen(false); 
        }} 
        isOpen={isSidebarOpen} 
        onOpenDevProfile={() => setShowDevProfileModal(true)} 
      />`
);

// Initially on mobile sidebar should be closed
// Find `const [isSidebarOpen, setIsSidebarOpen] = useState(true);`
code = code.replace(
  /const \[isSidebarOpen, setIsSidebarOpen\] = useState\(true\);/,
  `const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);`
);

fs.writeFileSync('src/App.tsx', code);
