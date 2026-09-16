import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { INITIAL_STATE } from '@/constants';
import { 
  School, Users, Calendar, Camera, FolderPlus, 
  Target, PenTool, Activity, CheckSquare, 
  BookOpen, FileSpreadsheet, Printer, Book, Contact, 
  Archive, ArrowRightLeft, PieChart, Bot, Lightbulb, 
  Settings, UserCircle, Star, FolderGit2, ChevronDown, ChevronRight, LogOut, LayoutDashboard, Trash2, Medal
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen: boolean;
  onOpenDevProfile?: () => void;
}

export default function Sidebar({ activeView, setActiveView, isOpen, onOpenDevProfile }: SidebarProps) {
  const { updateState, updateSekolah } = useAppStore();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const menuGroups = [
    {
      title: 'Utama',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { id: 'data-sekolah', label: 'Data Dasar', icon: <School size={18} /> },
      ]
    },
    {
      title: 'Perencanaan',
      items: [
        { id: 'kegiatan-akademik', label: 'Intrakurikuler', icon: <Calendar size={18} /> },
        { id: 'data-ekskul', label: 'Ekstrakurikuler', icon: <Medal size={18} /> },
        { id: 'data-siswa', label: 'Data Murid', icon: <Users size={18} /> },
        { id: 'data-pendukung', label: 'Data Pendukung', icon: <FolderPlus size={18} /> },
      ]
    },
    {
      title: 'Akademik & Penilaian',
      items: [
        { id: 'input-nilai', label: 'Nilai Intrakurikuler', icon: <PenTool size={18} /> },
        { id: 'sesuaikan-capaian', label: 'Sesuaikan Capaian', icon: <CheckSquare size={18} /> },
        { id: 'nilai-ekskul', label: 'Nilai Ekstrakurikuler', icon: <Activity size={18} /> },
        { id: 'data-projek', label: 'Data Projek', icon: <FolderGit2 size={18} /> },
        { id: 'nilai-projek', label: 'Nilai Kokurikuler', icon: <Star size={18} /> },
        { id: 'leger', label: 'Leger Nilai', icon: <FileSpreadsheet size={18} /> },
      ]
    },
    {
      title: 'Output/Cetak',
      items: [
        { id: 'jilid-identitas', label: 'Jilid & Identitas', icon: <Book size={18} /> },
        { id: 'biodata-murid', label: 'Biodata Murid', icon: <Contact size={18} /> },
        { id: 'cetak-rapor', label: 'Cetak Rapor', icon: <Printer size={18} /> },
        { id: 'lampiran-buku-induk', label: 'Lampiran Buku Induk', icon: <Archive size={18} /> },
        { id: 'keterangan-pindah', label: 'Keterangan Pindah', icon: <ArrowRightLeft size={18} /> },
      ]
    },
    {
      title: 'Fitur Professional',
      items: [
        { id: 'dashboard-analitik', label: 'Dashboard Analitik', icon: <PieChart size={18} /> },
        { id: 'ai-assistant', label: 'AI Assistant', icon: <Bot size={18} /> },
      ]
    },
    {
      title: 'Sistem',
      items: [
        { id: 'panduan-asesmen', label: 'Panduan Asesmen 2025', icon: <BookOpen size={18} /> },
        { id: 'petunjuk', label: 'Petunjuk Penggunaan', icon: <Lightbulb size={18} /> },
        { id: 'kotak-sampah', label: 'Kotak Sampah', icon: <Trash2 size={18} /> },
        { id: 'profil-pengembang', label: 'Profil Pengembang', icon: <UserCircle size={18} /> },
      ]
    }
  ];

  useEffect(() => {
    // Cari grup mana yang memiliki item yang sedang aktif
    const activeGroup = menuGroups.find(group => 
      group.items.some(item => item.id === activeView)
    );
    if (activeGroup) {
      setExpandedGroup(activeGroup.title);
    }
  }, [activeView]);

  const toggleGroup = (title: string) => {
    setExpandedGroup(prev => prev === title ? null : title);
  };
  
  const handleLogout = () => {
    updateState('isAuthenticated', false);
    updateSekolah(INITIAL_STATE.sekolah);
    setActiveView('dashboard');
  };

  return (
    <aside className={`sidebar bg-white border-r border-slate-200 text-slate-800 flex flex-col h-screen fixed lg:sticky top-0 z-40 shadow-sm overflow-hidden transition-all duration-300 ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0'}`}>
      <div className="h-16 flex items-center justify-center border-b border-slate-200 shrink-0 px-4">
        <div className="flex items-center gap-3 w-full">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white font-bold font-sans shrink-0 overflow-hidden border border-blue-200 cursor-pointer transition-transform duration-200 hover:scale-110">
            <img src="https://raw.githubusercontent.com/edibrata/image/main/FotoEdiBrata.jpg" alt="Edi Brata" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 whitespace-nowrap transition-opacity duration-300 flex flex-col justify-center -space-y-0.5">
            <h1 className="font-extrabold text-[15px] tracking-tight text-slate-800 flex items-center gap-1.5 leading-none">
              E-Rapor <span className="text-blue-600 font-black">Edi Brata</span>
            </h1>
            <div>
              <span 
                className="text-[9px] font-black text-white bg-gradient-to-r from-blue-700 to-blue-500 px-1.5 rounded shadow-sm uppercase tracking-widest leading-none hover:opacity-90 transition-opacity cursor-pointer inline-block"
                onClick={onOpenDevProfile}
                style={{ paddingTop: '2px', paddingBottom: '2px' }}
              >
                v5.0 PRO
              </span>
            </div>
          </div>
        </div>
      </div>
            
      <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {menuGroups.map((group, idx) => (
          <div key={idx} className="mb-2">
            <button 
              onClick={() => toggleGroup(group.title)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors rounded-md focus:outline-none group opacity-90 hover:opacity-100"
            >
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                {group.title}
              </p>
              {expandedGroup === group.title ? (
                <ChevronDown size={14} className="text-slate-500 group-hover:text-slate-700 transition-colors" />
              ) : (
                <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-700 transition-colors" />
              )}
            </button>
            
            <div 
              className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
                expandedGroup === group.title ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}
            >
              <ul className="space-y-1">
                {group.items.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        if (item.id === 'profil-pengembang' && onOpenDevProfile) {
                          onOpenDevProfile();
                        } else {
                          setActiveView(item.id);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-xs transition-all ${
                        activeView === item.id 
                          ? 'bg-indigo-50 text-blue-700 font-bold' 
                          : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <div className={activeView === item.id ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-700'}>
                        {item.icon}
                      </div>
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </nav>
      
      <div className="p-4 bg-slate-50/20 border-t border-slate-100 flex items-center justify-between shrink-0">
        <div 
          className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-1.5 -ml-1.5 rounded-lg transition-colors"
          onClick={onOpenDevProfile}
        >
          <img 
            src="https://raw.githubusercontent.com/edibrata/image/main/FotoEdiBrata.jpg" 
            alt="Edi Brata" 
            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 group-hover:ring-blue-300 transition-all duration-300 group-hover:scale-105"
          />
          <div>
            <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">Edi Brata</p>
            <p className="text-[10px] text-slate-500 transition-colors">&copy; EduDev {new Date().getFullYear()}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 -mr-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none group relative"
        >
          <LogOut size={16} />
          <span className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 bottom-full mb-2 right-0 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-bottom-1 before:right-2 before:border-4 before:border-transparent before:border-t-slate-800">Ganti Sekolah/Logout</span>
        </button>
      </div>
    </aside>
  );
}
