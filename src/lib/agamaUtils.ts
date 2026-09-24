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

  // Deteksi tag kurung siku, kurung biasa, atau keyword agama
  if (desc.includes('[islam]') || desc.includes('(islam)') || code.includes('islam') || code.includes('.pai.') || code.includes('.isl.') || code === 'pai' || code.includes('pabp-islam')) return 'Islam';
  if (desc.includes('[kristen]') || desc.includes('(kristen)') || code.includes('kristen') || code.includes('.pak.') || code.includes('.krs.') || code === 'pak' || code.includes('pabp-kristen')) return 'Kristen';
  if (desc.includes('[katolik]') || desc.includes('(katolik)') || code.includes('katolik') || code.includes('.pkat.') || code.includes('.kat.') || code === 'pkat' || code.includes('pabp-katolik')) return 'Katolik';
  if (desc.includes('[hindu]') || desc.includes('(hindu)') || code.includes('hindu') || code.includes('.pah.') || code.includes('.hin.') || code === 'pah' || code.includes('pabp-hindu')) return 'Hindu';
  if (desc.includes('[buddha]') || desc.includes('(buddha)') || desc.includes('budha') || code.includes('buddha') || code.includes('budha') || code.includes('.pab.') || code.includes('.bud.') || code === 'pab' || code.includes('pabp-buddha')) return 'Buddha';
  if (desc.includes('[khonghucu]') || desc.includes('(khonghucu)') || desc.includes('konghucu') || code.includes('khonghucu') || code.includes('konghucu') || code.includes('.pakong.') || code.includes('.kong.') || code === 'pakong' || code.includes('pabp-khonghucu')) return 'Khonghucu';

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
  if (!isPabp || !tps || tps.length === 0) return tps;

  const sAgama = normalizeAgama(studentAgama) || 'Islam';

  // Periksa apakah di dalam kumpulan TP terdapat pembedaan agama
  const hasAgamaSpecific = tps.some(tp => getTpAgama(tp) !== null);

  if (hasAgamaSpecific) {
    const strictlyMatched = tps.filter(tp => {
      const tpAgama = getTpAgama(tp);
      // Cocok jika secara eksplisit sesuai agama siswa
      return tpAgama === sAgama;
    });

    if (strictlyMatched.length > 0) {
      return strictlyMatched;
    }
  }

  // Jika tidak ada yang strictly match atau TP bersifat umum, filter yang tidak konflik
  const matched = tps.filter(tp => {
    const tpAgama = getTpAgama(tp);
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
