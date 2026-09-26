import React, { useState, useRef } from 'react';
import { useAppStore } from '@/store';
import { Mapel } from '@/types';
import Tooltip from '@/components/Tooltip';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Upload, 
  Download, 
  Book, 
  Sliders, 
  Settings2, 
  Percent, 
  CheckCircle2, 
  X,
  Equal
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DataMapel() {
  const { state, updateState } = useAppStore();
  const { mapel } = state;
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingAsesmenMapel, setEditingAsesmenMapel] = useState<Mapel | null>(null);
  const [isGlobalBatchMode, setIsGlobalBatchMode] = useState(false);
  const [applyToAll, setApplyToAll] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [newMapelData, setNewMapelData] = useState<Partial<Mapel>>({
    kode: '',
    nama: '',
    kelompok: 'Pokok',
    opsiPengolahan: 'rata-rata',
    pakaiSas: true,
    rasioSlmSas: { slm: 75, sas: 25 }
  });

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const _mapel = [...mapel];
    const draggedItemContent = _mapel.splice(dragItem.current, 1)[0];
    _mapel.splice(dragOverItem.current, 0, draggedItemContent);
    updateState('mapel', _mapel);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { KODE_MAPEL: 'mtk', NAMA_MAPEL: 'Matematika', KELOMPOK: 'Pokok', TAMPIL_RAPOR: 'Aktif' },
      { KODE_MAPEL: 'ipa-ter', NAMA_MAPEL: 'Ilmu Pengetahuan Alam Terapan', KELOMPOK: 'Muatan Lokal', TAMPIL_RAPOR: 'Aktif' }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Mapel");
    
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const filename = `E-Rapor Edi Brata Template Mapel ${yyyy}${mm}${dd} ${hh}.${min}.${ss}.xlsx`;
    
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
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet);
      
      const newMapels: Mapel[] = [];
      
      rows.forEach((row, index) => {
        const kode = row['KODE_MAPEL'];
        const nama = row['NAMA_MAPEL'];
        const kelompok = row['KELOMPOK'];
        const tampil = row['TAMPIL_RAPOR'];
        
        if (kode && nama) {
          newMapels.push({
            id: 'm_' + Date.now() + '_' + index,
            kode: String(kode).trim(),
            nama: String(nama).trim(),
            kelompok: String(kelompok).trim() === 'Muatan Lokal' ? 'Muatan Lokal' : 'Pokok',
            tampilRapor: String(tampil).trim().toLowerCase() === 'disembunyikan' ? false : true,
            opsiPengolahan: 'rata-rata',
            pakaiSas: true,
            rasioSlmSas: { slm: 75, sas: 25 }
          });
        }
      });

      if (newMapels.length > 0) {
        updateState('mapel', [...mapel, ...newMapels]);
        showNotification(`${newMapels.length} mata pelajaran berhasil diimpor!`);
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddMapel = () => {
    if (!newMapelData.nama || !newMapelData.kode) {
      return;
    }
    
    const newMapel: Mapel = {
      id: 'm' + Date.now(),
      nama: newMapelData.nama,
      kode: newMapelData.kode,
      kelompok: newMapelData.kelompok || 'Pokok',
      opsiPengolahan: newMapelData.opsiPengolahan || 'rata-rata',
      pakaiSas: newMapelData.pakaiSas !== false,
      rasioSlmSas: newMapelData.rasioSlmSas || { slm: 75, sas: 25 },
      tampilRapor: true
    };
    updateState('mapel', [...mapel, newMapel]);
    setNewMapelData({ 
      kode: '', 
      nama: '', 
      kelompok: 'Pokok',
      opsiPengolahan: 'rata-rata',
      pakaiSas: true,
      rasioSlmSas: { slm: 75, sas: 25 }
    });
    setIsAddingMode(false);
    showNotification('Mata pelajaran berhasil ditambahkan!');
  };

  const handleUpdate = (id: string, field: keyof Mapel, value: any) => {
    updateState('mapel', mapel.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // Buka modal pengaturan pengolahan serentak untuk semua mapel
  const handleOpenGlobalPengaturan = () => {
    setIsGlobalBatchMode(true);
    setApplyToAll(true);
    const baseMapel = mapel[0] || {
      id: 'global',
      nama: 'Seluruh Mata Pelajaran',
      kode: 'ALL',
      kelompok: 'Pokok',
      tampilRapor: true,
      opsiPengolahan: 'rata-rata',
      pakaiSas: true,
      rasioSlmSas: { slm: 75, sas: 25 }
    };
    setEditingAsesmenMapel({
      ...baseMapel,
      id: 'global',
      nama: 'Semua Mata Pelajaran',
      kode: 'SEMUA'
    });
  };

  // Simpan pengaturan dari modal
  const handleSaveModalPengaturan = () => {
    if (!editingAsesmenMapel) return;

    if (isGlobalBatchMode || applyToAll) {
      const updatedMapels = mapel.map(m => ({
        ...m,
        opsiPengolahan: editingAsesmenMapel.opsiPengolahan || 'rata-rata',
        pakaiSas: editingAsesmenMapel.pakaiSas !== false,
        rasioSlmSas: editingAsesmenMapel.rasioSlmSas || { slm: 75, sas: 25 }
      }));
      updateState('mapel', updatedMapels);
      showNotification('Pengaturan Pengolahan Nilai Rapor berhasil diterapkan ke SELURUH mata pelajaran!');
    } else {
      updateState('mapel', mapel.map(m => m.id === editingAsesmenMapel.id ? {
        ...m,
        opsiPengolahan: editingAsesmenMapel.opsiPengolahan || 'rata-rata',
        pakaiSas: editingAsesmenMapel.pakaiSas !== false,
        rasioSlmSas: editingAsesmenMapel.rasioSlmSas || { slm: 75, sas: 25 }
      } : m));
      showNotification(`Pengaturan pengolahan nilai untuk ${editingAsesmenMapel.nama} disimpan!`);
    }

    setEditingAsesmenMapel(null);
    setIsGlobalBatchMode(false);
    setApplyToAll(false);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const isAllSelected = mapel.length > 0 && selectedIds.length === mapel.length;
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(mapel.map(m => m.id));
    }
  };

  const handleDeleteSelected = () => {
    const deletedMapels = mapel.filter(m => selectedIds.includes(m.id));
    const newTrashItems = deletedMapels.map(m => ({
      id: 'trash_' + Date.now() + Math.random().toString(36).substring(2, 9),
      originalId: m.id,
      type: 'mapel' as const,
      label: `Mata Pelajaran: ${m.nama} (${m.kode})`,
      data: m,
      deletedAt: new Date().toISOString()
    }));
    
    updateState('trash', [...(state.trash || []), ...newTrashItems]);
    const newMapelArray = mapel.filter(m => !selectedIds.includes(m.id));
    updateState('mapel', newMapelArray);
    setSelectedIds([]);
  };

  return (
    <div className="w-full">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Utama */}
      <div className="px-6 py-5 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-800">Manajemen Mata Pelajaran</h3>
          <p className="text-[11px] text-gray-500 mt-1">
            Kelola daftar mata pelajaran dan skema perhitungan nilai rapor akhir siswa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
          {/* Tombol Seragamkan Pengolahan Semua Mapel */}
          <Tooltip content="Terapkan rumus dan rasio pengolahan yang sama ke seluruh mata pelajaran sekaligus" position="bottom">
            <button
              type="button"
              onClick={handleOpenGlobalPengaturan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg border border-indigo-200 shadow-2xs transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pengaturan Pengolahan Nilai Rapor</span>
            </button>
          </Tooltip>

          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <Tooltip content="Import dari File Excel (.xlsx)" position="bottom">
            <button 
              onClick={handleImportClick} 
              className="w-8 h-8 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg shadow-sm border border-emerald-200 transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Unduh Template Excel Mapel" position="bottom">
            <button 
              onClick={handleDownloadTemplate} 
              className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg shadow-sm border border-gray-200 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Tambah Mata Pelajaran Baru" position="bottom">
            <button 
              onClick={() => setIsAddingMode(!isAddingMode)} 
              className="w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>
      
      {isAddingMode && (
        <div className="bg-slate-50 border-b border-gray-200 p-6 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold text-sm">
            <Book className="w-4 h-4" /> Form Penambahan Mata Pelajaran Baru
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-1/4">
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">Kode Mapel (Unik)</label>
              <input
                type="text"
                value={newMapelData.kode || ''}
                onChange={(e) => setNewMapelData({ ...newMapelData, kode: e.target.value })}
                placeholder="misal: mtk, ipa-ter"
                className="w-full border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 font-mono text-slate-700"
              />
            </div>
            <div className="w-full md:w-2/4">
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">Nama Mata Pelajaran</label>
              <input
                type="text"
                value={newMapelData.nama || ''}
                onChange={(e) => setNewMapelData({ ...newMapelData, nama: e.target.value })}
                placeholder="contoh: Pendidikan Matematika Terapan"
                className="w-full border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 font-bold text-slate-700"
              />
              <p className="text-[10px] text-gray-500 mt-1.5">Tips: Untuk mapel Seni, ketiklah spesifik cabangnya (misal: "Seni Rupa", "Seni Musik") agar TP otomatis terdeteksi.</p>
            </div>
            <div className="w-full md:w-1/4">
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">Kelompok Mapel</label>
              <select
                value={newMapelData.kelompok || 'Pokok'}
                onChange={(e) => setNewMapelData({ ...newMapelData, kelompok: e.target.value })}
                className="w-full border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 text-slate-700"
              >
                <option value="Pokok">Pokok</option>
                <option value="Muatan Lokal">Muatan Lokal</option>
              </select>
            </div>
          </div>

          {/* Kebijakan Pengolahan Nilai Rapor Awal */}
          <div className="pt-3 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                Metode Pengolahan Nilai Inter-TP
              </label>
              <select
                value={newMapelData.opsiPengolahan || 'rata-rata'}
                onChange={(e) => setNewMapelData({ ...newMapelData, opsiPengolahan: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="rata-rata">Opsi 1: Rata-Rata SLM (Standar Baku)</option>
                <option value="pembobotan">Opsi 2: Pembobotan Inter-TP</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">
                Rasio Komposit Nilai Rapor (NA-SLM : N-SAS)
              </label>
              <select
                value={`${newMapelData.rasioSlmSas?.slm ?? 75}:${newMapelData.rasioSlmSas?.sas ?? 25}`}
                onChange={(e) => {
                  const [slm, sas] = e.target.value.split(':').map(Number);
                  setNewMapelData({ ...newMapelData, rasioSlmSas: { slm, sas } });
                }}
                className="w-full border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 font-semibold"
              >
                <option value="75:25">75% NA-SLM : 25% N-SAS (Standar Baku)</option>
                <option value="60:40">60% NA-SLM : 40% N-SAS</option>
                <option value="70:30">70% NA-SLM : 30% N-SAS</option>
                <option value="50:50">50% NA-SLM : 50% N-SAS</option>
                <option value="100:0">100% NA-SLM (Tanpa SAS)</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAddingMode(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button onClick={handleAddMapel} className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors">
              Simpan Mapel
            </button>
          </div>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="px-6 py-2.5 bg-gradient-to-r from-rose-50 via-rose-100/60 to-rose-50 border-t border-b border-rose-200 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
              {selectedIds.length}
            </span>
            <span className="font-bold text-rose-950">
              {selectedIds.length} mata pelajaran dipilih
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-100/70 text-rose-700 font-semibold transition cursor-pointer text-xs"
            >
              Batal Pilih
            </button>
            <button 
              type="button"
              onClick={handleDeleteSelected}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus yang Dipilih ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      <div className="overflow-auto bg-white rounded-b-2xl border-t border-gray-200" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#F8FAFC] text-slate-500 font-bold border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-2 py-2 w-8 text-center text-[10px] uppercase tracking-wider">
                <Tooltip content="Geser baris untuk mengubah urutan mata pelajaran" position="bottom">
                  <GripVertical className="w-3.5 h-3.5 mx-auto text-slate-400" />
                </Tooltip>
              </th>
              <th className="px-2 py-2 w-8 text-center text-[10px] uppercase tracking-wider">
                <Tooltip content={isAllSelected ? "Batalkan pilihan semua" : "Pilih semua mata pelajaran"} position="bottom">
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
              <th className="px-4 py-2 w-32 text-center text-[10px] uppercase tracking-wider">Kode Mapel</th>
              <th className="px-4 py-2 text-center text-[10px] uppercase tracking-wider">Nama Mata Pelajaran</th>
              <th className="px-4 py-2 w-40 text-center text-[10px] uppercase tracking-wider">Kelompok</th>
              <th className="px-4 py-2 w-52 text-center text-[10px] uppercase tracking-wider">
                <Tooltip content="Metode Pengolahan Nilai & Rasio Komposit Rapor (SLM : SAS)" position="bottom">
                  <span>Skema Nilai Rapor</span>
                </Tooltip>
              </th>
              <th className="px-3 py-2 w-28 text-center text-[10px] uppercase tracking-wider">Tampil Rapor?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mapel.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Belum ada data mata pelajaran</td></tr>
            ) : null}
            {mapel.map((m, i) => {
              const currentMetode = m.opsiPengolahan || 'rata-rata';
              const currentRasio = m.rasioSlmSas || { slm: 75, sas: 25 };
              const isPakaiSas = m.pakaiSas !== false;

              return (
                <tr 
                  key={m.id} 
                  draggable
                  onDragStart={() => (dragItem.current = i)}
                  onDragEnter={() => (dragOverItem.current = i)}
                  onDragEnd={handleSort}
                  onDragOver={(e) => e.preventDefault()}
                  className={`transition-colors group align-middle ${selectedIds.includes(m.id) ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/80'}`}
                >
                  {/* 1. Gagang Geser (Grip) */}
                  <td className="px-2 py-2 text-center text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing select-none">
                    <Tooltip content="Klik & seret untuk memindahkan urutan" position="right">
                      <GripVertical className="w-3.5 h-3.5 mx-auto" />
                    </Tooltip>
                  </td>

                  {/* 2. Checkbox */}
                  <td className="px-2 py-2 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(m.id)}
                      onChange={() => handleToggleSelect(m.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer accent-indigo-600" 
                    />
                  </td>

                  {/* 3. No */}
                  <td className="px-3 py-2 text-center text-gray-400 font-mono text-[11px]">{i + 1}</td>
                  <td className="px-4 py-1.5">
                    <input
                      type="text"
                      value={m.kode || ''}
                      onChange={(e) => handleUpdate(m.id, 'kode', e.target.value)}
                      placeholder="kode"
                      className="w-full px-1.5 py-0.5 border border-transparent hover:border-gray-200 focus:border-indigo-400 rounded outline-none font-bold font-mono text-[11px] bg-transparent focus:bg-white transition-colors text-slate-800"
                    />
                  </td>
                  <td className="px-4 py-1.5">
                    <input
                      type="text"
                      value={m.nama || ''}
                      onChange={(e) => handleUpdate(m.id, 'nama', e.target.value)}
                      placeholder="Nama Mata Pelajaran"
                      className="w-full px-1.5 py-0.5 border border-transparent hover:border-gray-200 focus:border-indigo-400 rounded outline-none font-bold text-[12px] bg-transparent focus:bg-white transition-colors text-slate-800"
                    />
                  </td>
                  <td className="px-4 py-1.5 text-center">
                    <select
                      value={m.kelompok || 'Pokok'}
                      onChange={(e) => handleUpdate(m.id, 'kelompok', e.target.value)}
                      className={`w-full px-1.5 py-0.5 border border-transparent hover:border-gray-200 focus:border-indigo-400 rounded outline-none font-bold text-[11px] bg-transparent focus:bg-white transition-colors cursor-pointer text-center ${m.kelompok === 'Muatan Lokal' ? 'text-orange-600' : 'text-blue-600'}`}
                    >
                      <option value="Pokok">Pokok</option>
                      <option value="Muatan Lokal">Muatan Lokal</option>
                    </select>
                  </td>

                  {/* 4. Skema Nilai Rapor (Interactive Badge + Setting Trigger) */}
                  <td className="px-3 py-1.5 text-center">
                    <Tooltip content="Klik untuk mengubah Pengaturan Pengolahan Nilai Rapor (Metode & Rasio SAS)" position="top">
                      <button
                        type="button"
                        onClick={() => {
                          setIsGlobalBatchMode(false);
                          setApplyToAll(false);
                          setEditingAsesmenMapel(m);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold bg-slate-100/80 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200/90 hover:border-indigo-300 transition-all cursor-pointer group/btn shadow-2xs hover:shadow-xs"
                      >
                        <Sliders className="w-3 h-3 text-slate-400 group-hover/btn:text-indigo-600 transition-colors" />
                        <span className="font-bold">
                          {currentMetode === 'pembobotan' ? 'Bobot TP' : 'Rata-Rata'}
                        </span>
                        <span className="text-[10px] text-slate-300 group-hover/btn:text-indigo-300">•</span>
                        <span className="text-slate-600 font-mono text-[10px] group-hover/btn:text-indigo-600 font-semibold">
                          {isPakaiSas ? `${currentRasio.slm}:${currentRasio.sas}` : 'Tanpa SAS'}
                        </span>
                      </button>
                    </Tooltip>
                  </td>

                  {/* 5. Tampil Rapor */}
                  <td className="px-3 py-1.5 text-center">
                    <Tooltip content={m.tampilRapor ? "Ditampilkan di Rapor Siswa" : "Disembunyikan dari Rapor Siswa"} position="top">
                      <button 
                        onClick={() => handleUpdate(m.id, 'tampilRapor', !m.tampilRapor)}
                        className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${m.tampilRapor ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        role="switch"
                        aria-checked={m.tampilRapor}
                      >
                        <span className="sr-only">Tampil di Rapor</span>
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ease-in-out shadow-sm ${
                            m.tampilRapor ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </Tooltip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL PENGATURAN PENGOLAHAN NILAI RAPOR */}
      {editingAsesmenMapel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-400/20">
                  <Sliders size={18} />
                </span>
                <div>
                  <h3 className="font-bold text-sm">
                    Pengaturan Pengolahan Nilai Rapor
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {isGlobalBatchMode ? 'Pengaturan Serentak untuk Semua Mata Pelajaran' : `${editingAsesmenMapel.nama} (${editingAsesmenMapel.kode})`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingAsesmenMapel(null);
                  setIsGlobalBatchMode(false);
                  setApplyToAll(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Opsi Terapkan Serentak (Jika diedit dari baris spesifik) */}
              {!isGlobalBatchMode && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-indigo-950">
                    <input
                      type="checkbox"
                      checked={applyToAll}
                      onChange={(e) => setApplyToAll(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer accent-indigo-600"
                    />
                    <span>Terapkan skema pengolahan ini ke SEMUA mata pelajaran</span>
                  </label>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-150">
                    {mapel.length} Mapel
                  </span>
                </div>
              )}

              {/* 1. Tingkat 1: Pengolahan TP */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Tingkat 1: Pengolahan Antar-TP (NA-SLM)
                </label>
                <div className="space-y-2 text-xs">
                  {[
                    { val: 'rata-rata', label: 'Opsi 1: Rata-Rata SLM (Standar Baku)', desc: 'Materi terpisah/setara. Setiap TP memiliki bobot seimbang sesuai standar resmi rapor.' },
                    { val: 'pembobotan', label: 'Opsi 2: Pembobotan Inter-TP', desc: 'Materi berjenjang/kompleks. Guru memberi bobot spesifik per-TP (Total 100%).' }
                  ].map((opt) => (
                    <label 
                      key={opt.val} 
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        (editingAsesmenMapel.opsiPengolahan || 'rata-rata') === opt.val
                          ? 'border-indigo-500 bg-indigo-50/40 text-indigo-950 font-medium'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="modalOpsiPengolahan"
                        checked={(editingAsesmenMapel.opsiPengolahan || 'rata-rata') === opt.val}
                        onChange={() => {
                          setEditingAsesmenMapel({ ...editingAsesmenMapel, opsiPengolahan: opt.val as any });
                        }}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-xs">{opt.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 2. Tingkat 2: Rasio Komposit SAS */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2. Tingkat 2: Komposit Nilai Rapor (+ SAS)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <span>Sertakan Ujian SAS</span>
                    <input
                      type="checkbox"
                      checked={editingAsesmenMapel.pakaiSas !== false}
                      onChange={(e) => {
                        setEditingAsesmenMapel({ ...editingAsesmenMapel, pakaiSas: e.target.checked });
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </label>
                </div>

                {editingAsesmenMapel.pakaiSas !== false ? (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Pilihan Cepat Rasio:</span>
                      <div className="flex gap-1.5">
                        {[
                          { slm: 75, sas: 25, label: '75 : 25 (Standar)' },
                          { slm: 60, sas: 40, label: '60 : 40' },
                          { slm: 70, sas: 30, label: '70 : 30' },
                          { slm: 50, sas: 50, label: '50 : 50' }
                        ].map(preset => {
                          const isSelected = 
                            (editingAsesmenMapel.rasioSlmSas?.slm ?? 75) === preset.slm &&
                            (editingAsesmenMapel.rasioSlmSas?.sas ?? 25) === preset.sas;
                          return (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setEditingAsesmenMapel({ 
                                  ...editingAsesmenMapel, 
                                  rasioSlmSas: { slm: preset.slm, sas: preset.sas } 
                                });
                              }}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                                isSelected 
                                  ? 'bg-indigo-600 text-white shadow-2xs' 
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-white p-3 rounded-xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Bobot NA-SLM (%)
                        </label>
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editingAsesmenMapel.rasioSlmSas?.slm ?? 75}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                              setEditingAsesmenMapel({ 
                                ...editingAsesmenMapel, 
                                rasioSlmSas: { slm: val, sas: 100 - val } 
                              });
                            }}
                            className="w-16 text-center text-xl font-black text-indigo-600 border border-slate-200 rounded-lg py-0.5 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                          />
                          <span className="text-sm font-bold text-indigo-400">%</span>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Bobot Skor SAS (%)
                        </label>
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editingAsesmenMapel.rasioSlmSas?.sas ?? 25}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                              setEditingAsesmenMapel({ 
                                ...editingAsesmenMapel, 
                                rasioSlmSas: { slm: 100 - val, sas: val } 
                              });
                            }}
                            className="w-16 text-center text-xl font-black text-slate-700 border border-slate-200 rounded-lg py-0.5 focus:outline-none focus:border-indigo-500 bg-slate-50/50"
                          />
                          <span className="text-sm font-bold text-slate-400">%</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 font-mono text-center bg-white/70 py-1.5 px-2 rounded-lg border border-slate-100">
                      Rumus: NA Rapor = ({editingAsesmenMapel.rasioSlmSas?.slm ?? 75}% × NA-SLM) + ({editingAsesmenMapel.rasioSlmSas?.sas ?? 25}% × Skor SAS)
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800">
                    Mata pelajaran ini ditetapkan <strong>tanpa ujian SAS</strong>. Nilai Akhir Rapor murni 100% dari rata-rata sumatif lingkup materi (NA-SLM).
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {isGlobalBatchMode || applyToAll 
                  ? 'Akan memperbarui seluruh mapel secara serentak.' 
                  : 'Tersinkronisasi otomatis dengan Input Nilai.'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAsesmenMapel(null);
                    setIsGlobalBatchMode(false);
                    setApplyToAll(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalPengaturan}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition cursor-pointer"
                >
                  {isGlobalBatchMode || applyToAll ? 'Terapkan ke Semua Mapel' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
