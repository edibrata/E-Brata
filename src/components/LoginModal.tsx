import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore, deepMerge } from '@/store';
import { INITIAL_STATE, getDefaultMapelForKelas } from '@/constants';
import { Lock, AlertCircle, Loader2, ArrowRight, Home, Plus, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import DeveloperProfileModal from './DeveloperProfileModal';

export default function LoginModal() {
  const [step, setStep] = useState<1 | 2>(1);
  const [npsn, setNpsn] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDevProfileModal, setShowDevProfileModal] = useState(false);
  const { updateSekolah, updateState, setState } = useAppStore();
  
  // State for step 2
  const [baselineData, setBaselineData] = useState<any>(null);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<any[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    tahunAjaran: '',
    semester: '1',
    kelas: '',
    ruangRombel: ''
  });

  // State for Edit Ruang Kerja
  const [editingWorkspace, setEditingWorkspace] = useState<any | null>(null);
  const [editWorkspaceData, setEditWorkspaceData] = useState({
    tahunAjaran: '',
    semester: '1',
    kelas: '1',
    ruangRombel: 'satu'
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleVerifyNpsn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!npsn.trim()) {
      setError('NPSN tidak boleh kosong');
      return;
    }

    setIsLoading(true);

    try {
      let data = null;
      let sbError = null;

      try {
        const { data: dbData, error } = await supabase
          .from('registrasirapor')
          .select('*')
          .eq('data_payload->>npsn', npsn.trim())
          .single();
        data = dbData;
        sbError = error;
      } catch (fetchErr) {
        console.error("Fetch error:", fetchErr);
        setError('Gagal menghubungi server database. Silakan coba lagi.');
        setIsLoading(false);
        return;
      }

      if (!data && sbError) {
        console.error(sbError);
        setError('NPSN tidak ditemukan di database. Anda tidak memiliki akses ke aplikasi ini.');
        setIsLoading(false);
        return;
      }

      // Map the returned data
      const payload = data.data_payload ? { ...data, ...data.data_payload } : data || {};
      const sekolahUpdates: any = {};
      
      const normalizedPayload: Record<string, any> = {};
      Object.keys(payload).forEach(key => {
        normalizedPayload[key.toLowerCase().trim().replace(/-/g, '_')] = payload[key];
      });

      const findVal = (...keys: string[]) => {
        for (const k of keys) {
          if (normalizedPayload[k.replace(/-/g, '_')] !== undefined) return normalizedPayload[k.replace(/-/g, '_')];
        }
        return undefined;
      };

      const valNama = findVal('nama lengkap sekolah', 'nama_sekolah', 'nama sekolah', 'nama_lengkap', 'nama');
      if (valNama) sekolahUpdates.nama = valNama;

      const valNpsn = findVal('npsn', 'npsn_sekolah');
      if (valNpsn) sekolahUpdates.npsn = valNpsn;

      const valAlamat = findVal('jalan/blok/rt rw', 'alamat', 'alamat lengkap', 'alamat_lengkap');
      if (valAlamat) sekolahUpdates.alamat = valAlamat;
      
      const valJenisWilayah = findVal('desa/kelurahan', 'desa_kelurahan_jenis', 'jenis wilayah', 'jenis_wilayah');
      if (valJenisWilayah) sekolahUpdates.desaKelurahanJenis = valJenisWilayah.toString().toLowerCase();
      
      const valNamaDesaKel = findVal('nama desa/kelurahan', 'desa_kelurahan_nama', 'nama desa/kel.', 'nama_desa_kelurahan', 'desa_kelurahan', 'desa', 'kelurahan');
      if (valNamaDesaKel) sekolahUpdates.desaKelurahanNama = valNamaDesaKel;
      
      const valKecamatan = findVal('kecamatan', 'nama kecamatan');
      if (valKecamatan) sekolahUpdates.kecamatan = valKecamatan;
      
      const valTipeDaerah = findVal('kabupaten/kota', 'kabupaten_kota_jenis', 'tipe daerah', 'tipe_daerah', 'jenis_kabupaten_kota');
      if (valTipeDaerah) sekolahUpdates.kabupatenKotaJenis = valTipeDaerah.toString().toLowerCase();
      
      const valNamaKabKota = findVal('nama kabupaten/kota', 'kabupaten_kota_nama', 'nama kab/kota', 'nama_kab_kota', 'kab_kota');
      if (valNamaKabKota) sekolahUpdates.kabupatenKotaNama = valNamaKabKota;
      
      const valProvinsi = findVal('provinsi', 'nama_provinsi', 'nama provinsi');
      if (valProvinsi) sekolahUpdates.provinsi = valProvinsi;

      const classes = findVal('fase/kelas utama', 'kelas', 'fase', 'fase_kelas_utama');
      if (Array.isArray(classes)) {
        sekolahUpdates.allowedKelas = classes.map(String);
      } else if (typeof classes === 'string' && classes.includes(',')) {
        sekolahUpdates.allowedKelas = classes.split(',').map(s => s.trim());
      } else if (typeof classes === 'string' || typeof classes === 'number') {
        sekolahUpdates.allowedKelas = [classes.toString()];
      }

      setBaselineData(sekolahUpdates);

      // Now fetch existing workspaces for this NPSN from aplikasirapor
      let workspacesData = null;
      let workspacesError = null;

      try {
        const res = await supabase
          .from('aplikasirapor')
          .select('npsn, data_payload->sekolah')
          .like('npsn', `${npsn.trim()}_%`)
          .order('created_at', { ascending: false });
        workspacesData = res.data;
        workspacesError = res.error;
      } catch (fetchErr) {
        console.warn("Could not fetch workspaces", fetchErr);
      }

      if (!workspacesError && workspacesData) {
        setAvailableWorkspaces(workspacesData);
      }

      setStep(2);

    } catch (err: any) {
      setError('Terjadi kesalahan tidak terduga.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkspace = async (workspaceNpsn: string) => {
    setIsLoading(true);
    try {
      const res = await supabase
        .from('aplikasirapor')
        .select('*')
        .eq('npsn', workspaceNpsn)
        .single();
      const appData = res.data;
      const appError = res.error;
        
      if (!appError && appData && appData.data_payload) {
        // Backfill fase if missing from old data
        let faseFallback = appData.data_payload.sekolah?.fase;
        if (!faseFallback && appData.data_payload.sekolah?.kelas) {
            const num = parseInt(appData.data_payload.sekolah.kelas.toString(), 10);
            if (num === 1 || num === 2) faseFallback = 'A';
            else if (num === 3 || num === 4) faseFallback = 'B';
            else if (num === 5 || num === 6) faseFallback = 'C';
        }

        // Try to find the most up-to-date school profile from availableWorkspaces to keep global data in sync across classes
        const latestGlobalSekolah: any = {};
        if (availableWorkspaces && availableWorkspaces.length > 0) {
          const baseNpsn = workspaceNpsn.split('_')[0];
          const relevantWorkspaces = availableWorkspaces.filter(ws => ws.npsn.startsWith(baseNpsn + '_'));
          
          relevantWorkspaces.sort((a, b) => {
            const tA = a.sekolah?.timestamp || 0;
            const tB = b.sekolah?.timestamp || 0;
            return tB - tA;
          });

          if (relevantWorkspaces.length > 0) {
            const bestSekolah = relevantWorkspaces[0].sekolah || {};
            // Extract only the global school-level properties
            const globalProps = [
              'nama', 'alamat', 'desaKelurahanJenis', 'desaKelurahanNama', 
              'kecamatan', 'kabupatenKotaJenis', 'kabupatenKotaNama', 'provinsi', 
              'kodePos', 'telepon', 'email', 'website', 'kepsek', 'nipKepsek', 
              'waKepalaSekolah', 'lokasiTitimangsa', 'tanggalBiodata', 'tanggalRapor',
              'logoTutWuri', 'logoSekolah', 'logoPemda', 'bobotSumatifLingkup', 
              'bobotSumatifSemester', 'useDigitalSignature', 'ttdKepsek'
            ];
            
            globalProps.forEach(prop => {
              if (bestSekolah[prop] !== undefined && bestSekolah[prop] !== null && bestSekolah[prop] !== '') {
                latestGlobalSekolah[prop] = bestSekolah[prop];
              }
            });
          }
        }

        setState(prev => {
          const merged = deepMerge(INITIAL_STATE, appData.data_payload);
          return {
            ...merged,
            isAuthenticated: true,
            sekolah: {
              ...merged.sekolah,
              ...baselineData,
              ...latestGlobalSekolah,
              fase: faseFallback || appData.data_payload.sekolah?.fase
            }
          };
        });
      } else {
        setError('Gagal memuat data ruang kerja.');
      }
    } catch (err: any) {
      setError('Terjadi kesalahan memuat data ruang kerja.');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspace.tahunAjaran || !newWorkspace.semester || !newWorkspace.kelas || !newWorkspace.ruangRombel) {
      setError('Harap lengkapi semua isian ruang kerja baru.');
      return;
    }
    
    // First login, just set baseline and authenticate
    let fase = '';
    const num = parseInt(newWorkspace.kelas, 10);
    if (num === 1 || num === 2) fase = 'A';
    else if (num === 3 || num === 4) fase = 'B';
    else if (num === 5 || num === 6) fase = 'C';

    updateSekolah({
        ...baselineData,
        tahunAjaran: newWorkspace.tahunAjaran,
        semester: newWorkspace.semester,
        kelas: newWorkspace.kelas,
        fase: fase,
        ruangRombel: newWorkspace.ruangRombel
    });
    updateState('mapel', getDefaultMapelForKelas(newWorkspace.kelas));
    updateState('isAuthenticated', true);
  };

  const handleStartEditWorkspace = (e: React.MouseEvent, ws: any) => {
    e.stopPropagation();
    setError('');
    setEditingWorkspace(ws);
    setEditWorkspaceData({
      tahunAjaran: ws.sekolah?.tahunAjaran || '',
      semester: String(ws.sekolah?.semester || '1'),
      kelas: String(ws.sekolah?.kelas || '1'),
      ruangRombel: ws.sekolah?.ruangRombel || 'satu'
    });
  };

  const handleSaveEditWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkspace) return;
    setIsSavingEdit(true);
    setError('');

    try {
      const { data, error: fetchErr } = await supabase
        .from('aplikasirapor')
        .select('data_payload')
        .eq('npsn', editingWorkspace.npsn)
        .single();

      if (fetchErr || !data) {
        setError('Gagal membaca data ruang kerja dari server.');
        setIsSavingEdit(false);
        return;
      }

      let fase = '';
      const num = parseInt(editWorkspaceData.kelas, 10);
      if (num === 1 || num === 2) fase = 'A';
      else if (num === 3 || num === 4) fase = 'B';
      else if (num === 5 || num === 6) fase = 'C';

      const updatedSekolah = {
        ...(data.data_payload?.sekolah || {}),
        tahunAjaran: editWorkspaceData.tahunAjaran,
        semester: editWorkspaceData.semester,
        kelas: editWorkspaceData.kelas,
        fase: fase,
        ruangRombel: editWorkspaceData.ruangRombel,
        timestamp: Date.now()
      };

      const updatedPayload = {
        ...data.data_payload,
        sekolah: updatedSekolah
      };

      const { error: updateErr } = await supabase
        .from('aplikasirapor')
        .update({ data_payload: updatedPayload })
        .eq('npsn', editingWorkspace.npsn);

      if (updateErr) {
        setError('Gagal menyimpan perubahan ruang kerja.');
      } else {
        setAvailableWorkspaces(prev => prev.map(w => {
          if (w.npsn === editingWorkspace.npsn) {
            return {
              ...w,
              sekolah: updatedSekolah
            };
          }
          return w;
        }));
        setEditingWorkspace(null);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menyimpan perubahan.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteWorkspace = async (e: React.MouseEvent, ws: any) => {
    e.stopPropagation();
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus permanen ruang kerja Kelas ${ws.sekolah?.kelas || ''} - ${ws.sekolah?.ruangRombel || ''}?`
    );
    if (!confirmDelete) return;

    setError('');
    try {
      const { error: deleteErr } = await supabase
        .from('aplikasirapor')
        .delete()
        .eq('npsn', ws.npsn);

      if (deleteErr) {
        setError('Gagal menghapus ruang kerja dari database server.');
      } else {
        setAvailableWorkspaces(prev => prev.filter(w => w.npsn !== ws.npsn));
      }
    } catch (err) {
      setError('Terjadi kesalahan saat menghapus ruang kerja.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-6 md:p-8">
          
          {step === 1 && (
              <>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-zinc-100 text-zinc-900 rounded-xl flex items-center justify-center">
                  <Lock size={24} />
                </div>
                <div 
                  className="flex items-center gap-2 bg-zinc-50 hover:bg-white px-3 py-1.5 rounded-full border border-zinc-100 hover:border-zinc-200 cursor-pointer transition-all shadow-sm group"
                  onClick={() => setShowDevProfileModal(true)}
                >
                  <img src="https://raw.githubusercontent.com/edibrata/image/main/FotoEdiBrata.jpg" alt="Edi Brata" className="w-5 h-5 rounded-full object-cover group-hover:ring-2 ring-indigo-400 transition-all" />
                  <span className="text-[11px] font-bold text-zinc-500 group-hover:text-zinc-900 uppercase tracking-wider transition-colors">Edi Brata</span>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-zinc-800 mb-2">Autentikasi Aplikasi</h2>
              <p className="text-sm text-zinc-500 mb-8">
                Silakan masukkan NPSN sekolah Anda untuk sinkronisasi data dasar dan membuka kunci akses pelaporan.
              </p>

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleVerifyNpsn} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="npsn" className="block text-sm font-semibold text-zinc-700">NPSN</label>
                  <input
                    id="npsn"
                    type="text"
                    placeholder="Masukkan 8 Digit NPSN"
                    value={npsn}
                    onChange={(e) => setNpsn(e.target.value)}
                    className="w-full px-4 py-3.5 border border-zinc-300 rounded-xl shadow-xs focus:outline-none focus:ring-4 focus:ring-zinc-500/10 focus:border-zinc-500 text-xl font-bold text-center tracking-wider text-zinc-800 placeholder:text-sm placeholder:font-normal placeholder:tracking-normal"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-zinc-900 hover:bg-zinc-950 text-white font-semibold flex items-center justify-center py-3 px-4 rounded-lg transition-colors focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>Verifikasi NPSN <ArrowRight size={18} className="ml-2" /></>
                  )}
                </button>
              </form>
            </>
          )}

          {step === 2 && (
             <>
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => { setStep(1); setIsCreatingNew(false); }} className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-colors">
                        <ArrowRight size={16} className="rotate-180" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-zinc-800">Pilih Ruang Kerja</h2>
                        <p className="text-xs text-zinc-500">{baselineData?.nama} ({npsn})</p>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                    </div>
                )}

                {editingWorkspace ? (
                    <form onSubmit={handleSaveEditWorkspace} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 mb-2">
                        <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 border-b border-indigo-100 pb-2 flex items-center justify-between">
                            <span>Edit Ruang Kerja</span>
                            <span className="text-[10px] text-zinc-400 font-normal">Perbarui Identitas</span>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-zinc-700">Tahun Ajaran</label>
                                <input required type="text" placeholder="2023/2024" value={editWorkspaceData.tahunAjaran} onChange={(e) => setEditWorkspaceData({...editWorkspaceData, tahunAjaran: e.target.value})} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-zinc-700">Semester</label>
                                <select value={editWorkspaceData.semester} onChange={(e) => setEditWorkspaceData({...editWorkspaceData, semester: e.target.value})} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                                    <option value="1">1 (Ganjil)</option>
                                    <option value="2">2 (Genap)</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-zinc-700">Kelas</label>
                                <select required value={editWorkspaceData.kelas} onChange={(e) => setEditWorkspaceData({...editWorkspaceData, kelas: e.target.value})} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                    <option value="6">6</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-zinc-700">Rombel</label>
                                <select required value={editWorkspaceData.ruangRombel} onChange={(e) => setEditWorkspaceData({...editWorkspaceData, ruangRombel: e.target.value})} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                                    <option value="satu">Hanya Satu (Default)</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                    <option value="E">E</option>
                                    <option value="F">F</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6 mt-6 border-t border-zinc-100">
                            <button
                                type="button"
                                onClick={() => setEditingWorkspace(null)}
                                disabled={isSavingEdit}
                                className="flex-1 border bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700 font-semibold flex items-center justify-center py-2.5 px-4 rounded-lg transition-colors focus:outline-none"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isSavingEdit}
                                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center py-2.5 px-4 rounded-lg transition-colors focus:outline-none shadow-sm disabled:opacity-70"
                            >
                                {isSavingEdit ? <Loader2 size={18} className="animate-spin" /> : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                ) : !isCreatingNew ? (
                    <div className="space-y-4">
                        {availableWorkspaces.length > 0 && (
                            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Lanjutkan Pekerjaan</label>
                                {availableWorkspaces.map((ws, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => loadWorkspace(ws.npsn)}
                                        className="w-full flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 hover:border-indigo-300 hover:bg-zinc-50/50 transition-colors text-left group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-zinc-100 text-zinc-900 rounded-lg group-hover:bg-zinc-200 transition-colors">
                                                <FolderOpen size={18} />
                                            </div>
                                            <div>
                                                 <p className="font-semibold text-zinc-800 text-sm">Kelas {ws.sekolah?.kelas} - {ws.sekolah?.ruangRombel}</p>
                                                 <p className="text-xs text-zinc-500">{ws.sekolah?.tahunAjaran} | Smt {ws.sekolah?.semester}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                title="Edit Identitas Ruang Kerja"
                                                onClick={(e) => handleStartEditWorkspace(e, ws)}
                                                className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                title="Hapus Ruang Kerja"
                                                onClick={(e) => handleDeleteWorkspace(e, ws)}
                                                className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                            <div className="p-1.5 text-zinc-400 group-hover:text-zinc-900 transition-colors">
                                                <ArrowRight size={16} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-2 border-t border-zinc-100">
                             <button
                                onClick={() => setIsCreatingNew(true)}
                                className="w-full border-2 border-dashed border-zinc-300 text-zinc-600 hover:border-indigo-400 hover:text-zinc-900 hover:bg-zinc-50 font-medium flex items-center justify-center py-3 px-4 rounded-xl transition-all focus:outline-none"
                            >
                                <Plus size={18} className="mr-2" />
                                Buat Ruang Kerja Baru
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={createNewWorkspace} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 mb-2">
                        <label className="block text-xs font-bold text-zinc-900 uppercase tracking-wider mb-4 border-b border-zinc-100 pb-2">Identitas Ruang Kelas</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-zinc-700">Tahun Ajaran</label>
                                <input required type="text" placeholder="2023/2024" value={newWorkspace.tahunAjaran} onChange={(e) => setNewWorkspace({...newWorkspace, tahunAjaran: e.target.value})} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-zinc-700">Semester</label>
                                <select value={newWorkspace.semester} onChange={(e) => setNewWorkspace({...newWorkspace, semester: e.target.value})} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500">
                                    <option value="1">1 (Ganjil)</option>
                                    <option value="2">2 (Genap)</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-zinc-700">Kelas</label>
                                <select required value={newWorkspace.kelas} onChange={(e) => setNewWorkspace({...newWorkspace, kelas: e.target.value})} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500">
                                    <option value="">Pilih</option>
                                    {baselineData?.allowedKelas?.map((k: string) => (
                                         <option key={k} value={k}>{k}</option>
                                    ))}
                                    {(!baselineData?.allowedKelas || baselineData?.allowedKelas.length === 0) && (
                                        <>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                            <option value="5">5</option>
                                            <option value="6">6</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-zinc-700">Rombel</label>
                                <select required value={newWorkspace.ruangRombel} onChange={(e) => setNewWorkspace({...newWorkspace, ruangRombel: e.target.value})} className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500">
                                    <option value="">Pilih</option>
                                    <option value="satu">Hanya Satu (Default)</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                    <option value="D">D</option>
                                    <option value="E">E</option>
                                    <option value="F">F</option>
                                </select>
                            </div>
                        </div>

                         <div className="flex gap-3 pt-6 mt-6 border-t border-zinc-100">
                             <button
                                type="button"
                                onClick={() => setIsCreatingNew(false)}
                                className="flex-1 border bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700 font-semibold flex items-center justify-center py-2.5 px-4 rounded-lg transition-colors focus:outline-none"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] bg-zinc-900 hover:bg-zinc-950 text-white font-semibold flex items-center justify-center py-2.5 px-4 rounded-lg transition-colors focus:outline-none shadow-sm"
                            >
                                Masuk Aplikasi
                            </button>
                        </div>
                    </form>
                )}
             </>
          )}
        </div>
      </div>
      <DeveloperProfileModal isOpen={showDevProfileModal} onClose={() => setShowDevProfileModal(false)} />
    </div>
  );
}
