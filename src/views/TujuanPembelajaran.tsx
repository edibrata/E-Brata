import { KriteriaKetuntasan } from '../components/KriteriaKetuntasan';
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
import { Plus, Trash2, Target, Download, Upload, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TujuanPembelajaranView() {
  const { state, updateState } = useAppStore();
  const { mapel } = state;
  const [selectedMapel, setSelectedMapel] = useState<string>('');
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);
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

  const handleAdd = () => {
    if (!selectedMapel) {
      alert("Pilih mata pelajaran terlebih dahulu.");
      return;
    }
    const newTp: TujuanPembelajaran = {
      id: 'tp' + Date.now(),
      mapelId: selectedMapel,
      kode: `TP.${activeMapel?.kode || 'X'}.${tps.length + 1}`,
      deskripsi: 'Deskripsi TP baru...'
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

    if (!isPancasila && !isInggris && !isIndonesia && !isMatematika && !isIpas && !isPjok && !isKka && !isSeniRupa && !isSeniMusik && !isSeniTeater && !isSeniTari) {
      showNotif("Maaf, muat TP otomatis saat ini baru tersedia untuk mapel: Pancasila, B. Inggris, B. Indonesia, Matematika, IPAS, PJOK, KKA, Seni Rupa, Seni Musik, Seni Teater, dan Seni Tari.", "error");
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
              className="border border-slate-200 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/20 cursor-pointer"
            >
              {mapel.map(m => (
                <option key={m.id} value={m.id}>{m.nama}</option>
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
                Template Excel (Semua Mapel)
              </span>
            </button>
            <button 
              onClick={handleGenerateDefaultTp} 
              className="w-8 h-8 flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg shadow-sm border border-amber-200 transition focus:outline-none group/tooltip relative"
            >
              <Sparkles className="w-4 h-4" />
              <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 top-full mt-1.5 right-0 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-top-1 before:right-3 before:border-4 before:border-transparent before:border-b-slate-800">
                Muat TP Default
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
      {selectedMapel && <KriteriaKetuntasan mapelId={selectedMapel} />}
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
                  Belum ada Tujuan Pembelajaran untuk mata pelajaran ini. Silakan klik Tambah TP.
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
