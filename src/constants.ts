import { Mapel, AppState } from './types';
import { DEFAULT_LOGO_TUT_WURI } from './data/defaultLogoTutWuri';

export const getDefaultMapelForKelas = (kelasStr?: string | number): Mapel[] => {
  const num = parseInt(String(kelasStr || '1').replace(/[^0-9]/g, ''), 10);
  const commonRatio = { slm: 75, sas: 25 };

  const pabp: Mapel = { id: 'm_pabp', nama: 'Pendidikan Agama dan Budi Pekerti', kode: 'pabp', kelompok: 'Pokok', tampilRapor: true, opsiPengolahan: 'rata-rata', pakaiSas: true, rasioSlmSas: commonRatio };
  const pancasila: Mapel = { id: 'm_pp', nama: 'Pendidikan Pancasila', kode: 'pp', kelompok: 'Pokok', tampilRapor: true, opsiPengolahan: 'rata-rata', pakaiSas: true, rasioSlmSas: commonRatio };
  const ind: Mapel = { id: 'm_ind', nama: 'Bahasa Indonesia', kode: 'ind', kelompok: 'Pokok', tampilRapor: true, opsiPengolahan: 'rata-rata', pakaiSas: true, rasioSlmSas: commonRatio };
  const mtk: Mapel = { id: 'm_mtk', nama: 'Matematika', kode: 'mtk', kelompok: 'Pokok', tampilRapor: true, opsiPengolahan: 'rata-rata', pakaiSas: true, rasioSlmSas: commonRatio };
  const ipas: Mapel = { id: 'm_ipas', nama: 'Ilmu Pengetahuan Alam dan Sosial', kode: 'ipas', kelompok: 'Pokok', tampilRapor: true, opsiPengolahan: 'rata-rata', pakaiSas: true, rasioSlmSas: commonRatio };
  const pjok: Mapel = { id: 'm_pjok', nama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', kode: 'pjok', kelompok: 'Pokok', tampilRapor: true, opsiPengolahan: 'rata-rata', pakaiSas: true, rasioSlmSas: commonRatio };
  const sdb: Mapel = { id: 'm_sdb', nama: 'Seni dan Budaya', kode: 'sdb', kelompok: 'Pokok', tampilRapor: true, opsiPengolahan: 'rata-rata', pakaiSas: true, rasioSlmSas: commonRatio };
  const eng: Mapel = { id: 'm_eng', nama: 'Bahasa Inggris', kode: 'eng', kelompok: 'Pokok', tampilRapor: true, opsiPengolahan: 'rata-rata', pakaiSas: true, rasioSlmSas: commonRatio };
  const koding: Mapel = { id: 'm_koding', nama: 'Koding dan Kecerdasan Artifisial', kode: 'koding', kelompok: 'Pokok', tampilRapor: true, opsiPengolahan: 'rata-rata', pakaiSas: true, rasioSlmSas: commonRatio };
  const mulok: Mapel = { id: 'm_mulok', nama: '--Silakan Ganti Mapel Muatan Lokal--', kode: 'mulok', kelompok: 'Muatan Lokal', tampilRapor: true, opsiPengolahan: 'rata-rata', pakaiSas: true, rasioSlmSas: commonRatio };

  if (num === 1 || num === 2) {
    // Kelas 1 dan Kelas 2: 7 Mapel
    return [pabp, pancasila, ind, mtk, pjok, sdb, mulok];
  } else if (num === 3 || num === 4) {
    // Kelas 3 dan Kelas 4: 9 Mapel
    return [pabp, pancasila, ind, mtk, ipas, pjok, sdb, eng, mulok];
  } else if (num === 5 || num === 6) {
    // Kelas 5 dan Kelas 6: 10 Mapel
    return [pabp, pancasila, ind, mtk, ipas, pjok, sdb, eng, koding, mulok];
  }

  // Default fallback (Kelas 1)
  return [pabp, pancasila, ind, mtk, pjok, sdb, mulok];
};

export const DAFTAR_MAPEL: Mapel[] = getDefaultMapelForKelas('1');

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();

let defaultTahunAjaran = "";
let defaultSemester = "";

if (currentMonth >= 0 && currentMonth <= 5) {
  // Jan - Jun
  defaultTahunAjaran = `${currentYear - 1}/${currentYear}`;
  defaultSemester = "1";
} else {
  // Jul - Dec
  defaultTahunAjaran = `${currentYear}/${currentYear + 1}`;
  defaultSemester = "2";
}

export const INITIAL_STATE: AppState = {
  isAuthenticated: false,
  sekolah: {
    nama: '',
    npsn: '',
    nss: '',
    nis: '',
    alamat: '',
    desaKelurahanJenis: 'desa',
    desaKelurahanNama: '',
    kecamatan: '',
    kabupatenKotaJenis: 'kabupaten',
    kabupatenKotaNama: '',
    provinsi: '',
    kodePos: '',
    telepon: '',
    email: '',
    website: '',
    kepsek: '',
    nipKepsek: '',
    waKepalaSekolah: '',
    waliKelas: '',
    nipWaliKelas: '',
    waGuru: '',
    tahunAjaran: defaultTahunAjaran,
    semester: defaultSemester,
    fase: '',
    kelas: '',
    ruangRombel: '',
    lokasiTitimangsa: 'kabupaten_kota',
    tanggalBiodata: '',
    tanggalRapor: '',
    bobotSumatifLingkup: 75,
    bobotSumatifSemester: 25,
    logo: DEFAULT_LOGO_TUT_WURI,
    logoKiri: '',
    logoKanan: '',
    coverNomenklaturBaris1: 'KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH',
    coverNomenklaturBaris2: 'REPUBLIK INDONESIA',
    useCoverNomenklatur: false,
    useDigitalSignature: false,
    ttdWaliKelas: '',
    ttdKepsek: '',
  },
  siswa: [],
  mapel: DAFTAR_MAPEL,
  tujuanPembelajaran: [],
  ekstrakurikuler: [],
  tpEkskul: [],
  nilai: {},
  projek: [],
  dimensiProjek: [],
  nilaiP5: {},
  customDeskripsiMapel: {},
  customDeskripsiKokurikuler: {},
  lockedDeskripsiMapel: {},
  lockedDeskripsiEkskul: {},
  lockedDeskripsiKokurikuler: {},
  lockedCatatanWali: {},
  dataPendukung: {},
  trash: [],
};
