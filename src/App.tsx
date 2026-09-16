import { useState } from 'react';
import { AppProvider, useAppStore } from '@/store';
import { AnimatePresence } from 'motion/react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DataSekolah from '@/views/DataSekolah';
import KegiatanAkademik from '@/views/KegiatanAkademik';
import DataSiswa from '@/views/DataSiswa';
import DataEkstrakurikuler from '@/views/DataEkstrakurikuler';
import InputNilai from '@/views/InputNilai';
import Leger from '@/views/Leger';
import DataProjekView from '@/views/DataProjek';
import NilaiProjek from '@/views/NilaiProjek';
import CetakRapor from '@/views/CetakRapor';
import KotakSampah from '@/views/KotakSampah';
import Placeholder from '@/views/Placeholder';
import Petunjuk from '@/views/Petunjuk';
import PanduanAsesmen from '@/views/PanduanAsesmen';
import LoginModal from '@/components/LoginModal';
import DashboardView from '@/views/DashboardView';
import DeveloperProfileModal from '@/components/DeveloperProfileModal';

function Dashboard() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [showDevProfileModal, setShowDevProfileModal] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <Sidebar 
        activeView={activeView} 
        setActiveView={(v) => { 
          setActiveView(v); 
          if (window.innerWidth < 1024) setIsSidebarOpen(false); 
        }} 
        isOpen={isSidebarOpen} 
        onOpenDevProfile={() => setShowDevProfileModal(true)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 main-content h-screen overflow-y-auto">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onOpenDevProfile={() => setShowDevProfileModal(true)} />
        
        <main className="p-6 lg:p-8 md:p-6 p-4 flex-1 overflow-x-hidden">
          {activeView === 'dashboard' && <DashboardView onOpenDevProfile={() => setShowDevProfileModal(true)} />}
          {activeView === 'data-sekolah' && <DataSekolah />}
          {activeView === 'kegiatan-akademik' && <KegiatanAkademik />}
          {activeView === 'data-siswa' && <DataSiswa />}
          {activeView === 'data-ekskul' && <DataEkstrakurikuler />}
          {activeView === 'kotak-sampah' && <KotakSampah />}
          {activeView === 'data-pendukung' && <Placeholder title="Data Pendukung" />}

          {activeView === 'input-nilai' && <InputNilai />}
          {activeView === 'sesuaikan-capaian' && <Placeholder title="Lihat & Sesuaikan Capaian" />}
          {activeView === 'nilai-ekskul' && <Placeholder title="Nilai Ekstrakurikuler" />}
          {activeView === 'data-projek' && <DataProjekView />}
          {activeView === 'nilai-projek' && <NilaiProjek />}
          {activeView === 'leger' && <Leger />}

          {activeView === 'jilid-identitas' && <Placeholder title="Jilid & Identitas" />}
          {activeView === 'biodata-murid' && <Placeholder title="Biodata Murid" />}
          {activeView === 'cetak-rapor' && <CetakRapor />}
          {activeView === 'lampiran-buku-induk' && <Placeholder title="Lampiran Buku Induk" />}
          {activeView === 'keterangan-pindah' && <Placeholder title="Keterangan Pindah" />}

          {activeView === 'dashboard-analitik' && <Placeholder title="Dashboard Analitik" />}
          {activeView === 'ai-assistant' && <Placeholder title="AI Assistant" />}

          {activeView === 'petunjuk' && <Petunjuk />}
          {activeView === 'panduan-asesmen' && <PanduanAsesmen />}
        </main>
        <footer className="py-5 shrink-0 border-t border-slate-200/80 bg-slate-50/80 backdrop-blur-sm">
          <div 
            className="flex items-center justify-center gap-2 text-[13px] text-slate-500 font-medium cursor-pointer hover:text-indigo-600 transition-colors"
            onClick={() => setShowDevProfileModal(true)}
          >
            Dikembangkan oleh
            <img src="https://raw.githubusercontent.com/edibrata/image/main/FotoEdiBrata.jpg" alt="Edi Brata" className="w-5 h-5 rounded-full shadow-sm object-cover" />
            <span className="font-bold text-slate-700">Edi Brata</span>
          </div>
        </footer>
      </div>
      <DeveloperProfileModal isOpen={showDevProfileModal} onClose={() => setShowDevProfileModal(false)} />
    </div>
  );
}

function RootView() {
  const { state } = useAppStore();
  
  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 relative">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1546410531-b4cafc7b74ba?auto=format&fit=crop&q=80&w=2670')] bg-cover bg-center brightness-[0.25]" />
         <LoginModal />
      </div>
    )
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AppProvider>
      <RootView />
    </AppProvider>
  );
}
