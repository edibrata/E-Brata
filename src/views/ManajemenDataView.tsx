import React, { useState, useRef } from 'react';
import { useAppStore } from '@/store';
import { 
  Trash2, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  FileJson, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  Info,
  Check,
  RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import KotakSampah from './KotakSampah';
import Tooltip from '@/components/Tooltip';

interface ManajemenDataViewProps {
  initialTab?: 'sampah' | 'ekspor' | 'impor' | 'backup' | 'restore';
}

export default function ManajemenDataView({ initialTab = 'sampah' }: ManajemenDataViewProps) {
  const { state, updateState, updateSekolah } = useAppStore();
  const [activeTab, setActiveTab] = useState<'sampah' | 'ekspor' | 'impor' | 'backup' | 'restore'>(initialTab);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const importMuridRef = useRef<HTMLInputElement>(null);
  const importDasarRef = useRef<HTMLInputElement>(null);
  const restoreJsonRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper format timestamp: YYYYMMDD HH.MM.SS
  const formatTimestampFileName = (d: Date = new Date()) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}${mm}${dd} ${hh}.${min}.${ss}`;
  };

  // --- EKSPOR EXCEL LENGKAP ---
  const handleExportFullExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Sheet Data Dasar
      const dataDasarRows = [
        ['Parameter', 'Nilai'],
        ['Nama Sekolah', state.sekolah.nama || ''],
        ['NPSN', state.sekolah.npsn || ''],
        ['NSS', state.sekolah.nss || ''],
        ['Alamat', state.sekolah.alamat || ''],
        ['Desa/Kelurahan', state.sekolah.desaKelurahanNama || ''],
        ['Kecamatan', state.sekolah.kecamatan || ''],
        ['Kabupaten/Kota', state.sekolah.kabupatenKotaNama || ''],
        ['Provinsi', state.sekolah.provinsi || ''],
        ['Tahun Ajaran', state.sekolah.tahunAjaran || ''],
        ['Semester', state.sekolah.semester || ''],
        ['Fase', state.sekolah.fase || ''],
        ['Kelas', state.sekolah.kelas || ''],
        ['Kepala Sekolah', state.sekolah.kepsek || ''],
        ['NIP Kepala Sekolah', state.sekolah.nipKepsek || ''],
        ['Wali Kelas', state.sekolah.waliKelas || ''],
        ['NIP Wali Kelas', state.sekolah.nipWaliKelas || '']
      ];
      const wsDasar = XLSX.utils.aoa_to_sheet(dataDasarRows);
      XLSX.utils.book_append_sheet(wb, wsDasar, 'Data Dasar');

      // 2. Sheet Data Murid
      const muridHeaders = ['NIS', 'NISN', 'Nama Siswa', 'Jenis Kelamin', 'Tempat Lahir', 'Tanggal Lahir', 'Agama', 'Nama Ayah', 'Nama Ibu', 'Pekerjaan Ayah', 'Pekerjaan Ibu', 'Alamat Ortu'];
      const muridRows = state.siswa.map(s => [
        s.nis || '',
        s.nisn || '',
        s.nama || '',
        s.jk || '',
        s.tempatLahir || '',
        s.tanggalLahir || '',
        s.agama || '',
        s.namaAyah || '',
        s.namaIbu || '',
        s.pekerjaanAyah || '',
        s.pekerjaanIbu || '',
        s.alamatOrtu || ''
      ]);
      const wsMurid = XLSX.utils.aoa_to_sheet([muridHeaders, ...muridRows]);
      XLSX.utils.book_append_sheet(wb, wsMurid, 'Data Murid');

      // 3. Sheet Mata Pelajaran
      const mapelHeaders = ['Kode', 'Nama Mata Pelajaran', 'KKTP', 'Tampil di Rapor'];
      const mapelRows = state.mapel.map(m => [
        m.kode || '',
        m.nama || '',
        m.kktp ?? 70,
        m.tampilRapor !== false ? 'Ya' : 'Tidak'
      ]);
      const wsMapel = XLSX.utils.aoa_to_sheet([mapelHeaders, ...mapelRows]);
      XLSX.utils.book_append_sheet(wb, wsMapel, 'Mata Pelajaran');

      // 4. Sheet Tujuan Pembelajaran (TP)
      const tpHeaders = ['Mata Pelajaran', 'Kode TP', 'Deskripsi TP', 'Semester'];
      const tpRows = (state.tujuanPembelajaran || []).map(tp => {
        const m = state.mapel.find(item => item.id === tp.mapelId);
        return [
          m?.nama || tp.mapelId,
          tp.kode || '',
          tp.deskripsi || '',
          tp.semester || ''
        ];
      });
      const wsTp = XLSX.utils.aoa_to_sheet([tpHeaders, ...tpRows]);
      XLSX.utils.book_append_sheet(wb, wsTp, 'Tujuan Pembelajaran');

      const filename = `E-Rapor Edi Brata Data Seluruhnya ${formatTimestampFileName()}.xlsx`;
      XLSX.writeFile(wb, filename);
      showToast('Seluruh data berhasil diekspor ke Excel!');
    } catch (err) {
      showToast('Gagal mengekspor data ke Excel.', true);
    }
  };

  // --- BACKUP JSON ---
  const handleBackupJSON = () => {
    try {
      const fullState = {
        ...state,
        backupDate: new Date().toISOString(),
        version: 'v5.0'
      };
      const jsonStr = JSON.stringify(fullState, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `E-Rapor Edi Brata Backup ${formatTimestampFileName()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('File Backup JSON berhasil diunduh!');
    } catch (err) {
      showToast('Gagal membuat file backup JSON.', true);
    }
  };

  // --- RESTORE JSON ---
  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Format JSON tidak valid');
        }

        const confirmRestore = window.confirm(
          `Apakah Anda yakin ingin memulihkan data dari file backup ini?\nData sekolah: ${parsed.sekolah?.nama || 'Tidak diketahui'}\nJumlah Siswa: ${parsed.siswa?.length || 0}`
        );

        if (!confirmRestore) return;

        // Pulihkan properti utama
        if (parsed.sekolah) updateSekolah(parsed.sekolah);
        if (Array.isArray(parsed.siswa)) updateState('siswa', parsed.siswa);
        if (Array.isArray(parsed.mapel)) updateState('mapel', parsed.mapel);
        if (Array.isArray(parsed.tujuanPembelajaran)) updateState('tujuanPembelajaran', parsed.tujuanPembelajaran);
        if (parsed.nilai) updateState('nilai', parsed.nilai);
        if (Array.isArray(parsed.ekstrakurikuler)) updateState('ekstrakurikuler', parsed.ekstrakurikuler);
        if (parsed.nilaiEkskul) updateState('nilaiEkskul', parsed.nilaiEkskul);
        if (Array.isArray(parsed.projek)) updateState('projek', parsed.projek);
        if (Array.isArray(parsed.dimensiProjek)) updateState('dimensiProjek', parsed.dimensiProjek);
        if (parsed.nilaiP5) updateState('nilaiP5', parsed.nilaiP5);
        if (parsed.dataPendukung) updateState('dataPendukung', parsed.dataPendukung);
        if (parsed.customDeskripsiMapel) updateState('customDeskripsiMapel', parsed.customDeskripsiMapel);
        if (parsed.customDeskripsiKokurikuler) updateState('customDeskripsiKokurikuler', parsed.customDeskripsiKokurikuler);

        showToast('Data aplikasi berhasil dipulihkan secara penuh dari Backup JSON!');
      } catch (err) {
        showToast('Gagal memulihkan file JSON. Pastikan file backup valid.', true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="w-full animate-in fade-in duration-200 pb-20 space-y-6">
      
      {/* Toast Notifikasi */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 ${
          toastMessage.isError ? 'bg-rose-900 text-white border-rose-700' : 'bg-slate-900 text-white border-slate-700'
        }`}>
          {toastMessage.isError ? <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" /> : <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Unified Compact Header & Tab Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-indigo-900 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800">Pusat Manajemen Data</h1>
          </div>
        </div>

        {/* Compact Segmented Control Pills Navigation with Tooltips */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 overflow-x-auto self-start lg:self-auto max-w-full">
          <Tooltip content="Kotak Sampah (Kelola & pulihkan data terhapus)" position="bottom">
            <button
              type="button"
              onClick={() => setActiveTab('sampah')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'sampah'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Kotak Sampah</span>
              {(state.trash || []).length > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-black rounded-full bg-rose-500 text-white leading-none">
                  {(state.trash || []).length}
                </span>
              )}
            </button>
          </Tooltip>

          <Tooltip content="Ekspor seluruh data rapor ke format Excel (.xlsx)" position="bottom">
            <button
              type="button"
              onClick={() => setActiveTab('ekspor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'ekspor'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Ekspor Excel</span>
            </button>
          </Tooltip>

          <Tooltip content="Impor pendaftaran data murid atau data dasar lembaga" position="bottom">
            <button
              type="button"
              onClick={() => setActiveTab('impor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'impor'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Impor Excel</span>
            </button>
          </Tooltip>

          <Tooltip content="Cadangkan 100% data aplikasi ke berkas JSON aman" position="bottom">
            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'backup'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
              }`}
            >
              <FileJson className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Backup JSON</span>
            </button>
          </Tooltip>

          <Tooltip content="Pulihkan keadaan aplikasi dari berkas backup JSON" position="bottom">
            <button
              type="button"
              onClick={() => setActiveTab('restore')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'restore'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border border-transparent'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Restore JSON</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Main Tab Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5">
          
          {/* 1. KOTAK SAMPAH */}
          {activeTab === 'sampah' && (
            <KotakSampah />
          )}

          {/* 2. EKSPOR EXCEL */}
          {activeTab === 'ekspor' && (
            <div className="max-w-2xl mx-auto py-6 space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Ekspor Data Rapor ke Spreadsheet Excel</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Unduh seluruh kumpulan data (Data Dasar, Data Siswa, Mata Pelajaran, TP) ke dalam format buku kerja Excel (.xlsx).
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Total Peserta Didik:</span>
                  <span className="font-bold text-slate-800">{state.siswa.length} Siswa</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Mata Pelajaran Aktif:</span>
                  <span className="font-bold text-slate-800">{state.mapel.length} Mapel</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Tujuan Pembelajaran:</span>
                  <span className="font-bold text-slate-800">{(state.tujuanPembelajaran || []).length} TP</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportFullExcel}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Seluruh Data Excel (.xlsx)</span>
              </button>
            </div>
          )}

          {/* 3. IMPOR EXCEL */}
          {activeTab === 'impor' && (
            <div className="max-w-2xl mx-auto py-6 space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Impor Data Siswa atau Data Dasar</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Unggah file Excel yang telah disesuaikan dengan format template resmi aplikasi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Data Murid</h4>
                    <p className="text-xs text-slate-500 mt-1">Impor pendaftaran nama, NIS, NISN, dan data orang tua siswa.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Buka menu Data Murid untuk mengunggah berkas Excel murid!');
                    }}
                    className="w-full py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Petunjuk Impor Murid</span>
                  </button>
                </div>

                <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Data Dasar Lembaga</h4>
                    <p className="text-xs text-slate-500 mt-1">Impor profil lembaga, alamat, dan pejabat sekolah.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Buka menu Data Dasar untuk mengunggah berkas Excel lembaga!');
                    }}
                    className="w-full py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Petunjuk Impor Lembaga</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. BACKUP JSON */}
          {activeTab === 'backup' && (
            <div className="max-w-2xl mx-auto py-6 space-y-6 animate-in fade-in duration-200">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-200 shadow-xs">
                  <FileJson className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Cadangkan Seluruh Data (Backup JSON)</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Simpan arsip cadangan 100% lengkap berisi nilai, asesmen, catatan, tanda tangan, dan konfigurasi rapor ke dalam satu berkas aman.
                </p>
              </div>

              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4.5 text-xs text-indigo-900 space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span>Keamanan Cadangan Terjamin</span>
                </div>
                <p className="leading-relaxed text-[11px] text-indigo-800">
                  File backup ini dapat disimpan di flashdisk atau Google Drive Anda, dan dapat dipulihkan kapan saja melalui menu <strong>Restore JSON</strong> di laptop/komputer mana pun tanpa kehilangan satu pun data.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBackupJSON}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File Cadangan (.json)</span>
              </button>
            </div>
          )}

          {/* 5. RESTORE JSON */}
          {activeTab === 'restore' && (
            <div className="max-w-2xl mx-auto py-6 space-y-6 animate-in fade-in duration-200">
              <input 
                type="file" 
                ref={restoreJsonRef} 
                accept=".json" 
                onChange={handleRestoreJSON} 
                className="hidden" 
              />

              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                  <RotateCcw className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Pulihkan Data dari Berkas Backup</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Pilih file backup JSON (.json) yang sebelumnya diunduh untuk mengembalikan seluruh keadaan aplikasi.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4.5 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Peringatan Pemulihan</span>
                </div>
                <p className="leading-relaxed text-[11px] text-amber-800">
                  Memulihkan data akan menggantikan data yang saat ini ada di aplikasi dengan data yang tersimpan di dalam file backup JSON yang Anda pilih.
                </p>
              </div>

              <button
                type="button"
                onClick={() => restoreJsonRef.current?.click()}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Upload className="w-4 h-4" />
                <span>Pilih Berkas JSON & Pulihkan Data</span>
              </button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
