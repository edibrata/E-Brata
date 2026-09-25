export interface Sekolah {
  nama: string;
  npsn: string;
  nss?: string;
  nis?: string;
  alamat: string;
  desaKelurahanJenis?: string;
  desaKelurahanNama?: string;
  kecamatan?: string;
  kabupatenKotaJenis?: string;
  kabupatenKotaNama?: string;
  provinsi?: string;
  kodePos?: string;
  telepon?: string;
  email?: string;
  website?: string;
  kepsek: string;
  nipKepsek: string;
  waKepalaSekolah?: string;
  waliKelas: string;
  nipWaliKelas: string;
  waGuru?: string;
  tahunAjaran: string;
  semester: string;
  fase: string;
  kelas: string;
  ruangRombel?: string;
  allowedKelas?: (string | number)[];
  lokasiTitimangsa?: string;
  tanggalBiodata?: string;
  tanggalRapor?: string;
  bobotSumatifLingkup?: number;
  bobotSumatifSemester?: number;
  logo?: string;
  logoKiri?: string;
  logoKanan?: string;
  logoScale?: number;
  logoRotation?: number;
  logoOffsetX?: number;
  logoOffsetY?: number;
  useDigitalSignature?: boolean;
  ttdWaliKelas?: string;
  ttdWaliKelasScale?: number;
  ttdWaliKelasRotation?: number;
  ttdWaliKelasOffsetX?: number;
  ttdWaliKelasOffsetY?: number;
  ttdKepsek?: string;
  ttdKepsekScale?: number;
  ttdKepsekRotation?: number;
  ttdKepsekOffsetX?: number;
  ttdKepsekOffsetY?: number;
  timestamp?: number;
}

export interface Siswa {
  id: string;
  fotoBase64?: string;
  nis?: string;
  nisn: string;
  nama: string;
  jk: 'L' | 'P' | 'Laki-Laki' | 'Perempuan' | '';
  tempatLahir?: string;
  tanggalLahir?: string;
  tanggalMasuk?: string;
  agama?: string;
  pendidikanSebelumnya?: string;
  alamat?: string;
  namaAyah?: string;
  pekerjaanAyah?: string;
  namaIbu?: string;
  pekerjaanIbu?: string;
  jalanOrtu?: string;
  desaKelurahanOrtu?: string;
  kecamatanOrtu?: string;
  kabupatenKotaOrtu?: string;
  provinsiOrtu?: string;
  namaWali?: string;
  pekerjaanWali?: string;
  alamatWali?: string;
}

export interface Mapel {
  intervalBatas?: number[]; // [batas1, batas2, batas3, batas4] e.g. [20, 40, 60, 80]
  kktp?: number; // ambang batas ketercapaian TP (default: 70)
  opsiPengolahan?: 'rata-rata' | 'pembobotan';
  // Tingkat 1: Pembobotan antar TP (Total 100%)
  bobotTp?: Record<string, number>; // tpId -> bobot persen (default dibagi rata)
  // Tingkat 2: Pembobotan Komposit NA-SLM vs SAS (Total 100%)
  pakaiSas?: boolean; // apakah menyertakan Sumatif Akhir Semester (SAS opsional)
  rasioSlmSas?: { slm: number; sas: number }; // default { slm: 60, sas: 40 }
  bobotSas?: number; // fallback backward-compatibility
  id: string;
  nama: string;
  kode: string;
  kelompok: string;
  tampilRapor: boolean;
}

export interface TujuanPembelajaran {
  id: string;
  mapelId: string;
  kode: string;
  deskripsi: string;
  agama?: string; // 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Khonghucu'
}

export interface Ekstrakurikuler {
  id: string;
  kode: string;
  nama: string;
  jenis: 'Wajib' | 'Pilihan';
  tampilRapor?: boolean;
}

export interface NilaiMapelSiswa {
  tpScores: Record<string, number | null>; // tpId -> score (0-100)
  sumatifAkhir: number | null;
}

export interface NilaiEkskul {
  predikat: string;
  deskripsi: string;
}

export interface DataProjek {
  id: string;
  tema: string;
  deskripsi: string;
  bentuk?: 'kolaboratif' | 'g7kaih' | 'lainnya' | string;
  alokasiWaktu?: string;
}

export interface DimensiProjek {
  id: string;
  projekId: string;
  nama: string;
  subdimensi?: string[];
}

export type NilaiProjek = 'M' | 'C' | 'B' | 'MB' | 'SB' | 'BSH' | 'SAB' | '';

export interface DataPendukungSiswa {
  sakit?: number;
  izin?: number;
  alpa?: number;
  catatanWaliKelas?: string;
  tinggiBadan?: number;
  beratBadan?: number;
}

export interface TrashItem {
  id: string;
  originalId: string;
  type: 'mapel' | 'siswa' | 'tp' | 'projek' | 'ekskul' | 'tp-ekskul';
  label: string;
  data: any;
  deletedAt: string;
}

export interface AppState {
  isAuthenticated: boolean;
  sekolah: Sekolah;
  siswa: Siswa[];
  mapel: Mapel[];
  tujuanPembelajaran: TujuanPembelajaran[];
  ekstrakurikuler: Ekstrakurikuler[];
  tpEkskul: TujuanPembelajaran[];
  // studentId -> mapelId -> NilaiMapelSiswa
  nilai: Record<string, Record<string, NilaiMapelSiswa>>;
  // studentId -> ekskulId -> NilaiEkskul
  nilaiEkskul?: Record<string, Record<string, NilaiEkskul>>;
  projek: DataProjek[];
  dimensiProjek: DimensiProjek[];
  // studentId -> dimensiId -> NilaiProjek
  nilaiP5: Record<string, Record<string, NilaiProjek>>;
  // Ruang Transit Deskripsi Capaian
  customDeskripsiMapel?: Record<string, Record<string, string>>; // studentId -> mapelId -> custom text
  customDeskripsiKokurikuler?: Record<string, Record<string, string>>; // studentId -> projekId -> custom text
  // studentId -> DataPendukungSiswa (Kehadiran & Catatan Wali Kelas)
  dataPendukung?: Record<string, DataPendukungSiswa>;
  // Status Kunci Deskripsi Capaian per Murid (terproteksi dari Sintesis Ulang 1 Kelas)
  lockedDeskripsiMapel?: Record<string, Record<string, boolean>>; // studentId -> mapelId -> boolean
  lockedDeskripsiEkskul?: Record<string, Record<string, boolean>>; // studentId -> ekskulId -> boolean
  lockedDeskripsiKokurikuler?: Record<string, boolean>; // studentId -> boolean
  lockedCatatanWali?: Record<string, boolean>; // studentId -> boolean
  trash: TrashItem[];
}
