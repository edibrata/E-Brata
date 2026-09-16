import React, { useState, useRef } from 'react';
import { useAppStore } from '@/store';
import { Mapel } from '@/types';
import { Plus, Trash2, GripVertical, Upload, Download, Book } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DataMapel() {
  const { state, updateState } = useAppStore();
  const { mapel } = state;
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newMapelData, setNewMapelData] = useState<Partial<Mapel>>({
    kode: '',
    nama: '',
    kelompok: 'Pokok'
  });

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
            tampilRapor: String(tampil).trim().toLowerCase() === 'disembunyikan' ? false : true
          });
        }
      });

      if (newMapels.length > 0) {
        updateState('mapel', [...mapel, ...newMapels]);
      }
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddMapel = () => {
    if (!newMapelData.nama || !newMapelData.kode) {
      // using simple return instead of alert which is blocked in iframe
      return;
    }
    
    const newMapel: Mapel = {
      id: 'm' + Date.now(),
      nama: newMapelData.nama,
      kode: newMapelData.kode,
      kelompok: newMapelData.kelompok || 'Pokok',
      tampilRapor: true
    };
    updateState('mapel', [...mapel, newMapel]);
    setNewMapelData({ kode: '', nama: '', kelompok: 'Pokok' });
    setIsAddingMode(false);
  };

  const handleUpdate = (id: string, field: keyof Mapel, value: string | boolean) => {
    updateState('mapel', mapel.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === mapel.length) {
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
      <div className="px-6 py-5 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-slate-800">Manajemen Mata Pelajaran</h3>
          <p className="text-[11px] text-gray-500 mt-1">Kelola daftar mata pelajaran resmi. Penyeragaman kode akan disebarkan otomatis ke seluruh nilai murid.</p>
        </div>
        <div className="flex flex-row gap-2 mt-4 sm:mt-0">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={handleImportClick} 
            className="w-8 h-8 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg shadow-sm border border-emerald-200 transition focus:outline-none group/tooltip relative"
          >
            <Upload className="w-4 h-4" />
            <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 top-full mt-1.5 right-0 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-top-1 before:right-3 before:border-4 before:border-transparent before:border-b-slate-800">
              Import Excel
            </span>
          </button>
          <button 
            onClick={handleDownloadTemplate} 
            className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg shadow-sm border border-gray-200 transition focus:outline-none group/tooltip relative"
          >
            <Download className="w-4 h-4" />
            <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 top-full mt-1.5 right-0 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-top-1 before:right-3 before:border-4 before:border-transparent before:border-b-slate-800">
              Template Excel
            </span>
          </button>
          <button 
            onClick={() => setIsAddingMode(!isAddingMode)} 
            className="w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition group/tooltip relative"
          >
            <Plus className="w-4 h-4" />
            <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 top-full mt-1.5 right-0 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-top-1 before:right-3 before:border-4 before:border-transparent before:border-b-slate-800">
              Tambah Mata Pelajaran
            </span>
          </button>
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
        <div className="bg-slate-50/80 border-b border-slate-100 px-6 py-3 flex items-center justify-between animate-in fade-in duration-200">
          <span className="text-slate-950 font-bold text-sm">{selectedIds.length} mata pelajaran terpilih</span>
          <button 
            onClick={handleDeleteSelected}
            className="flex items-center gap-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Hapus Terpilih
          </button>
        </div>
      )}

      <div className="overflow-auto bg-white rounded-b-2xl border-t border-gray-200" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#F8FAFC] text-slate-500 font-bold border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-3 py-2 w-10 text-center">
                <input 
                  type="checkbox" 
                  checked={mapel.length > 0 && selectedIds.length === mapel.length}
                  onChange={handleToggleSelectAll}
                  className="rounded border-gray-300 text-slate-900 focus:ring-slate-500 w-3.5 h-3.5 cursor-pointer" 
                />
              </th>
              <th className="px-2 py-2 w-10 text-center text-[10px] uppercase tracking-wider">Geser</th>
              <th className="px-3 py-2 w-12 text-center text-[10px] uppercase tracking-wider">No</th>
              <th className="px-4 py-2 w-32 text-left text-[10px] uppercase tracking-wider">Kode Mapel</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider">Nama Mata Pelajaran</th>
              <th className="px-4 py-2 w-40 text-center text-[10px] uppercase tracking-wider">Kelompok</th>
              <th className="px-4 py-2 w-32 text-center text-[10px] uppercase tracking-wider">Tampil Rapor?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mapel.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Belum ada data mata pelajaran</td></tr>
            ) : null}
            {mapel.map((m, i) => (
              <tr 
                key={m.id} 
                draggable
                onDragStart={() => (dragItem.current = i)}
                onDragEnter={() => (dragOverItem.current = i)}
                onDragEnd={handleSort}
                onDragOver={(e) => e.preventDefault()}
                className={`hover:bg-slate-50/80 transition-colors group ${selectedIds.includes(m.id) ? 'bg-slate-50/30' : ''}`}
              >
                <td className="px-3 py-1.5 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(m.id)}
                    onChange={() => handleToggleSelect(m.id)}
                    className="rounded border-gray-300 text-slate-900 focus:ring-slate-500 w-3.5 h-3.5 cursor-pointer" 
                  />
                </td>
                <td className="px-2 py-1.5 text-center text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500">
                  <GripVertical className="w-3.5 h-3.5 mx-auto" />
                </td>
                <td className="px-3 py-1.5 text-center text-gray-400 font-mono text-[11px]">{i + 1}</td>
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
                <td className="px-4 py-1.5 text-center">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
