import { Mapel, AppState } from './types';

export const DAFTAR_MAPEL: Mapel[] = [
  { id: 'm1', nama: 'Pendidikan Agama dan Budi Pekerti', kode: 'pabp', kelompok: 'Pokok', tampilRapor: true },
  { id: 'm2', nama: 'Pendidikan Pancasila', kode: 'pp', kelompok: 'Pokok', tampilRapor: true },
  { id: 'm3', nama: 'Bahasa Indonesia', kode: 'ind', kelompok: 'Pokok', tampilRapor: true },
  { id: 'm4', nama: 'Matematika', kode: 'mtk', kelompok: 'Pokok', tampilRapor: true },
  { id: 'm5', nama: 'Ilmu Pengetahuan Alam dan Sosial', kode: 'ipas', kelompok: 'Pokok', tampilRapor: true },
  { id: 'm6', nama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', kode: 'pjok', kelompok: 'Pokok', tampilRapor: true },
  { id: 'm7', nama: 'Seni dan Budaya', kode: 'sdb', kelompok: 'Pokok', tampilRapor: true },
  { id: 'm8', nama: 'Bahasa Inggris', kode: 'eng', kelompok: 'Pokok', tampilRapor: true },
  { id: 'm9', nama: 'Bahasa Sunda', kode: 'sunda', kelompok: 'Muatan Lokal', tampilRapor: true },
];

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
    logoKiri: '',
    logoKanan: '',
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
  trash: [],
};
