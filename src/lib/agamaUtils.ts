import { TujuanPembelajaran } from '../types';

export const AGAMA_LIST = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu'] as const;
export type AgamaType = typeof AGAMA_LIST[number];

/**
 * Mendeteksi apakah mata pelajaran adalah Pendidikan Agama dan Budi Pekerti (PABP)
 */
export const isPabpMapel = (nama?: string, kode?: string): boolean => {
  const n = (nama || '').toLowerCase().trim();
  const k = (kode || '').toLowerCase().trim();

  return (
    n.includes('agama') ||
    n.includes('pabp') ||
    k === 'pabp' ||
    k === 'pai' ||
    k === 'pak' ||
    k === 'pkat' ||
    k === 'pah' ||
    k === 'pab'
  );
};

/**
 * Mendeteksi apakah mata pelajaran terikat pada agama tertentu secara spesifik
 */
export const getMapelAgama = (nama?: string, kode?: string): AgamaType | null => {
  const n = (nama || '').toLowerCase().trim();
  const k = (kode || '').toLowerCase().trim();

  if (n.includes('islam') || k === 'pai' || k.includes('isl')) return 'Islam';
  if (n.includes('kristen') || n.includes('protestan') || k === 'pak' || k.includes('krs')) return 'Kristen';
  if (n.includes('katolik') || k === 'pkat' || k.includes('kat')) return 'Katolik';
  if (n.includes('hindu') || k === 'pah' || k.includes('hin')) return 'Hindu';
  if (n.includes('buddha') || n.includes('budha') || k === 'pab' || k.includes('bud')) return 'Buddha';
  if (n.includes('khonghucu') || n.includes('konghucu') || k === 'pakong' || k.includes('kong')) return 'Khonghucu';

  return null;
};

/**
 * Menstandarkan penamaan agama
 */
export const normalizeAgama = (agamaStr?: string): AgamaType | null => {
  if (!agamaStr) return null;
  const s = agamaStr.trim().toLowerCase();

  if (s.includes('islam')) return 'Islam';
  if (s.includes('katolik') || s.includes('catholic')) return 'Katolik';
  if (s.includes('protestan') || s.includes('kristen')) return 'Kristen';
  if (s.includes('hindu')) return 'Hindu';
  if (s.includes('buddha') || s.includes('budha')) return 'Buddha';
  if (s.includes('khonghucu') || s.includes('konghucu')) return 'Khonghucu';

  return null;
};

/**
 * Mendeteksi agama yang melekat pada sebuah TP (baik dari property agama, kode, maupun tag deskripsi)
 */
export const getTpAgama = (tp: { agama?: string; kode?: string; deskripsi?: string }): AgamaType | null => {
  if (tp.agama) {
    const norm = normalizeAgama(tp.agama);
    if (norm) return norm;
  }

  const desc = (tp.deskripsi || '').toLowerCase();
  const code = (tp.kode || '').toLowerCase();

  if (desc.includes('[islam]') || code.includes('.pai.') || code.includes('.isl.')) return 'Islam';
  if (desc.includes('[kristen]') || code.includes('.pak.') || code.includes('.krs.')) return 'Kristen';
  if (desc.includes('[katolik]') || code.includes('.pkat.') || code.includes('.kat.')) return 'Katolik';
  if (desc.includes('[hindu]') || code.includes('.pah.') || code.includes('.hin.')) return 'Hindu';
  if (desc.includes('[buddha]') || code.includes('.pab.') || code.includes('.bud.')) return 'Buddha';
  if (desc.includes('[khonghucu]') || code.includes('.pakong.') || code.includes('.kong.')) return 'Khonghucu';

  return null;
};

/**
 * Memeriksa apakah seorang siswa berhak/cocok dengan TP tertentu
 */
export const doesStudentMatchTp = (
  studentAgama?: string,
  tp?: { agama?: string; kode?: string; deskripsi?: string }
): boolean => {
  if (!tp) return true;
  const tpAgama = getTpAgama(tp);

  // Jika TP ini sifatnya umum (tidak terikat agama tertentu), semua siswa berhak
  if (!tpAgama) return true;

  const sAgama = normalizeAgama(studentAgama) || 'Islam';
  return sAgama === tpAgama;
};

/**
 * Menyaring daftar TP yang relevan untuk seorang siswa (khususnya untuk mapel PABP)
 */
export const filterTpsForStudent = (
  tps: TujuanPembelajaran[],
  studentAgama?: string,
  isPabp: boolean = false
): TujuanPembelajaran[] => {
  if (!isPabp) return tps;

  const sAgama = normalizeAgama(studentAgama);
  if (!sAgama) return tps; // Jika belum ada data agama, fallback ke semua TP

  const matched = tps.filter(tp => {
    const tpAgama = getTpAgama(tp);
    // Cocok jika seagama, atau jika TP tidak bertag agama apapun
    return !tpAgama || tpAgama === sAgama;
  });

  return matched.length > 0 ? matched : tps;
};

/**
 * Membersihkan awalan tag seperti [Islam], [Katolik], [Rupa] untuk narasi rapor
 */
export const cleanTpDeskripsi = (deskripsi: string): string => {
  if (!deskripsi) return '';
  return deskripsi.replace(/^\[.*?\]\s*/, '').trim();
};
