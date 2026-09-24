import React, { useState, useRef } from 'react';
import { useAppStore } from '@/store';
import { Ekstrakurikuler } from '@/types';
import Tooltip from '@/components/Tooltip';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Upload, 
  Download, 
  Medal, 
  CheckCircle2, 
  Check, 
  X 
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TabManajemenEkskul() {
  const { state, updateState } = useAppStore();
  const ekstrakurikuler = state.ekstrakurikuler || [];
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const [newEkskulData, setNewEkskulData] = useState<Partial<Ekstrakurikuler>>({
    kode: '',
    nama: '',
    jenis: 'Wajib',
    tampilRapor: true
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
    const _ekskul = [...ekstrakurikuler];
    const draggedItemContent = _ekskul.splice(dragItem.current, 1)[0];
    _ekskul.splice(dragOverItem.current, 0, draggedItemContent);
    updateState('ekstrakurikuler', _ekskul);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { KODE_EKSKUL: 'pramuka', NAMA_EKSTRAKURIKULER: 'Pendidikan Kepramukaan', JENIS: 'Wajib', TAMPIL_RAPOR: 'Aktif' },
      { KODE_EKSKUL: 'pmr', NAMA_EKSTRAKURIKULER: 'Palang Merah Remaja', JENIS: 'Pilihan', TAMPIL_RAPOR: 'Aktif' },
      { KODE_EKSKUL: 'futsal', NAMA_EKSTRAKURIKULER: 'Futsal & Sepak Bola', JENIS: 'Pilihan', TAMPIL_RAPOR: 'Aktif' }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Ekstrakurikuler");
    
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const filename = `E-Rapor Edi Brata Template Ekstrakurikuler ${yyyy}${mm}${dd} ${hh}.${min}.${ss}.xlsx`;
    
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
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        const newEkskuls: Ekstrakurikuler[] = [];
        
        rows.forEach((row, index) => {
          const kode = row['KODE_EKSKUL'] || row['Kode'] || row['kode'];
          const nama = row['NAMA_EKSTRAKURIKULER'] || row['Nama'] || row['nama'];
          const jenis = row['JENIS'] || row['Jenis'] || row['jenis'];
          const tampil = row['TAMPIL_RAPOR'] || row['Tampil'] || row['tampil'];
          
          if (kode && nama) {
            newEkskuls.push({
              id: 'eks_' + Date.now() + '_' + index,
              kode: String(kode).trim(),
              nama: String(nama).trim(),
              jenis: String(jenis).trim().toLowerCase() === 'wajib' ? 'Wajib' : 'Pilihan',
              tampilRapor: tampil ? String(tampil).toLowerCase() !== 'nonaktif' : true
            });
          }
        });

        if (newEkskuls.length > 0) {
          updateState('ekstrakurikuler', [...ekstrakurikuler, ...newEkskuls]);
          showNotification(`Berhasil mengimpor ${newEkskuls.length} ekstrakurikuler!`);
        } else {
          showNotification('Tidak ada data ekstrakurikuler yang valid pada file Excel.');
        }
      } catch (err) {
        console.error("Gagal mengimpor data", err);
        showNotification('Terjadi kesalahan saat membaca file Excel.');
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddEkskul = () => {
    if (!newEkskulData.nama || !newEkskulData.kode) {
      showNotification('Kode dan Nama Ekstrakurikuler wajib diisi!');
      return;
    }
    
    const newEkskul: Ekstrakurikuler = {
      id: 'eks_' + Date.now(),
      nama: newEkskulData.nama.trim(),
      kode: newEkskulData.kode.trim(),
      jenis: newEkskulData.jenis || 'Wajib',
      tampilRapor: newEkskulData.tampilRapor !== false
    };
    updateState('ekstrakurikuler', [...ekstrakurikuler, newEkskul]);
    setNewEkskulData({ kode: '', nama: '', jenis: 'Wajib', tampilRapor: true });
    setIsAddingMode(false);
    showNotification('Ekstrakurikuler berhasil ditambahkan!');
  };

  const handleUpdate = (id: string, field: keyof Ekstrakurikuler, value: any) => {
    updateState('ekstrakurikuler', ekstrakurikuler.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const isAllSelected = ekstrakurikuler.length > 0 && selectedIds.length === ekstrakurikuler.length;
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ekstrakurikuler.map(e => e.id));
    }
  };

  const handleDeleteSelected = () => {
    const deletedEkskuls = ekstrakurikuler.filter(e => selectedIds.includes(e.id));
    const newTrashItems = deletedEkskuls.map(e => ({
      id: 'trash_' + Date.now() + Math.random().toString(36).substring(2, 9),
      originalId: e.id,
      type: 'ekskul' as const,
      label: `Ekstrakurikuler: ${e.nama} (${e.kode})`,
      data: e,
      deletedAt: new Date().toISOString()
    }));
    
    updateState('trash', [...(state.trash || []), ...newTrashItems]);
    const newEkskulArray = ekstrakurikuler.filter(e => !selectedIds.includes(e.id));
    updateState('ekstrakurikuler', newEkskulArray);
    setSelectedIds([]);
    showNotification(`${deletedEkskuls.length} ekstrakurikuler berhasil dihapus.`);
  };

  // Statistik Ekstrakurikuler
  const countWajib = ekstrakurikuler.filter(e => e.jenis === 'Wajib').length;
  const countPilihan = ekstrakurikuler.filter(e => e.jenis === 'Pilihan').length;
  const countTampil = ekstrakurikuler.filter(e => e.tampilRapor !== false).length;

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
          <h3 className="font-bold text-sm text-slate-800">Manajemen Ekstrakurikuler</h3>
          <p className="text-[11px] text-gray-500 mt-1">
            Kelola daftar program kegiatan ekstrakurikuler sekolah dan status tampil di rapor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
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
          <Tooltip content="Unduh Template Excel Ekstrakurikuler" position="bottom">
            <button 
              onClick={handleDownloadTemplate} 
              className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg shadow-sm border border-gray-200 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Tambah Ekstrakurikuler Baru" position="bottom">
            <button 
              onClick={() => setIsAddingMode(!isAddingMode)} 
              className="w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>
      
      {/* Form Penambahan Ekstrakurikuler */}
      {isAddingMode && (
        <div className="bg-slate-50 border-b border-gray-200 p-6 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold text-sm">
            <Medal className="w-4 h-4 text-indigo-600" /> Form Penambahan Ekstrakurikuler Baru
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-1/4">
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">Kode Ekskul (Unik)</label>
              <input
                type="text"
                value={newEkskulData.kode || ''}
                onChange={(e) => setNewEkskulData({ ...newEkskulData, kode: e.target.value })}
                placeholder="misal: pramuka, pmr"
                className="w-full border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-slate-700"
              />
            </div>
            <div className="w-full md:w-2/4">
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">Nama Ekstrakurikuler</label>
              <input
                type="text"
                value={newEkskulData.nama || ''}
                onChange={(e) => setNewEkskulData({ ...newEkskulData, nama: e.target.value })}
                placeholder="contoh: Pendidikan Kepramukaan"
                className="w-full border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700"
              />
            </div>
            <div className="w-full md:w-1/4">
              <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5 tracking-wider">Kategori / Jenis</label>
              <select
                value={newEkskulData.jenis || 'Wajib'}
                onChange={(e) => setNewEkskulData({ ...newEkskulData, jenis: e.target.value as 'Wajib' | 'Pilihan' })}
                className="w-full border border-gray-300 rounded-lg bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-semibold"
              >
                <option value="Wajib">Wajib</option>
                <option value="Pilihan">Pilihan</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={newEkskulData.tampilRapor !== false}
                onChange={(e) => setNewEkskulData({ ...newEkskulData, tampilRapor: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer accent-indigo-600"
              />
              <span>Tampilkan di Lembar Rapor</span>
            </label>

            <div className="flex gap-2">
              <button 
                onClick={() => setIsAddingMode(false)} 
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={handleAddEkskul} 
                className="px-4 py-2 bg-indigo-600 rounded-lg text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Simpan Ekskul
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="px-6 py-2.5 bg-gradient-to-r from-rose-50 via-rose-100/60 to-rose-50 border-t border-b border-rose-200 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
              {selectedIds.length}
            </span>
            <span className="font-bold text-rose-950">
              {selectedIds.length} ekstrakurikuler dipilih
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

      {/* Tabel Ekstrakurikuler */}
      <div className="overflow-auto bg-white rounded-b-2xl border-t border-gray-200" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#F8FAFC] text-slate-500 font-bold border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-2 py-2 w-8 text-center text-[10px] uppercase tracking-wider">
                <Tooltip content="Geser baris untuk mengubah urutan ekstrakurikuler" position="bottom">
                  <GripVertical className="w-3.5 h-3.5 mx-auto text-slate-400" />
                </Tooltip>
              </th>
              <th className="px-2 py-2 w-8 text-center text-[10px] uppercase tracking-wider">
                <Tooltip content={isAllSelected ? "Batalkan pilihan semua" : "Pilih semua ekstrakurikuler"} position="bottom">
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
              <th className="px-4 py-2 w-36 text-left text-[10px] uppercase tracking-wider">Kode Ekskul</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider">Nama Ekstrakurikuler</th>
              <th className="px-4 py-2 w-36 text-center text-[10px] uppercase tracking-wider">Kategori</th>
              <th className="px-4 py-2 w-32 text-center text-[10px] uppercase tracking-wider">Status Rapor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ekstrakurikuler.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  <Medal className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
                  <p className="font-semibold text-slate-500 text-xs">Belum ada data ekstrakurikuler.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Klik tombol "+ Tambah Ekstrakurikuler Baru" atau Import Excel di atas.</p>
                </td>
              </tr>
            ) : null}
            {ekstrakurikuler.map((e, i) => (
              <tr 
                key={e.id} 
                draggable
                onDragStart={() => (dragItem.current = i)}
                onDragEnter={() => (dragOverItem.current = i)}
                onDragEnd={handleSort}
                onDragOver={(ev) => ev.preventDefault()}
                className={`hover:bg-slate-50/80 transition-colors group ${selectedIds.includes(e.id) ? 'bg-indigo-50/30' : ''}`}
              >
                {/* Drag Handler */}
                <td className="px-2 py-1.5 text-center text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-600">
                  <GripVertical className="w-3.5 h-3.5 mx-auto" />
                </td>

                {/* Checkbox */}
                <td className="px-2 py-1.5 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(e.id)}
                    onChange={() => handleToggleSelect(e.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer accent-indigo-600" 
                  />
                </td>

                {/* No */}
                <td className="px-3 py-1.5 text-center text-gray-400 font-mono text-[11px]">{i + 1}</td>

                {/* Kode Ekskul */}
                <td className="px-4 py-1.5">
                  <input
                    type="text"
                    value={e.kode || ''}
                    onChange={(ev) => handleUpdate(e.id, 'kode', ev.target.value)}
                    placeholder="kode"
                    className="w-full px-2 py-1 border border-transparent hover:border-gray-200 focus:border-indigo-400 rounded outline-none font-bold font-mono text-[11px] bg-transparent focus:bg-white transition-colors text-slate-800"
                  />
                </td>

                {/* Nama Ekstrakurikuler */}
                <td className="px-4 py-1.5">
                  <input
                    type="text"
                    value={e.nama || ''}
                    onChange={(ev) => handleUpdate(e.id, 'nama', ev.target.value)}
                    placeholder="Nama Ekstrakurikuler"
                    className="w-full px-2 py-1 border border-transparent hover:border-gray-200 focus:border-indigo-400 rounded outline-none font-bold text-[12px] bg-transparent focus:bg-white transition-colors text-slate-800"
                  />
                </td>

                {/* Kategori / Jenis (Wajib / Pilihan) */}
                <td className="px-4 py-1.5 text-center">
                  <select
                    value={e.jenis || 'Wajib'}
                    onChange={(ev) => handleUpdate(e.id, 'jenis', ev.target.value)}
                    className={`px-2.5 py-1 rounded-full border text-[11px] font-bold cursor-pointer transition-colors text-center outline-none ${
                      e.jenis === 'Wajib' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <option value="Wajib">Wajib</option>
                    <option value="Pilihan">Pilihan</option>
                  </select>
                </td>

                {/* Status Rapor Toggle */}
                <td className="px-4 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => handleUpdate(e.id, 'tampilRapor', e.tampilRapor === false ? true : false)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-all cursor-pointer ${
                      e.tampilRapor !== false
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {e.tampilRapor !== false ? (
                      <>
                        <Check className="w-3 h-3 text-indigo-600" />
                        <span>Aktif</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 text-slate-400" />
                        <span>Nonaktif</span>
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Statistik */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-700">Total: <b className="text-slate-900">{ekstrakurikuler.length}</b> Ekstrakurikuler</span>
          <span className="text-slate-300">|</span>
          <span className="text-blue-700 font-medium">Wajib: <b>{countWajib}</b></span>
          <span className="text-emerald-700 font-medium">Pilihan: <b>{countPilihan}</b></span>
          <span className="text-slate-300">|</span>
          <span className="text-indigo-700 font-medium">Tampil Rapor: <b>{countTampil}</b></span>
        </div>
        <div className="text-[11px] text-slate-400 italic">
          * Seluruh perubahan tersimpan otomatis ke sistem.
        </div>
      </div>
    </div>
  );
}
