import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { TujuanPembelajaran } from '@/types';
import Tooltip from '@/components/Tooltip';
import { 
  Plus, 
  Trash2, 
  Target, 
  Download, 
  Upload, 
  CheckCircle2, 
  GripVertical 
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TabTPEkskul() {
  const { state, updateState } = useAppStore();
  const { ekstrakurikuler } = state;
  const [selectedEkskul, setSelectedEkskul] = useState<string>('');
  const [selectedTpIds, setSelectedTpIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (ekstrakurikuler && ekstrakurikuler.length > 0 && !selectedEkskul) {
      setSelectedEkskul(ekstrakurikuler[0].id);
    }
  }, [ekstrakurikuler, selectedEkskul]);

  useEffect(() => {
    setSelectedTpIds([]);
  }, [selectedEkskul]);

  const tpEkskulList = state.tpEkskul || [];
  const currentEkskulTps = tpEkskulList.filter(tp => tp.mapelId === selectedEkskul);
  const activeEkskul = ekstrakurikuler?.find(e => e.id === selectedEkskul);

  const handleAdd = () => {
    if (!selectedEkskul) {
      showNotification("Pilih ekstrakurikuler terlebih dahulu.");
      return;
    }
    const newTp: TujuanPembelajaran = {
      id: 'tpeks_' + Date.now(),
      mapelId: selectedEkskul,
      kode: `TP.${activeEkskul?.kode || 'EKS'}.${currentEkskulTps.length + 1}`,
      deskripsi: 'Menunjukkan keterampilan dan penguasaan teknik dasar dalam kegiatan ekstrakurikuler.'
    };
    updateState('tpEkskul', [...tpEkskulList, newTp]);
    showNotification('Tujuan Pembelajaran berhasil ditambahkan!');
  };

  const handleUpdate = (id: string, field: keyof TujuanPembelajaran, value: string) => {
    updateState('tpEkskul', tpEkskulList.map(tp => 
      tp.id === id ? { ...tp, [field]: value } : tp
    ));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedTpIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const isAllSelected = currentEkskulTps.length > 0 && selectedTpIds.length === currentEkskulTps.length;
  const isSomeSelected = selectedTpIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedTpIds([]);
    } else {
      setSelectedTpIds(currentEkskulTps.map(tp => tp.id));
    }
  };

  const handleDeleteSelected = () => {
    const deletedTps = tpEkskulList.filter(tp => selectedTpIds.includes(tp.id));
    const newTrashItems = deletedTps.map(tp => ({
      id: 'trash_' + Date.now() + Math.random().toString(36).substring(2, 9),
      originalId: tp.id,
      type: 'tp-ekskul' as const,
      label: `TP Ekskul: ${tp.kode} - ${activeEkskul?.nama || 'Ekskul'}`,
      data: tp,
      deletedAt: new Date().toISOString()
    }));
    
    updateState('trash', [...(state.trash || []), ...newTrashItems]);
    updateState('tpEkskul', tpEkskulList.filter(tp => !selectedTpIds.includes(tp.id)));
    setSelectedTpIds([]);
    showNotification(`${deletedTps.length} TP berhasil dihapus.`);
  };

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const items = [...currentEkskulTps];
    const draggedItem = items.splice(dragItem.current, 1)[0];
    items.splice(dragOverItem.current, 0, draggedItem);

    // Merge back into state.tpEkskul preserving order of other ekskuls
    const otherEkskulTps = tpEkskulList.filter(tp => tp.mapelId !== selectedEkskul);
    updateState('tpEkskul', [...otherEkskulTps, ...items]);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDownloadTemplate = () => {
    if (!ekstrakurikuler || ekstrakurikuler.length === 0) {
      showNotification("Anda belum memiliki data Ekstrakurikuler.");
      return;
    }
    
    const workbook = XLSX.utils.book_new();
    
    ekstrakurikuler.forEach((e) => {
      const sheetName = e.kode.replace(/[\\/*?:[\]]/g, '').substring(0, 31) || `Ekskul-${e.id.substring(0,6)}`;
      
      const templateData = [
        { KODE_TP: `TP.${e.kode}.1`, DESKRIPSI_TP: `Mampu memahami konsep dasar dan disiplin dalam ${e.nama}` },
        { KODE_TP: `TP.${e.kode}.2`, DESKRIPSI_TP: `Mampu mempraktikkan keterampilan dan kerja sama dalam ${e.nama}` }
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
    const filename = `E-Rapor Edi Brata Template TP Ekstrakurikuler ${yyyy}${mm}${dd} ${hh}.${min}.${ss}.xlsx`;
    
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
          const matchedEkskul = ekstrakurikuler?.find(eks => {
            const expectedSheetName = eks.kode.replace(/[\\/*?:[\]]/g, '').substring(0, 31) || `Ekskul-${eks.id.substring(0,6)}`;
            return expectedSheetName.toLowerCase() === sheetName.toLowerCase() || eks.kode.toLowerCase() === sheetName.toLowerCase();
          });
          
          if (matchedEkskul) {
            const worksheet = workbook.Sheets[sheetName];
            const rows: any[] = XLSX.utils.sheet_to_json(worksheet);
            
            rows.forEach((row) => {
              const kodeTp = row['KODE_TP'] || row['Kode'] || row['kode'];
              const deskripsiTp = row['DESKRIPSI_TP'] || row['Deskripsi'] || row['deskripsi'];
              
              if (kodeTp && deskripsiTp) {
                newTps.push({
                  id: 'tpeks_' + Date.now() + '_' + (indexCounter++),
                  mapelId: matchedEkskul.id,
                  kode: String(kodeTp).trim(),
                  deskripsi: String(deskripsiTp).trim()
                });
              }
            });
          }
        });
        
        if (newTps.length > 0) {
          updateState('tpEkskul', [...tpEkskulList, ...newTps]);
          showNotification(`Berhasil mengimpor ${newTps.length} TP Ekstrakurikuler!`);
        } else {
          showNotification('Tidak ada baris data TP yang cocok dengan daftar ekstrakurikuler.');
        }
      } catch (err) {
        console.error("Gagal mengimpor file Excel", err);
        showNotification("Terjadi kesalahan saat memproses file Excel.");
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="w-full animate-in fade-in duration-200">
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
          <h3 className="font-bold text-sm text-slate-800">Tujuan Pembelajaran Ekstrakurikuler</h3>
          <p className="text-[11px] text-gray-500 mt-1">
            Kelola target kompetensi dan deskripsi capaian untuk setiap program ekstrakurikuler.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dropdown Selector Ekskul */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pilih Ekskul:</label>
            <select 
              value={selectedEkskul} 
              onChange={(e) => setSelectedEkskul(e.target.value)} 
              className="border border-indigo-200 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              {ekstrakurikuler?.map(e => (
                <option key={e.id} value={e.id}>
                  {e.nama} ({e.kode})
                </option>
              ))}
            </select>
          </div>
          
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
          <Tooltip content="Unduh Template Excel TP (Semua Ekskul)" position="bottom">
            <button 
              onClick={handleDownloadTemplate} 
              className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg shadow-sm border border-gray-200 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Tambah TP Baru Manual" position="bottom">
            <button 
              onClick={handleAdd} 
              className="w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedTpIds.length > 0 && (
        <div className="px-6 py-2.5 bg-gradient-to-r from-rose-50 via-rose-100/60 to-rose-50 border-t border-b border-rose-200 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
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
              onClick={handleDeleteSelected}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus yang Dipilih ({selectedTpIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Tabel TP Ekstrakurikuler */}
      <div className="overflow-auto bg-white rounded-b-2xl border-t border-gray-200" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#F8FAFC] text-slate-500 font-bold border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-2 py-2 w-8 text-center text-[10px] uppercase tracking-wider">
                <Tooltip content="Geser baris untuk mengubah urutan TP" position="bottom">
                  <GripVertical className="w-3.5 h-3.5 mx-auto text-slate-400" />
                </Tooltip>
              </th>
              <th className="px-2 py-2 w-8 text-center text-[10px] uppercase tracking-wider">
                <Tooltip content={isAllSelected ? "Batalkan pilihan semua" : "Pilih semua TP"} position="bottom">
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
              <th className="px-4 py-2 w-36 text-left text-[10px] uppercase tracking-wider">Kode TP</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider">Deskripsi Tujuan Pembelajaran (Capaian)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentEkskulTps.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <Target className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
                  <p className="font-semibold text-slate-500 text-xs">Belum ada Tujuan Pembelajaran untuk {activeEkskul?.nama || 'ekstrakurikuler ini'}.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Klik tombol "+" di atas untuk menambahkan TP secara manual atau import via Excel.</p>
                </td>
              </tr>
            ) : null}
            {currentEkskulTps.map((tp, i) => (
              <tr 
                key={tp.id} 
                draggable
                onDragStart={() => (dragItem.current = i)}
                onDragEnter={() => (dragOverItem.current = i)}
                onDragEnd={handleSort}
                onDragOver={(ev) => ev.preventDefault()}
                className={`hover:bg-slate-50/80 transition-colors group align-top ${selectedTpIds.includes(tp.id) ? 'bg-indigo-50/30' : ''}`}
              >
                {/* Drag Handler */}
                <td className="px-2 py-2 text-center text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-600">
                  <GripVertical className="w-3.5 h-3.5 mx-auto" />
                </td>

                {/* Checkbox */}
                <td className="px-2 py-2 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedTpIds.includes(tp.id)}
                    onChange={() => handleToggleSelect(tp.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer accent-indigo-600" 
                  />
                </td>

                {/* No */}
                <td className="px-3 py-2 text-center text-gray-400 font-mono text-[11px] pt-2.5">{i + 1}</td>

                {/* Kode TP */}
                <td className="px-4 py-1.5">
                  <input 
                    type="text" 
                    value={tp.kode || ''} 
                    onChange={(e) => handleUpdate(tp.id, 'kode', e.target.value)} 
                    className="w-full px-2 py-1 border border-transparent hover:border-gray-200 focus:border-indigo-400 rounded outline-none font-bold font-mono text-[11px] bg-transparent focus:bg-white transition-colors text-slate-800" 
                  />
                </td>

                {/* Deskripsi TP */}
                <td className="px-4 py-1.5">
                  <textarea 
                    value={tp.deskripsi || ''} 
                    onChange={(e) => handleUpdate(tp.id, 'deskripsi', e.target.value)} 
                    className="w-full px-2 py-1.5 border border-transparent hover:border-gray-200 focus:border-indigo-400 rounded outline-none text-[12px] bg-transparent focus:bg-white transition-colors text-slate-700 resize-y min-h-[34px] leading-relaxed block font-medium" 
                    rows={1} 
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Statistik */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">
            Total TP untuk <b className="text-indigo-900">{activeEkskul?.nama || 'Ekskul Terpilih'}</b>:
          </span>
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-bold text-[11px]">
            {currentEkskulTps.length} TP
          </span>
        </div>
        <div className="text-[11px] text-slate-400 italic">
          * Seluruh penyesuaian tersimpan otomatis ke sistem.
        </div>
      </div>
    </div>
  );
}
