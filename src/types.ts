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
  logoKiri?: string;
  logoKanan?: string;
  useDigitalSignature?: boolean;
  ttdWaliKelas?: string;
  ttdKepsek?: string;
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
  alamat?: string;
  namaWali?: string;
}

export interface Mapel {
  intervalBatas?: number[]; // [batas1, batas2, batas3, batas4] e.g. [20, 40, 60, 80]
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
}

export interface Ekstrakurikuler {
  id: string;
  kode: string;
  nama: string;
  jenis: 'Wajib' | 'Pilihan';
}

export interface NilaiMapelSiswa {
  tpScores: Record<string, number | null>; // tpId -> score (0-100)
  sumatifAkhir: number | null;
}

export interface DataProjek {
  id: string;
  tema: string;
  deskripsi: string;
}

export interface DimensiProjek {
  id: string;
  projekId: string;
  nama: string;
}

export type NilaiProjek = 'MB' | 'SB' | 'BSH' | 'SAB' | '';

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
  projek: DataProjek[];
  dimensiProjek: DimensiProjek[];
  // studentId -> dimensiId -> NilaiProjek
  nilaiP5: Record<string, Record<string, NilaiProjek>>;
  trash: TrashItem[];
}
