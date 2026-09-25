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
import SesuaikanCapaian from '@/views/SesuaikanCapaian';
import KotakSampah from '@/views/KotakSampah';
import DataPendukung from '@/views/DataPendukung';
import GenerateCatatanWali from '@/views/GenerateCatatanWali';
import NilaiEkskulView from '@/views/NilaiEkskulView';
import ManajemenDataView from '@/views/ManajemenDataView';
import Placeholder from '@/views/Placeholder';
import Petunjuk from '@/views/Petunjuk';
import PanduanAsesmen from '@/views/PanduanAsesmen';
import LoginModal from '@/components/LoginModal';
import DashboardView from '@/views/DashboardView';
import DeveloperProfileModal from '@/components/DeveloperProfileModal';

function Dashboard() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [showDevProfileModal, setShowDevProfileModal] = useState(true);

  return (
    <div className="flex min-h-[100dvh] bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
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
      
      <div className="flex-1 flex flex-col min-w-0 main-content h-[100dvh] overflow-y-auto">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onOpenDevProfile={() => setShowDevProfileModal(true)} />
        
        <main className="p-6 lg:p-8 md:p-6 p-4 flex-1 overflow-x-hidden">
          {/* 1. UTAMA */}
          {activeView === 'dashboard' && <DashboardView onOpenDevProfile={() => setShowDevProfileModal(true)} onNavigate={(v) => setActiveView(v)} />}
          {(activeView === 'data-dasar' || activeView === 'data-sekolah') && <DataSekolah />}
          {(activeView === 'data-murid' || activeView === 'data-siswa') && <DataSiswa />}

          {/* 2. INTRAKURIKULER */}
          {(activeView === 'intra-perencanaan' || activeView === 'kegiatan-akademik') && <KegiatanAkademik />}
          {(activeView === 'intra-input-nilai' || activeView === 'input-nilai') && <InputNilai />}

          {/* 3. KOKURIKULER */}
          {(activeView === 'koku-perencanaan' || activeView === 'data-projek') && <DataProjekView />}
          {(activeView === 'koku-input-nilai' || activeView === 'nilai-projek') && <NilaiProjek />}

          {/* 4. EKSTRAKURIKULER */}
          {(activeView === 'ekskul-perencanaan' || activeView === 'data-ekskul') && <DataEkstrakurikuler />}
          {(activeView === 'ekskul-input-nilai' || activeView === 'nilai-ekskul') && <NilaiEkskulView />}

          {/* 5. OUTPUT & CETAK */}
          {(activeView === 'output-capaian' || activeView === 'sesuaikan-capaian' || activeView === 'intra-capaian' || activeView === 'koku-capaian' || activeView === 'ekskul-capaian') && <SesuaikanCapaian />}
          {(activeView === 'output-catatan' || activeView === 'generate-catatan-wali') && <GenerateCatatanWali />}
          {(activeView === 'output-leger' || activeView === 'leger') && <Leger />}
          {(activeView === 'output-cetak' || activeView === 'cetak-rapor' || activeView === 'jilid-identitas' || activeView === 'biodata-murid' || activeView === 'lampiran-buku-induk' || activeView === 'keterangan-pindah') && <CetakRapor />}

          {/* 6. MANAJEMEN DATA */}
          {(activeView === 'manajemen-sampah' || activeView === 'kotak-sampah') && <ManajemenDataView initialTab="sampah" />}
          {activeView === 'manajemen-ekspor' && <ManajemenDataView initialTab="ekspor" />}
          {activeView === 'manajemen-impor' && <ManajemenDataView initialTab="impor" />}
          {activeView === 'manajemen-backup' && <ManajemenDataView initialTab="backup" />}
          {activeView === 'manajemen-restore' && <ManajemenDataView initialTab="restore" />}

          {/* 7. SISTEM */}
          {(activeView === 'sistem-petunjuk' || activeView === 'petunjuk') && <Petunjuk />}
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

import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <RootView />
      </AppProvider>
    </ErrorBoundary>
  );
}
