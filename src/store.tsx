import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState } from './types';
import { INITIAL_STATE } from './constants';
import { supabase } from '@/lib/supabase';

export type SyncStatus = 'synced' | 'syncing' | 'error';

export function deepMerge(target: any, source: any): any {
  if (target === null || typeof target !== 'object' || Array.isArray(target)) {
    return source !== undefined ? source : target;
  }
  
  if (source === null || typeof source !== 'object' || Array.isArray(source)) {
    return source !== undefined ? source : target;
  }

  const output = { ...target };
  Object.keys(source).forEach(key => {
    if (source[key] !== undefined) {
      if (key in target && typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
  });
  return output;
}

interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  updateSekolah: (data: Partial<AppState['sekolah']>) => void;
  updateState: <K extends keyof AppState>(key: K, data: AppState[K]) => void;
  syncToDatabase: () => Promise<void>;
  syncStatus: SyncStatus;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'rapor_kumer_state';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return deepMerge(INITIAL_STATE, parsed);
      }
    } catch (e) {
      console.error('Failed to load state from LS', e);
    }
    return INITIAL_STATE;
  });

  const stateRef = useRef<AppState>(state);
  
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const syncToDatabase = async () => {
    const currentState = stateRef.current;
    if (!currentState.isAuthenticated || !currentState.sekolah?.npsn) return;
    
    // Create Composite Key: NPSN_TahunAjaran_Semester_Kelas_Rombel
    const compositeNpsn = `${currentState.sekolah.npsn}_${currentState.sekolah.tahunAjaran || ''}_${currentState.sekolah.semester || ''}_${currentState.sekolah.kelas || ''}_${currentState.sekolah.ruangRombel || ''}`.replace(/\s+/g, '-');

    setSyncStatus('syncing');
    try {
      const { error } = await supabase
        .from('aplikasirapor')
        .upsert(
          { 
            npsn: compositeNpsn, 
            data_payload: currentState 
          },
          { onConflict: 'npsn' }
        );
      if (error) {
        console.warn("Error syncing to Supabase:", error.message || error);
        setSyncStatus('error');
      } else {
        setSyncStatus('synced');
      }
    } catch (error) {
      console.warn("Network offline, cannot sync to Supabase:", error);
      setSyncStatus('error');
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    // Auto-save ke Supabase dengan teknik Debounce (Tunda 2 detik)
    if (state.isAuthenticated && state.sekolah?.npsn) {
      const timeoutId = setTimeout(() => {
        syncToDatabase().catch(err => console.error('Auto-sync error:', err));
      }, 2000);
      
      // Bersihkan timer jika ada perubahan state baru sebelum 2 detik selesai
      return () => clearTimeout(timeoutId);
    }
  }, [state]);

  useEffect(() => {
    const handleOnline = () => {
      if (syncStatus === 'error') {
        syncToDatabase();
      }
    };
    const handleOffline = () => setSyncStatus('error');

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          // Only update if it's actually different to prevent infinite loops
          if (JSON.stringify(stateRef.current) !== e.newValue) {
            setState(newState);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorage);
    };
  }, [syncStatus]);

  useEffect(() => {
    // Fetch baseline updates on mount/refresh if authenticated
    const fetchLatestBaseline = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      try {
        const currentState = JSON.parse(saved);
        if (!currentState.isAuthenticated || !currentState.sekolah?.npsn) return;

        let dbData, dbError;
        try {
          const res = await supabase
            .from('registrasirapor')
            .select('*')
            .eq('data_payload->>npsn', currentState.sekolah.npsn.trim())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          dbData = res.data;
          dbError = res.error;
        } catch (fetchErr) {
          console.warn("Fetch error or offline during baseline update:", fetchErr);
          return;
        }

        if (dbError || !dbData) return;

        const payload = dbData.data_payload ? { ...dbData, ...dbData.data_payload } : dbData || {};
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

        const sekolahUpdates: Partial<AppState['sekolah']> = {};

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

        // PULL/FETCH DARI APLIKASIRAPOR (SINKRONISASI 2 ARAH SAAT REFRESH)
        const compositeNpsn = `${currentState.sekolah.npsn}_${currentState.sekolah.tahunAjaran || ''}_${currentState.sekolah.semester || ''}_${currentState.sekolah.kelas || ''}_${currentState.sekolah.ruangRombel || ''}`.replace(/\s+/g, '-');
        
        try {
          const { data: raporData, error: raporError } = await supabase
            .from('aplikasirapor')
            .select('data_payload')
            .eq('npsn', compositeNpsn)
            .maybeSingle();

          if (!raporError && raporData && raporData.data_payload) {
            setState((prev) => {
              const newState = deepMerge(prev, raporData.data_payload);
              if (Object.keys(sekolahUpdates).length > 0) {
                newState.sekolah = { ...newState.sekolah, ...sekolahUpdates };
              }
              return newState;
            });
            return; // Selesai sinkronisasi payload terbaru
          }
        } catch (err) {
          console.warn("Gagal menarik payload aplikasirapor pada refresh", err);
        }

        // FALLBACK: Jika tidak ada data nilai di aplikasirapor, tetap update profil sekolah dari registrasirapor
        if (Object.keys(sekolahUpdates).length > 0) {
          setState((prev) => ({
            ...prev,
            sekolah: { ...prev.sekolah, ...sekolahUpdates }
          }));
        }
      } catch (e) {
        console.error("Failed to fetch baseline on refresh", e);
      }
    };
    
    fetchLatestBaseline();
  }, []);

  const updateSekolah = (data: Partial<AppState['sekolah']>) => {
    setState((prev) => ({
      ...prev,
      sekolah: { ...prev.sekolah, ...data, timestamp: Date.now() },
    }));
  };

  const updateState = <K extends keyof AppState>(key: K, data: AppState[K]) => {
    setState((prev) => ({ ...prev, [key]: data }));
  };

  return (
    <AppContext.Provider value={{ state, setState, updateSekolah, updateState, syncToDatabase, syncStatus }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
