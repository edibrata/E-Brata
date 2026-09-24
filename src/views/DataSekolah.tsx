import { useAppStore } from '@/store';
import { 
  FileText, Calendar, School, Users, 
  MapPin, Percent, Info, Save, RotateCcw,
  Download, Upload, FileJson, CheckCircle2,
  AlertCircle, Lock, Settings, Image,
  RotateCw, ZoomIn, RefreshCw, Trash2,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Move, Sliders
} from 'lucide-react';
import React, { useState, useRef } from 'react';
import { INITIAL_STATE } from '@/constants';
import * as XLSX from 'xlsx';
import { formatLokasiTitimangsa } from '@/lib/pdfGenerator';

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
        const result = reader.result as string;
        if (name === 'logo' || name === 'logoKiri') {
          updateSekolah({
            logo: result,
            logoKiri: result,
            logoScale: sekolah.logoScale || 100,
            logoRotation: sekolah.logoRotation || 0
          });
        } else {
          updateSekolah({ [name]: result });
        }
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

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset formulir Data Sekolah ke pengaturan awal?')) {
      Object.keys(INITIAL_STATE.sekolah).forEach((key) => {
        updateSekolah(key as any, (INITIAL_STATE.sekolah as any)[key]);
      });
      setErrors({});
      showToast('Data Sekolah berhasil direset ke default.');
    }
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
                    <p className="text-[11px] text-slate-500 pt-0.5 flex items-center gap-1">
                      <span>Tercetak:</span>
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {formatLokasiTitimangsa(sekolah)}
                      </span>
                    </p>
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

              {/* Informasi Integrasi Pembobotan Asesmen 2025 (Menghilangkan Redundansi) */}
              <div className="bg-indigo-50/50 rounded-xl border border-indigo-150 p-6 space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Percent size={18} />
                  </span>
                  <div>
                    <h4 className="font-bold text-xs tracking-wider text-indigo-950 uppercase">
                      Pengaturan Bobot Asesmen Rapor (Panduan 2025)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Sistem Pembobotan Dua Tingkat (Inter-TP dan Komposit SLM + SAS)
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Sesuai prinsip Kurikulum Merdeka, perencanaan <strong>Kriteria Ketuntasan TP (KKTP)</strong>, <strong>Opsi Pengolahan (Rata-rata/Pembobotan/Persentase)</strong>, serta <strong>Rasio Komposit SAS</strong> telah dipusatkan dan dikelola secara mandiri pada menu:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      1. Tahap Perencanaan
                    </span>
                    <span className="font-bold text-xs text-slate-800 block">
                      Kegiatan Akademik &gt; Mata Pelajaran
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Menetapkan KKTP dan metode perhitungan resmi per mata pelajaran.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      2. Tahap Penilaian
                    </span>
                    <span className="font-bold text-xs text-slate-800 block">
                      Nilai Intrakurikuler &gt; Input Nilai
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Input nilai cepat, penyesuaian bobot manual TP, dan rasio SLM : SAS.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: PENGATURAN APLIKASI (LOGO & TTD) */}
          {activeTab === 'aplikasi' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* 1. Logo Satuan Pendidikan (Tunggal / Default) */}
              <div className="p-6 border border-slate-200 rounded-xl bg-slate-50/70 space-y-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="flex items-center gap-2 font-bold text-xs tracking-widest text-slate-800 uppercase">
                      Logo Satuan Pendidikan (Utama)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Digunakan pada Halaman Sampul (Cover Rapor) dan Dokumen Resmi Sekolah.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-5">
                  {/* Top Bar: Preview & Upload Controls */}
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Live Preview Box with Crosshair */}
                    <div className="w-36 h-36 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/80 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative group select-none">
                      {/* Grid background markers */}
                      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:8px_8px]" />
                      <div className="absolute w-full h-[1px] bg-slate-300/40 pointer-events-none" />
                      <div className="absolute h-full w-[1px] bg-slate-300/40 pointer-events-none" />

                      {(sekolah.logo || sekolah.logoKiri) ? (
                        <img 
                          src={sekolah.logo || sekolah.logoKiri} 
                          alt="Logo Satuan Pendidikan" 
                          style={{
                            transform: `translate(${sekolah.logoOffsetX || 0}px, ${sekolah.logoOffsetY || 0}px) rotate(${sekolah.logoRotation || 0}deg) scale(${(sekolah.logoScale || 100) / 100})`,
                            transformOrigin: 'center center'
                          }}
                          className="max-h-28 max-w-28 object-contain transition-transform" 
                        />
                      ) : (
                        <div className="text-center p-3 z-10">
                          <Image className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                          <span className="text-[10px] text-slate-400 font-bold block leading-tight">Default: Tut Wuri</span>
                        </div>
                      )}
                    </div>

                    {/* Actions & Status */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold cursor-pointer transition shadow-2xs">
                          <Upload size={14} />
                          {(sekolah.logo || sekolah.logoKiri) ? 'Ganti Logo' : 'Unggah Logo (PNG/JPG)'}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} />
                        </label>
                        {(sekolah.logo || sekolah.logoKiri) && (
                          <button 
                            type="button" 
                            onClick={() => updateSekolah({ logo: '', logoKiri: '', logoRotation: 0, logoScale: 100, logoOffsetX: 0, logoOffsetY: 0 })} 
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition"
                          >
                            <Trash2 size={14} /> Hapus Logo
                          </button>
                        )}
                        {((sekolah.logoRotation && sekolah.logoRotation !== 0) || (sekolah.logoScale && sekolah.logoScale !== 100) || (sekolah.logoOffsetX && sekolah.logoOffsetX !== 0) || (sekolah.logoOffsetY && sekolah.logoOffsetY !== 0)) && (
                          <button
                            type="button"
                            onClick={() => updateSekolah({ logoRotation: 0, logoScale: 100, logoOffsetX: 0, logoOffsetY: 0 })}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                          >
                            <RefreshCw size={13} /> Reset Semua
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed">
                        Atur sudut kemiringan rotasi, pergeseran posisi (X/Y), dan ukuran skala logo agar pas dan presisi pada format cetak.
                      </p>
                    </div>
                  </div>

                  {/* Advanced Controls Section (Rotasi, Posisi, Skala) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-slate-200">
                    {/* 1. KONTROL ROTASI FLEKSIBEL */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <RotateCw size={14} className="text-indigo-600" /> Rotasi Fleksibel
                        </span>
                        <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono font-bold text-indigo-700 shadow-2xs">
                          {sekolah.logoRotation || 0}°
                        </span>
                      </div>

                      {/* Slider Rotasi Bebas (-180° s.d. +180°) */}
                      <div className="space-y-1">
                        <input 
                          type="range" 
                          min="-180" 
                          max="180" 
                          step="1" 
                          value={sekolah.logoRotation || 0} 
                          onChange={(e) => updateSekolah({ logoRotation: parseInt(e.target.value, 10) })}
                          className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer" 
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>-180°</span>
                          <span className="cursor-pointer hover:text-indigo-600 font-bold" onClick={() => updateSekolah({ logoRotation: 0 })}>0° (Tegak)</span>
                          <span>+180°</span>
                        </div>
                      </div>

                      {/* Fine-Tuning Rotasi Buttons */}
                      <div className="grid grid-cols-5 gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => updateSekolah({ logoRotation: ((sekolah.logoRotation || 0) - 5) })}
                          className="px-1 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono font-bold transition text-center shadow-2xs"
                          title="Putar -5°"
                        >
                          -5°
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSekolah({ logoRotation: ((sekolah.logoRotation || 0) - 1) })}
                          className="px-1 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono font-bold transition text-center shadow-2xs"
                          title="Putar -1° (Halus)"
                        >
                          -1°
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSekolah({ logoRotation: 0 })}
                          className="px-1 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold transition text-center shadow-2xs"
                          title="Reset Tegak"
                        >
                          0°
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSekolah({ logoRotation: ((sekolah.logoRotation || 0) + 1) })}
                          className="px-1 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono font-bold transition text-center shadow-2xs"
                          title="Putar +1° (Halus)"
                        >
                          +1°
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSekolah({ logoRotation: ((sekolah.logoRotation || 0) + 5) })}
                          className="px-1 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono font-bold transition text-center shadow-2xs"
                          title="Putar +5°"
                        >
                          +5°
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => updateSekolah({ logoRotation: (((sekolah.logoRotation || 0) + 90) % 360) })}
                        className="w-full flex items-center justify-center gap-1 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold transition shadow-2xs"
                      >
                        <RotateCw size={12} /> Putar Cepat 90°
                      </button>
                    </div>

                    {/* 2. KONTROL PERGESERAN POSISI (X & Y) */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Move size={14} className="text-indigo-600" /> Pergeseran Posisi
                        </span>
                        <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10.5px] font-mono font-bold text-indigo-700 shadow-2xs">
                          X:{sekolah.logoOffsetX || 0} Y:{sekolah.logoOffsetY || 0}
                        </span>
                      </div>

                      {/* Slider X (Horizontal) */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-600 font-semibold">
                          <span>Geser X (Kiri/Kanan):</span>
                          <span className="font-mono">{sekolah.logoOffsetX || 0}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="-50" 
                          max="50" 
                          step="1" 
                          value={sekolah.logoOffsetX || 0} 
                          onChange={(e) => updateSekolah({ logoOffsetX: parseInt(e.target.value, 10) })}
                          className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer" 
                        />
                      </div>

                      {/* Slider Y (Vertikal) */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-600 font-semibold">
                          <span>Geser Y (Atas/Bawah):</span>
                          <span className="font-mono">{sekolah.logoOffsetY || 0}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="-50" 
                          max="50" 
                          step="1" 
                          value={sekolah.logoOffsetY || 0} 
                          onChange={(e) => updateSekolah({ logoOffsetY: parseInt(e.target.value, 10) })}
                          className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer" 
                        />
                      </div>

                      {/* D-Pad Buttons for Step Adjustment */}
                      <div className="flex items-center justify-center gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => updateSekolah({ logoOffsetX: (sekolah.logoOffsetX || 0) - 2 })}
                          className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded shadow-2xs transition"
                          title="Geser Kiri 2px"
                        >
                          <ArrowLeft size={13} />
                        </button>
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => updateSekolah({ logoOffsetY: (sekolah.logoOffsetY || 0) - 2 })}
                            className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded shadow-2xs transition"
                            title="Geser Atas 2px"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateSekolah({ logoOffsetY: (sekolah.logoOffsetY || 0) + 2 })}
                            className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded shadow-2xs transition"
                            title="Geser Bawah 2px"
                          >
                            <ArrowDown size={13} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateSekolah({ logoOffsetX: (sekolah.logoOffsetX || 0) + 2 })}
                          className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded shadow-2xs transition"
                          title="Geser Kanan 2px"
                        >
                          <ArrowRight size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSekolah({ logoOffsetX: 0, logoOffsetY: 0 })}
                          className="px-2 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-bold shadow-2xs transition ml-1"
                          title="Pusatkan Posisi"
                        >
                          Tengah
                        </button>
                      </div>
                    </div>

                    {/* 3. KONTROL SKALA UKURAN */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <ZoomIn size={14} className="text-indigo-600" /> Skala Ukuran
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="30"
                            max="300"
                            value={sekolah.logoScale || 100}
                            onChange={(e) => updateSekolah({ logoScale: Math.max(30, Math.min(300, parseInt(e.target.value, 10) || 100)) })}
                            className="w-14 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono font-bold text-indigo-700 text-center shadow-2xs focus:ring-1 focus:ring-indigo-500 outline-none"
                          />
                          <span className="text-[11px] font-bold text-slate-500">%</span>
                        </div>
                      </div>

                      <div className="space-y-1 pt-1">
                        <input 
                          type="range" 
                          min="30" 
                          max="300" 
                          step="1" 
                          value={sekolah.logoScale || 100} 
                          onChange={(e) => updateSekolah({ logoScale: parseInt(e.target.value, 10) })}
                          className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer" 
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>30%</span>
                          <span className="cursor-pointer hover:text-indigo-600 font-bold" onClick={() => updateSekolah({ logoScale: 100 })}>100% (Normal)</span>
                          <span>300%</span>
                        </div>
                      </div>

                      {/* Preset Skala */}
                      <div className="grid grid-cols-5 gap-1 pt-1">
                        {[100, 150, 180, 220, 250].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => updateSekolah({ logoScale: pct })}
                            className={`py-1 rounded text-[10px] font-mono font-bold border transition shadow-2xs ${
                              (sekolah.logoScale || 100) === pct 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => updateSekolah({ logoScale: 100 })}
                        className="w-full py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded text-[11px] font-semibold transition shadow-2xs"
                      >
                        Reset ke 100%
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Digital Signature */}
              <div className="p-6 border border-slate-200 rounded-xl bg-slate-50/70 space-y-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs tracking-widest text-slate-800 uppercase">
                      Tanda Tangan Digital
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Gunakan scan tanda tangan digital pada Lembar Rapor & Buku Induk.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={sekolah.useDigitalSignature || false} 
                      onChange={(e) => updateSekolah({ useDigitalSignature: e.target.checked })} 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                
                {sekolah.useDigitalSignature && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 animate-in fade-in slide-in-from-top-2">
                    {/* TTD WALI / GURU KELAS */}
                    <div className="p-5 border border-slate-200 rounded-xl bg-white space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Wali / Guru Kelas
                        </p>
                        <span className="text-[11px] text-slate-500 truncate max-w-[140px] font-semibold">
                          {sekolah.waliKelas || 'Guru Kelas'}
                        </span>
                      </div>

                      {/* Live Preview Box with Crosshair */}
                      <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/70 flex items-center justify-center overflow-hidden relative shadow-inner select-none">
                        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:8px_8px]" />
                        <div className="absolute w-full h-[1px] bg-slate-300/40 pointer-events-none" />
                        <div className="absolute h-full w-[1px] bg-slate-300/40 pointer-events-none" />

                        {sekolah.ttdWaliKelas ? (
                          <img 
                            src={sekolah.ttdWaliKelas} 
                            alt="TTD Wali Kelas" 
                            style={{
                              transform: `translate(${sekolah.ttdWaliKelasOffsetX || 0}px, ${sekolah.ttdWaliKelasOffsetY || 0}px) rotate(${sekolah.ttdWaliKelasRotation || 0}deg) scale(${(sekolah.ttdWaliKelasScale || 100) / 100})`,
                              transformOrigin: 'center center'
                            }}
                            className="max-h-24 max-w-28 object-contain transition-transform" 
                          />
                        ) : (
                          <span className="text-slate-400 text-[10.5px] font-bold uppercase tracking-wider text-center px-2 z-10">
                            Belum Ada Tanda Tangan (PNG)
                          </span>
                        )}
                      </div>

                      {/* Buttons Upload & Hapus */}
                      <div className="flex items-center gap-2">
                        <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold cursor-pointer transition shadow-2xs">
                          <Upload size={13} /> {sekolah.ttdWaliKelas ? 'Ganti TTD' : 'Pilih File (PNG)'}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'ttdWaliKelas')} />
                        </label>
                        {sekolah.ttdWaliKelas && (
                          <button 
                            type="button" 
                            onClick={() => updateSekolah({ ttdWaliKelas: '', ttdWaliKelasRotation: 0, ttdWaliKelasScale: 100, ttdWaliKelasOffsetX: 0, ttdWaliKelasOffsetY: 0 })} 
                            className="px-2.5 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition"
                            title="Hapus Tanda Tangan"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Transform Controls for TTD Wali Kelas */}
                      {sekolah.ttdWaliKelas && (
                        <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                          {/* 1. Rotasi Fleksibel */}
                          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                                <RotateCw size={12} className="text-indigo-600" /> Rotasi
                              </span>
                              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10.5px] font-mono font-bold text-indigo-700">
                                {sekolah.ttdWaliKelasRotation || 0}°
                              </span>
                            </div>
                            <input 
                              type="range" 
                              min="-180" 
                              max="180" 
                              step="1" 
                              value={sekolah.ttdWaliKelasRotation || 0} 
                              onChange={(e) => updateSekolah({ ttdWaliKelasRotation: parseInt(e.target.value, 10) })}
                              className="w-full accent-indigo-600 h-1 bg-slate-200 rounded cursor-pointer" 
                            />
                            <div className="flex items-center justify-between gap-1 pt-0.5">
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdWaliKelasRotation: (sekolah.ttdWaliKelasRotation || 0) - 1 })}
                                className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono font-bold"
                              >
                                -1°
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdWaliKelasRotation: 0 })}
                                className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold"
                              >
                                0°
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdWaliKelasRotation: (sekolah.ttdWaliKelasRotation || 0) + 1 })}
                                className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono font-bold"
                              >
                                +1°
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdWaliKelasRotation: (((sekolah.ttdWaliKelasRotation || 0) + 90) % 360) })}
                                className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-semibold"
                              >
                                90° ↻
                              </button>
                            </div>
                          </div>

                          {/* 2. Pergeseran Posisi (X & Y) */}
                          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                                <Move size={12} className="text-indigo-600" /> Posisi X / Y
                              </span>
                              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold text-indigo-700">
                                X:{sekolah.ttdWaliKelasOffsetX || 0} Y:{sekolah.ttdWaliKelasOffsetY || 0}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[9.5px] text-slate-500 font-semibold block">Geser X (Kiri/Kanan):</span>
                                <input 
                                  type="range" 
                                  min="-50" 
                                  max="50" 
                                  step="1" 
                                  value={sekolah.ttdWaliKelasOffsetX || 0} 
                                  onChange={(e) => updateSekolah({ ttdWaliKelasOffsetX: parseInt(e.target.value, 10) })}
                                  className="w-full accent-indigo-600 h-1 bg-slate-200 rounded cursor-pointer" 
                                />
                              </div>
                              <div>
                                <span className="text-[9.5px] text-slate-500 font-semibold block">Geser Y (Atas/Bawah):</span>
                                <input 
                                  type="range" 
                                  min="-50" 
                                  max="50" 
                                  step="1" 
                                  value={sekolah.ttdWaliKelasOffsetY || 0} 
                                  onChange={(e) => updateSekolah({ ttdWaliKelasOffsetY: parseInt(e.target.value, 10) })}
                                  className="w-full accent-indigo-600 h-1 bg-slate-200 rounded cursor-pointer" 
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-center gap-1 pt-1">
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdWaliKelasOffsetX: (sekolah.ttdWaliKelasOffsetX || 0) - 2 })}
                                className="p-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px]"
                                title="Geser Kiri 2px"
                              >
                                <ArrowLeft size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdWaliKelasOffsetY: (sekolah.ttdWaliKelasOffsetY || 0) - 2 })}
                                className="p-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px]"
                                title="Geser Atas 2px"
                              >
                                <ArrowUp size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdWaliKelasOffsetX: 0, ttdWaliKelasOffsetY: 0 })}
                                className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold"
                              >
                                0
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdWaliKelasOffsetY: (sekolah.ttdWaliKelasOffsetY || 0) + 2 })}
                                className="p-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px]"
                                title="Geser Bawah 2px"
                              >
                                <ArrowDown size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdWaliKelasOffsetX: (sekolah.ttdWaliKelasOffsetX || 0) + 2 })}
                                className="p-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px]"
                                title="Geser Kanan 2px"
                              >
                                <ArrowRight size={11} />
                              </button>
                            </div>
                          </div>

                          {/* 3. Skala Ukuran */}
                          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                <ZoomIn size={12} className="text-indigo-600" /> Skala Ukuran
                              </span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="30"
                                  max="300"
                                  value={sekolah.ttdWaliKelasScale || 100}
                                  onChange={(e) => updateSekolah({ ttdWaliKelasScale: Math.max(30, Math.min(300, parseInt(e.target.value, 10) || 100)) })}
                                  className="w-12 px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold text-indigo-700 text-center shadow-2xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                                <span className="text-[10px] font-bold text-slate-500">%</span>
                              </div>
                            </div>
                            <input 
                              type="range" 
                              min="30" 
                              max="300" 
                              step="1" 
                              value={sekolah.ttdWaliKelasScale || 100} 
                              onChange={(e) => updateSekolah({ ttdWaliKelasScale: parseInt(e.target.value, 10) })}
                              className="w-full accent-indigo-600 h-1 bg-slate-200 rounded cursor-pointer" 
                            />
                            <div className="flex items-center justify-between gap-1 pt-0.5">
                              {[100, 150, 180, 220, 250].map((pct) => (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => updateSekolah({ ttdWaliKelasScale: pct })}
                                  className={`px-1 py-0.5 rounded text-[9.5px] font-mono font-bold border transition ${
                                    (sekolah.ttdWaliKelasScale || 100) === pct
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Reset Button */}
                          {((sekolah.ttdWaliKelasRotation && sekolah.ttdWaliKelasRotation !== 0) || (sekolah.ttdWaliKelasScale && sekolah.ttdWaliKelasScale !== 100) || (sekolah.ttdWaliKelasOffsetX && sekolah.ttdWaliKelasOffsetX !== 0) || (sekolah.ttdWaliKelasOffsetY && sekolah.ttdWaliKelasOffsetY !== 0)) && (
                            <button
                              type="button"
                              onClick={() => updateSekolah({ ttdWaliKelasRotation: 0, ttdWaliKelasScale: 100, ttdWaliKelasOffsetX: 0, ttdWaliKelasOffsetY: 0 })}
                              className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition pt-1"
                            >
                              <RefreshCw size={10} /> Reset Semua Penyesuaian TTD
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* TTD KEPALA SEKOLAH */}
                    <div className="p-5 border border-slate-200 rounded-xl bg-white space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Kepala Sekolah
                        </p>
                        <span className="text-[11px] text-slate-500 truncate max-w-[140px] font-semibold">
                          {sekolah.kepsek || 'Kepala Sekolah'}
                        </span>
                      </div>

                      {/* Live Preview Box with Crosshair */}
                      <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/70 flex items-center justify-center overflow-hidden relative shadow-inner select-none">
                        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#64748b_1px,transparent_1px)] [background-size:8px_8px]" />
                        <div className="absolute w-full h-[1px] bg-slate-300/40 pointer-events-none" />
                        <div className="absolute h-full w-[1px] bg-slate-300/40 pointer-events-none" />

                        {sekolah.ttdKepsek ? (
                          <img 
                            src={sekolah.ttdKepsek} 
                            alt="TTD Kepala Sekolah" 
                            style={{
                              transform: `translate(${sekolah.ttdKepsekOffsetX || 0}px, ${sekolah.ttdKepsekOffsetY || 0}px) rotate(${sekolah.ttdKepsekRotation || 0}deg) scale(${(sekolah.ttdKepsekScale || 100) / 100})`,
                              transformOrigin: 'center center'
                            }}
                            className="max-h-24 max-w-28 object-contain transition-transform" 
                          />
                        ) : (
                          <span className="text-slate-400 text-[10.5px] font-bold uppercase tracking-wider text-center px-2 z-10">
                            Belum Ada Tanda Tangan (PNG)
                          </span>
                        )}
                      </div>

                      {/* Buttons Upload & Hapus */}
                      <div className="flex items-center gap-2">
                        <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold cursor-pointer transition shadow-2xs">
                          <Upload size={13} /> {sekolah.ttdKepsek ? 'Ganti TTD' : 'Pilih File (PNG)'}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'ttdKepsek')} />
                        </label>
                        {sekolah.ttdKepsek && (
                          <button 
                            type="button" 
                            onClick={() => updateSekolah({ ttdKepsek: '', ttdKepsekRotation: 0, ttdKepsekScale: 100, ttdKepsekOffsetX: 0, ttdKepsekOffsetY: 0 })} 
                            className="px-2.5 py-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition"
                            title="Hapus Tanda Tangan"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {/* Transform Controls for TTD Kepala Sekolah */}
                      {sekolah.ttdKepsek && (
                        <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                          {/* 1. Rotasi Fleksibel */}
                          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                                <RotateCw size={12} className="text-indigo-600" /> Rotasi
                              </span>
                              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10.5px] font-mono font-bold text-indigo-700">
                                {sekolah.ttdKepsekRotation || 0}°
                              </span>
                            </div>
                            <input 
                              type="range" 
                              min="-180" 
                              max="180" 
                              step="1" 
                              value={sekolah.ttdKepsekRotation || 0} 
                              onChange={(e) => updateSekolah({ ttdKepsekRotation: parseInt(e.target.value, 10) })}
                              className="w-full accent-indigo-600 h-1 bg-slate-200 rounded cursor-pointer" 
                            />
                            <div className="flex items-center justify-between gap-1 pt-0.5">
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdKepsekRotation: (sekolah.ttdKepsekRotation || 0) - 1 })}
                                className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono font-bold"
                              >
                                -1°
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdKepsekRotation: 0 })}
                                className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold"
                              >
                                0°
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdKepsekRotation: (sekolah.ttdKepsekRotation || 0) + 1 })}
                                className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono font-bold"
                              >
                                +1°
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdKepsekRotation: (((sekolah.ttdKepsekRotation || 0) + 90) % 360) })}
                                className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-semibold"
                              >
                                90° ↻
                              </button>
                            </div>
                          </div>

                          {/* 2. Pergeseran Posisi (X & Y) */}
                          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                                <Move size={12} className="text-indigo-600" /> Posisi X / Y
                              </span>
                              <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold text-indigo-700">
                                X:{sekolah.ttdKepsekOffsetX || 0} Y:{sekolah.ttdKepsekOffsetY || 0}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[9.5px] text-slate-500 font-semibold block">Geser X (Kiri/Kanan):</span>
                                <input 
                                  type="range" 
                                  min="-50" 
                                  max="50" 
                                  step="1" 
                                  value={sekolah.ttdKepsekOffsetX || 0} 
                                  onChange={(e) => updateSekolah({ ttdKepsekOffsetX: parseInt(e.target.value, 10) })}
                                  className="w-full accent-indigo-600 h-1 bg-slate-200 rounded cursor-pointer" 
                                />
                              </div>
                              <div>
                                <span className="text-[9.5px] text-slate-500 font-semibold block">Geser Y (Atas/Bawah):</span>
                                <input 
                                  type="range" 
                                  min="-50" 
                                  max="50" 
                                  step="1" 
                                  value={sekolah.ttdKepsekOffsetY || 0} 
                                  onChange={(e) => updateSekolah({ ttdKepsekOffsetY: parseInt(e.target.value, 10) })}
                                  className="w-full accent-indigo-600 h-1 bg-slate-200 rounded cursor-pointer" 
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-center gap-1 pt-1">
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdKepsekOffsetX: (sekolah.ttdKepsekOffsetX || 0) - 2 })}
                                className="p-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px]"
                                title="Geser Kiri 2px"
                              >
                                <ArrowLeft size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdKepsekOffsetY: (sekolah.ttdKepsekOffsetY || 0) - 2 })}
                                className="p-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px]"
                                title="Geser Atas 2px"
                              >
                                <ArrowUp size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdKepsekOffsetX: 0, ttdKepsekOffsetY: 0 })}
                                className="px-1.5 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold"
                              >
                                0
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdKepsekOffsetY: (sekolah.ttdKepsekOffsetY || 0) + 2 })}
                                className="p-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px]"
                                title="Geser Bawah 2px"
                              >
                                <ArrowDown size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateSekolah({ ttdKepsekOffsetX: (sekolah.ttdKepsekOffsetX || 0) + 2 })}
                                className="p-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px]"
                                title="Geser Kanan 2px"
                              >
                                <ArrowRight size={11} />
                              </button>
                            </div>
                          </div>

                          {/* 3. Skala Ukuran */}
                          <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                                <ZoomIn size={12} className="text-indigo-600" /> Skala Ukuran
                              </span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="30"
                                  max="300"
                                  value={sekolah.ttdKepsekScale || 100}
                                  onChange={(e) => updateSekolah({ ttdKepsekScale: Math.max(30, Math.min(300, parseInt(e.target.value, 10) || 100)) })}
                                  className="w-12 px-1 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-bold text-indigo-700 text-center shadow-2xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                                <span className="text-[10px] font-bold text-slate-500">%</span>
                              </div>
                            </div>
                            <input 
                              type="range" 
                              min="30" 
                              max="300" 
                              step="1" 
                              value={sekolah.ttdKepsekScale || 100} 
                              onChange={(e) => updateSekolah({ ttdKepsekScale: parseInt(e.target.value, 10) })}
                              className="w-full accent-indigo-600 h-1 bg-slate-200 rounded cursor-pointer" 
                            />
                            <div className="flex items-center justify-between gap-1 pt-0.5">
                              {[100, 150, 180, 220, 250].map((pct) => (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => updateSekolah({ ttdKepsekScale: pct })}
                                  className={`px-1 py-0.5 rounded text-[9.5px] font-mono font-bold border transition ${
                                    (sekolah.ttdKepsekScale || 100) === pct
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Reset Button */}
                          {((sekolah.ttdKepsekRotation && sekolah.ttdKepsekRotation !== 0) || (sekolah.ttdKepsekScale && sekolah.ttdKepsekScale !== 100) || (sekolah.ttdKepsekOffsetX && sekolah.ttdKepsekOffsetX !== 0) || (sekolah.ttdKepsekOffsetY && sekolah.ttdKepsekOffsetY !== 0)) && (
                            <button
                              type="button"
                              onClick={() => updateSekolah({ ttdKepsekRotation: 0, ttdKepsekScale: 100, ttdKepsekOffsetX: 0, ttdKepsekOffsetY: 0 })}
                              className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition pt-1"
                            >
                              <RefreshCw size={10} /> Reset Semua Penyesuaian TTD
                            </button>
                          )}
                        </div>
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