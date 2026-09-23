import { ModalKktp } from '../components/ModalKktp';
import { ModalPilihTpSeni } from '../components/ModalPilihTpSeni';
import { isPabpMapel, getTpAgama, normalizeAgama, AGAMA_LIST } from '../lib/agamaUtils';
import { defaultTpPabp, AgamaKey } from '../data/defaultTpPabp';
import { defaultTpPancasila } from '../data/defaultTpPancasila';
import { defaultTpBahasaInggris } from '../data/defaultTpBahasaInggris';
import { defaultTpBahasaIndonesia } from '../data/defaultTpBahasaIndonesia';
import { defaultTpMatematika } from '../data/defaultTpMatematika';
import { defaultTpIpas } from '../data/defaultTpIpas';
import { defaultTpPjok } from '../data/defaultTpPjok';
import { defaultTpKka } from '../data/defaultTpKka';
import { defaultTpSeniRupa } from '../data/defaultTpSeniRupa';
import { defaultTpSeniMusik } from '../data/defaultTpSeniMusik';
import { defaultTpSeniTeater } from '../data/defaultTpSeniTeater';
import { defaultTpSeniTari } from '../data/defaultTpSeniTari';
import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { TujuanPembelajaran } from '@/types';
import Tooltip from '@/components/Tooltip';
import { Plus, Trash2, Target, Download, Upload, Sparkles, AlertCircle, CheckCircle2, GripVertical, SlidersHorizontal } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TujuanPembelajaranView() {
  const { state, updateState } = useAppStore();
  const { mapel } = state;
  const [selectedMapel, setSelectedMapel] = useState<string>('');
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [isSeniModalOpen, setIsSeniModalOpen] = useState(false);
  const [isKktpModalOpen, setIsKktpModalOpen] = useState(false);
  // Menentukan agama awal: prioritas pada agama murid yang ada di rombel, fallback ke 'Islam'
  const getDefaultAgama = (): string => {
    for (const s of state.siswa) {
      const norm = normalizeAgama(s.agama);
      if (norm && norm in defaultTpPabp) {
        return norm;
      }
    }
    return 'Islam';
  };

  const [selectedAgamaFilter, setSelectedAgamaFilter] = useState<string>(() => getDefaultAgama());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotif = (message: string, type: 'error' | 'success' = 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (mapel.length > 0 && !selectedMapel) {
      setSelectedMapel(mapel[0].id);
    }
  }, [mapel, selectedMapel]);

  const tps = state.tujuanPembelajaran.filter(tp => tp.mapelId === selectedMapel);
  const activeMapel = mapel.find(m => m.id === selectedMapel);
  const activeIntervals = activeMapel?.intervalBatas || [20, 40, 60, 80];
  const activeBatasTuntas = activeIntervals[2] || 60;

  const getParsedKelas = () => {
    const { kelas } = state.sekolah;
    let pk = String(kelas || '').replace(/[^0-9]/g, '');
    const ks = String(kelas || '').toLowerCase();
    if (!pk) {
      if (ks.includes('satu') || (ks.includes('i') && !ks.includes('ii') && !ks.includes('iii') && !ks.includes('iv') && !ks.includes('vi') && !ks.includes('ix'))) pk = '1';
      else if (ks.includes('dua') || (ks.includes('ii') && !ks.includes('iii') && !ks.includes('vii') && !ks.includes('viii'))) pk = '2';
      else if (ks.includes('tiga') || (ks.includes('iii') && !ks.includes('viii'))) pk = '3';
      else if (ks.includes('empat') || ks.includes('iv')) pk = '4';
      else if (ks.includes('lima') || (ks.includes('v') && !ks.includes('iv') && !ks.includes('vi') && !ks.includes('vii') && !ks.includes('viii'))) pk = '5';
      else if (ks.includes('enam') || (ks.includes('vi') && !ks.includes('vii') && !ks.includes('viii'))) pk = '6';
      else if (ks.includes('tujuh') || (ks.includes('vii') && !ks.includes('viii'))) pk = '7';
      else if (ks.includes('delapan') || (ks.includes('viii'))) pk = '8';
      else if (ks.includes('sembilan') || (ks.includes('ix'))) pk = '9';
      else if (ks.includes('sepuluh') || (ks.includes('x') && !ks.includes('xi') && !ks.includes('xii'))) pk = '10';
      else if (ks.includes('sebelas') || (ks.includes('xi') && !ks.includes('xii'))) pk = '11';
      else if (ks.includes('dua belas') || (ks.includes('xii'))) pk = '12';
    }
    return pk || '1';
  };

  const parsedKelasCurrent = getParsedKelas();

  const isCurrentSeniBudaya = activeMapel ? (
    activeMapel.nama.toLowerCase().includes('seni dan budaya') ||
    activeMapel.nama.toLowerCase().includes('seni budaya') ||
    (activeMapel.nama.toLowerCase().includes('seni') &&
      !activeMapel.nama.toLowerCase().includes('seni rupa') &&
      !activeMapel.nama.toLowerCase().includes('seni musik') &&
      !activeMapel.nama.toLowerCase().includes('seni teater') &&
      !activeMapel.nama.toLowerCase().includes('seni tari')
    )
  ) : false;

  const isCurrentPabp = activeMapel ? isPabpMapel(activeMapel.nama, activeMapel.kode) : false;
  const displayedTps = isCurrentPabp
    ? tps.filter(tp => (tp.agama || getTpAgama(tp)) === selectedAgamaFilter)
    : tps;

  const [selectedTpIds, setSelectedTpIds] = useState<string[]>([]);
  const [draggedTpId, setDraggedTpId] = useState<string | null>(null);
  const [dragOverTpId, setDragOverTpId] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    setSelectedTpIds([]);
  }, [selectedMapel, selectedAgamaFilter]);

  const studentAgamaCounts: Record<string, number> = {};
  state.siswa.forEach(s => {
    const norm = normalizeAgama(s.agama);
    if (norm) {
      studentAgamaCounts[norm] = (studentAgamaCounts[norm] || 0) + 1;
    }
  });

  const getAgamaStyle = (ag: string) => {
    switch (ag) {
      case 'Islam':
        return {
          active: 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      case 'Kristen':
        return {
          active: 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-600',
          badge: 'bg-sky-50 text-sky-700 border-sky-200'
        };
      case 'Katolik':
        return {
          active: 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600',
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200'
        };
      case 'Hindu':
        return {
          active: 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-600',
          badge: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      case 'Buddha':
        return {
          active: 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-600',
          badge: 'bg-orange-50 text-orange-700 border-orange-200'
        };
      case 'Khonghucu':
        return {
          active: 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-600',
          badge: 'bg-rose-50 text-rose-700 border-rose-200'
        };
      default:
        return {
          active: 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-700',
          badge: 'bg-slate-50 text-slate-700 border-slate-200'
        };
    }
  };

  const handleApplySeniTps = (selectedTps: { kode: string; deskripsi: string }[], mode: 'replace' | 'append') => {
    if (!selectedMapel || selectedTps.length === 0) return;

    let indexCounter = 0;
    const newTpObjects: TujuanPembelajaran[] = selectedTps.map((item) => ({
      id: 'tp_' + Date.now() + '_' + (indexCounter++),
      mapelId: selectedMapel,
      kode: item.kode,
      deskripsi: item.deskripsi
    }));

    if (mode === 'replace') {
      const otherTps = state.tujuanPembelajaran.filter(tp => tp.mapelId !== selectedMapel);
      updateState('tujuanPembelajaran', [...otherTps, ...newTpObjects]);
    } else {
      updateState('tujuanPembelajaran', [...state.tujuanPembelajaran, ...newTpObjects]);
    }

    showNotif(`Berhasil memuat ${newTpObjects.length} TP Seni dan Budaya!`, "success");
  };

  const handleAdd = () => {
    if (!selectedMapel) {
      alert("Pilih mata pelajaran terlebih dahulu.");
      return;
    }
    const defaultAgama = isCurrentPabp 
      ? ((selectedAgamaFilter in defaultTpPabp) ? selectedAgamaFilter : getDefaultAgama()) 
      : undefined;

    const countForAgama = isCurrentPabp && defaultAgama
      ? tps.filter(t => (t.agama || getTpAgama(t)) === defaultAgama).length
      : tps.length;

    const newTp: TujuanPembelajaran = {
      id: 'tp' + Date.now(),
      mapelId: selectedMapel,
      kode: isCurrentPabp && defaultAgama
        ? `TP.PABP.${defaultAgama.substring(0, 3).toUpperCase()}.${countForAgama + 1}`
        : `TP.${activeMapel?.kode || 'X'}.${tps.length + 1}`,
      deskripsi: isCurrentPabp && defaultAgama ? `[${defaultAgama}] Deskripsi TP baru...` : 'Deskripsi TP baru...',
      agama: defaultAgama
    };
    updateState('tujuanPembelajaran', [...state.tujuanPembelajaran, newTp]);
  };

  const handleUpdate = (id: string, field: keyof TujuanPembelajaran, value: string) => {
    updateState('tujuanPembelajaran', state.tujuanPembelajaran.map(tp => 
      tp.id === id ? { ...tp, [field]: value } : tp
    ));
  };

  const handleDelete = (id: string) => {
    const tpToDelete = state.tujuanPembelajaran.find(tp => tp.id === id);
    if (tpToDelete) {
      const newTrashItem = {
        id: 'trash_' + Date.now() + Math.random().toString(36).substring(2, 9),
        originalId: tpToDelete.id,
        type: 'tp' as const,
        label: `TP ${tpToDelete.kode} - ${activeMapel?.nama || 'Mapel'}`,
        data: tpToDelete,
        deletedAt: new Date().toISOString()
      };
      updateState('trash', [...(state.trash || []), newTrashItem]);
    }
    updateState('tujuanPembelajaran', state.tujuanPembelajaran.filter(tp => tp.id !== id));
    setSelectedTpIds(prev => prev.filter(item => item !== id));
    showNotif("1 TP dipindahkan ke Kotak Sampah.", "success");
  };

  const isAllSelected = displayedTps.length > 0 && displayedTps.every(tp => selectedTpIds.includes(tp.id));
  const isSomeSelected = displayedTps.some(tp => selectedTpIds.includes(tp.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const displayedIdSet = new Set(displayedTps.map(tp => tp.id));
      setSelectedTpIds(prev => prev.filter(id => !displayedIdSet.has(id)));
    } else {
      const displayedIds = displayedTps.map(tp => tp.id);
      setSelectedTpIds(prev => Array.from(new Set([...prev, ...displayedIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedTpIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleReorder = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    const fromIndex = displayedTps.findIndex(tp => tp.id === sourceId);
    const toIndex = displayedTps.findIndex(tp => tp.id === targetId);

    if (fromIndex === -1 || toIndex === -1) return;

    const reorderedSubset = [...displayedTps];
    const [moved] = reorderedSubset.splice(fromIndex, 1);
    reorderedSubset.splice(toIndex, 0, moved);

    const subsetIdSet = new Set(displayedTps.map(tp => tp.id));
    let subsetIdx = 0;
    const newAllTps = state.tujuanPembelajaran.map(tp => {
      if (subsetIdSet.has(tp.id)) {
        return reorderedSubset[subsetIdx++];
      }
      return tp;
    });

    updateState('tujuanPembelajaran', newAllTps);
  };

  const handleConfirmBulkDelete = () => {
    if (selectedTpIds.length === 0) return;
    const itemsToDelete = state.tujuanPembelajaran.filter(tp => selectedTpIds.includes(tp.id));
    if (itemsToDelete.length === 0) return;

    const newTrashItems = itemsToDelete.map(tp => ({
      id: 'trash_' + Date.now() + Math.random().toString(36).substring(2, 9),
      originalId: tp.id,
      type: 'tp' as const,
      label: `TP ${tp.kode} - ${activeMapel?.nama || 'Mapel'}`,
      data: tp,
      deletedAt: new Date().toISOString()
    }));

    updateState('trash', [...(state.trash || []), ...newTrashItems]);
    updateState('tujuanPembelajaran', state.tujuanPembelajaran.filter(tp => !selectedTpIds.includes(tp.id)));
    showNotif(`Berhasil menghapus ${itemsToDelete.length} TP (dipindahkan ke Kotak Sampah).`, "success");
    setSelectedTpIds([]);
    setIsBulkDeleteConfirmOpen(false);
  };

      const handleGenerateDefaultTp = () => {
    if (!selectedMapel) return;
    const mapelObj = mapel.find(m => m.id === selectedMapel);
    if (!mapelObj) return;

    
    
    
    
    
    
    const isPancasila = mapelObj.nama.toLowerCase().includes('pancasila');
    const isInggris = mapelObj.nama.toLowerCase().includes('inggris') || mapelObj.nama.toLowerCase().includes('english');
    const isIndonesia = mapelObj.nama.toLowerCase().includes('indonesia');
    const isMatematika = mapelObj.nama.toLowerCase().includes('matematika') || mapelObj.nama.toLowerCase().includes('math');
    const isIpas = mapelObj.nama.toLowerCase().includes('ipas') || mapelObj.nama.toLowerCase().includes('ilmu pengetahuan alam') || mapelObj.nama.toLowerCase().includes('sains') || mapelObj.nama.toLowerCase().includes('sosial');
    const isPjok = mapelObj.nama.toLowerCase().includes('pjok') || mapelObj.nama.toLowerCase().includes('pendidikan jasmani') || mapelObj.nama.toLowerCase().includes('olahraga') || mapelObj.nama.toLowerCase().includes('kesehatan') || mapelObj.nama.toLowerCase().includes('penjas');
    const isKka = mapelObj.nama.toLowerCase().includes('koding') || mapelObj.nama.toLowerCase().includes('kecerdasan artifisial') || mapelObj.nama.toLowerCase().includes('kka') || mapelObj.nama.toLowerCase().includes('informatika');
    const isSeniRupa = mapelObj.nama.toLowerCase().includes('seni rupa');
    const isSeniMusik = mapelObj.nama.toLowerCase().includes('seni musik');
    const isSeniTeater = mapelObj.nama.toLowerCase().includes('seni teater');
    const isSeniTari = mapelObj.nama.toLowerCase().includes('seni tari');
    const isSeniBudaya = (
      mapelObj.nama.toLowerCase().includes('seni dan budaya') ||
      mapelObj.nama.toLowerCase().includes('seni budaya') ||
      (mapelObj.nama.toLowerCase().includes('seni') && !isSeniRupa && !isSeniMusik && !isSeniTeater && !isSeniTari)
    );

    if (isCurrentPabp) {
      if (!parsedKelasCurrent) {
        showNotif("Sistem tidak dapat mendeteksi Kelas. Silakan periksa isian di menu Data Dasar.", "error");
        return;
      }

      const { semester } = state.sekolah;
      let sem = "1";
      if (String(semester).toLowerCase().includes('genap') || String(semester).includes('2')) {
        sem = "2";
      }

      // Tentukan agama yang akan dimuat TP-nya sesuai tab yang sedang aktif
      const targetAgama: AgamaKey = (selectedAgamaFilter in defaultTpPabp)
        ? (selectedAgamaFilter as AgamaKey)
        : (getDefaultAgama() as AgamaKey);

      const existingTps = state.tujuanPembelajaran.filter(tp => tp.mapelId === selectedMapel);
      const newTpObjects: TujuanPembelajaran[] = [];
      let indexCounter = 0;

      const tpList = defaultTpPabp[targetAgama]?.[parsedKelasCurrent]?.[sem] || [];
      tpList.forEach(item => {
        const alreadyExists = existingTps.some(et =>
          et.kode === item.kode ||
          et.deskripsi.trim().toLowerCase() === item.deskripsi.trim().toLowerCase() ||
          et.deskripsi.trim().toLowerCase() === `[${targetAgama}] ${item.deskripsi}`.trim().toLowerCase()
        );
        if (!alreadyExists) {
          newTpObjects.push({
            id: 'tp_' + Date.now() + '_' + (indexCounter++),
            mapelId: selectedMapel,
            kode: item.kode,
            deskripsi: `[${targetAgama}] ${item.deskripsi}`,
            agama: targetAgama
          });
        }
      });

      if (newTpObjects.length === 0) {
        showNotif(`Seluruh TP ${targetAgama} Kelas ${parsedKelasCurrent} Semester ${sem} sudah ada di tabel.`, "error");
        return;
      }

      updateState('tujuanPembelajaran', [...state.tujuanPembelajaran, ...newTpObjects]);
      showNotif(`Berhasil memuat ${newTpObjects.length} TP ${targetAgama} Kelas ${parsedKelasCurrent} Semester ${sem} (BSKAP 046/2025)!`, "success");
      return;
    }

    if (isSeniBudaya) {
      if (!parsedKelasCurrent) {
        showNotif("Sistem tidak dapat mendeteksi Kelas. Silakan periksa isian di menu Data Dasar.", "error");
        return;
      }
      setIsSeniModalOpen(true);
      return;
    }

    if (!isPancasila && !isInggris && !isIndonesia && !isMatematika && !isIpas && !isPjok && !isKka && !isSeniRupa && !isSeniMusik && !isSeniTeater && !isSeniTari) {
      showNotif("Maaf, muat TP otomatis saat ini baru tersedia untuk mapel: PABP (Pendidikan Agama), Pancasila, B. Inggris, B. Indonesia, Matematika, IPAS, PJOK, KKA, Seni Rupa, Seni Musik, Seni Teater, Seni Tari, dan Seni dan Budaya.", "error");
      return;
    }

    const { kelas, semester } = state.sekolah;
    
    let sem = "1";
    if (String(semester).toLowerCase().includes('genap') || String(semester).includes('2')) {
      sem = "2";
    }

    let parsedKelas = String(kelas).replace(/[^0-9]/g, '');
    
    // Fallback if roman numerals or words are used
    const kelasStr = String(kelas).toLowerCase();
    if (!parsedKelas) {
      if (kelasStr.includes('satu') || kelasStr.includes('i') && !kelasStr.includes('ii') && !kelasStr.includes('iii') && !kelasStr.includes('iv') && !kelasStr.includes('vi') && !kelasStr.includes('ix')) parsedKelas = '1';
      else if (kelasStr.includes('dua') || kelasStr.includes('ii') && !kelasStr.includes('iii') && !kelasStr.includes('vii') && !kelasStr.includes('viii')) parsedKelas = '2';
      else if (kelasStr.includes('tiga') || kelasStr.includes('iii') && !kelasStr.includes('viii')) parsedKelas = '3';
      else if (kelasStr.includes('empat') || kelasStr.includes('iv')) parsedKelas = '4';
      else if (kelasStr.includes('lima') || kelasStr.includes('v') && !kelasStr.includes('iv') && !kelasStr.includes('vi') && !kelasStr.includes('vii') && !kelasStr.includes('viii')) parsedKelas = '5';
      else if (kelasStr.includes('enam') || kelasStr.includes('vi') && !kelasStr.includes('vii') && !kelasStr.includes('viii')) parsedKelas = '6';
      else if (kelasStr.includes('tujuh') || kelasStr.includes('vii') && !kelasStr.includes('viii')) parsedKelas = '7';
      else if (kelasStr.includes('delapan') || kelasStr.includes('viii')) parsedKelas = '8';
      else if (kelasStr.includes('sembilan') || kelasStr.includes('ix')) parsedKelas = '9';
      else if (kelasStr.includes('sepuluh') || kelasStr.includes('x') && !kelasStr.includes('xi') && !kelasStr.includes('xii')) parsedKelas = '10';
      else if (kelasStr.includes('sebelas') || kelasStr.includes('xi') && !kelasStr.includes('xii')) parsedKelas = '11';
      else if (kelasStr.includes('dua belas') || kelasStr.includes('xii')) parsedKelas = '12';
    }

    if (!parsedKelas) {
      showNotif("Sistem tidak dapat mendeteksi Kelas. Silakan periksa isian di menu Data Dasar.", "error");
      return;
    }

    let kelasData;
    if (isPancasila) kelasData = defaultTpPancasila[parsedKelas];
    if (isInggris) kelasData = defaultTpBahasaInggris[parsedKelas];
    if (isIndonesia) kelasData = defaultTpBahasaIndonesia[parsedKelas];
    if (isMatematika) kelasData = defaultTpMatematika[parsedKelas];
    if (isIpas) kelasData = defaultTpIpas[parsedKelas];
    if (isPjok) kelasData = defaultTpPjok[parsedKelas];
    if (isKka) kelasData = defaultTpKka[parsedKelas];
    if (isSeniRupa) kelasData = defaultTpSeniRupa[parsedKelas];
    if (isSeniMusik) kelasData = defaultTpSeniMusik[parsedKelas];
    if (isSeniTeater) kelasData = defaultTpSeniTeater[parsedKelas];
    if (isSeniTari) kelasData = defaultTpSeniTari[parsedKelas];

    if (!kelasData) {
      if (isIpas && parseInt(parsedKelas) > 6) {
        showNotif(`Maaf, mata pelajaran IPAS hanya diajarkan di jenjang SD (Kelas 3-6).`, "error");
      } else if (isKka && parseInt(parsedKelas) < 5) {
        showNotif(`Maaf, mata pelajaran Koding & KA baru diajarkan mulai jenjang Kelas 5 SD.`, "error");
      } else {
        showNotif(`Maaf, data TP default untuk Kelas ${parsedKelas} belum tersedia.`, "error");
      }
      return;
    }

    const tpsToInject = kelasData[sem];
    if (!tpsToInject || tpsToInject.length === 0) {
      showNotif(`Maaf, data TP default untuk Kelas ${parsedKelas} Semester ${sem} belum tersedia.`, "error");
      return;
    }







    
      let indexCounter = 0;
      const newTps = tpsToInject.map(item => ({
        id: 'tp_' + Date.now() + '_' + (indexCounter++),
        mapelId: selectedMapel,
        kode: item.kode,
        deskripsi: item.deskripsi
      }));

      updateState('tujuanPembelajaran', [...state.tujuanPembelajaran, ...newTps]);
      showNotif(`Berhasil memuat ${newTps.length} TP default ${mapelObj.nama}!`, "success");
    
  };

  const handleDownloadTemplate = () => {
    if (mapel.length === 0) {
      alert("Anda belum memiliki data Mata Pelajaran.");
      return;
    }
    
    const workbook = XLSX.utils.book_new();
    
    mapel.forEach((m) => {
      // Safe sheet name (max 31 chars, forbidden chars removed)
      const sheetName = m.kode.replace(/[\\/*?:[\]]/g, '').substring(0, 31) || `Mapel-${m.id.substring(0,6)}`;
      
      const templateData = [
        { KODE_TP: `TP.${m.kode}.1`, DESKRIPSI_TP: `Deskripsi contoh TP 1 untuk ${m.nama}` },
        { KODE_TP: `TP.${m.kode}.2`, DESKRIPSI_TP: `Deskripsi contoh TP 2 untuk ${m.nama}` }
      ];
      
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const filename = `E-Rapor Edi Brata Template Tujuan Pembelajaran ${yyyy}${mm}${dd} ${hh}.${min}.${ss}.xlsx`;
    
    XLSX.writeFile(workbook, filename);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const newTps: TujuanPembelajaran[] = [];
        let indexCounter = 0;
        
        workbook.SheetNames.forEach((sheetName) => {
          // Find matching mapel by kode
          const matchedMapel = mapel.find(m => {
            const expectedSheetName = m.kode.replace(/[\\/*?:[\]]/g, '').substring(0, 31) || `Mapel-${m.id.substring(0,6)}`;
            return expectedSheetName === sheetName;
          });
          
          if (matchedMapel) {
            const worksheet = workbook.Sheets[sheetName];
            const rows: any[] = XLSX.utils.sheet_to_json(worksheet);
            
            rows.forEach((row) => {
              const kodeTp = row['KODE_TP'];
              const deskripsiTp = row['DESKRIPSI_TP'];
              
              if (kodeTp && deskripsiTp) {
                newTps.push({
                  id: 'tp_' + Date.now() + '_' + (indexCounter++),
                  mapelId: matchedMapel.id,
                  kode: String(kodeTp).trim(),
                  deskripsi: String(deskripsiTp).trim()
                });
              }
            });
          }
        });
        
        if (newTps.length > 0) {
          updateState('tujuanPembelajaran', [...state.tujuanPembelajaran, ...newTps]);
        }
      } catch (err) {
        console.error("Error importing Excel file", err);
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="w-full animate-in fade-in duration-200">

      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-rose-500" />}
            <p className="text-xs font-bold">{notification.message}</p>
          </div>
        </div>
      )}

      <div className="px-6 py-5 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-2xl">
        <div>
          <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-900" />
            Manajemen Tujuan Pembelajaran
          </h1>
          <p className="text-[11px] text-slate-500 mt-1">Kelola data Tujuan Pembelajaran (TP) untuk setiap mata pelajaran.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mapel:</label>
            <select 
              value={selectedMapel} 
              onChange={(e) => setSelectedMapel(e.target.value)} 
              className="border border-slate-200 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/20 cursor-pointer max-w-[210px] truncate"
            >
              {mapel.map(m => (
                <option key={m.id} value={m.id}>{m.nama}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Pengaturan Interval KKTP */}
            <Tooltip content={`Pengaturan Interval KKTP (${activeMapel?.nama || 'Mapel'}). Ambang Tuntas: >${activeBatasTuntas}`} position="bottom">
              <button
                type="button"
                onClick={() => setIsKktpModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg border border-indigo-200 shadow-2xs transition cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                <span>Pengaturan KKTP</span>
                <span className="bg-indigo-600 text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full">
                  &gt;{activeBatasTuntas}
                </span>
              </button>
            </Tooltip>

            <input 
              type="file" 
              accept=".xlsx, .xls" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            <Tooltip content="Import TP dari File Excel (Multi-Sheet)" position="bottom">
              <button 
                onClick={handleImportClick} 
                className="w-8 h-8 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg shadow-sm border border-emerald-200 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Unduh Template Excel (Semua Mapel)" position="bottom">
              <button 
                onClick={handleDownloadTemplate} 
                className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg shadow-sm border border-gray-200 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip 
              content={
                isCurrentPabp 
                  ? `Muat TP ${selectedAgamaFilter} Otomatis (BSKAP 046/2025)`
                  : isCurrentSeniBudaya 
                    ? 'Pilih TP Seni (Rupa, Musik, Tari, Teater)' 
                    : 'Muat TP Default Otomatis'
              } 
              position="bottom"
            >
              <button 
                onClick={handleGenerateDefaultTp} 
                className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm border transition cursor-pointer ${
                  isCurrentPabp
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200'
                    : isCurrentSeniBudaya 
                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200' 
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip content="Tambah TP Baru Secara Manual" position="bottom">
              <button 
                onClick={handleAdd} 
                className="w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Tab Navigasi Permanen untuk 6 Agama Resmi jika PABP */}
      {isCurrentPabp && (
        <div className="px-5 py-2.5 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-emerald-50/40 border-t border-b border-emerald-100/80 flex items-center justify-between gap-3 text-xs overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mr-1">Agama:</span>

            {/* Tab Masing-Masing 6 Agama Resmi */}
            {AGAMA_LIST.map(ag => {
              const countTp = tps.filter(t => (t.agama || getTpAgama(t)) === ag).length;
              const studentCount = studentAgamaCounts[ag] || 0;
              const isActive = selectedAgamaFilter === ag;
              const styles = getAgamaStyle(ag);

              return (
                <button
                  key={ag}
                  type="button"
                  onClick={() => setSelectedAgamaFilter(ag)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? styles.active
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  {studentCount > 0 && (
                    <Tooltip content={`Terdapat ${studentCount} murid beragama ${ag} di kelas ini`} position="top">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white shrink-0 block" />
                    </Tooltip>
                  )}
                  <span>{ag}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-black/25 text-white'
                      : countTp > 0
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-slate-50 text-slate-400'
                  }`}>
                    {countTp}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Indikator info murid rombel */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>Ada murid di kelas ini</span>
          </div>
        </div>
      )}

      {/* Bilah Aksi Hapus Massal (Bulk Action Toolbar) */}
      {selectedTpIds.length > 0 && (
        <div className="px-5 py-2.5 bg-gradient-to-r from-rose-50 via-rose-100/60 to-rose-50 border-t border-b border-rose-200 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
              {selectedTpIds.length}
            </span>
            <span className="font-bold text-rose-950">
              {selectedTpIds.length} Tujuan Pembelajaran dipilih
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedTpIds([])}
              className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-100/70 text-rose-700 font-semibold transition cursor-pointer text-xs"
            >
              Batal Pilih
            </button>
            <button
              type="button"
              onClick={() => setIsBulkDeleteConfirmOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus yang Dipilih ({selectedTpIds.length})
            </button>
          </div>
        </div>
      )}

      <div className="overflow-auto bg-white rounded-b-2xl border-t border-gray-200" style={{ maxHeight: 'calc(100vh - 250px)' }}>
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#F8FAFC] text-slate-500 font-bold border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-2 py-2 w-8 text-center text-[10px] uppercase tracking-wider">
                <Tooltip content="Geser baris untuk memindahkan urutan TP" position="bottom">
                  <GripVertical className="w-3.5 h-3.5 mx-auto text-slate-400" />
                </Tooltip>
              </th>
              <th className="px-2 py-2 w-8 text-center text-[10px] uppercase tracking-wider">
                <Tooltip content={isAllSelected ? "Batalkan pilihan semua" : "Pilih semua TP yang tampil"} position="bottom">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={input => {
                      if (input) input.indeterminate = isSomeSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer accent-indigo-600"
                  />
                </Tooltip>
              </th>
              <th className="px-3 py-2 w-12 text-center text-[10px] uppercase tracking-wider">No</th>
              <th className="px-4 py-2 w-48 text-left text-[10px] uppercase tracking-wider">Kode TP</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider">Deskripsi Tujuan Pembelajaran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayedTps.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                  {isCurrentPabp ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-slate-500 font-medium">
                        Belum ada Tujuan Pembelajaran untuk Agama {selectedAgamaFilter}.
                      </p>
                      <button
                        type="button"
                        onClick={handleGenerateDefaultTp}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Muat TP {selectedAgamaFilter} Otomatis (BSKAP 046/2025)
                      </button>
                    </div>
                  ) : isCurrentSeniBudaya ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-slate-500 font-medium">Belum ada Tujuan Pembelajaran untuk Seni dan Budaya.</p>
                      <button
                        type="button"
                        onClick={handleGenerateDefaultTp}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Pilih dari Bank Seni (Rupa, Musik, Tari, Teater)
                      </button>
                    </div>
                  ) : (
                    "Belum ada Tujuan Pembelajaran untuk mata pelajaran ini. Silakan klik Tambah TP atau Muat TP Default."
                  )}
                </td>
              </tr>
            ) : null}
            {displayedTps.map((tp, i) => {
              const tpAg = tp.agama || getTpAgama(tp);
              const styles = tpAg ? getAgamaStyle(tpAg) : null;
              const isChecked = selectedTpIds.includes(tp.id);

              return (
                <tr 
                  key={tp.id} 
                  draggable
                  onDragStart={(e) => {
                    const targetTag = (e.target as HTMLElement).tagName.toLowerCase();
                    if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
                      e.preventDefault();
                      return;
                    }
                    e.dataTransfer.setData('text/plain', tp.id);
                    e.dataTransfer.effectAllowed = 'move';
                    setDraggedTpId(tp.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverTpId !== tp.id) {
                      setDragOverTpId(tp.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverTpId === tp.id) {
                      setDragOverTpId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const sourceId = e.dataTransfer.getData('text/plain') || draggedTpId;
                    if (sourceId && sourceId !== tp.id) {
                      handleReorder(sourceId, tp.id);
                    }
                    setDraggedTpId(null);
                    setDragOverTpId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedTpId(null);
                    setDragOverTpId(null);
                  }}
                  className={`transition-colors group align-top ${
                    draggedTpId === tp.id
                      ? 'opacity-40 bg-indigo-50/60'
                      : dragOverTpId === tp.id
                        ? 'bg-indigo-50/90 border-t-2 border-indigo-500'
                        : isChecked
                          ? 'bg-rose-50/40 hover:bg-rose-50/70'
                          : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Grip Handle Drag Column */}
                  <td className="px-2 py-3 text-center text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing select-none">
                    <Tooltip content="Klik & seret untuk memindahkan urutan TP" position="right">
                      <GripVertical className="w-4 h-4 mx-auto" />
                    </Tooltip>
                  </td>

                  {/* Checkbox Column */}
                  <td className="px-2 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSelect(tp.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer accent-indigo-600"
                    />
                  </td>

                  {/* Nomor Urut */}
                  <td className="px-3 py-2 text-center text-gray-400 font-mono text-[11px] pt-3">{i + 1}</td>

                  {/* Kode TP */}
                  <td className="px-4 py-1.5">
                    <div className="flex flex-col gap-1">
                      <input 
                        type="text" 
                        value={tp.kode || ''} 
                        onChange={(e) => handleUpdate(tp.id, 'kode', e.target.value)} 
                        className="w-full px-2 py-1 border border-transparent hover:border-gray-200 focus:border-indigo-400 rounded outline-none font-bold font-mono text-[11px] bg-transparent focus:bg-white transition-colors text-slate-800" 
                      />
                      {isCurrentPabp && tpAg && (
                        <div className="flex items-center gap-1.5 px-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${styles?.badge || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                            {tpAg}
                          </span>
                          <Tooltip content="Pindahkan TP ini ke Agama lain" position="right">
                            <select
                              value={tpAg}
                              onChange={(e) => handleUpdate(tp.id, 'agama', e.target.value)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer outline-none p-0"
                            >
                              {AGAMA_LIST.map(ag => (
                                <option key={ag} value={ag}>{ag}</option>
                              ))}
                            </select>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Deskripsi TP */}
                  <td className="px-4 py-1.5">
                    <textarea 
                      value={tp.deskripsi || ''} 
                      onChange={(e) => handleUpdate(tp.id, 'deskripsi', e.target.value)} 
                      className="w-full px-2 py-1.5 border border-transparent hover:border-gray-200 focus:border-indigo-400 rounded outline-none text-[12px] bg-transparent focus:bg-white transition-colors text-slate-700 resize-y min-h-[34px] leading-relaxed block" 
                      rows={1} 
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Konfirmasi Hapus Massal */}
      {isBulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Hapus {selectedTpIds.length} TP Terpilih?</h3>
                <p className="text-xs text-slate-500">Tindakan ini aman dan dapat dipulihkan.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-5 leading-relaxed">
              Sebanyak <strong>{selectedTpIds.length}</strong> Tujuan Pembelajaran pada mata pelajaran <strong>{activeMapel?.nama}</strong> akan dipindahkan ke <strong>Kotak Sampah</strong>.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsBulkDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm cursor-pointer transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {activeMapel && (
        <ModalPilihTpSeni
          isOpen={isSeniModalOpen}
          onClose={() => setIsSeniModalOpen(false)}
          mapelNama={activeMapel.nama}
          mapelKode={activeMapel.kode}
          kelas={parsedKelasCurrent}
          semester={state.sekolah.semester || '1'}
          existingTpCount={tps.length}
          onApply={handleApplySeniTps}
        />
      )}

      {selectedMapel && (
        <ModalKktp
          isOpen={isKktpModalOpen}
          onClose={() => setIsKktpModalOpen(false)}
          mapelId={selectedMapel}
          onSuccess={(msg) => showNotif(msg, 'success')}
          onSelectMapel={(newMapelId) => setSelectedMapel(newMapelId)}
        />
      )}
    </div>
  );
}
