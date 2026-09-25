import { useState, useMemo, useEffect } from 'react';
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
  X,
  Lock,
  Unlock,
  Award
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
import { 
  generateVariasiNarasiKokurikuler, 
  normalisasiSkala, 
  InputItemSintesis 
} from '@/data/kokurikuler2025';

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
    customDeskripsiKokurikuler = {},
    lockedDeskripsiMapel = {},
    lockedDeskripsiEkskul = {},
    lockedDeskripsiKokurikuler = {}
  } = state;

  const [activeTab, setActiveTab] = useState<TransitTab>(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);
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

  // Helper memeriksa apakah murid memiliki nilai pada mapel aktif
  const studentHasScoresIntra = (studentId: string, mapelId: string): boolean => {
    const studentNilai = nilai[studentId]?.[mapelId];
    if (!studentNilai) return false;
    if (studentNilai.sumatifAkhir !== null && studentNilai.sumatifAkhir !== undefined) return true;
    return Object.values(studentNilai.tpScores || {}).some(v => v !== null && v !== undefined);
  };

  // Status apakah di kelas aktif ini sudah pernah disintesis sebelumnya
  const hasSynthesizedAnyIntra = useMemo(() => {
    if (!activeMapel) return false;
    return filteredSiswa.some(s => (customDeskripsiMapel[s.id]?.[activeMapel.id] || '').trim().length > 0);
  }, [filteredSiswa, activeMapel, customDeskripsiMapel]);

  const hasSynthesizedAnyEkskul = useMemo(() => {
    if (!activeEkskul) return false;
    return filteredSiswa.some(s => (nilaiEkskul[s.id]?.[activeEkskul.id]?.deskripsi || '').trim().length > 0);
  }, [filteredSiswa, activeEkskul, nilaiEkskul]);

  const hasSynthesizedAnyKokurikuler = useMemo(() => {
    return filteredSiswa.some(s => {
      const text = customDeskripsiKokurikuler[s.id]?.['__kompilasi__'] || 
        (projek[0]?.id ? customDeskripsiKokurikuler[s.id]?.[projek[0].id] : '');
      return (text || '').trim().length > 0;
    });
  }, [filteredSiswa, customDeskripsiKokurikuler, projek]);

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

  // Toggle kunci status intrakurikuler per murid
  const handleToggleLockIntra = (studentId: string, mapelId: string) => {
    const currentLocked = !!lockedDeskripsiMapel?.[studentId]?.[mapelId];
    const newLocked = !currentLocked;
    updateState('lockedDeskripsiMapel', {
      ...lockedDeskripsiMapel,
      [studentId]: {
        ...(lockedDeskripsiMapel?.[studentId] || {}),
        [mapelId]: newLocked
      }
    });
    showToast(newLocked ? 'Deskripsi murid ini dikunci (terproteksi)' : 'Kunci deskripsi dibuka');
  };

  // Putar ke variasi berikutnya untuk 1 siswa (Intrakurikuler)
  const handleCycleVariasiIntra = (studentId: string, mapelId: string) => {
    if (lockedDeskripsiMapel?.[studentId]?.[mapelId]) {
      showToast('Deskripsi murid ini terkunci. Buka kunci untuk mengubah variasi.');
      return;
    }
    if (!studentHasScoresIntra(studentId, mapelId)) {
      showToast('Input nilai belum ada pada murid ini');
      return;
    }
    const variations = get5VariasiIntraForStudent(studentId, mapelId);
    if (variations.length === 0) return;

    const key = `${studentId}_${mapelId}`;
    const currentIndex = intrakurikulerVariationIndex[key] !== undefined ? intrakurikulerVariationIndex[key] : -1;
    const nextIndex = (currentIndex + 1) % variations.length;

    setIntrakurikulerVariationIndex(prev => ({ ...prev, [key]: nextIndex }));
    handleUpdateDeskripsiIntra(studentId, mapelId, variations[nextIndex]);
    showToast(`Variasi ${nextIndex + 1}/5 diterapkan`);
  };

  // Reset deskripsi intrakurikuler ke default PPA 2025 untuk 1 siswa
  const handleResetIntra = (studentId: string, mapelId: string) => {
    if (lockedDeskripsiMapel?.[studentId]?.[mapelId]) {
      showToast('Deskripsi murid ini terkunci. Buka kunci untuk me-reset.');
      return;
    }
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

  // Sintesis / Sintesis Ulang semua murid secara massal untuk mapel aktif (Melewati yang terkunci & yang belum ada nilai)
  const handleSintesisSemuaIntra = () => {
    if (!activeMapel) return;
    const updated = { ...customDeskripsiMapel };
    const newIdxMap = { ...intrakurikulerVariationIndex };
    let processedCount = 0;
    let lockedCount = 0;
    let noScoreCount = 0;

    filteredSiswa.forEach((student, idx) => {
      // 1. Lewati murid yang dikunci
      if (lockedDeskripsiMapel?.[student.id]?.[activeMapel.id]) {
        lockedCount++;
        return;
      }

      // 2. Lewati murid yang belum memiliki input nilai
      if (!studentHasScoresIntra(student.id, activeMapel.id)) {
        noScoreCount++;
        return;
      }

      const variations = get5VariasiIntraForStudent(student.id, activeMapel.id);
      if (variations.length > 0) {
        const key = `${student.id}_${activeMapel.id}`;
        const currentIdx = intrakurikulerVariationIndex[key] !== undefined 
          ? intrakurikulerVariationIndex[key] 
          : (idx % variations.length);
        const nextIdx = hasSynthesizedAnyIntra ? ((currentIdx + 1) % variations.length) : currentIdx;
        newIdxMap[key] = nextIdx;
        if (!updated[student.id]) updated[student.id] = {};
        updated[student.id][activeMapel.id] = variations[nextIdx];
        processedCount++;
      }
    });

    updateState('customDeskripsiMapel', updated);
    setIntrakurikulerVariationIndex(newIdxMap);

    if (processedCount === 0 && noScoreCount > 0 && lockedCount === 0) {
      showToast(`Belum ada murid yang memiliki input nilai pada ${activeMapel.nama}`);
    } else {
      showToast(
        `${hasSynthesizedAnyIntra ? 'Sintesis Ulang' : 'Sintesis'} selesai untuk ${processedCount} murid` +
        (lockedCount > 0 ? ` (${lockedCount} murid terkunci dilewati)` : '')
      );
    }
  };

  // Reset / kosongkan deskripsi murid yang tidak terkunci
  const handleResetSemuaIntra = () => {
    if (!activeMapel) return;
    const updated = { ...customDeskripsiMapel };
    const newIdxMap = { ...intrakurikulerVariationIndex };
    let resetCount = 0;
    let lockedCount = 0;

    filteredSiswa.forEach(student => {
      if (lockedDeskripsiMapel?.[student.id]?.[activeMapel.id]) {
        lockedCount++;
        return;
      }
      const key = `${student.id}_${activeMapel.id}`;
      delete newIdxMap[key];
      if (updated[student.id]) {
        delete updated[student.id][activeMapel.id];
        resetCount++;
      }
    });

    updateState('customDeskripsiMapel', updated);
    setIntrakurikulerVariationIndex(newIdxMap);
    showToast(
      `Deskripsi ${activeMapel.nama} dikosongkan untuk ${resetCount} murid` +
      (lockedCount > 0 ? ` (${lockedCount} murid terkunci dipertahankan)` : '')
    );
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

  const handleToggleLockEkskul = (studentId: string, ekskulId: string) => {
    const currentLocked = !!lockedDeskripsiEkskul?.[studentId]?.[ekskulId];
    const newLocked = !currentLocked;
    updateState('lockedDeskripsiEkskul', {
      ...lockedDeskripsiEkskul,
      [studentId]: {
        ...(lockedDeskripsiEkskul?.[studentId] || {}),
        [ekskulId]: newLocked
      }
    });
    showToast(newLocked ? 'Deskripsi ekstrakurikuler dikunci (terproteksi)' : 'Kunci ekstrakurikuler dibuka');
  };

  const handleCycleVariasiEkskul = (studentId: string, ekskulId: string) => {
    if (lockedDeskripsiEkskul?.[studentId]?.[ekskulId]) {
      showToast('Deskripsi ekstrakurikuler murid ini terkunci. Buka kunci untuk mengubah variasi.');
      return;
    }
    if (!activeEkskul) return;
    const currentNe = nilaiEkskul[studentId]?.[ekskulId];
    const predikat = currentNe?.predikat;
    if (!predikat) {
      showToast('Tentukan predikat murid terlebih dahulu pada menu Input Nilai Ekstrakurikuler');
      return;
    }
    const variations = get5VariasiEkskul(activeEkskul.nama, predikat);

    const key = `${studentId}_${ekskulId}`;
    const currentIndex = ekskulVariationIndex[key] !== undefined ? ekskulVariationIndex[key] : -1;
    const nextIndex = (currentIndex + 1) % variations.length;

    setEkskulVariationIndex(prev => ({ ...prev, [key]: nextIndex }));
    handleUpdateEkskul(studentId, ekskulId, predikat, variations[nextIndex]);
    showToast(`Variasi ${nextIndex + 1}/5 diterapkan`);
  };

  const handleResetEkskul = (studentId: string, ekskulId: string) => {
    if (lockedDeskripsiEkskul?.[studentId]?.[ekskulId]) {
      showToast('Deskripsi ekstrakurikuler murid ini terkunci. Buka kunci untuk me-reset.');
      return;
    }
    if (!activeEkskul) return;
    const currentNe = nilaiEkskul[studentId]?.[ekskulId];
    const predikat = currentNe?.predikat;
    if (!predikat) {
      handleUpdateEkskul(studentId, ekskulId, '', '');
      showToast('Deskripsi dikosongkan karena murid belum memiliki predikat');
      return;
    }
    const defaultText = get5VariasiEkskul(activeEkskul.nama, predikat)[0] || '';
    handleUpdateEkskul(studentId, ekskulId, predikat, defaultText);
    const key = `${studentId}_${ekskulId}`;
    setEkskulVariationIndex(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    showToast('Catatan ekstrakurikuler di-reset ke standar');
  };

  const handleSintesisSemuaEkskul = () => {
    if (!activeEkskul) return;
    const updated = { ...nilaiEkskul };
    const newIdxMap = { ...ekskulVariationIndex };
    let processedCount = 0;
    let lockedCount = 0;

    filteredSiswa.forEach((student, idx) => {
      if (lockedDeskripsiEkskul?.[student.id]?.[activeEkskul.id]) {
        lockedCount++;
        return;
      }

      const currentPred = updated[student.id]?.[activeEkskul.id]?.predikat;
      // Hanya sintesis murid yang memiliki predikat nilai (mengikuti ekskul)
      if (!currentPred) {
        return;
      }

      const variations = get5VariasiEkskul(activeEkskul.nama, currentPred);
      const key = `${student.id}_${activeEkskul.id}`;
      const currentIdx = ekskulVariationIndex[key] !== undefined 
        ? ekskulVariationIndex[key] 
        : (idx % variations.length);
      const nextIdx = hasSynthesizedAnyEkskul ? ((currentIdx + 1) % variations.length) : currentIdx;
      newIdxMap[key] = nextIdx;

      if (!updated[student.id]) updated[student.id] = {};
      updated[student.id][activeEkskul.id] = {
        predikat: currentPred,
        deskripsi: variations[nextIdx]
      };
      processedCount++;
    });

    updateState('nilaiEkskul', updated);
    setEkskulVariationIndex(newIdxMap);
    showToast(
      `${hasSynthesizedAnyEkskul ? 'Sintesis Ulang' : 'Sintesis'} ${activeEkskul.nama} diterapkan untuk ${processedCount} murid` +
      (lockedCount > 0 ? ` (${lockedCount} murid terkunci dilewati)` : '')
    );
  };

  // ==========================================
  // HANDLERS KOKURIKULER (KOMPILASI TUNGGAL LINTAS KEGIATAN)
  // ==========================================
  const getStudentAllKokurikulerScores = (studentId: string): InputItemSintesis[] => {
    const items: InputItemSintesis[] = [];
    dimensiProjek.forEach(d => {
      const subNames = d.subdimensi && d.subdimensi.length > 0 ? d.subdimensi : [d.nama];
      subNames.forEach(sName => {
        const subKey = `${d.id}__${sName}`;
        const raw = nilaiP5[studentId]?.[subKey] || nilaiP5[studentId]?.[d.id] || '';
        const norm = normalisasiSkala(raw);
        if (norm) {
          items.push({
            dimName: d.nama,
            subdimName: sName,
            score: norm
          });
        }
      });
    });
    return items;
  };

  const getKompilasiVariasiKokurikulerForStudent = (student: any): string[] => {
    const scores = getStudentAllKokurikulerScores(student.id);
    const projectThemes = projek.map(p => p.tema).filter(Boolean);
    return generateVariasiNarasiKokurikuler(student.nama, projectThemes, scores);
  };

  const handleUpdateKokurikulerKompilasi = (studentId: string, text: string) => {
    const existing = customDeskripsiKokurikuler[studentId] || {};
    const updatedForStudent = {
      ...existing,
      '__kompilasi__': text
    };
    if (projek.length > 0) {
      updatedForStudent[projek[0].id] = text;
    }
    updateState('customDeskripsiKokurikuler', {
      ...customDeskripsiKokurikuler,
      [studentId]: updatedForStudent
    });
  };

  const handleToggleLockKokurikuler = (studentId: string) => {
    const currentLocked = !!lockedDeskripsiKokurikuler?.[studentId];
    const newLocked = !currentLocked;
    updateState('lockedDeskripsiKokurikuler', {
      ...lockedDeskripsiKokurikuler,
      [studentId]: newLocked
    });
    showToast(newLocked ? 'Deskripsi kokurikuler dikunci (terproteksi)' : 'Kunci kokurikuler dibuka');
  };

  const handleCycleVariasiKokurikulerKompilasi = (studentId: string) => {
    if (lockedDeskripsiKokurikuler?.[studentId]) {
      showToast('Deskripsi kokurikuler murid ini terkunci. Buka kunci untuk mengubah variasi.');
      return;
    }
    const student = siswa.find(s => s.id === studentId);
    if (!student) return;
    const variations = getKompilasiVariasiKokurikulerForStudent(student);
    const key = `${studentId}__kompilasi__`;
    const currentIndex = kokurikulerVariationIndex[key] !== undefined ? kokurikulerVariationIndex[key] : -1;
    const nextIndex = (currentIndex + 1) % variations.length;

    setKokurikulerVariationIndex(prev => ({ ...prev, [key]: nextIndex }));
    handleUpdateKokurikulerKompilasi(studentId, variations[nextIndex]);
    showToast(`Variasi ${nextIndex + 1}/5 diterapkan`);
  };

  const handleResetKokurikulerKompilasi = (studentId: string) => {
    if (lockedDeskripsiKokurikuler?.[studentId]) {
      showToast('Deskripsi kokurikuler murid ini terkunci. Buka kunci untuk me-reset.');
      return;
    }
    const student = siswa.find(s => s.id === studentId);
    if (!student) return;
    const variations = getKompilasiVariasiKokurikulerForStudent(student);
    const defaultText = variations[0] || '';
    handleUpdateKokurikulerKompilasi(studentId, defaultText);
    const key = `${studentId}__kompilasi__`;
    setKokurikulerVariationIndex(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    showToast('Deskripsi kokurikuler di-reset ke standar');
  };

  const handleSintesisSemuaKokurikulerKompilasi = () => {
    const updated = { ...customDeskripsiKokurikuler };
    const newIdxMap = { ...kokurikulerVariationIndex };
    let processedCount = 0;
    let lockedCount = 0;

    filteredSiswa.forEach((student, idx) => {
      if (lockedDeskripsiKokurikuler?.[student.id]) {
        lockedCount++;
        return;
      }

      const variations = getKompilasiVariasiKokurikulerForStudent(student);
      const key = `${student.id}__kompilasi__`;
      const currentIdx = kokurikulerVariationIndex[key] !== undefined 
        ? kokurikulerVariationIndex[key] 
        : (idx % variations.length);
      const nextIdx = hasSynthesizedAnyKokurikuler ? ((currentIdx + 1) % variations.length) : currentIdx;
      newIdxMap[key] = nextIdx;

      if (!updated[student.id]) updated[student.id] = {};
      updated[student.id]['__kompilasi__'] = variations[nextIdx];
      if (projek.length > 0) {
        updated[student.id][projek[0].id] = variations[nextIdx];
      }
      processedCount++;
    });

    updateState('customDeskripsiKokurikuler', updated);
    setKokurikulerVariationIndex(newIdxMap);
    showToast(
      `${hasSynthesizedAnyKokurikuler ? 'Sintesis Ulang' : 'Sintesis'} kompilasi kokurikuler diterapkan untuk ${processedCount} murid` +
      (lockedCount > 0 ? ` (${lockedCount} murid terkunci dilewati)` : '')
    );
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
          
          {/* Sisi Kiri: Konteks Menu + Dropdown Selector Sejajar */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Header Konteks Sesuai Menu Aktif */}
            {activeTab === 'intrakurikuler' && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <BookOpen size={16} />
                </div>
                <h1 className="text-sm font-bold text-slate-800 whitespace-nowrap">
                  Deskripsi Capaian <span className="text-indigo-600">Intrakurikuler</span>
                </h1>
              </div>
            )}

            {activeTab === 'ekstrakurikuler' && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Medal size={16} />
                </div>
                <h1 className="text-sm font-bold text-slate-800 whitespace-nowrap">
                  Deskripsi Capaian <span className="text-indigo-600">Ekstrakurikuler</span>
                </h1>
              </div>
            )}

            {activeTab === 'kokurikuler' && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Compass size={16} />
                </div>
                <h1 className="text-sm font-bold text-slate-800 whitespace-nowrap">
                  Deskripsi Capaian <span className="text-indigo-600">Kokurikuler</span>
                </h1>
              </div>
            )}

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

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

            {/* Indikator Kompilasi Kokurikuler */}
            {activeTab === 'kokurikuler' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-800 rounded-lg text-xs font-bold shrink-0">
                <Layers size={13} className="text-sky-600" />
                <span>Kompilasi {projek.length} Kegiatan Kokurikuler</span>
              </div>
            )}
          </div>

          {/* Sisi Kanan: Aksi + Pencarian Sejajar */}
          <div className="flex flex-wrap items-center gap-2 justify-end flex-1">
            {/* Tombol Aksi Utama */}
            <div className="flex items-center gap-1.5">
              {activeTab === 'intrakurikuler' && (
                <>
                  <Tooltip 
                    content={hasSynthesizedAnyIntra ? "Sintesis ulang narasi untuk seluruh kelas (murid terkunci dilindungi)" : "Sintesis narasi untuk seluruh murid yang telah memiliki input nilai"} 
                    position="bottom"
                  >
                    <button
                      type="button"
                      onClick={handleSintesisSemuaIntra}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
                    >
                      <Sparkles size={12} className="text-amber-300" />
                      <span>{hasSynthesizedAnyIntra ? 'Sintesis Ulang' : 'Sintesis'}</span>
                    </button>
                  </Tooltip>

                  <Tooltip content="Kosongkan Deskripsi Mapel Ini untuk Murid yang Tidak Terkunci" position="bottom">
                    <button
                      type="button"
                      onClick={handleResetSemuaIntra}
                      className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg text-xs transition-all border border-slate-200 hover:border-rose-200 shadow-2xs cursor-pointer active:scale-95"
                      aria-label="Kosongkan Semua"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </Tooltip>
                </>
              )}

              {activeTab === 'ekstrakurikuler' && (
                <Tooltip 
                  content={hasSynthesizedAnyEkskul ? "Sintesis ulang catatan ekstrakurikuler 1 kelas (murid terkunci dilindungi)" : "Sintesis catatan ekstrakurikuler untuk seluruh kelas"} 
                  position="bottom"
                >
                  <button
                    type="button"
                    onClick={handleSintesisSemuaEkskul}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    <Sparkles size={12} className="text-amber-300" />
                    <span>{hasSynthesizedAnyEkskul ? 'Sintesis Ulang' : 'Sintesis'}</span>
                  </button>
                </Tooltip>
              )}

              {activeTab === 'kokurikuler' && (
                <Tooltip 
                  content={hasSynthesizedAnyKokurikuler ? "Sintesis ulang narasi kompilasi kokurikuler 1 kelas (murid terkunci dilindungi)" : "Sintesis kompilasi kokurikuler untuk seluruh kelas"} 
                  position="bottom"
                >
                  <button
                    type="button"
                    onClick={handleSintesisSemuaKokurikulerKompilasi}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    <Sparkles size={12} className="text-amber-300" />
                    <span>{hasSynthesizedAnyKokurikuler ? 'Sintesis Ulang' : 'Sintesis'}</span>
                  </button>
                </Tooltip>
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
              const hasScores = studentHasScoresIntra(student.id, activeMapel.id);

              // Teks saat ini di Ruang Transit (atau kosong di awal jika belum disintesis)
              const savedCustom = customDeskripsiMapel[student.id]?.[activeMapel.id];
              const currentText = savedCustom !== undefined ? savedCustom : '';
              const isLocked = !!lockedDeskripsiMapel?.[student.id]?.[activeMapel.id];

              const key = `${student.id}_${activeMapel.id}`;
              const varIdx = intrakurikulerVariationIndex[key];
              const isCustomEdited = savedCustom !== undefined && savedCustom.trim().length > 0;

              return (
                <div 
                  key={student.id} 
                  className={`bg-white rounded-xl p-3 border shadow-2xs transition-all group space-y-2 ${
                    isLocked ? 'border-amber-300/80 bg-amber-50/10' : 'border-slate-200 hover:border-indigo-300'
                  }`}
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
                      {isCustomEdited && varIdx === undefined && !isLocked && (
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                          Tersimpan
                        </span>
                      )}

                      {/* Tombol Kunci Satuan */}
                      <Tooltip content={isLocked ? "Buka kuncian deskripsi murid ini" : "Kunci deskripsi murid ini agar terlindungi saat Sintesis Ulang"} position="top">
                        <button
                          type="button"
                          onClick={() => handleToggleLockIntra(student.id, activeMapel.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all border cursor-pointer active:scale-95 shadow-2xs ${
                            isLocked 
                              ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' 
                              : 'bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          {isLocked ? <Lock size={11} className="text-amber-700" /> : <Unlock size={11} />}
                          <span>{isLocked ? 'Terkunci' : 'Kunci'}</span>
                        </button>
                      </Tooltip>

                      {/* Tombol Variasi Satuan */}
                      <Tooltip content={isLocked ? "Buka kunci terlebih dahulu untuk memvariasikan" : "Putar ke variasi narasi berikutnya (tersedia 5 variasi unik)"} position="top">
                        <button
                          type="button"
                          onClick={() => handleCycleVariasiIntra(student.id, activeMapel.id)}
                          disabled={isLocked}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-bold text-[11px] transition-colors border shadow-2xs ${
                            isLocked 
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/70 active:scale-95 cursor-pointer'
                          }`}
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
                          disabled={isLocked}
                          className={`p-1 rounded-md border transition-colors ${
                            isLocked
                              ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-slate-200/60 cursor-pointer active:scale-95'
                          }`}
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
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={currentText}
                      onChange={(e) => {
                        if (isLocked) {
                          showToast('Deskripsi murid ini terkunci. Buka kunci untuk mengedit.');
                          return;
                        }
                        handleUpdateDeskripsiIntra(student.id, activeMapel.id, e.target.value);
                      }}
                      readOnly={isLocked}
                      className={`w-full px-3 py-2 border rounded-lg text-xs leading-relaxed focus:outline-none transition-all resize-y font-sans placeholder:text-slate-400 ${
                        isLocked 
                          ? 'bg-slate-100/70 border-amber-300 text-slate-700 cursor-not-allowed'
                          : 'bg-slate-50/70 focus:bg-white border-slate-200 text-slate-800 focus:ring-1.5 focus:ring-indigo-500/30 focus:border-indigo-500'
                      }`}
                      placeholder={
                        hasScores
                          ? "Klik tombol 'Sintesis' atau 'Variasi' untuk memunculkan deskripsi otomatis..."
                          : "Belum ada nilai terinput pada mata pelajaran ini..."
                      }
                    />
                    {isLocked && (
                      <div className="absolute right-2.5 bottom-2.5 pointer-events-none flex items-center gap-1 bg-amber-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                        <Lock size={10} />
                        <span>Terkunci</span>
                      </div>
                    )}
                  </div>
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
                const predikat = currentNe?.predikat || '';
                const deskripsi = currentNe?.deskripsi !== undefined ? currentNe.deskripsi : '';
                const isLocked = !!lockedDeskripsiEkskul?.[student.id]?.[activeEkskul.id];

                const isA = predikat.includes('A') || predikat.toLowerCase().includes('sangat');
                const isC = predikat.includes('C') || predikat.toLowerCase().includes('cukup');
                const isKurang = predikat.includes('D') || predikat.toLowerCase().includes('kurang');

                const key = `${student.id}_${activeEkskul.id}`;
                const varIdx = ekskulVariationIndex[key];

                return (
                  <div 
                    key={student.id} 
                    className={`bg-white rounded-xl p-3 border shadow-2xs transition-all group space-y-2 ${
                      isLocked ? 'border-amber-300/80 bg-amber-50/10' : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {/* Baris Atas: Nomor, Nama Murid, Predikat Dropdown Inline, dan Aksi */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      
                      {/* Sisi Kiri: Identitas Murid & Predikat Dropdown Inline */}
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

                        {/* Read-Only Predikat Badge Inline */}
                        <div className="flex items-center gap-1 pl-1">
                          {predikat ? (
                            <Tooltip content={`Predikat capaian yang diinput dari menu Input Nilai: ${predikat}`} position="top">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 select-none font-bold ${
                                isA ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                isC ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                isKurang ? 'bg-rose-50 text-rose-800 border-rose-300' :
                                'bg-blue-50 text-blue-800 border-blue-300'
                              }`}>
                                <Award size={10} className="shrink-0" />
                                <span>Predikat: <strong>{predikat}</strong></span>
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip content="Murid ini belum dinilai atau tidak mengikuti ekskul ini di menu Input Nilai" position="top">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-slate-200 bg-slate-50 text-slate-400 select-none">
                                Belum Mengikuti
                              </span>
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      {/* Sisi Kanan: Status & 4 Tombol Aksi Seragam */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        {deskripsi && varIdx === undefined && !isLocked && (
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                            Tersimpan
                          </span>
                        )}

                        {/* 1. Tombol Kunci Satuan */}
                        <Tooltip content={isLocked ? "Buka kuncian ekstrakurikuler murid ini" : "Kunci ekstrakurikuler murid ini agar terlindungi saat Sintesis Ulang"} position="top">
                          <button
                            type="button"
                            onClick={() => handleToggleLockEkskul(student.id, activeEkskul.id)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all border cursor-pointer active:scale-95 shadow-2xs ${
                              isLocked 
                                ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' 
                                : 'bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            {isLocked ? <Lock size={11} className="text-amber-700" /> : <Unlock size={11} />}
                            <span>{isLocked ? 'Terkunci' : 'Kunci'}</span>
                          </button>
                        </Tooltip>

                        {/* 2. Tombol Variasi Satuan */}
                        <Tooltip content={isLocked ? "Buka kunci terlebih dahulu untuk memvariasikan" : !predikat ? "Tentukan predikat di menu Input Nilai terlebih dahulu" : "Putar ke variasi narasi berikutnya (tersedia 5 variasi unik)"} position="top">
                          <button
                            type="button"
                            onClick={() => handleCycleVariasiEkskul(student.id, activeEkskul.id)}
                            disabled={isLocked || !predikat}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-bold text-[11px] transition-colors border shadow-2xs ${
                              isLocked || !predikat
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/70 active:scale-95 cursor-pointer'
                            }`}
                          >
                            <Shuffle size={11} />
                            <span>Variasi {varIdx !== undefined ? `(${varIdx + 1}/5)` : ''}</span>
                          </button>
                        </Tooltip>

                        {/* 3. Tombol Reset Satuan */}
                        <Tooltip content={!predikat ? "Murid belum memiliki predikat nilai" : "Reset narasi ekstrakurikuler murid ini ke standar"} position="top">
                          <button
                            type="button"
                            onClick={() => handleResetEkskul(student.id, activeEkskul.id)}
                            disabled={isLocked || !predikat}
                            className={`p-1 rounded-md border transition-colors ${
                              isLocked || !predikat
                                ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-slate-200/60 cursor-pointer active:scale-95'
                            }`}
                            aria-label="Reset Ekstrakurikuler"
                          >
                            <RotateCcw size={12} />
                          </button>
                        </Tooltip>

                        {/* 4. Tombol Salin */}
                        <Tooltip content="Salin teks catatan ekstrakurikuler ini" position="top">
                          <button
                            type="button"
                            onClick={() => handleCopyText(deskripsi, `ekskul_${student.id}`)}
                            disabled={!deskripsi}
                            className={`p-1 rounded-md border transition-colors ${
                              !deskripsi 
                                ? 'text-slate-300 border-slate-200 cursor-not-allowed' 
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-slate-200/60 cursor-pointer active:scale-95'
                            }`}
                            aria-label="Salin Teks"
                          >
                            {copiedId === `ekskul_${student.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Baris Bawah: Textarea Full-Width */}
                    <div className="relative">
                      <textarea
                        rows={2}
                        value={deskripsi}
                        onChange={(e) => {
                          if (isLocked) {
                            showToast('Deskripsi ekstrakurikuler murid ini terkunci. Buka kunci untuk mengedit.');
                            return;
                          }
                          handleUpdateEkskul(student.id, activeEkskul.id, predikat, e.target.value);
                        }}
                        readOnly={isLocked}
                        placeholder={
                          predikat 
                            ? "Klik tombol 'Sintesis' atau 'Variasi' untuk memunculkan catatan ekstrakurikuler..."
                            : "Murid ini belum dinilai di menu Input Nilai Ekstrakurikuler..."
                        }
                        className={`w-full px-3 py-2 border rounded-lg text-xs leading-relaxed focus:outline-none transition-all resize-y font-sans placeholder:text-slate-400 ${
                          isLocked 
                            ? 'bg-slate-100/70 border-amber-300 text-slate-700 cursor-not-allowed'
                            : 'bg-slate-50/70 focus:bg-white border-slate-200 text-slate-800 focus:ring-1.5 focus:ring-indigo-500/30 focus:border-indigo-500'
                        }`}
                      />
                      {isLocked && (
                        <div className="absolute right-2.5 bottom-2.5 pointer-events-none flex items-center gap-1 bg-amber-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                          <Lock size={10} />
                          <span>Terkunci</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: KOKURIKULER (KOMPILASI TUNGGAL RAPOR) */}
        {activeTab === 'kokurikuler' && (
          <div className="space-y-3 pb-8">
            {projek.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">Belum ada perencanaan kegiatan kokurikuler.</p>
                <p className="text-[11px] text-slate-400">Silakan buat kegiatan kokurikuler di menu Perencanaan terlebih dahulu.</p>
              </div>
            ) : (
              filteredSiswa.map((student, sIdx) => {
                const savedKompilasi = customDeskripsiKokurikuler[student.id]?.['__kompilasi__'] || 
                  (projek[0]?.id ? customDeskripsiKokurikuler[student.id]?.[projek[0].id] : undefined);
                const currentText = savedKompilasi !== undefined ? savedKompilasi : '';
                const isLocked = !!lockedDeskripsiKokurikuler?.[student.id];

                const key = `${student.id}__kompilasi__`;
                const varIdx = kokurikulerVariationIndex[key];

                return (
                  <div 
                    key={student.id} 
                    className={`bg-white rounded-xl p-3 border shadow-2xs transition-all group space-y-2 ${
                      isLocked ? 'border-amber-300/80 bg-amber-50/10' : 'border-slate-200 hover:border-sky-300'
                    }`}
                  >
                    {/* Baris Atas: Nomor, Nama Murid, Dimensi Badges Inline, dan 4 Aksi */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      
                      {/* Sisi Kiri: Identitas Murid & Capaian Dimensi Inline */}
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

                        {/* Rincian Seluruh Subdimensi Terasesmen Inline */}
                        <div className="flex flex-wrap items-center gap-1 pl-1">
                          {dimensiProjek.length > 0 ? (
                            dimensiProjek.map(d => {
                              const subNames = d.subdimensi && d.subdimensi.length > 0 ? d.subdimensi : [d.nama];
                              return subNames.map(sName => {
                                const subKey = `${d.id}__${sName}`;
                                const sc = normalisasiSkala(nilaiP5[student.id]?.[subKey] || nilaiP5[student.id]?.[d.id] || '');
                                const badgeColor = sc === 'M' ? 'bg-sky-50 text-sky-800 border-sky-300 font-bold' :
                                  sc === 'C' ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' :
                                  sc === 'B' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                  'bg-slate-50 text-slate-400 border-slate-200';
                                return (
                                  <Tooltip key={subKey} content={`${d.nama} - ${sName} (Nilai: ${sc || '-'})`} position="top">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border flex items-center gap-0.5 select-none ${badgeColor}`}>
                                      <span>{sName.length > 12 ? sName.slice(0, 10) + '..' : sName}:</span>
                                      <b>{sc || '-'}</b>
                                    </span>
                                  </Tooltip>
                                );
                              });
                            })
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Belum ada dimensi</span>
                          )}
                        </div>
                      </div>

                      {/* Sisi Kanan: Status & 4 Tombol Aksi Seragam */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        {currentText && varIdx === undefined && !isLocked && (
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                            Tersimpan
                          </span>
                        )}

                        {/* 1. Tombol Kunci Satuan */}
                        <Tooltip content={isLocked ? "Buka kuncian kokurikuler murid ini" : "Kunci kokurikuler murid ini agar terlindungi saat Sintesis Ulang"} position="top">
                          <button
                            type="button"
                            onClick={() => handleToggleLockKokurikuler(student.id)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all border cursor-pointer active:scale-95 shadow-2xs ${
                              isLocked 
                                ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' 
                                : 'bg-slate-50 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            {isLocked ? <Lock size={11} className="text-amber-700" /> : <Unlock size={11} />}
                            <span>{isLocked ? 'Terkunci' : 'Kunci'}</span>
                          </button>
                        </Tooltip>

                        {/* 2. Tombol Variasi Satuan */}
                        <Tooltip content={isLocked ? "Buka kunci terlebih dahulu untuk memvariasikan" : "Putar ke variasi narasi berikutnya (tersedia 5 variasi unik)"} position="top">
                          <button
                            type="button"
                            onClick={() => handleCycleVariasiKokurikulerKompilasi(student.id)}
                            disabled={isLocked}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-bold text-[11px] transition-colors border shadow-2xs ${
                              isLocked 
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200/70 active:scale-95 cursor-pointer'
                            }`}
                          >
                            <Shuffle size={11} />
                            <span>Variasi {varIdx !== undefined ? `(${varIdx + 1}/5)` : ''}</span>
                          </button>
                        </Tooltip>

                        {/* 3. Tombol Reset Satuan */}
                        <Tooltip content="Reset narasi kokurikuler murid ini ke standar" position="top">
                          <button
                            type="button"
                            onClick={() => handleResetKokurikulerKompilasi(student.id)}
                            disabled={isLocked}
                            className={`p-1 rounded-md border transition-colors ${
                              isLocked
                                ? 'text-slate-300 border-slate-200 cursor-not-allowed'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-slate-200/60 cursor-pointer active:scale-95'
                            }`}
                            aria-label="Reset Kokurikuler"
                          >
                            <RotateCcw size={12} />
                          </button>
                        </Tooltip>

                        {/* 4. Tombol Salin */}
                        <Tooltip content="Salin teks deskripsi kokurikuler ini" position="top">
                          <button
                            type="button"
                            onClick={() => handleCopyText(currentText, `kokur_${student.id}`)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200/60 transition-colors cursor-pointer active:scale-95"
                            aria-label="Salin Teks"
                          >
                            {copiedId === `kokur_${student.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Baris Bawah: Textarea Full-Width */}
                    <div className="relative">
                      <textarea
                        rows={2}
                        value={currentText}
                        onChange={(e) => {
                          if (isLocked) {
                            showToast('Deskripsi kokurikuler murid ini terkunci. Buka kunci untuk mengedit.');
                            return;
                          }
                          handleUpdateKokurikulerKompilasi(student.id, e.target.value);
                        }}
                        readOnly={isLocked}
                        className={`w-full px-3 py-2 border rounded-lg text-xs leading-relaxed focus:outline-none transition-all resize-y font-sans placeholder:text-slate-400 ${
                          isLocked 
                            ? 'bg-slate-100/70 border-amber-300 text-slate-700 cursor-not-allowed'
                            : 'bg-slate-50/70 focus:bg-white border-slate-200 text-slate-800 focus:ring-1.5 focus:ring-sky-500/30 focus:border-sky-500'
                        }`}
                        placeholder="Klik tombol 'Sintesis' atau 'Variasi' untuk merangkum capaian kokurikuler seluruh kegiatan..."
                      />
                      {isLocked && (
                        <div className="absolute right-2.5 bottom-2.5 pointer-events-none flex items-center gap-1 bg-amber-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                          <Lock size={10} />
                          <span>Terkunci</span>
                        </div>
                      )}
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
