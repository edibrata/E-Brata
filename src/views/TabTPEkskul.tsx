import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store';
import { TujuanPembelajaran } from '@/types';
import { Plus, Trash2, Target, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TabTPEkskul() {
  const { state, updateState } = useAppStore();
  const { ekstrakurikuler } = state;
  const [selectedEkskul, setSelectedEkskul] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ekstrakurikuler && ekstrakurikuler.length > 0 && !selectedEkskul) {
      setSelectedEkskul(ekstrakurikuler[0].id);
    }
  }, [ekstrakurikuler, selectedEkskul]);

  const tpEkskulList = state.tpEkskul || [];
  const tps = tpEkskulList.filter(tp => tp.mapelId === selectedEkskul);
  const activeEkskul = ekstrakurikuler?.find(e => e.id === selectedEkskul);

  const handleAdd = () => {
    if (!selectedEkskul) {
      alert("Pilih ekstrakurikuler terlebih dahulu.");
      return;
    }
    const newTp: TujuanPembelajaran = {
      id: 'tpeks' + Date.now(),
      mapelId: selectedEkskul,
      kode: `TP.${activeEkskul?.kode || 'X'}.${tps.length + 1}`,
      deskripsi: 'Deskripsi TP Ekstrakurikuler baru...'
    };
    updateState('tpEkskul', [...tpEkskulList, newTp]);
  };

  const handleUpdate = (id: string, field: keyof TujuanPembelajaran, value: string) => {
    updateState('tpEkskul', tpEkskulList.map(tp => 
      tp.id === id ? { ...tp, [field]: value } : tp
    ));
  };

  const handleDelete = (id: string) => {
    const tpToDelete = tpEkskulList.find(tp => tp.id === id);
    if (tpToDelete) {
      const newTrashItem = {
        id: 'trash_' + Date.now() + Math.random().toString(36).substring(2, 9),
        originalId: tpToDelete.id,
        type: 'tp-ekskul' as const,
        label: `TP Ekskul ${tpToDelete.kode} - ${activeEkskul?.nama || 'Ekskul'}`,
        data: tpToDelete,
        deletedAt: new Date().toISOString()
      };
      updateState('trash', [...(state.trash || []), newTrashItem]);
    }
    updateState('tpEkskul', tpEkskulList.filter(tp => tp.id !== id));
  };

  const handleDownloadTemplate = () => {
    if (!ekstrakurikuler || ekstrakurikuler.length === 0) {
      alert("Anda belum memiliki data Ekstrakurikuler.");
      return;
    }
    
    const workbook = XLSX.utils.book_new();
    
    ekstrakurikuler.forEach((e) => {
      // Safe sheet name (max 31 chars, forbidden chars removed)
      const sheetName = e.kode.replace(/[\\/*?:[\]]/g, '').substring(0, 31) || `Ekskul-${e.id.substring(0,6)}`;
      
      const templateData = [
        { KODE_TP: `TP.${e.kode}.1`, DESKRIPSI_TP: `Mampu memahami dasar-dasar ${e.nama}` },
        { KODE_TP: `TP.${e.kode}.2`, DESKRIPSI_TP: `Mampu mempraktekkan keterampilan ${e.nama}` }
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
          // Find matching ekstrakurikuler by kode
          const matchedEkskul = ekstrakurikuler?.find(eks => {
            const expectedSheetName = eks.kode.replace(/[\\/*?:[\]]/g, '').substring(0, 31) || `Ekskul-${eks.id.substring(0,6)}`;
            return expectedSheetName === sheetName;
          });
          
          if (matchedEkskul) {
            const worksheet = workbook.Sheets[sheetName];
            const rows: any[] = XLSX.utils.sheet_to_json(worksheet);
            
            rows.forEach((row) => {
              const kodeTp = row['KODE_TP'];
              const deskripsiTp = row['DESKRIPSI_TP'];
              
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
      <div className="px-6 py-5 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-4 h-4 text-slate-900" />
            Tujuan Pembelajaran Ekstrakurikuler
          </h1>
          <p className="text-[11px] text-slate-500 mt-1">Kelola data Tujuan Pembelajaran (TP) untuk setiap ekstrakurikuler.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ekskul:</label>
            <select 
              value={selectedEkskul} 
              onChange={(e) => setSelectedEkskul(e.target.value)} 
              className="border border-slate-200 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/20 cursor-pointer"
            >
              {ekstrakurikuler?.map(e => (
                <option key={e.id} value={e.id}>{e.nama}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
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
                Import Excel (Multi-Sheet)
              </span>
            </button>
            <button 
              onClick={handleDownloadTemplate} 
              className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg shadow-sm border border-gray-200 transition focus:outline-none group/tooltip relative"
            >
              <Download className="w-4 h-4" />
              <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 top-full mt-1.5 right-0 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-top-1 before:right-3 before:border-4 before:border-transparent before:border-b-slate-800">
                Template Excel (Semua Ekskul)
              </span>
            </button>
            <button 
              onClick={handleAdd} 
              className="w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition group/tooltip relative"
            >
              <Plus className="w-4 h-4" />
              <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 top-full mt-1.5 right-0 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-top-1 before:right-3 before:border-4 before:border-transparent before:border-b-slate-800">
                Tambah TP Manual
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-auto bg-white rounded-b-2xl border-t border-gray-200" style={{ maxHeight: 'calc(100vh - 250px)' }}>
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#F8FAFC] text-slate-500 font-bold border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-2 w-12 text-center text-[10px] uppercase tracking-wider">No</th>
              <th className="px-4 py-2 w-40 text-left text-[10px] uppercase tracking-wider">Kode TP</th>
              <th className="px-4 py-2 text-left text-[10px] uppercase tracking-wider">Deskripsi Tujuan Pembelajaran</th>
              <th className="px-4 py-2 w-20 text-center text-[10px] uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tps.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                  Belum ada Tujuan Pembelajaran untuk ekstrakurikuler ini. Silakan klik Tambah TP.
                </td>
              </tr>
            ) : null}
            {tps.map((tp, i) => (
              <tr key={tp.id} className="hover:bg-slate-50/80 transition-colors group align-top">
                <td className="px-4 py-2 text-center text-gray-400 font-mono text-[11px] pt-3">{i + 1}</td>
                <td className="px-4 py-1.5">
                  <input 
                    type="text" 
                    value={tp.kode || ''} 
                    onChange={(e) => handleUpdate(tp.id, 'kode', e.target.value)} 
                    className="w-full px-2 py-1.5 border border-transparent hover:border-gray-200 focus:border-indigo-400 rounded outline-none font-bold font-mono text-[11px] bg-transparent focus:bg-white transition-colors text-slate-800" 
                  />
                </td>
                <td className="px-4 py-1.5">
                  <textarea 
                    value={tp.deskripsi || ''} 
                    onChange={(e) => handleUpdate(tp.id, 'deskripsi', e.target.value)} 
                    className="w-full px-2 py-1.5 border border-transparent hover:border-gray-200 focus:border-indigo-400 rounded outline-none text-[12px] bg-transparent focus:bg-white transition-colors text-slate-700 resize-y min-h-[34px] leading-relaxed block" 
                    rows={1} 
                  />
                </td>
                <td className="px-4 py-1.5 text-center pt-2">
                  <button 
                    onClick={() => handleDelete(tp.id)} 
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors mx-auto opacity-0 group-hover:opacity-100 focus-within:opacity-100 group/tooltip relative focus:outline-none block"
                  >
                    <Trash2 size={15} />
                    <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-bottom-1 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-slate-800">
                      Hapus TP
                    </span>
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
