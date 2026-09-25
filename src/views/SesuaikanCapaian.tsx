import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';
import { 
  CheckSquare, 
  Sparkles, 
  RotateCcw, 
  Shuffle, 
  BookOpen, 
  Medal, 
  Compass, 
  Search, 
  Check, 
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Layers,
  ArrowUpDown,
  X
} from 'lucide-react';
import Tooltip from '@/components/Tooltip';
import { isPabpMapel, filterTpsForStudent } from '@/lib/agamaUtils';
import { 
  hitungNilaiMapel, 
  get5VariasiIntrakurikuler, 
  get5VariasiEkskul, 
  get5VariasiKokurikuler,
  getAmbangBatasKktp
} from '@/lib/penilaianUtils';

type TransitTab = 'intrakurikuler' | 'ekstrakurikuler' | 'kokurikuler';

interface SesuaikanCapaianProps {
  defaultTab?: TransitTab;
}

export default function SesuaikanCapaian({ defaultTab = 'intrakurikuler' }: SesuaikanCapaianProps) {
  const { state, updateState } = useAppStore();
  const { 
    siswa, 
    mapel, 
    tujuanPembelajaran, 
    nilai, 
    ekstrakurikuler, 
    nilaiEkskul = {}, 
    projek, 
    dimensiProjek, 
    nilaiP5 = {},
    customDeskripsiMapel = {},
    customDeskripsiKokurikuler = {}
  } = state;

  const [activeTab, setActiveTab] = useState<TransitTab>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Intrakurikuler State
  const displayedMapel = useMemo(() => mapel.filter(m => m.tampilRapor !== false), [mapel]);
  const [selectedMapelId, setSelectedMapelId] = useState<string>(displayedMapel[0]?.id || '');
  const [intrakurikulerVariationIndex, setIntrakurikulerVariationIndex] = useState<Record<string, number>>({});

  // Ekstrakurikuler State
  const displayedEkskul = useMemo(() => ekstrakurikuler.filter(e => e.tampilRapor !== false), [ekstrakurikuler]);
  const [selectedEkskulId, setSelectedEkskulId] = useState<string>(displayedEkskul[0]?.id || '');
  const [ekskulVariationIndex, setEkskulVariationIndex] = useState<Record<string, number>>({});

  // Kokurikuler State
  const [selectedProjekId, setSelectedProjekId] = useState<string>(projek[0]?.id || '');
  const [kokurikulerVariationIndex, setKokurikulerVariationIndex] = useState<Record<string, number>>({});

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filteredSiswa = useMemo(() => {
    if (!searchQuery.trim()) return siswa;
    const q = searchQuery.toLowerCase();
    return siswa.filter(s => 
      s.nama.toLowerCase().includes(q) || 
      (s.nisn && s.nisn.includes(q)) || 
      (s.nis && s.nis.includes(q))
    );
  }, [siswa, searchQuery]);

  const activeMapel = displayedMapel.find(m => m.id === selectedMapelId) || displayedMapel[0];
  const activeEkskul = displayedEkskul.find(e => e.id === selectedEkskulId) || displayedEkskul[0];
  const activeProjek = projek.find(p => p.id === selectedProjekId) || projek[0];

  const currentMapelIndex = displayedMapel.findIndex(m => m.id === selectedMapelId);
  const currentEkskulIndex = displayedEkskul.findIndex(e => e.id === selectedEkskulId);
  const currentProjekIndex = projek.findIndex(p => p.id === selectedProjekId);

  // Helper navigasi Mapel
  const handlePrevMapel = () => {
    if (displayedMapel.length <= 1) return;
    const newIdx = (currentMapelIndex - 1 + displayedMapel.length) % displayedMapel.length;
    setSelectedMapelId(displayedMapel[newIdx].id);
  };

  const handleNextMapel = () => {
    if (displayedMapel.length <= 1) return;
    const newIdx = (currentMapelIndex + 1) % displayedMapel.length;
    setSelectedMapelId(displayedMapel[newIdx].id);
  };

  // Helper mendapatkan deskripsi default intrakurikuler untuk 1 siswa
  const getDefaultDeskripsiIntra = (studentId: string, mapelId: string): string => {
    const targetMapel = mapel.find(m => m.id === mapelId);
    if (!targetMapel) return '';
    const student = siswa.find(s => s.id === studentId);
    const isPabp = isPabpMapel(targetMapel.nama, targetMapel.kode);
    const allMapelTps = tujuanPembelajaran.filter(tp => tp.mapelId === mapelId);
    const mapelTps = isPabp
      ? filterTpsForStudent(allMapelTps, student?.agama, true)
      : allMapelTps;

    const n = nilai[studentId]?.[mapelId];
    const res = hitungNilaiMapel(targetMapel, mapelTps, n, studentId);

    let desk = '';
    if (res.deskripsiTertinggi) desk += res.deskripsiTertinggi;
    if (res.deskripsiTerendah) {
      if (desk) desk += '\n\n';
      desk += res.deskripsiTerendah;
    }
    return desk || 'Menunjukkan penguasaan capaian kompetensi dengan baik dalam proses pembelajaran.';
  };

  // Helper mendapatkan 5 variasi intrakurikuler untuk 1 siswa
  const get5VariasiIntraForStudent = (studentId: string, mapelId: string): string[] => {
    const targetMapel = mapel.find(m => m.id === mapelId);
    if (!targetMapel) return [];
    const student = siswa.find(s => s.id === studentId);
    const isPabp = isPabpMapel(targetMapel.nama, targetMapel.kode);
    const allMapelTps = tujuanPembelajaran.filter(tp => tp.mapelId === mapelId);
    const mapelTps = isPabp
      ? filterTpsForStudent(allMapelTps, student?.agama, true)
      : allMapelTps;

    const n = nilai[studentId]?.[mapelId];
    const res = hitungNilaiMapel(targetMapel, mapelTps, n, studentId);
    const kktp = getAmbangBatasKktp(targetMapel);

    return get5VariasiIntrakurikuler(
      targetMapel,
      mapelTps,
      res.maxTpItem || null,
      res.minTpItem || null,
      kktp,
      n?.tpScores || {}
    );
  };

  // Update deskripsi intrakurikuler untuk 1 siswa
  const handleUpdateDeskripsiIntra = (studentId: string, mapelId: string, text: string) => {
    updateState('customDeskripsiMapel', {
      ...customDeskripsiMapel,
      [studentId]: {
        ...(customDeskripsiMapel[studentId] || {}),
        [mapelId]: text
      }
    });
  };

  // Putar ke variasi berikutnya untuk 1 siswa (Intrakurikuler)
  const handleCycleVariasiIntra = (studentId: string, mapelId: string) => {
    const variations = get5VariasiIntraForStudent(studentId, mapelId);
    if (variations.length === 0) return;

    const key = `${studentId}_${mapelId}`;
    const currentIndex = intrakurikulerVariationIndex[key] !== undefined ? intrakurikulerVariationIndex[key] : 0;
    const nextIndex = (currentIndex + 1) % variations.length;

    setIntrakurikulerVariationIndex(prev => ({ ...prev, [key]: nextIndex }));
    handleUpdateDeskripsiIntra(studentId, mapelId, variations[nextIndex]);
  };

  // Reset deskripsi intrakurikuler ke default PPA 2025 untuk 1 siswa
  const handleResetIntra = (studentId: string, mapelId: string) => {
    const defaultText = getDefaultDeskripsiIntra(studentId, mapelId);
    handleUpdateDeskripsiIntra(studentId, mapelId, defaultText);
    const key = `${studentId}_${mapelId}`;
    setIntrakurikulerVariationIndex(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    showToast('Deskripsi di-reset ke formula standar');
  };

  // Salin teks ke clipboard
  const handleCopyText = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
      showToast('Teks disalin ke clipboard');
    }
  };

  // Variasikan semua murid secara massal untuk mapel aktif (1 kelas langsung punya redaksi unik dan bisa diputar berkali-kali hingga 5 variasi)
  const handleVariasikanSemuaIntra = () => {
    if (!activeMapel) return;
    const updated = { ...customDeskripsiMapel };
    const newIdxMap = { ...intrakurikulerVariationIndex };

    filteredSiswa.forEach((student, idx) => {
      const variations = get5VariasiIntraForStudent(student.id, activeMapel.id);
      if (variations.length > 0) {
        const key = `${student.id}_${activeMapel.id}`;
        const currentIdx = intrakurikulerVariationIndex[key] !== undefined 
          ? intrakurikulerVariationIndex[key] 
          : (idx % variations.length);
        const nextIdx = (currentIdx + 1) % variations.length;
        newIdxMap[key] = nextIdx;
        if (!updated[student.id]) updated[student.id] = {};
        updated[student.id][activeMapel.id] = variations[nextIdx];
      }
    });

    updateState('customDeskripsiMapel', updated);
    setIntrakurikulerVariationIndex(newIdxMap);
    showToast(`Variasi redaksi diterapkan untuk ${filteredSiswa.length} murid (${activeMapel.nama})`);
  };

  // Reset semua murid ke formula standar PPA 2025
  const handleResetSemuaIntra = () => {
    if (!activeMapel) return;
    const updated = { ...customDeskripsiMapel };
    const newIdxMap = { ...intrakurikulerVariationIndex };

    filteredSiswa.forEach(student => {
      const key = `${student.id}_${activeMapel.id}`;
      delete newIdxMap[key];
      if (updated[student.id]) {
        delete updated[student.id][activeMapel.id];
      }
    });

    updateState('customDeskripsiMapel', updated);
    setIntrakurikulerVariationIndex(newIdxMap);
    showToast(`Deskripsi ${activeMapel.nama} telah di-reset ke formula baku`);
  };

  // ==========================================
  // HANDLERS EKSTRAKURIKULER
  // ==========================================
  const handleUpdateEkskul = (studentId: string, ekskulId: string, predikat: string, deskripsi: string) => {
    updateState('nilaiEkskul', {
      ...nilaiEkskul,
      [studentId]: {
        ...(nilaiEkskul[studentId] || {}),
        [ekskulId]: { predikat, deskripsi }
      }
    });
  };

  const handleCycleVariasiEkskul = (studentId: string, ekskulId: string) => {
    if (!activeEkskul) return;
    const currentNe = nilaiEkskul[studentId]?.[ekskulId];
    const predikat = currentNe?.predikat || 'Baik (B)';
    const variations = get5VariasiEkskul(activeEkskul.nama, predikat);

    const key = `${studentId}_${ekskulId}`;
    const currentIndex = ekskulVariationIndex[key] !== undefined ? ekskulVariationIndex[key] : 0;
    const nextIndex = (currentIndex + 1) % variations.length;

    setEkskulVariationIndex(prev => ({ ...prev, [key]: nextIndex }));
    handleUpdateEkskul(studentId, ekskulId, predikat, variations[nextIndex]);
  };

  const handleVariasikanSemuaEkskul = () => {
    if (!activeEkskul) return;
    const updated = { ...nilaiEkskul };
    const newIdxMap = { ...ekskulVariationIndex };

    filteredSiswa.forEach((student, idx) => {
      const currentPred = updated[student.id]?.[activeEkskul.id]?.predikat || 'Baik (B)';
      const variations = get5VariasiEkskul(activeEkskul.nama, currentPred);
      const key = `${student.id}_${activeEkskul.id}`;
      const currentIdx = ekskulVariationIndex[key] !== undefined 
        ? ekskulVariationIndex[key] 
        : (idx % variations.length);
      const nextIdx = (currentIdx + 1) % variations.length;
      newIdxMap[key] = nextIdx;

      if (!updated[student.id]) updated[student.id] = {};
      updated[student.id][activeEkskul.id] = {
        predikat: currentPred,
        deskripsi: variations[nextIdx]
      };
    });

    updateState('nilaiEkskul', updated);
    setEkskulVariationIndex(newIdxMap);
    showToast(`Variasi redaksi diterapkan untuk ${activeEkskul.nama}`);
  };

  // ==========================================
  // HANDLERS KOKURIKULER
  // ==========================================
  const handleUpdateKokurikuler = (studentId: string, projekId: string, text: string) => {
    updateState('customDeskripsiKokurikuler', {
      ...customDeskripsiKokurikuler,
      [studentId]: {
        ...(customDeskripsiKokurikuler[studentId] || {}),
        [projekId]: text
      }
    });
  };

  const handleCycleVariasiKokurikuler = (studentId: string, projekId: string) => {
    if (!activeProjek) return;
    const variations = get5VariasiKokurikuler(activeProjek.tema, activeProjek.deskripsi);
    const key = `${studentId}_${projekId}`;
    const currentIndex = kokurikulerVariationIndex[key] !== undefined ? kokurikulerVariationIndex[key] : 0;
    const nextIndex = (currentIndex + 1) % variations.length;

    setKokurikulerVariationIndex(prev => ({ ...prev, [key]: nextIndex }));
    handleUpdateKokurikuler(studentId, projekId, variations[nextIndex]);
  };

  const handleVariasikanSemuaKokurikuler = () => {
    if (!activeProjek) return;
    const updated = { ...customDeskripsiKokurikuler };
    const newIdxMap = { ...kokurikulerVariationIndex };

    filteredSiswa.forEach((student, idx) => {
      const variations = get5VariasiKokurikuler(activeProjek.tema, activeProjek.deskripsi);
      const key = `${student.id}_${activeProjek.id}`;
      const currentIdx = kokurikulerVariationIndex[key] !== undefined 
        ? kokurikulerVariationIndex[key] 
        : (idx % variations.length);
      const nextIdx = (currentIdx + 1) % variations.length;
      newIdxMap[key] = nextIdx;

      if (!updated[student.id]) updated[student.id] = {};
      updated[student.id][activeProjek.id] = variations[nextIdx];
    });

    updateState('customDeskripsiKokurikuler', updated);
    setKokurikulerVariationIndex(newIdxMap);
    showToast(`Variasi redaksi diterapkan untuk tema "${activeProjek.tema}"`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -m-4 md:-m-6 lg:-m-8 bg-slate-50/60 overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900/95 text-white text-xs px-3.5 py-2 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-3 duration-150">
          <Sparkles size={13} className="text-amber-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ULTRA-COMPACT SINGLE BAR STICKY HEADER */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs px-3 sm:px-5 py-2.5 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 max-w-7xl mx-auto">
          
          {/* Sisi Kiri: Ikon + Segmented Control Tabs + Dropdown Selector Sejajar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Segmented Control Tabs */}
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200/70">
              <button
                type="button"
                onClick={() => setActiveTab('intrakurikuler')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'intrakurikuler'
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen size={12} />
                <span>Intrakurikuler</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ekstrakurikuler')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'ekstrakurikuler'
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Medal size={12} />
                <span>Ekstrakurikuler</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('kokurikuler')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === 'kokurikuler'
                    ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Compass size={12} />
                <span>Kokurikuler</span>
              </button>
            </div>

            {/* Selector Dropdown Intrakurikuler */}
            {activeTab === 'intrakurikuler' && (
              <div className="flex items-center gap-1">
                <div className="relative w-44 sm:w-60">
                  <select
                    value={selectedMapelId}
                    onChange={(e) => setSelectedMapelId(e.target.value)}
                    className="w-full appearance-none bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    {displayedMapel.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nama}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <Tooltip content="Mapel Sebelumnya" position="bottom">
                    <button
                      type="button"
                      onClick={handlePrevMapel}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
                      aria-label="Mapel Sebelumnya"
                    >
                      <ChevronLeft size={13} />
                    </button>
                  </Tooltip>
                  <Tooltip content="Mapel Berikutnya" position="bottom">
                    <button
                      type="button"
                      onClick={handleNextMapel}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
                      aria-label="Mapel Berikutnya"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            )}

            {/* Selector Dropdown Ekstrakurikuler */}
            {activeTab === 'ekstrakurikuler' && displayedEkskul.length > 0 && (
              <div className="relative w-52 sm:w-64">
                <select
                  value={selectedEkskulId}
                  onChange={(e) => setSelectedEkskulId(e.target.value)}
                  className="w-full appearance-none bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {displayedEkskul.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.nama} ({e.jenis})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Selector Dropdown Kokurikuler */}
            {activeTab === 'kokurikuler' && projek.length > 0 && (
              <div className="relative w-52 sm:w-72">
                <select
                  value={selectedProjekId}
                  onChange={(e) => setSelectedProjekId(e.target.value)}
                  className="w-full appearance-none bg-slate-50 hover:bg-slate-100/90 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {projek.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.tema}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Sisi Kanan: Aksi + Pencarian Sejajar */}
          <div className="flex flex-wrap items-center gap-2 justify-end flex-1">
            {/* Tombol Aksi Utama */}
            <div className="flex items-center gap-1.5">
              {activeTab === 'intrakurikuler' && (
                <>
                  <button
                    type="button"
                    onClick={handleVariasikanSemuaIntra}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
                    title="Variasikan narasi otomatis untuk seluruh kelas"
                  >
                    <Sparkles size={12} className="text-amber-300" />
                    <span>Variasikan 1 Kelas</span>
                  </button>

                  <Tooltip content="Reset Semua Deskripsi Mapel Ini ke Formula Baku PPA 2025" position="bottom">
                    <button
                      type="button"
                      onClick={handleResetSemuaIntra}
                      className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg text-xs transition-all border border-slate-200 hover:border-rose-200 shadow-2xs cursor-pointer active:scale-95"
                      aria-label="Reset Semua"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </Tooltip>
                </>
              )}

              {activeTab === 'ekstrakurikuler' && (
                <button
                  type="button"
                  onClick={handleVariasikanSemuaEkskul}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
                >
                  <Sparkles size={12} className="text-amber-300" />
                  <span>Variasikan 1 Kelas</span>
                </button>
              )}

              {activeTab === 'kokurikuler' && (
                <button
                  type="button"
                  onClick={handleVariasikanSemuaKokurikuler}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
                >
                  <Sparkles size={12} className="text-amber-300" />
                  <span>Variasikan 1 Kelas</span>
                </button>
              )}

              {/* Input Pencarian Ramping */}
              <div className="relative w-36 sm:w-48 shrink-0">
                <Search size={13} className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari murid..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-6 py-1.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* ========================================================================= */}
      {/* VERTICAL SCROLLABLE CONTENT AREA */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 max-w-7xl w-full mx-auto">
        
        {/* TAB 1: INTRAKURIKULER (COMPACT ROW CARDS) */}
        {activeTab === 'intrakurikuler' && (
          <div className="space-y-3 pb-8">
            {filteredSiswa.map((student, sIdx) => {
              if (!activeMapel) return null;
              const isPabp = isPabpMapel(activeMapel.nama, activeMapel.kode);
              const allMapelTps = tujuanPembelajaran.filter(tp => tp.mapelId === activeMapel.id);
              const mapelTps = isPabp
                ? filterTpsForStudent(allMapelTps, student.agama, true)
                : allMapelTps;

              const n = nilai[student.id]?.[activeMapel.id];
              const res = hitungNilaiMapel(activeMapel, mapelTps, n, student.id);
              const kktp = getAmbangBatasKktp(activeMapel);

              // Teks saat ini di Ruang Transit (atau fallback ke default)
              const savedCustom = customDeskripsiMapel[student.id]?.[activeMapel.id];
              const defaultDesk = getDefaultDeskripsiIntra(student.id, activeMapel.id);
              const currentText = savedCustom !== undefined ? savedCustom : defaultDesk;

              const key = `${student.id}_${activeMapel.id}`;
              const varIdx = intrakurikulerVariationIndex[key];
              const isCustomEdited = savedCustom !== undefined && savedCustom !== defaultDesk;

              return (
                <div 
                  key={student.id} 
                  className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all group space-y-2"
                >
                  {/* Baris Atas: Nomor, Nama Murid, Chip Nilai TP Inline, dan Aksi */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    
                    {/* Sisi Kiri: Identitas Murid & TP Chips Inline */}
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                        {sIdx + 1}
                      </span>
                      <span className="font-bold text-xs text-slate-800 truncate" title={student.nama}>
                        {student.nama}
                      </span>
                      {student.nisn && (
                        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                          ({student.nisn})
                        </span>
                      )}

                      {/* TP Badges Inline (Compact & Elegan dengan Tooltip) */}
                      <div className="flex flex-wrap items-center gap-1 pl-1">
                        {mapelTps.map((tp, tpIdx) => {
                          const tpScore = res.tpStatus[tp.id]?.score;
                          const isMax = res.maxTpItem?.id === tp.id && tpScore !== null;
                          const isMinUnderKktp = res.minTpItem?.id === tp.id && tpScore !== null && tpScore < kktp;
                          const isBelow = tpScore !== null && tpScore < kktp;

                          let badgeStyle = 'bg-slate-50 text-slate-600 border-slate-200';
                          if (isMax) badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
                          else if (isMinUnderKktp) badgeStyle = 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
                          else if (isBelow) badgeStyle = 'bg-amber-50 text-amber-800 border-amber-300';

                          return (
                            <Tooltip key={tp.id} content={`${tp.deskripsi} (Nilai: ${tpScore ?? '-'})`} position="top">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border flex items-center gap-0.5 select-none ${badgeStyle}`}>
                                <span>TP{tpIdx + 1}:</span>
                                <b>{tpScore ?? '-'}</b>
                                {isMax && <span className="text-[8px] text-emerald-600" title="Capaian Tertinggi">★</span>}
                                {isMinUnderKktp && <span className="text-[8px] text-rose-600" title="Perlu Penguatan">▲</span>}
                              </span>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sisi Kanan: Status & Aksi Compact */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      {varIdx !== undefined && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          ✨ Var {varIdx + 1}/5
                        </span>
                      )}
                      {isCustomEdited && varIdx === undefined && (
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                          ✏️ Manual
                        </span>
                      )}

                      {/* Tombol Ganti Variasi */}
                      <Tooltip content="Putar ke variasi narasi berikutnya (tersedia 5 variasi unik)" position="top">
                        <button
                          type="button"
                          onClick={() => handleCycleVariasiIntra(student.id, activeMapel.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors border border-indigo-200/70 active:scale-95 cursor-pointer shadow-2xs"
                        >
                          <Shuffle size={11} />
                          <span>Variasi {varIdx !== undefined ? `(${varIdx + 1}/5)` : ''}</span>
                        </button>
                      </Tooltip>

                      {/* Tombol Reset Satuan */}
                      <Tooltip content="Reset narasi murid ini ke formula standar PPA" position="top">
                        <button
                          type="button"
                          onClick={() => handleResetIntra(student.id, activeMapel.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/60 transition-colors cursor-pointer active:scale-95"
                          aria-label="Reset Murid"
                        >
                          <RotateCcw size={12} />
                        </button>
                      </Tooltip>

                      {/* Tombol Salin */}
                      <Tooltip content="Salin teks deskripsi ini" position="top">
                        <button
                          type="button"
                          onClick={() => handleCopyText(currentText, student.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/60 transition-colors cursor-pointer active:scale-95"
                          aria-label="Salin Teks"
                        >
                          {copiedId === student.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      </Tooltip>
                    </div>

                  </div>

                  {/* Baris Bawah: Textarea Deskripsi Rapor (Clean & Compact) */}
                  <textarea
                    rows={2}
                    value={currentText}
                    onChange={(e) => handleUpdateDeskripsiIntra(student.id, activeMapel.id, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-1.5 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-y font-sans placeholder:text-slate-400"
                    placeholder="Deskripsi capaian kompetensi murid..."
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: EKSTRAKURIKULER */}
        {activeTab === 'ekstrakurikuler' && (
          <div className="space-y-3 pb-8">
            {displayedEkskul.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                Belum ada data ekstrakurikuler.
              </div>
            ) : (
              filteredSiswa.map((student, sIdx) => {
                if (!activeEkskul) return null;
                const currentNe = nilaiEkskul[student.id]?.[activeEkskul.id];
                const predikat = currentNe?.predikat || 'Baik (B)';
                const deskripsi = currentNe?.deskripsi !== undefined 
                  ? currentNe.deskripsi 
                  : `Aktif mengikuti kegiatan ${activeEkskul.nama} dengan tertib dan menunjukkan perkembangan keterampilan yang baik.`;

                const key = `${student.id}_${activeEkskul.id}`;
                const varIdx = ekskulVariationIndex[key];

                return (
                  <div 
                    key={student.id} 
                    className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-xs hover:border-indigo-300 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-3.5">
                      {/* Profil & Predikat Dropdown */}
                      <div className="md:w-56 shrink-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {sIdx + 1}
                          </span>
                          <div className="min-w-0">
                            <h2 className="font-bold text-xs text-slate-800 truncate">{student.nama}</h2>
                            <div className="text-[11px] text-slate-400">NISN: {student.nisn || '-'}</div>
                          </div>
                        </div>

                        {/* Compact Predikat Select */}
                        <select
                          value={predikat}
                          onChange={(e) => {
                            const newPred = e.target.value;
                            const defaultNewDesk = get5VariasiEkskul(activeEkskul.nama, newPred)[0];
                            handleUpdateEkskul(student.id, activeEkskul.id, newPred, defaultNewDesk);
                          }}
                          className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="Sangat Baik (A)">Sangat Baik (A)</option>
                          <option value="Baik (B)">Baik (B)</option>
                          <option value="Cukup (C)">Cukup (C)</option>
                        </select>
                      </div>

                      {/* Deskripsi Catatan */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-semibold text-slate-600">
                            Catatan Ekstrakurikuler:
                          </span>

                          <button
                            onClick={() => handleCycleVariasiEkskul(student.id, activeEkskul.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors border border-indigo-200/70"
                          >
                            <Shuffle size={11} />
                            <span>Variasi {varIdx !== undefined ? `(${varIdx + 1}/5)` : ''}</span>
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={deskripsi}
                          onChange={(e) => handleUpdateEkskul(student.id, activeEkskul.id, predikat, e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50/60 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-1.5 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-y font-sans"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: KOKURIKULER */}
        {activeTab === 'kokurikuler' && (
          <div className="space-y-3 pb-8">
            {projek.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                Belum ada data tema kokurikuler.
              </div>
            ) : (
              filteredSiswa.map((student, sIdx) => {
                if (!activeProjek) return null;
                const currentText = customDeskripsiKokurikuler[student.id]?.[activeProjek.id] || 
                  `Menunjukkan partisipasi aktif dalam projek "${activeProjek.tema}", berkembang sangat baik dalam dimensi yang diamati serta konsisten menunjukkan kepedulian dan kerja sama nyata.`;

                const key = `${student.id}_${activeProjek.id}`;
                const varIdx = kokurikulerVariationIndex[key];
                const dims = dimensiProjek.filter(d => d.projekId === activeProjek.id);

                return (
                  <div 
                    key={student.id} 
                    className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-xs hover:border-indigo-300 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-3.5">
                      {/* Profil & Dimensi */}
                      <div className="md:w-56 shrink-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-purple-50 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {sIdx + 1}
                          </span>
                          <div className="min-w-0">
                            <h2 className="font-bold text-xs text-slate-800 truncate">{student.nama}</h2>
                            <div className="text-[11px] text-slate-400">NISN: {student.nisn || '-'}</div>
                          </div>
                        </div>

                        {dims.length > 0 && (
                          <div className="text-[10px] text-slate-500 flex flex-wrap gap-1">
                            {dims.map(d => (
                              <span key={d.id} className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                {d.nama.slice(0, 8)}..: <b>{nilaiP5[student.id]?.[d.id] || '-'}</b>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Deskripsi */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] font-semibold text-slate-600">
                            Capaian Kokurikuler:
                          </span>

                          <button
                            onClick={() => handleCycleVariasiKokurikuler(student.id, activeProjek.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors border border-indigo-200/70"
                          >
                            <Shuffle size={11} />
                            <span>Variasi {varIdx !== undefined ? `(${varIdx + 1}/5)` : ''}</span>
                          </button>
                        </div>

                        <textarea
                          rows={2}
                          value={currentText}
                          onChange={(e) => handleUpdateKokurikuler(student.id, activeProjek.id, e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50/60 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-1.5 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-y font-sans"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
}
