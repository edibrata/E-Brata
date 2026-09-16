import { useAppStore } from '@/store';
import { 
  FileText, Calendar, School, Users, 
  MapPin, Percent, Info, Save, RotateCcw,
  Download, Upload, FileJson, CheckCircle2,
  AlertCircle, Lock, Settings, Image
} from 'lucide-react';
import React, { useState, useRef } from 'react';
import { INITIAL_STATE } from '@/constants';
import * as XLSX from 'xlsx';

export default function DataSekolah() {
  const { state, updateSekolah } = useAppStore();
  const { sekolah } = state;

  const [activeTab, setActiveTab] = useState<'profil' | 'akademik' | 'guru' | 'output' | 'aplikasi'>('profil');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  
  const excelInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, isSuccess: boolean = true) => {
    setToastMessage(message);
    setToastType(isSuccess ? 'success' : 'error');
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Logic for Bobot Sumatif
    if (name === 'bobotSumatifLingkup') {
      let val: number | '' = value === '' ? '' : parseInt(value, 10);
      if (typeof val === 'number' && !isNaN(val)) {
        if (val > 100) val = 100;
        if (val < 0) val = 0;
        updateSekolah({
          bobotSumatifLingkup: val,
          bobotSumatifSemester: 100 - val
        });
      } else if (value === '') {
        updateSekolah({ bobotSumatifLingkup: '', bobotSumatifSemester: '' });
      }
    } else if (name === 'bobotSumatifSemester') {
      let val: number | '' = value === '' ? '' : parseInt(value, 10);
      if (typeof val === 'number' && !isNaN(val)) {
        if (val > 100) val = 100;
        if (val < 0) val = 0;
        updateSekolah({
          bobotSumatifSemester: val,
          bobotSumatifLingkup: 100 - val
        });
      } else if (value === '') {
        updateSekolah({ bobotSumatifSemester: '', bobotSumatifLingkup: '' });
      }
    } else if (name === 'kelas') {
      const num = parseInt(value, 10);
      let calculatedFase = '';
      if (num === 1 || num === 2) calculatedFase = 'A';
      else if (num === 3 || num === 4) calculatedFase = 'B';
      else if (num === 5 || num === 6) calculatedFase = 'C';
      
      updateSekolah({ kelas: value, fase: calculatedFase });
    } else {
      updateSekolah({ [name]: value });
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran gambar maksimal 2MB', false);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSekolah({ [name]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const requiredFields = [
    { name: 'tahunAjaran', label: 'Tahun Ajaran', tab: 'akademik' },
    { name: 'semester', label: 'Semester', tab: 'akademik' },
    { name: 'kelas', label: 'Kelas', tab: 'akademik' },
    { name: 'ruangRombel', label: 'Ruang Rombel', tab: 'akademik' },
    { name: 'nama', label: 'Nama Lengkap Sekolah', tab: 'profil' },
    { name: 'npsn', label: 'NPSN', tab: 'profil' },
    { name: 'nss', label: 'Nomor Statistik Sekolah (NSS)', tab: 'profil' },
    { name: 'nis', label: 'Nomor Induk Sekolah (NIS)', tab: 'profil' },
    { name: 'alamat', label: 'Alamat Lengkap', tab: 'profil' },
    { name: 'desaKelurahanJenis', label: 'Jenis Desa/Kelurahan', tab: 'profil' },
    { name: 'desaKelurahanNama', label: 'Nama Desa/Kelurahan', tab: 'profil' },
    { name: 'kecamatan', label: 'Kecamatan', tab: 'profil' },
    { name: 'kabupatenKotaJenis', label: 'Jenis Kabupaten/Kota', tab: 'profil' },
    { name: 'kabupatenKotaNama', label: 'Nama Kabupaten/Kota', tab: 'profil' },
    { name: 'provinsi', label: 'Provinsi', tab: 'profil' },
    { name: 'kodePos', label: 'Kode Pos', tab: 'profil' },
    { name: 'kepsek', label: 'Nama Kepala Sekolah', tab: 'guru' },
    { name: 'nipKepsek', label: 'NIP Kepala Sekolah', tab: 'guru' },
    { name: 'waKepalaSekolah', label: 'WhatsApp Kepala Sekolah', tab: 'guru' },
    { name: 'waliKelas', label: 'Nama Guru Kelas', tab: 'guru' },
    { name: 'nipWaliKelas', label: 'NIP Guru Kelas', tab: 'guru' },
    { name: 'waGuru', label: 'WhatsApp Guru', tab: 'guru' },
    { name: 'lokasiTitimangsa', label: 'Lokasi Titimangsa', tab: 'output' },
    { name: 'tanggalBiodata', label: 'Tanggal Biodata', tab: 'output' },
    { name: 'tanggalRapor', label: 'Tanggal Rapor', tab: 'output' }
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    const emptyLabels: string[] = [];
    let firstErrorTab = '';

    requiredFields.forEach(field => {
      const val = sekolah[field.name as keyof typeof sekolah] as string | undefined;
      if (!val || val.toString().trim() === '') {
        newErrors[field.name] = true;
        emptyLabels.push(field.label);
        if (!firstErrorTab) firstErrorTab = field.tab;
      }
    });

    if (emptyLabels.length > 0) {
      setErrors(newErrors);
      showToast('Terdapat isian yang masih kosong. Silakan periksa kolom dengan garis merah.', false);
      if (firstErrorTab) setActiveTab(firstErrorTab as any);
      
      setTimeout(() => {
        const firstErrorField = requiredFields.find(f => newErrors[f.name]);
        if (firstErrorField) {
          const el = document.getElementById(firstErrorField.name);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus();
          }
        }
      }, 100);
    } else {
      setErrors({});
    }
  };

  // --- EXPORT & IMPORT LOGIC ---
  const excelMap = [
    { key: 'tahunAjaran', header: 'Tahun Ajaran' },
    { key: 'semester', header: 'Semester' },
    { key: 'nama', header: 'Nama Sekolah' },
    { key: 'npsn', header: 'NPSN' },
    { key: 'nss', header: 'Nomor Statistik Sekolah' },
    { key: 'nis', header: 'Nomor Induk Sekolah' },
    { key: 'alamat', header: 'Alamat' },
    { key: 'desaKelurahanJenis', header: 'Desa/Kelurahan Jenis' },
    { key: 'desaKelurahanNama', header: 'Desa/Kelurahan Nama' },
    { key: 'kecamatan', header: 'Kecamatan' },
    { key: 'kabupatenKotaJenis', header: 'Kabupaten/Kota Jenis' },
    { key: 'kabupatenKotaNama', header: 'Kabupaten/Kota Nama' },
    { key: 'provinsi', header: 'Provinsi' },
    { key: 'kodePos', header: 'Kode Pos' },
    { key: 'telepon', header: 'Telepon' },
    { key: 'email', header: 'Email' },
    { key: 'website', header: 'Website' },
    { key: 'kelas', header: 'Kelas' },
    { key: 'ruangRombel', header: 'Ruang Rombel' },
    { key: 'kepsek', header: 'Nama Kepala Sekolah' },
    { key: 'nipKepsek', header: 'NIP Kepala Sekolah' },
    { key: 'waKepalaSekolah', header: 'WhatsApp Kepala Sekolah' },
    { key: 'waliKelas', header: 'Nama Guru Kelas' },
    { key: 'nipWaliKelas', header: 'NIP Guru Kelas' },
    { key: 'waGuru', header: 'WhatsApp Guru' },
    { key: 'lokasiTitimangsa', header: 'Lokasi Titimangsa' },
    { key: 'tanggalBiodata', header: 'Tanggal Biodata' },
    { key: 'tanggalRapor', header: 'Tanggal Rapor' },
    { key: 'bobotSumatifLingkup', header: 'Bobot Sumatif Lingkup Materi' },
    { key: 'bobotSumatifSemester', header: 'Bobot Sumatif Akhir Semester' }
  ];

  const handleDownloadExcel = () => {
    const dataRow = excelMap.map(entry => {
      const val = sekolah[entry.key as keyof typeof sekolah];
      return val !== undefined && val !== null ? val : '';
    });
    const ws = XLSX.utils.aoa_to_sheet([excelMap.map(e => e.header), dataRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Dasar");
    XLSX.writeFile(wb, `Template_Data_Dasar_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        const dataRow = jsonData[1] as any[];
        if (dataRow) {
          const newData = { ...sekolah };
          excelMap.forEach((entry, index) => {
            let val = dataRow[index];
            if (val instanceof Date) {
              // Fix timezone issue when parsing dates from excel
              const dateObj = new Date(val);
              dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
              val = dateObj.toISOString().split('T')[0];
            } else if (val === undefined) {
              val = '';
            } else {
              val = val.toString();
            }
            if (entry.key === 'bobotSumatifLingkup' || entry.key === 'bobotSumatifSemester') {
              (newData as any)[entry.key] = parseInt(val) || 0;
            } else {
              (newData as any)[entry.key] = val;
            }
          });
          updateSekolah(newData);
          setErrors({});
          showToast('Data Excel berhasil diimpor!');
        } else {
          showToast('File Excel kosong atau format tidak sesuai.', false);
        }
      } catch (err) {
        showToast('Gagal memproses file Excel.', false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(sekolah, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Data_Dasar_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        updateSekolah(json);
        setErrors({});
        showToast('Data JSON berhasil dipulihkan!');
      } catch (err) {
        showToast('Gagal membaca file JSON.', false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isLocked = state.isAuthenticated;
  
  const getSelectValue = (val: any) => {
    if (Array.isArray(val)) return '';
    if (typeof val === 'object' && val !== null) return '';
    return val || '';
  };

  // --- STYLING HELPERS ---
  const getFieldClass = (name: keyof typeof sekolah) => {
    const isError = errors[name];
    let classes = "w-full rounded-lg px-3 py-2 text-sm transition-all focus:outline-none border shadow-sm ";
    if (isError) {
      classes += "border-red-500 bg-red-50/30 text-red-900 focus:ring-2 focus:ring-red-500/20 placeholder:text-red-300";
    } else if (isLocked && ['nama', 'npsn', 'alamat', 'desaKelurahanJenis', 'desaKelurahanNama', 'kecamatan', 'kabupatenKotaJenis', 'kabupatenKotaNama', 'provinsi', 'tahunAjaran', 'semester', 'kelas', 'ruangRombel'].includes(name as string)) {
      classes += "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed";
    } else {
      classes += "border-gray-300 bg-white focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 placeholder:text-slate-400";
    }
    return classes;
  };

  const getLabelClass = (name: keyof typeof sekolah) => {
    const isError = errors[name];
    return `block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isError ? 'text-red-600' : 'text-slate-600'}`;
  };

  const totalBobot = (Number(sekolah.bobotSumatifLingkup) || 0) + (Number(sekolah.bobotSumatifSemester) || 0);

  return (
    <div className="w-full">
      
      {/* HEADER ACTIONS */}
      <div className="px-6 py-5 border-b border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-2xl">
        <div>
          <h3 className="font-bold text-sm text-slate-800">Data Dasar Sekolah</h3>
          <p className="text-[11px] text-gray-500 mt-1">Lengkapi profil lembaga dan konfigurasi rapor.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="file" ref={excelInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
          <input type="file" ref={jsonInputRef} onChange={handleImportJSON} accept=".json" className="hidden" />
          
          {!isLocked && (
            <>
              <button 
                type="button"
                onClick={handleDownloadExcel} 
                className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg shadow-sm border border-gray-200 transition focus:outline-none group/tooltip relative"
              >
                <Download className="w-4 h-4" />
                <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 top-full mt-1.5 right-0 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-top-1 before:right-3 before:border-4 before:border-transparent before:border-b-slate-800">
                  Unduh Excel
                </span>
              </button>
              
              <button 
                type="button"
                onClick={() => excelInputRef.current?.click()} 
                className="w-8 h-8 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg shadow-sm border border-emerald-200 transition focus:outline-none group/tooltip relative"
              >
                <Upload className="w-4 h-4" />
                <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 top-full mt-1.5 right-0 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-top-1 before:right-3 before:border-4 before:border-transparent before:border-b-slate-800">
                  Import Excel
                </span>
              </button>

              <button 
                type="button"
                onClick={handleDownloadJSON} 
                className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg shadow-sm border border-gray-200 transition focus:outline-none group/tooltip relative"
              >
                <FileText className="w-4 h-4" />
                <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 top-full mt-1.5 right-0 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-top-1 before:right-3 before:border-4 before:border-transparent before:border-b-slate-800">
                  Backup JSON
                </span>
              </button>

              <button 
                type="button"
                onClick={() => jsonInputRef.current?.click()} 
                className="w-8 h-8 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg shadow-sm border border-emerald-200 transition focus:outline-none group/tooltip relative"
              >
                <FileJson className="w-4 h-4" />
                <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 top-full mt-1.5 right-0 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-top-1 before:right-3 before:border-4 before:border-transparent before:border-b-slate-800">
                  Restore JSON
                </span>
              </button>

              <button 
                type="button"
                onClick={handleReset} 
                className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 rounded-lg shadow-sm border border-red-200 transition focus:outline-none group/tooltip relative"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 top-full mt-1.5 right-0 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-top-1 before:right-3 before:border-4 before:border-transparent before:border-b-slate-800">
                  Reset Default
                </span>
              </button>

              <button 
                type="button"
                onClick={(e) => handleSubmit(e as any)} 
                className="w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition group/tooltip relative"
              >
                <Save className="w-4 h-4" />
                <span className="absolute opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all bg-slate-800 text-white text-[10px] font-medium rounded px-2 py-1 top-full mt-1.5 right-0 whitespace-nowrap z-50 pointer-events-none shadow-sm before:absolute before:-top-1 before:right-3 before:border-4 before:border-transparent before:border-b-slate-800">
                  Simpan Perubahan
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-slate-200 bg-[#F8FAFC] flex-wrap sticky top-0 z-10 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('profil')}
          className={`whitespace-nowrap flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold transition-all uppercase tracking-wider border-b-2 ${
            activeTab === 'profil'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <School className="w-3.5 h-3.5" /> PROFIL SEKOLAH
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('akademik')}
          className={`whitespace-nowrap flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold transition-all uppercase tracking-wider border-b-2 ${
            activeTab === 'akademik'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> AKADEMIK & ROMBEL
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('guru')}
          className={`whitespace-nowrap flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold transition-all uppercase tracking-wider border-b-2 ${
            activeTab === 'guru'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> KEPALA SEKOLAH & GURU
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('output')}
          className={`whitespace-nowrap flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold transition-all uppercase tracking-wider border-b-2 ${
            activeTab === 'output'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> PENGATURAN OUTPUT
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('aplikasi')}
          className={`whitespace-nowrap flex items-center justify-center gap-2 px-6 py-3 text-[11px] font-bold transition-all uppercase tracking-wider border-b-2 ${
            activeTab === 'aplikasi'
              ? 'border-indigo-600 text-indigo-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Image className="w-3.5 h-3.5" /> LOGO & TTD
        </button>
      </div>

      <div className="overflow-auto bg-white rounded-b-2xl border-t border-gray-200" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <form onSubmit={handleSubmit} className="p-5 md:p-6 min-h-[400px] max-w-4xl mx-auto">
          
          {/* TAB CONTENT: PROFIL SEKOLAH */}
          {activeTab === 'profil' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                <div className="sm:col-span-12 space-y-1.5">
                  <label htmlFor="nama" className={getLabelClass('nama')}>Nama Lengkap Sekolah</label>
                  <input id="nama" name="nama" type="text" value={sekolah.nama || ''} onChange={handleChange} placeholder="Misal: SDN Legokmenteng Waringinkurung" className={getFieldClass('nama')} readOnly={isLocked} />
                </div>
                <div className="sm:col-span-4 space-y-1.5">
                  <label htmlFor="npsn" className={getLabelClass('npsn')}>NPSN</label>
                  <input id="npsn" name="npsn" type="text" value={sekolah.npsn || ''} onChange={handleChange} placeholder="8 Digit NPSN" className={getFieldClass('npsn')} readOnly={isLocked} />
                </div>
                <div className="sm:col-span-4 space-y-1.5">
                  <label htmlFor="nss" className={getLabelClass('nss')}>NSS</label>
                  <input id="nss" name="nss" type="text" value={sekolah.nss || ''} onChange={handleChange} placeholder="NSS Sekolah" className={getFieldClass('nss')} />
                </div>
                <div className="sm:col-span-4 space-y-1.5">
                  <label htmlFor="nis" className={getLabelClass('nis')}>NIS</label>
                  <input id="nis" name="nis" type="text" value={sekolah.nis || ''} onChange={handleChange} placeholder="NIS Sekolah" className={getFieldClass('nis')} />
                </div>
              </div>

              <div className="bg-slate-50/50 p-5 -mx-4 sm:mx-0 sm:p-6 rounded-xl border border-slate-100 space-y-6">
                <div className="space-y-1.5">
                  <label htmlFor="alamat" className={getLabelClass('alamat')}>Jalan/Blok/RT RW</label>
                  <input id="alamat" name="alamat" type="text" value={sekolah.alamat || ''} onChange={handleChange} placeholder="Nama jalan, RT/RW lengkap" className={getFieldClass('alamat')} readOnly={isLocked} />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                  <div className="sm:col-span-4 space-y-1.5">
                      <label htmlFor="desaKelurahanJenis" className={getLabelClass('desaKelurahanJenis')}>Desa/Kelurahan</label>
                      {isLocked ? (
                        <input id="desaKelurahanJenis" type="text" value={sekolah.desaKelurahanJenis === 'desa' ? 'Desa' : sekolah.desaKelurahanJenis === 'kelurahan' ? 'Kelurahan' : ''} className={getFieldClass('desaKelurahanJenis')} readOnly />
                      ) : (
                        <select id="desaKelurahanJenis" name="desaKelurahanJenis" value={getSelectValue(sekolah.desaKelurahanJenis)} onChange={handleChange} className={getFieldClass('desaKelurahanJenis')}>
                            <option value="">Pilih</option><option value="desa">Desa</option><option value="kelurahan">Kelurahan</option>
                        </select>
                      )}
                  </div>
                  <div className="sm:col-span-8 space-y-1.5">
                    <label htmlFor="desaKelurahanNama" className={getLabelClass('desaKelurahanNama')}>Nama Desa/Kelurahan</label>
                    <input id="desaKelurahanNama" name="desaKelurahanNama" type="text" value={sekolah.desaKelurahanNama || ''} onChange={handleChange} placeholder="Nama wilayah desa/kelurahan" className={getFieldClass('desaKelurahanNama')} readOnly={isLocked} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="kecamatan" className={getLabelClass('kecamatan')}>Kecamatan</label>
                  <input id="kecamatan" name="kecamatan" type="text" value={sekolah.kecamatan || ''} onChange={handleChange} placeholder="Nama kecamatan" className={getFieldClass('kecamatan')} readOnly={isLocked} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
                  <div className="sm:col-span-4 space-y-1.5">
                      <label htmlFor="kabupatenKotaJenis" className={getLabelClass('kabupatenKotaJenis')}>Kabupaten/Kota</label>
                      {isLocked ? (
                        <input id="kabupatenKotaJenis" type="text" value={sekolah.kabupatenKotaJenis === 'kabupaten' ? 'Kabupaten' : sekolah.kabupatenKotaJenis === 'kota' ? 'Kota' : ''} className={getFieldClass('kabupatenKotaJenis')} readOnly />
                      ) : (
                        <select id="kabupatenKotaJenis" name="kabupatenKotaJenis" value={getSelectValue(sekolah.kabupatenKotaJenis)} onChange={handleChange} className={getFieldClass('kabupatenKotaJenis')}>
                            <option value="">Pilih</option><option value="kabupaten">Kabupaten</option><option value="kota">Kota</option>
                        </select>
                      )}
                  </div>
                  <div className="sm:col-span-8 space-y-1.5">
                    <label htmlFor="kabupatenKotaNama" className={getLabelClass('kabupatenKotaNama')}>Nama Kabupaten/Kota</label>
                    <input id="kabupatenKotaNama" name="kabupatenKotaNama" type="text" value={sekolah.kabupatenKotaNama || ''} onChange={handleChange} placeholder="Nama wilayah kabupaten/kota" className={getFieldClass('kabupatenKotaNama')} readOnly={isLocked} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="sm:col-span-1 space-y-1.5">
                    <label htmlFor="provinsi" className={getLabelClass('provinsi')}>Provinsi</label>
                    <input id="provinsi" name="provinsi" type="text" value={sekolah.provinsi || ''} onChange={handleChange} placeholder="Provinsi" className={getFieldClass('provinsi')} readOnly={isLocked} />
                  </div>
                  <div className="sm:col-span-1 space-y-1.5">
                    <label htmlFor="kodePos" className={getLabelClass('kodePos')}>Kode Pos</label>
                    <input id="kodePos" name="kodePos" type="text" value={sekolah.kodePos || ''} onChange={handleChange} placeholder="12345" className={getFieldClass('kodePos')} />
                  </div>
                  <div className="sm:col-span-1 space-y-1.5">
                    <label htmlFor="telepon" className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-600">Telepon <span className="text-slate-400 font-normal ml-1">(Ops.)</span></label>
                    <input id="telepon" name="telepon" type="text" value={sekolah.telepon || ''} onChange={handleChange} placeholder="0254-xxx" className={getFieldClass('telepon')} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-200/60">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-600">Email <span className="text-slate-400 font-normal ml-1">(Ops.)</span></label>
                    <input id="email" name="email" type="email" value={sekolah.email || ''} onChange={handleChange} placeholder="sekolah@email.com" className={getFieldClass('email')} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="website" className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-600">Website <span className="text-slate-400 font-normal ml-1">(Ops.)</span></label>
                    <input id="website" name="website" type="url" value={sekolah.website || ''} onChange={handleChange} placeholder="https://..." className={getFieldClass('website')} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: AKADEMIK & ROMBEL */}
          {activeTab === 'akademik' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="tahunAjaran" className={getLabelClass('tahunAjaran')}>Tahun Ajaran</label>
                  <input id="tahunAjaran" name="tahunAjaran" type="text" value={sekolah.tahunAjaran || ''} onChange={handleChange} placeholder="Misal: 2024/2025" className={getFieldClass('tahunAjaran')} readOnly={isLocked} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="semester" className={getLabelClass('semester')}>Semester</label>
                  {isLocked ? (
                    <input id="semester" type="text" value={sekolah.semester == '1' ? '1 (Ganjil)' : sekolah.semester == '2' ? '2 (Genap)' : ''} className={getFieldClass('semester')} readOnly />
                  ) : (
                    <select id="semester" name="semester" value={getSelectValue(sekolah.semester)} onChange={handleChange} className={getFieldClass('semester')}>
                      <option value="">Pilih Semester</option>
                      <option value="1">1 (Ganjil)</option>
                      <option value="2">2 (Genap)</option>
                    </select>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="kelas" className={getLabelClass('kelas')}>Kelas</label>
                  {isLocked ? (
                    <input id="kelas" type="text" value={sekolah.kelas || ''} className={getFieldClass('kelas')} readOnly />
                  ) : (
                    <select id="kelas" name="kelas" value={getSelectValue(sekolah.kelas)} onChange={handleChange} className={getFieldClass('kelas')}>
                      <option value="">Pilih Kelas</option>
                      {(() => {
                        if (sekolah.allowedKelas && sekolah.allowedKelas.length > 0) {
                          const sorted = [...sekolah.allowedKelas].sort((a, b) => parseInt(a.toString(), 10) - parseInt(b.toString(), 10));
                          return sorted.map((k) => (
                            <option key={k} value={k.toString()}>{k}</option>
                          ));
                        } else {
                           return [1, 2, 3, 4, 5, 6].map(k => (
                             <option key={k} value={k.toString()}>{k}</option>
                           ));
                        }
                      })()}
                    </select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="fase" className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-slate-600">Fase</label>
                  <input 
                    id="fase" 
                    name="fase" 
                    type="text" 
                    value={sekolah.fase || ''} 
                    readOnly 
                    placeholder="Terisi otomatis"
                    className="w-full rounded-lg px-3.5 py-2.5 text-sm transition-all focus:outline-none border shadow-sm border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ruangRombel" className={getLabelClass('ruangRombel')}>Ruang Rombongan Belajar</label>
                  {isLocked ? (
                    <input id="ruangRombel" type="text" value={sekolah.ruangRombel === 'satu' ? 'Hanya Satu (Default)' : sekolah.ruangRombel || ''} className={getFieldClass('ruangRombel')} readOnly />
                  ) : (
                    <select id="ruangRombel" name="ruangRombel" value={getSelectValue(sekolah.ruangRombel)} onChange={handleChange} className={getFieldClass('ruangRombel')}>
                      <option value="">Pilih Rombel</option>
                      <option value="satu">Hanya Satu (Default)</option>
                      <option value="A">A</option><option value="B">B</option><option value="C">C</option>
                      <option value="D">D</option><option value="E">E</option><option value="F">F</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: KEPALA SEKOLAH & GURU */}
          {activeTab === 'guru' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-5">
                   <h4 className="font-bold text-sm tracking-widest text-slate-400 uppercase border-b border-slate-100 pb-2">Kepala Sekolah</h4>
                   <div className="space-y-1.5">
                     <label htmlFor="kepsek" className={getLabelClass('kepsek')}>Nama & Gelar</label>
                     <input id="kepsek" name="kepsek" type="text" value={sekolah.kepsek || ''} onChange={handleChange} placeholder="Nama lengkap & gelar" className={getFieldClass('kepsek')} />
                   </div>
                   <div className="space-y-1.5">
                     <label htmlFor="nipKepsek" className={getLabelClass('nipKepsek')}>NIP Kepala Sekolah</label>
                     <input id="nipKepsek" name="nipKepsek" type="text" value={sekolah.nipKepsek || ''} onChange={handleChange} placeholder="Tanpa spasi, misal 1980..." className={getFieldClass('nipKepsek')} />
                   </div>
                   <div className="space-y-1.5">
                     <label htmlFor="waKepalaSekolah" className={getLabelClass('waKepalaSekolah')}>Nomor WhatsApp</label>
                     <input id="waKepalaSekolah" name="waKepalaSekolah" type="text" value={sekolah.waKepalaSekolah || ''} onChange={handleChange} placeholder="Contoh: 0812..." className={getFieldClass('waKepalaSekolah')} />
                   </div>
                </div>
                
                <div className="space-y-5">
                   <h4 className="font-bold text-sm tracking-widest text-slate-400 uppercase border-b border-slate-100 pb-2">Guru/Wali Kelas</h4>
                   <div className="space-y-1.5">
                     <label htmlFor="waliKelas" className={getLabelClass('waliKelas')}>Nama & Gelar</label>
                     <input id="waliKelas" name="waliKelas" type="text" value={sekolah.waliKelas || ''} onChange={handleChange} placeholder="Nama lengkap & gelar" className={getFieldClass('waliKelas')} />
                   </div>
                   <div className="space-y-1.5">
                     <label htmlFor="nipWaliKelas" className={getLabelClass('nipWaliKelas')}>NIP Guru Kelas</label>
                     <input id="nipWaliKelas" name="nipWaliKelas" type="text" value={sekolah.nipWaliKelas || ''} onChange={handleChange} placeholder="Tanpa spasi" className={getFieldClass('nipWaliKelas')} />
                   </div>
                   <div className="space-y-1.5">
                     <label htmlFor="waGuru" className={getLabelClass('waGuru')}>Nomor WhatsApp</label>
                     <input id="waGuru" name="waGuru" type="text" value={sekolah.waGuru || ''} onChange={handleChange} placeholder="Contoh: 0812..." className={getFieldClass('waGuru')} />
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: PENGATURAN OUTPUT */}
          {activeTab === 'output' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Titimangsa Panel */}
              <div>
                <h4 className="flex items-center gap-2 font-bold text-xs tracking-widest text-slate-800 uppercase mb-4"><MapPin size={18} className="text-slate-400" /> Titimangsa Penandatanganan</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-1.5">
                    <label htmlFor="lokasiTitimangsa" className={getLabelClass('lokasiTitimangsa')}>Lokasi Cetak</label>
                    <select id="lokasiTitimangsa" name="lokasiTitimangsa" value={getSelectValue(sekolah.lokasiTitimangsa)} onChange={handleChange} className={getFieldClass('lokasiTitimangsa')}>
                      <option value="">Pilih Asal Referensi</option>
                      <option value="kabupaten_kota">Kabupaten/Kota</option>
                      <option value="kecamatan">Kecamatan</option>
                      <option value="desa_kelurahan">Desa/Kelurahan</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="tanggalBiodata" className={getLabelClass('tanggalBiodata')}>Tanggal Biodata</label>
                    <input id="tanggalBiodata" name="tanggalBiodata" type="date" value={sekolah.tanggalBiodata || ''} onChange={handleChange} className={getFieldClass('tanggalBiodata')} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="tanggalRapor" className={getLabelClass('tanggalRapor')}>Tanggal Rapor</label>
                    <input id="tanggalRapor" name="tanggalRapor" type="date" value={sekolah.tanggalRapor || ''} onChange={handleChange} className={getFieldClass('tanggalRapor')} />
                  </div>
                </div>
              </div>

              {/* Bobot Panel */}
              <div className="bg-slate-50/50 rounded-md border border-slate-100 p-6">
                  <h4 className="font-bold text-xs tracking-widest text-slate-800 uppercase mb-4 border-b border-slate-100 pb-2">Rasio Bobot Penilaian Rapor</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-3 flex flex-col items-center text-center">
                      <label htmlFor="bobotSumatifLingkup" className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 text-center">Bobot Sumatif Lingkup Materi</label>
                      <div className="flex items-center justify-center gap-3">
                        <input id="bobotSumatifLingkup" name="bobotSumatifLingkup" type="number" min="0" max="100" value={sekolah.bobotSumatifLingkup === '' ? '' : (sekolah.bobotSumatifLingkup !== undefined ? String(sekolah.bobotSumatifLingkup) : '75')} onChange={handleChange} className="w-20 rounded-lg px-3 py-2.5 text-base font-bold text-center border-slate-200 border bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm" />
                        <span className="text-slate-900 font-bold text-lg">%</span>
                      </div>
                    </div>
                    <div className="space-y-3 flex flex-col items-center text-center">
                      <label htmlFor="bobotSumatifSemester" className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 text-center">Bobot Sumatif Akhir Semester</label>
                      <div className="flex items-center justify-center gap-3">
                        <input id="bobotSumatifSemester" name="bobotSumatifSemester" type="number" min="0" max="100" value={sekolah.bobotSumatifSemester === '' ? '' : (sekolah.bobotSumatifSemester !== undefined ? String(sekolah.bobotSumatifSemester) : '25')} onChange={handleChange} className="w-20 rounded-lg px-3 py-2.5 text-base font-bold text-center border-slate-200 border bg-white focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm" />
                        <span className="text-slate-900 font-bold text-lg">%</span>
                      </div>
                    </div>
                  </div>

                  {totalBobot !== 100 && (
                    <div className="mt-5 bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-3">
                      <AlertCircle size={18} className="shrink-0" />
                      <p>Total bobot wajib berjumlah 100%. Pembobotan Anda saat ini: {totalBobot}%. Silakan sesuaikan rasio.</p>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: PENGATURAN APLIKASI */}
          {activeTab === 'aplikasi' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Logo Settings */}
              <div>
                <h4 className="flex items-center gap-2 font-bold text-xs tracking-widest text-slate-800 uppercase mb-4">Logo Rapor</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 border border-slate-200 rounded-md bg-slate-50 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                      {sekolah.logoKiri ? (
                        <img src={sekolah.logoKiri} alt="Logo Kiri" className="w-full h-full object-contain p-2" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold text-center px-1">Tut Wuri</span>
                      )}
                      <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-[10px] font-bold uppercase tracking-wider">
                        Ubah
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logoKiri')} />
                      </label>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 mb-1">Logo Kiri (Default: Tut Wuri)</p>
                      <p className="text-xs text-slate-500 leading-relaxed mb-2">Tampil di sudut kiri atas rapor.</p>
                      {sekolah.logoKiri && (
                        <button type="button" onClick={() => updateSekolah({ logoKiri: '' })} className="text-[10px] uppercase font-bold text-red-600 hover:text-red-700">Hapus Logo</button>
                      )}
                    </div>
                  </div>
                  <div className="p-5 border border-slate-200 rounded-md bg-slate-50 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                      {sekolah.logoKanan ? (
                        <img src={sekolah.logoKanan} alt="Logo Kanan" className="w-full h-full object-contain p-2" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold text-center px-1">Logo Pemda</span>
                      )}
                      <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-[10px] font-bold uppercase tracking-wider">
                        Ubah
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logoKanan')} />
                      </label>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 mb-1">Logo Kanan (Pemda)</p>
                      <p className="text-xs text-slate-500 leading-relaxed mb-2">Tampil di sudut kanan atas rapor.</p>
                      {sekolah.logoKanan && (
                        <button type="button" onClick={() => updateSekolah({ logoKanan: '' })} className="text-[10px] uppercase font-bold text-red-600 hover:text-red-700">Hapus Logo</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Signature */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-xs tracking-widest text-slate-800 uppercase">Tanda Tangan Digital</h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={sekolah.useDigitalSignature || false} onChange={(e) => updateSekolah({ useDigitalSignature: e.target.checked })} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                
                {sekolah.useDigitalSignature && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 animate-in fade-in slide-in-from-top-2">
                    <div className="p-5 border border-slate-200 rounded-md bg-slate-50 text-center">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Wali Kelas</p>
                      <label className="block w-full h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-white mb-3 hover:bg-slate-50 transition-colors cursor-pointer relative overflow-hidden group">
                        {sekolah.ttdWaliKelas ? (
                          <img src={sekolah.ttdWaliKelas} alt="TTD Wali Kelas" className="h-full w-full object-contain p-2" />
                        ) : (
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pilih Gambar (PNG)</span>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'ttdWaliKelas')} />
                      </label>
                      {sekolah.ttdWaliKelas && (
                        <button type="button" onClick={() => updateSekolah({ ttdWaliKelas: '' })} className="text-[10px] uppercase font-bold text-red-600 hover:text-red-700">Hapus Tanda Tangan</button>
                      )}
                    </div>
                    <div className="p-5 border border-slate-200 rounded-md bg-slate-50 text-center">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Kepala Sekolah</p>
                      <label className="block w-full h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-white mb-3 hover:bg-slate-50 transition-colors cursor-pointer relative overflow-hidden group">
                        {sekolah.ttdKepsek ? (
                          <img src={sekolah.ttdKepsek} alt="TTD Kepsek" className="h-full w-full object-contain p-2" />
                        ) : (
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Pilih Gambar (PNG)</span>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'ttdKepsek')} />
                      </label>
                      {sekolah.ttdKepsek && (
                        <button type="button" onClick={() => updateSekolah({ ttdKepsek: '' })} className="text-[10px] uppercase font-bold text-red-600 hover:text-red-700">Hapus Tanda Tangan</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* TOAST WARNING/SUCCESS OVERLAY */}
      {toastMessage && (
        <div className={`fixed bottom-24 right-8 z-[60] px-5 py-3 rounded-xl shadow-xl shadow-slate-900/10 border text-[13px] font-bold flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm ${
          toastType === 'success' 
            ? 'bg-emerald-800 text-white border-emerald-900' 
            : 'bg-red-600 text-white border-red-700'
        }`}>
          {toastType === 'success' ? <CheckCircle2 size={18} className="text-emerald-300 shrink-0" /> : <Info size={18} className="text-red-300 shrink-0" />}
          <span className="whitespace-pre-line truncate max-w-[280px]">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}