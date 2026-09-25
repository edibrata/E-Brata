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
  const { state } = useAppStore();
  const { sekolah } = state;

  const isUnlocked = Boolean(
    sekolah?.kepsek?.trim() &&
    sekolah?.nipKepsek?.trim() &&
    (sekolah?.waKepalaSekolah?.trim() || (sekolah as any)?.waKepsek?.trim()) &&
    sekolah?.waliKelas?.trim() &&
    sekolah?.nipWaliKelas?.trim() &&
    (sekolah?.waGuru?.trim() || (sekolah as any)?.waWaliKelas?.trim())
  );

  const isAlwaysAllowedView = (view: string) => {
    return (
      view === 'dashboard' ||
      view === 'data-dasar' ||
      view === 'data-sekolah' ||
      view === 'sistem-petunjuk' ||
      view === 'petunjuk' ||
      view === 'panduan-asesmen' ||
      view === 'sistem-profil' ||
      view === 'profil-pengembang'
    );
  };

  const [activeView, setActiveView] = useState('dashboard');
  const effectiveView = isUnlocked || isAlwaysAllowedView(activeView) ? activeView : 'dashboard';
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
        activeView={effectiveView} 
        setActiveView={(v) => { 
          if (!isUnlocked && !isAlwaysAllowedView(v)) {
            setActiveView('data-dasar');
          } else {
            setActiveView(v); 
          }
          if (window.innerWidth < 1024) setIsSidebarOpen(false); 
        }} 
        isOpen={isSidebarOpen} 
        onOpenDevProfile={() => setShowDevProfileModal(true)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 main-content h-[100dvh] overflow-y-auto">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onOpenDevProfile={() => setShowDevProfileModal(true)} />
        
        <main className="p-6 lg:p-8 md:p-6 p-4 flex-1 overflow-x-hidden">
          {/* 1. UTAMA */}
          {effectiveView === 'dashboard' && <DashboardView onOpenDevProfile={() => setShowDevProfileModal(true)} onNavigate={(v) => setActiveView(v)} />}
          {(effectiveView === 'data-dasar' || effectiveView === 'data-sekolah') && <DataSekolah />}
          {(effectiveView === 'data-murid' || effectiveView === 'data-siswa') && <DataSiswa />}

          {/* 2. INTRAKURIKULER */}
          {(effectiveView === 'intra-perencanaan' || effectiveView === 'kegiatan-akademik') && <KegiatanAkademik />}
          {(effectiveView === 'intra-input-nilai' || effectiveView === 'input-nilai') && <InputNilai />}
          {effectiveView === 'intra-capaian' && <SesuaikanCapaian defaultTab="intrakurikuler" />}

          {/* 3. KOKURIKULER */}
          {(effectiveView === 'koku-perencanaan' || effectiveView === 'data-projek') && <DataProjekView />}
          {(effectiveView === 'koku-input-nilai' || effectiveView === 'nilai-projek') && <NilaiProjek />}
          {effectiveView === 'koku-capaian' && <SesuaikanCapaian defaultTab="kokurikuler" />}

          {/* 4. EKSTRAKURIKULER */}
          {(effectiveView === 'ekskul-perencanaan' || effectiveView === 'data-ekskul') && <DataEkstrakurikuler />}
          {(effectiveView === 'ekskul-input-nilai' || effectiveView === 'nilai-ekskul') && <NilaiEkskulView />}
          {effectiveView === 'ekskul-capaian' && <SesuaikanCapaian defaultTab="ekstrakurikuler" />}

          {/* 5. OUTPUT & CETAK */}
          {(effectiveView === 'output-capaian' || effectiveView === 'sesuaikan-capaian') && <SesuaikanCapaian />}
          {(effectiveView === 'output-catatan' || effectiveView === 'generate-catatan-wali') && <GenerateCatatanWali />}
          {(effectiveView === 'output-leger' || effectiveView === 'leger') && <Leger />}
          {(effectiveView === 'output-cetak' || effectiveView === 'cetak-rapor' || effectiveView === 'jilid-identitas' || effectiveView === 'biodata-murid' || effectiveView === 'lampiran-buku-induk' || effectiveView === 'keterangan-pindah') && <CetakRapor />}

          {/* 6. MANAJEMEN DATA */}
          {(effectiveView === 'manajemen-sampah' || effectiveView === 'kotak-sampah') && <ManajemenDataView initialTab="sampah" />}
          {effectiveView === 'manajemen-ekspor' && <ManajemenDataView initialTab="ekspor" />}
          {effectiveView === 'manajemen-impor' && <ManajemenDataView initialTab="impor" />}
          {effectiveView === 'manajemen-backup' && <ManajemenDataView initialTab="backup" />}
          {effectiveView === 'manajemen-restore' && <ManajemenDataView initialTab="restore" />}

          {/* 7. SISTEM */}
          {(effectiveView === 'sistem-petunjuk' || effectiveView === 'petunjuk') && <Petunjuk />}
          {effectiveView === 'panduan-asesmen' && <PanduanAsesmen />}
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
