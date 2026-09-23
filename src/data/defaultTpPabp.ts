// Data Tujuan Pembelajaran (TP) Default Pendidikan Agama dan Budi Pekerti (PABP)
// Ditelaah dan disusun berdasarkan:
// KEPUTUSAN KEPALA BADAN STANDAR, KURIKULUM, DAN ASESMEN PENDIDIKAN
// KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH NOMOR 046/H/KR/2025
// TENTANG CAPAIAN PEMBELAJARAN PADA PAUD, DIKDAS, DAN DIKMEN
//
// Mencakup 6 Agama: Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu
// Jenjang SD: Fase A (Kelas 1-2), Fase B (Kelas 3-4), Fase C (Kelas 5-6)
// Terbagi secara proporsional ke dalam Semester 1 dan Semester 2.

export interface TpAgamaItem {
  kode: string;
  deskripsi: string;
}

export type AgamaKey = 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Khonghucu';

export const defaultTpPabp: Record<AgamaKey, Record<string, Record<string, TpAgamaItem[]>>> = {
  // =========================================================================
  // I.1. PENDIDIKAN AGAMA ISLAM DAN BUDI PEKERTI (PAI-BP)
  // BSKAP No. 046/H/KR/2025
  // =========================================================================
  Islam: {
    "1": {
      "1": [
        { kode: "TP.PAI.1.1", deskripsi: "Mengenal dan melafalkan huruf hijaiah berharakat tunggal (fatḥah, kasrah, ḍammah)" },
        { kode: "TP.PAI.1.2", deskripsi: "Membaca dan menghafal Surah al-Fātiḥah dengan tartil" },
        { kode: "TP.PAI.1.3", deskripsi: "Memahami rukun iman dan rukun Islam serta melafalkan dua kalimat syahadatain" },
        { kode: "TP.PAI.1.4", deskripsi: "Mengenal asmaulhusna ar-Raḥmān dan ar-Raḥīm dalam memuji Allah Swt." },
        { kode: "TP.PAI.1.5", deskripsi: "Memahami tata cara bersuci (istinja dan wudu) dengan tertib dan benar" }
      ],
      "2": [
        { kode: "TP.PAI.1.6", deskripsi: "Mengenal huruf hijaiah berharakat tanwin dan sukun" },
        { kode: "TP.PAI.1.7", deskripsi: "Memahami hadis tentang kebersihan dan membiasakan hidup bersih terhadap diri sendiri" },
        { kode: "TP.PAI.1.8", deskripsi: "Memahami nama dan tugas malaikat-malaikat Allah Swt. yang wajib diketahui" },
        { kode: "TP.PAI.1.9", deskripsi: "Memahami gerakan dan bacaan salat fardu sehari-hari" },
        { kode: "TP.PAI.1.10", deskripsi: "Menceritakan dan meneladani kisah keteladanan Nabi Adam a.s. dan Nabi Nuh a.s." }
      ]
    },
    "2": {
      "1": [
        { kode: "TP.PAI.2.1", deskripsi: "Membaca dan menulis huruf hijaiah bersambung dengan benar" },
        { kode: "TP.PAI.2.2", deskripsi: "Membaca, menghafal, dan memahami pesan pokok Surah an-Nās dan al-Falaq" },
        { kode: "TP.PAI.2.3", deskripsi: "Memahami asmaulhusna al-Khāliq dan al-Quddūs dalam menyucikan nama-Nya" },
        { kode: "TP.PAI.2.4", deskripsi: "Memahami tata cara mengumandangkan azan dan ikamah dengan santun" },
        { kode: "TP.PAI.2.5", deskripsi: "Menceritakan dan meneladani kisah perjuangan Nabi Ibrahim a.s. dan Nabi Ismail a.s." }
      ],
      "2": [
        { kode: "TP.PAI.2.6", deskripsi: "Membaca dan menghafal Surah al-Ikhlāṣ dan al-Kautsar" },
        { kode: "TP.PAI.2.7", deskripsi: "Memahami bacaan zikir dan doa harian setelah salat fardu" },
        { kode: "TP.PAI.2.8", deskripsi: "Menerapkan sikap kasih sayang, jujur, dan disiplin terhadap diri sendiri" },
        { kode: "TP.PAI.2.9", deskripsi: "Memahami pelaksanaan salat fardu berjamaah dengan tertib" },
        { kode: "TP.PAI.2.10", deskripsi: "Menceritakan masa kanak-kanak dan akhlak terpuji Nabi Muhammad saw." }
      ]
    },
    "3": {
      "1": [
        { kode: "TP.PAI.3.1", deskripsi: "Membaca, menghafal, dan memahami pesan pokok Surah an-Naṣr dan al-Kauṡar" },
        { kode: "TP.PAI.3.2", deskripsi: "Memahami sifat-sifat wajib, mustahil, dan jaiz bagi Allah Swt." },
        { kode: "TP.PAI.3.3", deskripsi: "Memahami asmaulhusna al-Wahhāb, al-Kabīr, dan al-‘Alīm" },
        { kode: "TP.PAI.3.4", deskripsi: "Memahami hadis tentang kewajiban mendirikan salat tepat waktu" },
        { kode: "TP.PAI.3.5", deskripsi: "Memahami ketentuan puasa Ramadan (syarat, rukun, dan hal yang membatalkan)" }
      ],
      "2": [
        { kode: "TP.PAI.3.6", deskripsi: "Membaca dan memahami kandungan Surah al-Kāfirūn dengan tartil" },
        { kode: "TP.PAI.3.7", deskripsi: "Memahami iman kepada kitab-kitab suci Allah Swt. dan para penerimanya" },
        { kode: "TP.PAI.3.8", deskripsi: "Menunjukkan akhlak hormat, santun, dan patuh kepada orang tua dan keluarga" },
        { kode: "TP.PAI.3.9", deskripsi: "Memahami tata cara dan keutamaan salat sunah rawatib dan duha" },
        { kode: "TP.PAI.3.10", deskripsi: "Menceritakan kisah masa remaja dan pernikahan Nabi Muhammad saw. dengan Khadijah r.a." }
      ]
    },
    "4": {
      "1": [
        { kode: "TP.PAI.4.1", deskripsi: "Membaca, menghafal, dan memahami pesan pokok Surah al-Mā‘ūn dan at-Tīn" },
        { kode: "TP.PAI.4.2", deskripsi: "Memahami asmaulhusna al-Mālik, al-Azīz, dan as-Salām" },
        { kode: "TP.PAI.4.3", deskripsi: "Memahami iman kepada rasul-rasul Allah Swt. dan sifat wajib rasul" },
        { kode: "TP.PAI.4.4", deskripsi: "Menunjukkan sikap berbaik sangka (husnuzan) kepada Allah Swt. dalam setiap keadaan" },
        { kode: "TP.PAI.4.5", deskripsi: "Memahami tanda-tanda usia balig menurut pandangan fikih dan konsekuensi taklif" }
      ],
      "2": [
        { kode: "TP.PAI.4.6", deskripsi: "Memahami hadis tentang menjaga silaturahmi dan hubungan baik dengan sesama manusia" },
        { kode: "TP.PAI.4.7", deskripsi: "Menerapkan adab dan akhlak mulia kepada guru dan pendidik di sekolah" },
        { kode: "TP.PAI.4.8", deskripsi: "Memahami ketentuan tata cara salat Jumat dan salat sunah tarawih serta witir" },
        { kode: "TP.PAI.4.9", deskripsi: "Menceritakan peristiwa pengangkatan Nabi Muhammad saw. menjadi rasul dan dakwah di Makkah" },
        { kode: "TP.PAI.4.10", deskripsi: "Meneladani ketabahan Nabi Muhammad saw. dan para sahabat pada periode Makkah" }
      ]
    },
    "5": {
      "1": [
        { kode: "TP.PAI.5.1", deskripsi: "Membaca, menghafal, dan memahami pesan pokok Surah al-Ḥujurāt ayat 13 tentang keragaman" },
        { kode: "TP.PAI.5.2", deskripsi: "Memahami hadis tentang persaudaraan dan menghargai perbedaan latar belakang" },
        { kode: "TP.PAI.5.3", deskripsi: "Memahami asmaulhusna al-Qawiyy, al-Qayyūm, dan al-Muḥyī" },
        { kode: "TP.PAI.5.4", deskripsi: "Memahami makna iman kepada hari akhir (kiamat) serta tanda-tandanya" },
        { kode: "TP.PAI.5.5", deskripsi: "Memahami ketentuan zakat fitrah, infak, dan sedekah dalam kehidupan sosial" }
      ],
      "2": [
        { kode: "TP.PAI.5.6", deskripsi: "Membaca dan menghafal Surah al-Qadr dan al-Inshirāḥ" },
        { kode: "TP.PAI.5.7", deskripsi: "Membiasakan diri berdoa dengan khusyuk dan bertawakal atas ketetapan Allah Swt." },
        { kode: "TP.PAI.5.8", deskripsi: "Menerapkan adab bertetangga dan berteman tanpa memandang perbedaan agama (toleransi)" },
        { kode: "TP.PAI.5.9", deskripsi: "Memahami ketentuan puasa sunah (Senin-Kamis, Syawal, dan Arafah)" },
        { kode: "TP.PAI.5.10", deskripsi: "Menceritakan peristiwa hijrah Nabi Muhammad saw. ke Madinah dan Piagam Madinah" }
      ]
    },
    "6": {
      "1": [
        { kode: "TP.PAI.6.1", deskripsi: "Membaca, menghafal, dan menelaah pesan pokok Surah al-A‘lā dan ad-Duḥā" },
        { kode: "TP.PAI.6.2", deskripsi: "Memahami asmaulhusna aṣ-Ṣamad, al-Muqtadir, dan al-Muqaddim" },
        { kode: "TP.PAI.6.3", deskripsi: "Memahami takdir Allah Swt. melalui konsep iman kepada Qadā’ dan Qadr" },
        { kode: "TP.PAI.6.4", deskripsi: "Menunjukkan kepedulian terhadap kelestarian lingkungan hidup, menyayangi hewan, dan merawat tumbuhan" },
        { kode: "TP.PAI.6.5", deskripsi: "Mengidentifikasi ketentuan makanan dan minuman yang halal dan haram menurut syariat Islam" }
      ],
      "2": [
        { kode: "TP.PAI.6.6", deskripsi: "Memahami konsep pemberian hadiah, hibah, dan tolong-menolong dalam kebajikan" },
        { kode: "TP.PAI.6.7", deskripsi: "Memahami sejarah kepemimpinan Khalifah Abu Bakar ash-Shiddiq dan Umar bin Khattab" },
        { kode: "TP.PAI.6.8", deskripsi: "Memahami sejarah kepemimpinan Khalifah Utsman bin Affan dan Ali bin Abi Thalib" },
        { kode: "TP.PAI.6.9", deskripsi: "Meneladani sifat adil, bijaksana, dan sederhana dari para Khulafaurasyidin" }
      ]
    }
  },

  // =========================================================================
  // I.2. PENDIDIKAN AGAMA KRISTEN DAN BUDI PEKERTI (PAK-BP)
  // BSKAP No. 046/H/KR/2025
  // =========================================================================
  Kristen: {
    "1": {
      "1": [
        { kode: "TP.PAK.1.1", deskripsi: "Memahami bahwa Allah menciptakan dirinya sebagai pribadi yang istimewa dan bersyukur atas tubuhnya" },
        { kode: "TP.PAK.1.2", deskripsi: "Membangun interaksi yang ramah dan saling menghargai dengan teman dan keluarga di rumah" },
        { kode: "TP.PAK.1.3", deskripsi: "Memahami pemeliharaan Allah melalui kehadiran orang tua dan anggota keluarga" },
        { kode: "TP.PAK.1.4", deskripsi: "Mengenal keindahan alam sekitar sebagai ciptaan Allah yang agung" }
      ],
      "2": [
        { kode: "TP.PAK.1.5", deskripsi: "Memahami bahwa dirinya terus bertumbuh dan berkembang baik fisik maupun kemampuan" },
        { kode: "TP.PAK.1.6", deskripsi: "Mempraktikkan sikap sopan, ramah, dan bertutur kata baik di rumah dan di sekolah" },
        { kode: "TP.PAK.1.7", deskripsi: "Mengenal gereja sebagai rumah Tuhan tempat bersekutu, memuji, dan mendengarkan firman Tuhan" },
        { kode: "TP.PAK.1.8", deskripsi: "Membiasakan diri memelihara kebersihan lingkungan rumah dan sekolah" }
      ]
    },
    "2": {
      "1": [
        { kode: "TP.PAK.2.1", deskripsi: "Menerima keberagaman suku bangsa dan budaya teman-teman sebagai anugerah Allah" },
        { kode: "TP.PAK.2.2", deskripsi: "Memahami makna doa dan bernyanyi memuji Tuhan dalam persekutuan ibadah anak di gereja" },
        { kode: "TP.PAK.2.3", deskripsi: "Menunjukkan tindakan tolong-menolong dan peduli terhadap anggota keluarga di rumah" },
        { kode: "TP.PAK.2.4", deskripsi: "Mengidentifikasi tugas manusia dalam menjaga tanaman dan hewan peliharaan di rumah" }
      ],
      "2": [
        { kode: "TP.PAK.2.5", deskripsi: "Memahami cara mengucap syukur kepada Allah dalam segala keadaan hidup" },
        { kode: "TP.PAK.2.6", deskripsi: "Mempraktikkan sikap disiplin dan tertib di lingkungan sekolah" },
        { kode: "TP.PAK.2.7", deskripsi: "Membangun persahabatan yang rukun dengan teman yang berbeda suku dan bahasa" },
        { kode: "TP.PAK.2.8", deskripsi: "Berpartisipasi aktif dalam kegiatan menjaga kebersihan dan penghijauan di lingkungan sekolah" }
      ]
    },
    "3": {
      "1": [
        { kode: "TP.PAK.3.1", deskripsi: "Memahami karya penciptaan Allah atas flora, fauna, dan manusia laki-laki serta perempuan" },
        { kode: "TP.PAK.3.2", deskripsi: "Merasakan pemeliharaan Allah melalui kehadiran teman, guru, dan tetangga di sekitar" },
        { kode: "TP.PAK.3.3", deskripsi: "Memahami diri sebagai makhluk sosial yang senang bergaul dan bekerja sama dengan sesama" },
        { kode: "TP.PAK.3.4", deskripsi: "Memahami kehadiran Allah dalam berbagai fenomena alam yang mendatangkan kebaikan" }
      ],
      "2": [
        { kode: "TP.PAK.3.5", deskripsi: "Memahami Allah sebagai Penyelamat hidup manusia dari kuasa dosa dan bahaya" },
        { kode: "TP.PAK.3.6", deskripsi: "Menerapkan perilaku disiplin dalam belajar, beribadah, dan beraktivitas sehari-hari" },
        { kode: "TP.PAK.3.7", deskripsi: "Menghargai keragaman tradisi budaya dan suku dalam masyarakat Indonesia" },
        { kode: "TP.PAK.3.8", deskripsi: "Melakukan tindakan nyata memelihara kelestarian alam dan sumber air di sekitar" }
      ]
    },
    "4": {
      "1": [
        { kode: "TP.PAK.4.1", deskripsi: "Mengenal karya Allah yang membarui hati dan perilaku manusia menjadi baru dan berkenan kepada-Nya" },
        { kode: "TP.PAK.4.2", deskripsi: "Memahami tugas panggilan gereja untuk bersekutu (koinonia), bersaksi (martyria), dan melayani (diakonia)" },
        { kode: "TP.PAK.4.3", deskripsi: "Menunjukkan sikap toleransi dan menghargai teman yang berbeda agama dalam kehidupan sehari-hari" },
        { kode: "TP.PAK.4.4", deskripsi: "Mengidentifikasi dampak kerusakan alam dan berkomitmen untuk tidak membuang sampah sembarangan" }
      ],
      "2": [
        { kode: "TP.PAK.4.5", deskripsi: "Meneladani kerendahan hati dan kasih Yesus Kristus dalam melayani sesama manusia" },
        { kode: "TP.PAK.4.6", deskripsi: "Membiasakan diri mempraktikkan kejujuran dan tanggung jawab di sekolah" },
        { kode: "TP.PAK.4.7", deskripsi: "Berperan serta dalam persekutuan ibadah anak dan kegiatan pelayanan sosial sederhana di gereja" },
        { kode: "TP.PAK.4.8", deskripsi: "Merawat tanaman di pekarangan sekolah sebagai wujud tanggung jawab memelihara alam ciptaan Allah" }
      ]
    },
    "5": {
      "1": [
        { kode: "TP.PAK.5.1", deskripsi: "Memahami bahwa Allah Pencipta berkarya nyata melalui keluarga, sekolah, dan masyarakat luas" },
        { kode: "TP.PAK.5.2", deskripsi: "Memahami pemeliharaan Allah yang adil kepada seluruh manusia, termasuk penyandang disabilitas" },
        { kode: "TP.PAK.5.3", deskripsi: "Menyadari hakikat keterbatasan diri manusia sebagai ciptaan yang senantiasa membutuhkan pertolongan Tuhan" },
        { kode: "TP.PAK.5.4", deskripsi: "Mengagumi kebesaran dan keteraturan alam ciptaan Allah serta kehadiran-Nya melalui alam" }
      ],
      "2": [
        { kode: "TP.PAK.5.5", deskripsi: "Memahami karya keselamatan Allah yang sempurna bagi dunia melalui pribadi Tuhan Yesus Kristus" },
        { kode: "TP.PAK.5.6", deskripsi: "Memahami dan mempraktikkan buah Roh (kasih, sukacita, damai sejahtera, dll.) dalam pergaulan" },
        { kode: "TP.PAK.5.7", deskripsi: "Memahami makna hidup rukun dan toleransi aktif dalam masyarakat Indonesia yang majemuk" },
        { kode: "TP.PAK.5.8", deskripsi: "Mengembangkan program hemat energi dan pengurangan sampah plastik di rumah dan di sekolah" }
      ]
    },
    "6": {
      "1": [
        { kode: "TP.PAK.6.1", deskripsi: "Memahami bagaimana Roh Kudus membarui dan memimpin kehidupan orang beriman dalam menghadapi tantangan" },
        { kode: "TP.PAK.6.2", deskripsi: "Memahami pelayanan terhadap sesama sebagai panggilan iman dan tanggung jawab kemuridan kristiani" },
        { kode: "TP.PAK.6.3", deskripsi: "Menghormati kebebasan beragama dan aktif memelihara persatuan bangsa di tengah perbedaan keyakinan" },
        { kode: "TP.PAK.6.4", deskripsi: "Mengidentifikasi isu kerusakan lingkungan dan merumuskan langkah pemeliharaan alam yang berkelanjutan" }
      ],
      "2": [
        { kode: "TP.PAK.6.5", deskripsi: "Meneladani integritas dan kesetiaan tokoh-tokoh Alkitab dalam memegang kebenaran firman Allah" },
        { kode: "TP.PAK.6.6", deskripsi: "Memperagakan perilaku adil, tidak diskriminatif, dan ramah terhadap sesama manusia" },
        { kode: "TP.PAK.6.7", deskripsi: "Memahami peran orang percaya sebagai garam dan terang dunia dalam masyarakat majemuk" },
        { kode: "TP.PAK.6.8", deskripsi: "Melakukan aksi nyata pelestarian lingkungan hidup bersama komunitas di satuan pendidikan" }
      ]
    }
  },

  // =========================================================================
  // I.3. PENDIDIKAN AGAMA KATOLIK DAN BUDI PEKERTI (PAKat-BP)
  // BSKAP No. 046/H/KR/2025
  // =========================================================================
  Katolik: {
    "1": {
      "1": [
        { kode: "TP.PAKat.1.1", deskripsi: "Memahami dirinya sebagai pribadi yang dicintai Tuhan, memiliki anggota tubuh yang berguna" },
        { kode: "TP.PAKat.1.2", deskripsi: "Memahami cara merawat kebersihan dan kesehatan tubuhnya secara mandiri" },
        { kode: "TP.PAKat.1.3", deskripsi: "Memahami bahwa Allah menciptakan langit, bumi, dan seluruh isinya dengan penuh kasih" },
        { kode: "TP.PAKat.1.4", deskripsi: "Mengenal dan mempraktikkan tanda salib dengan sikap hormat dan khidmat" },
        { kode: "TP.PAKat.1.5", deskripsi: "Memahami lingkungan keluarga dan rumah sebagai tempat mengembangkan potensi diri" }
      ],
      "2": [
        { kode: "TP.PAKat.1.6", deskripsi: "Memahami teman-teman dan lingkungan sekolah sebagai anugerah dalam bertumbuh bersama" },
        { kode: "TP.PAKat.1.7", deskripsi: "Memahami kisah kelahiran Tuhan Yesus Kristus dan kabar sukacita para gembala" },
        { kode: "TP.PAKat.1.8", deskripsi: "Mengenal dan mendoakan doa pokok Bapa Kami dan Salam Maria dengan benar" },
        { kode: "TP.PAKat.1.9", deskripsi: "Membiasakan diri berdoa pujian, syukur, dan permohonan dalam kehidupan sehari-hari" },
        { kode: "TP.PAKat.1.10", deskripsi: "Bergotong royong merawat kebersihan lingkungan kelas dan sekolah" }
      ]
    },
    "2": {
      "1": [
        { kode: "TP.PAKat.2.1", deskripsi: "Memahami tokoh-tokoh iman Perjanjian Lama: Nabi Nuh dan Bapa Abraham yang setia" },
        { kode: "TP.PAKat.2.2", deskripsi: "Memahami kisah Ishak dan Yakub dalam sejarah rencana keselamatan Allah" },
        { kode: "TP.PAKat.2.3", deskripsi: "Memahami doa Kemuliaan dan membiasakan diri hidup rukun bersama tetangga" },
        { kode: "TP.PAKat.2.4", deskripsi: "Memahami peraturan sekolah dan bekerja sama dengan teman dalam mengembangkan bakat" },
        { kode: "TP.PAKat.2.5", deskripsi: "Menunjukkan sikap tolong-menolong dan gotong royong merawat lingkungan sekitar" }
      ],
      "2": [
        { kode: "TP.PAKat.2.6", deskripsi: "Memahami kisah kunjungan Tiga Orang Majus menyembah Kanak-kanak Yesus" },
        { kode: "TP.PAKat.2.7", deskripsi: "Meneladani masa kanak-kanak Yesus di Nazaret yang taat kepada orang tua" },
        { kode: "TP.PAKat.2.8", deskripsi: "Memahami peristiwa Yesus dipersembahkan di Bait Allah dan berada di Bait Allah pada usia 12 tahun" },
        { kode: "TP.PAKat.2.9", deskripsi: "Memahami pelaksanaan perintah Allah dalam mengasihi keluarga dan teman" },
        { kode: "TP.PAKat.2.10", deskripsi: "Berpartisipasi aktif dalam kegiatan menjaga kebersihan dan kelestarian alam" }
      ]
    },
    "3": {
      "1": [
        { kode: "TP.PAKat.3.1", deskripsi: "Memahami dirinya sebagai pribadi yang tumbuh dan berkembang serta berbuat baik" },
        { kode: "TP.PAKat.3.2", deskripsi: "Memahami karya keselamatan Allah melalui tokoh Yusuf yang pemaaf dan Nabi Musa yang membebaskan" },
        { kode: "TP.PAKat.3.3", deskripsi: "Memahami Sepuluh Perintah Allah sebagai pedoman hidup beriman" },
        { kode: "TP.PAKat.3.4", deskripsi: "Memahami Sakramen Baptis sebagai tanda kelahiran baru menjadi anak-anak Allah" },
        { kode: "TP.PAKat.3.5", deskripsi: "Mengungkapkan rasa syukur dalam doa pribadi dan doa bersama dalam perayaan liturgi" }
      ],
      "2": [
        { kode: "TP.PAKat.3.6", deskripsi: "Mewujudkan rasa hormat, bakti, dan ketaatan kepada orang tua dan pendidik" },
        { kode: "TP.PAKat.3.7", deskripsi: "Memahami kisah bangsa Israel memasuki tanah terjanji di bawah kepemimpinan Yosua" },
        { kode: "TP.PAKat.3.8", deskripsi: "Meneladani Yesus yang mewartakan Kerajaan Allah melalui perkataan, perbuatan, dan mukjizat" },
        { kode: "TP.PAKat.3.9", deskripsi: "Mewujudkan makna doa melalui sikap dan tindakan belas kasih dalam kehidupan sehari-hari" },
        { kode: "TP.PAKat.3.10", deskripsi: "Menghormati pemimpin masyarakat dan menghargai tradisi budaya luhur setempat" }
      ]
    },
    "4": {
      "1": [
        { kode: "TP.PAKat.4.1", deskripsi: "Memahami diri sebagai pribadi yang unik, bersyukur, dan mengembangkan keunikan bersama orang lain" },
        { kode: "TP.PAKat.4.2", deskripsi: "Memahami panggilan Allah kepada Samuel serta kepemimpinan Raja Saul dan Daud bagi bangsa Israel" },
        { kode: "TP.PAKat.4.3", deskripsi: "Meneladani Yesus sebagai pemenuhan janji Allah yang menyembuhkan dan menyelamatkan" },
        { kode: "TP.PAKat.4.4", deskripsi: "Memahami makna perayaan Sakramen Ekaristi sebagai santapan rohani persaudaraan umat beriman" },
        { kode: "TP.PAKat.4.5", deskripsi: "Menghormati hidup pribadi orang lain dan tidak mengambil milik sesama secara sewenang-wenang" }
      ],
      "2": [
        { kode: "TP.PAKat.4.6", deskripsi: "Memahami Sakramen Tobat sebagai sarana rekonsiliasi dan menerima pengampunan Allah" },
        { kode: "TP.PAKat.4.7", deskripsi: "Mewujudkan sikap tobat melalui permintaan maaf dan memperbaiki perbuatan yang keliru" },
        { kode: "TP.PAKat.4.8", deskripsi: "Meneladani sikap Yesus yang menyambut anak-anak dan membela kaum yang lemah" },
        { kode: "TP.PAKat.4.9", deskripsi: "Menjaga kejujuran dalam berkata-kata dan bertindak adil kepada teman di sekolah" },
        { kode: "TP.PAKat.4.10", deskripsi: "Melakukan aksi nyata dalam melestarikan lingkungan alam ciptaan Tuhan" }
      ]
    },
    "5": {
      "1": [
        { kode: "TP.PAKat.5.1", deskripsi: "Memahami diri sebagai perempuan atau laki-laki sebagai citra Allah yang sederajat dan saling melengkapi" },
        { kode: "TP.PAKat.5.2", deskripsi: "Memahami perjuangan Raja Daud sebagai pemimpin yang tangguh dan berserah kepada Allah" },
        { kode: "TP.PAKat.5.3", deskripsi: "Meneladani kebijaksanaan Raja Salomo dan keberanian Ratu Ester dalam membela kebenaran" },
        { kode: "TP.PAKat.5.4", deskripsi: "Meneladani iman tokoh Maria dan Elisabet yang setia dan taat kepada rencana Allah" },
        { kode: "TP.PAKat.5.5", deskripsi: "Mewujudkan iman dalam kehidupan sehari-hari dan melibatkan diri dalam kehidupan menggereja" }
      ],
      "2": [
        { kode: "TP.PAKat.5.6", deskripsi: "Memahami hak dan kewajiban dirinya sebagai warga negara dan bangga sebagai bangsa Indonesia" },
        { kode: "TP.PAKat.5.7", deskripsi: "Meneladani Yesus yang taat kepada Allah, mengajarkan pengampunan, dan memanggil orang berdosa" },
        { kode: "TP.PAKat.5.8", deskripsi: "Memahami peristiwa sengsara, wafat, kebangkitan Yesus, dan pengutusan Roh Kudus" },
        { kode: "TP.PAKat.5.9", deskripsi: "Memahami empat sifat Gereja: Satu, Kudus, Katolik, dan Apostolik" },
        { kode: "TP.PAKat.5.10", deskripsi: "Membiasakan sikap jujur dan bertindak menurut suara hati nurani yang murni" }
      ]
    },
    "6": {
      "1": [
        { kode: "TP.PAKat.6.1", deskripsi: "Memahami diri sebagai bagian dari warga dunia yang dipanggil menegakkan persaudaraan universal" },
        { kode: "TP.PAKat.6.2", deskripsi: "Memahami perjuangan Nabi Elia menobatkan bangsa Israel dan Nabi Amos sebagai pejuang keadilan" },
        { kode: "TP.PAKat.6.3", deskripsi: "Memahami nubuat Nabi Yesaya tentang kedatangan Sang Juru Selamat bagi umat manusia" },
        { kode: "TP.PAKat.6.4", deskripsi: "Meneladani Yesus yang mewartakan Kerajaan Allah dengan perkataan dan perbuatan nyata" },
        { kode: "TP.PAKat.6.5", deskripsi: "Memahami persekutuan para kudus, pengampunan dosa, kebangkitan badan, dan kehidupan kekal" }
      ],
      "2": [
        { kode: "TP.PAKat.6.6", deskripsi: "Terlibat aktif dalam pelestarian lingkungan alam dan menjaga keutuhan ciptaan Tuhan" },
        { kode: "TP.PAKat.6.7", deskripsi: "Menegakkan keadilan dan membela kebenaran dalam hidup sehari-hari sebagai murid Kristus" },
        { kode: "TP.PAKat.6.8", deskripsi: "Mengembangkan dialog dan kerja sama persaudaraan dengan umat beragama lain" },
        { kode: "TP.PAKat.6.9", deskripsi: "Meneladani para saksi iman dan orang kudus dalam menghadirkan damai Kristus di tengah masyarakat" }
      ]
    }
  },

  // =========================================================================
  // I.4. PENDIDIKAN AGAMA HINDU DAN BUDI PEKERTI (PAH-BP)
  // BSKAP No. 046/H/KR/2025
  // =========================================================================
  Hindu: {
    "1": {
      "1": [
        { kode: "TP.PAH.1.1", deskripsi: "Memahami Hyang Widhi Wasa sebagai Sang Pencipta alam semesta dan sumber hidup" },
        { kode: "TP.PAH.1.2", deskripsi: "Memahami ajaran Tri Kaya Parisudha (Manacika, Wacika, Kayika) dalam pikiran, perkataan, dan perbuatan" },
        { kode: "TP.PAH.1.3", deskripsi: "Mengenal sarana persembahyangan dasar (bunga, dupa, air suci, canang sari)" },
        { kode: "TP.PAH.1.4", deskripsi: "Menceritakan kisah keteladanan tokoh Rama dan Laksamana dalam kitab Ramayana" }
      ],
      "2": [
        { kode: "TP.PAH.1.5", deskripsi: "Memahami Hyang Widhi Wasa yang menjiwai seluruh makhluk hidup" },
        { kode: "TP.PAH.1.6", deskripsi: "Membedakan perilaku baik (Subha Karma) dan perilaku buruk (Asubha Karma) di rumah dan sekolah" },
        { kode: "TP.PAH.1.7", deskripsi: "Mempraktikkan doa Dainika Upasana (Puja Trisandya dan Mantram Gayatri)" },
        { kode: "TP.PAH.1.8", deskripsi: "Mengenal keteladanan Raja Mulawarman dari Kerajaan Kutai yang adil dan dermawan" }
      ]
    },
    "2": {
      "1": [
        { kode: "TP.PAH.2.1", deskripsi: "Menceritakan keteladanan tokoh Mahabharata (Pandawa Lima) yang ksatria dan jujur" },
        { kode: "TP.PAH.2.2", deskripsi: "Memahami doa sehari-hari sebelum dan sesudah makan serta sebelum belajar" },
        { kode: "TP.PAH.2.3", deskripsi: "Menerapkan ajaran Subha Karma dalam bertutur kata sopan kepada orang tua dan guru" },
        { kode: "TP.PAH.2.4", deskripsi: "Mengenal keteladanan Raja Purnawarman dari Kerajaan Tarumanegara yang menyejahterakan rakyat" }
      ],
      "2": [
        { kode: "TP.PAH.2.5", deskripsi: "Mengenal mantram sehari-hari saat memulai kegiatan dan sebelum tidur" },
        { kode: "TP.PAH.2.6", deskripsi: "Mempraktikkan sikap duduk yang tenang (Padmasana/Bajrasana) dan hening saat sembahyang" },
        { kode: "TP.PAH.2.7", deskripsi: "Menceritakan kisah kesetiaan Hanoman dalam wiracarita Ramayana" },
        { kode: "TP.PAH.2.8", deskripsi: "Menerapkan kerukunan dan saling tolong-menolong dengan sesama teman di sekolah" }
      ]
    },
    "3": {
      "1": [
        { kode: "TP.PAH.3.1", deskripsi: "Memahami kedudukan Kitab Purana sebagai sumber ajaran dan teladan keagamaan Hindu" },
        { kode: "TP.PAH.3.2", deskripsi: "Memahami Hyang Widhi Wasa dalam manifestasi Tri Murti (Brahma, Wisnu, Siwa)" },
        { kode: "TP.PAH.3.3", deskripsi: "Memahami ajaran Tri Parartha (Asih, Punia, Bhakti) dalam kehidupan sehari-hari" },
        { kode: "TP.PAH.3.4", deskripsi: "Mengenal hari-hari suci keagamaan Hindu (Galungan, Kuningan, Saraswati, Pagerwesi, Nyepi, Siwaratri)" }
      ],
      "2": [
        { kode: "TP.PAH.3.5", deskripsi: "Memahami tempat suci agama Hindu (Pura, Candi, Kuil) sesuai dengan kearifan lokal" },
        { kode: "TP.PAH.3.6", deskripsi: "Memahami ajaran Catur Paramitha (Maitri, Karuna, Mudita, Upeksa) dalam pergaulan" },
        { kode: "TP.PAH.3.7", deskripsi: "Menceritakan keteladanan Raja Airlangga dari Kerajaan Kahuripan dalam memelihara kesejahteraan rakyat" },
        { kode: "TP.PAH.3.8", deskripsi: "Menunjukkan sikap sopan santun dan menjaga kebersihan saat berada di area tempat suci" }
      ]
    },
    "4": {
      "1": [
        { kode: "TP.PAH.4.1", deskripsi: "Menelaah nilai-nilai kebajikan dan moral yang terkandung dalam kisah-kisah Kitab Purana" },
        { kode: "TP.PAH.4.2", deskripsi: "Memahami kemahakuasaan Hyang Widhi Wasa sebagai Cadu Sakti (Prabu, Wibhu, Jnana, Kriya Sakti)" },
        { kode: "TP.PAH.4.3", deskripsi: "Mengamalkan kasih sayang (asih) kepada sesama makhluk ciptaan Tuhan" },
        { kode: "TP.PAH.4.4", deskripsi: "Memahami makna filosofis dan tata pelaksanaan Hari Suci Nyepi (Catur Brata Penyepian)" }
      ],
      "2": [
        { kode: "TP.PAH.4.5", deskripsi: "Meneladani kepemimpinan Raja Hayam Wuruk dan Mahapatih Gajah Mada dari Kerajaan Majapahit" },
        { kode: "TP.PAH.4.6", deskripsi: "Memahami sejarah dan pelestarian peninggalan candi-candi Hindu di Nusantara" },
        { kode: "TP.PAH.4.7", deskripsi: "Mempraktikkan pemberian punia yang tulus ikhlas kepada orang yang membutuhkan" },
        { kode: "TP.PAH.4.8", deskripsi: "Menerapkan nilai-nilai persatuan dan moderasi beragama dalam masyarakat majemuk" }
      ]
    },
    "5": {
      "1": [
        { kode: "TP.PAH.5.1", deskripsi: "Memahami kodifikasi Kitab Suci Weda dan pembagian Weda Sruti (Mantra, Brahmana, Aranyaka, Upanisad)" },
        { kode: "TP.PAH.5.2", deskripsi: "Memahami konsep alam semesta (Bhuana Agung) dan keterhubungannya dengan diri manusia (Bhuana Alit)" },
        { kode: "TP.PAH.5.3", deskripsi: "Memahami dan mengamalkan ajaran Catur Guru (Guru Swadhyaya, Rupaka, Pengajian, Wisesa)" },
        { kode: "TP.PAH.5.4", deskripsi: "Memahami hakikat Panca Yadnya (Dewa, Pitra, Rsi, Manusa, Bhuta Yadnya)" }
      ],
      "2": [
        { kode: "TP.PAH.5.5", deskripsi: "Memahami bagian-bagian Kitab Weda Smerti (Wedangga, Upaweda, Nibandha)" },
        { kode: "TP.PAH.5.6", deskripsi: "Mempraktikkan rasa hormat dan bakti kepada orang tua (Guru Rupaka) dan pendidik (Guru Pengajian)" },
        { kode: "TP.PAH.5.7", deskripsi: "Memahami peranan Manggalaning Yadnya dalam ketertiban pelaksanaan upacara korban suci" },
        { kode: "TP.PAH.5.8", deskripsi: "Menceritakan sejarah awal masuk dan perkembangan Agama Hindu di kepulauan Indonesia" }
      ]
    },
    "6": {
      "1": [
        { kode: "TP.PAH.6.1", deskripsi: "Menelaah ajaran Catur Asrama (Brahmacari, Grhastha, Wanaprastha, Bhiksuka) sebagai tahapan hidup" },
        { kode: "TP.PAH.6.2", deskripsi: "Menerapkan kewajiban masa menuntut ilmu (Brahmacari Asrama) dengan penuh disiplin dan ketekunan" },
        { kode: "TP.PAH.6.3", deskripsi: "Memahami pelaksanaan Bhuta Yadnya untuk menjaga kelestarian dan keharmonisan lingkungan alam" },
        { kode: "TP.PAH.6.4", deskripsi: "Mengidentifikasi peninggalan prasasti dan candi sebagai bukti kejayaan peradaban Hindu di Indonesia" }
      ],
      "2": [
        { kode: "TP.PAH.6.5", deskripsi: "Meneladani semangat perjuangan tokoh-tokoh Hindu dalam era kebangkitan nasional Indonesia" },
        { kode: "TP.PAH.6.6", deskripsi: "Memahami peran Parisada Hindu Dharma Indonesia (PHDI) dalam pembinaan umat dan kerukunan bangsa" },
        { kode: "TP.PAH.6.7", deskripsi: "Mengimplementasikan falsafah Tri Hita Karana dan Tat Twam Asi dalam kehidupan sehari-hari" },
        { kode: "TP.PAH.6.8", deskripsi: "Memperkokoh moderasi beragama dan persatuan nasional dalam bingkai Negara Kesatuan Republik Indonesia" }
      ]
    }
  },

  // =========================================================================
  // I.5. PENDIDIKAN AGAMA BUDDHA DAN BUDI PEKERTI (PAB-BP)
  // BSKAP No. 046/H/KR/2025
  // =========================================================================
  Buddha: {
    "1": {
      "1": [
        { kode: "TP.PAB.1.1", deskripsi: "Memahami identitas diri dan keluarganya serta bersyukur atas kebersamaan dalam keluarga" },
        { kode: "TP.PAB.1.2", deskripsi: "Memiliki keterbukaan untuk menghargai perbedaan identitas dan budaya teman-teman di sekolah" },
        { kode: "TP.PAB.1.3", deskripsi: "Mengenal simbol-simbol keagamaan Buddha di rumah dan vihara (rupang Buddha, lilin, dupa, bunga, air)" },
        { kode: "TP.PAB.1.4", deskripsi: "Mempraktikkan aturan sopan santun dan salam Buddhis (Anjali dan Namaskara) dengan tulus" }
      ],
      "2": [
        { kode: "TP.PAB.1.5", deskripsi: "Meneladani sifat cinta kasih para Bodhisattva dalam menyayangi diri sendiri dan menjaga kesehatan fisik serta batin" },
        { kode: "TP.PAB.1.6", deskripsi: "Mengenal identitas tempat ibadah agama lain di lingkungan sekitar dengan sikap menghormati" },
        { kode: "TP.PAB.1.7", deskripsi: "Membiasakan diri menjaga ucapan yang benar dan bersikap hormat kepada orang tua sesuai kisah Jataka" },
        { kode: "TP.PAB.1.8", deskripsi: "Berperilaku ramah dan suka menolong teman dalam kegiatan belajar dan bermain di sekolah" }
      ]
    },
    "2": {
      "1": [
        { kode: "TP.PAB.2.1", deskripsi: "Meneladani siswa Buddha dan tokoh Buddhis inspiratif dalam ketekunan belajar dan kejujuran" },
        { kode: "TP.PAB.2.2", deskripsi: "Memahami makna lilin, dupa, bunga, dan air di altar Buddha sebagai sarana perenungan batin" },
        { kode: "TP.PAB.2.3", deskripsi: "Memahami aturan dan tata krama saat berada di lingkungan rumah ibadah vihara atau cetya" },
        { kode: "TP.PAB.2.4", deskripsi: "Mempraktikkan musyawarah sederhana untuk mencapai mufakat dalam membagi tugas kebersihan kelas" }
      ],
      "2": [
        { kode: "TP.PAB.2.5", deskripsi: "Memahami prinsip sederhana Hukum Karma: perbuatan baik mendatangkan kebahagiaan, perbuatan buruk membawa penderitaan" },
        { kode: "TP.PAB.2.6", deskripsi: "Membiasakan meditasi pernapasan sederhana (Anapanasati) untuk melatih konsentrasi dan ketenangan pikiran" },
        { kode: "TP.PAB.2.7", deskripsi: "Menerapkan sikap pemaaf dan tidak membalas keburukan dengan keburukan kepada teman" },
        { kode: "TP.PAB.2.8", deskripsi: "Menjaga kebersihan dan kelestarian tanaman sekolah sebagai wujud cinta kasih kepada alam" }
      ]
    },
    "3": {
      "1": [
        { kode: "TP.PAB.3.1", deskripsi: "Memahami riwayat kelahiran Pangeran Siddharta dan masa kanak-kanak yang mulia di Istana Kapilawastu" },
        { kode: "TP.PAB.3.2", deskripsi: "Mengenal budaya dan bahasa dalam agama Buddha serta menghargai perbedaan budaya orang lain" },
        { kode: "TP.PAB.3.3", deskripsi: "Memahami dan melafalkan doa Buddhis harian serta doa syukur kepada Tuhan Yang Maha Esa dan Triratna" },
        { kode: "TP.PAB.3.4", deskripsi: "Memahami nilai-nilai sila pertama dan kedua dari Pancasila Buddhis (tidak membunuh dan tidak mengambil milik orang lain)" }
      ],
      "2": [
        { kode: "TP.PAB.3.5", deskripsi: "Meneladani sikap Pangeran Siddharta yang welas asih saat menolong angsa yang terluka oleh panah" },
        { kode: "TP.PAB.3.6", deskripsi: "Menghargai keragaman identitas dan tradisi budaya di lingkungan tempat tinggal" },
        { kode: "TP.PAB.3.7", deskripsi: "Mengamalkan kebajikan kedermawanan (Dana Paramita) kepada sesama yang membutuhkan" },
        { kode: "TP.PAB.3.8", deskripsi: "Bergotong royong merawat kebersihan lingkungan hidup dan menjaga kelestarian pepohonan di sekitar" }
      ]
    },
    "4": {
      "1": [
        { kode: "TP.PAB.4.1", deskripsi: "Memahami peristiwa empat peristiwa utama yang dilihat Pangeran Siddharta di luar istana" },
        { kode: "TP.PAB.4.2", deskripsi: "Meneladan Buddha Sakyamuni dalam menghargai sesama manusia dan menyelesaikan masalah pergaulan secara damai" },
        { kode: "TP.PAB.4.3", deskripsi: "Menghargai identitas masing-masing tradisi/aliran dalam agama Buddha (Theravada, Mahayana, Tantrayana)" },
        { kode: "TP.PAB.4.4", deskripsi: "Memahami sila ketiga, keempat, dan kelima dari Pancasila Buddhis dalam membina budi pekerti luhur" }
      ],
      "2": [
        { kode: "TP.PAB.4.5", deskripsi: "Memahami nilai-nilai Hukum Sebab Akibat yang Saling Bergantungan dalam menjaga keharmonisan pergaulan" },
        { kode: "TP.PAB.4.6", deskripsi: "Mempraktikkan kebajikan kesempurnaan (parami): sabar (khanti) dan bersemangat (viriya) dalam meraih cita-cita" },
        { kode: "TP.PAB.4.7", deskripsi: "Menunjukkan sikap sopan santun saat berziarah ke tempat ibadah dan situs sejarah keagamaan Buddha" },
        { kode: "TP.PAB.4.8", deskripsi: "Berperan aktif mewujudkan persahabatan yang rukun dan menolak segala bentuk perundungan di sekolah" }
      ]
    },
    "5": {
      "1": [
        { kode: "TP.PAB.5.1", deskripsi: "Meneladani perjuangan Petapa Gotama dalam menghadapi berbagai hambatan untuk meraih Penerangan Sempurna" },
        { kode: "TP.PAB.5.2", deskripsi: "Meneladan kehidupan Buddha Sakyamuni dalam menyelesaikan masalah kehidupan individu dan sosial secara arif" },
        { kode: "TP.PAB.5.3", deskripsi: "Memahami keragaman upacara puja dan tradisi kebaktian dalam berbagai aliran Agama Buddha" },
        { kode: "TP.PAB.5.4", deskripsi: "Mempraktikkan meditasi ketenangan (Samatha Bhavana) untuk mengendalikan emosi dan ketenteraman batin" }
      ],
      "2": [
        { kode: "TP.PAB.5.5", deskripsi: "Memahami ajaran Empat Kebenaran Mulia (Cattari Ariya Saccani) sebagai dasar ajaran Buddhadharma" },
        { kode: "TP.PAB.5.6", deskripsi: "Memahami hak dan kewajiban anak di rumah, sekolah, dan rumah ibadah sebagai wujud disiplin beragama" },
        { kode: "TP.PAB.5.7", deskripsi: "Memahami konsep dasar musyawarah mufakat yang dicontohkan dalam kehidupan sangha pada zaman Buddha" },
        { kode: "TP.PAB.5.8", deskripsi: "Mengamalkan sikap bersatu dalam perbedaan dengan berperan serta dalam dialog moderasi beragama" }
      ]
    },
    "6": {
      "1": [
        { kode: "TP.PAB.6.1", deskripsi: "Meneladani peristiwa Pemutaran Roda Dhamma pertama kali oleh Buddha Sakyamuni di Taman Rusa Isipatana" },
        { kode: "TP.PAB.6.2", deskripsi: "Meneladani welas asih Buddha yang melayani orang sakit dan memperlakukan semua manusia setara tanpa kasta" },
        { kode: "TP.PAB.6.3", deskripsi: "Memahami makna dan pesan spiritual hari-hari raya suci Agama Buddha (Waisak, Asadha, Kathina, Magha Puja)" },
        { kode: "TP.PAB.6.4", deskripsi: "Mengamalkan Delapan Jalan Utama Berunsur Benar (Ariya Atthangika Magga) dalam tingkah laku sehari-hari" }
      ],
      "2": [
        { kode: "TP.PAB.6.5", deskripsi: "Meneladani peristiwa Parinibbana Buddha Sakyamuni dan wasiat penting untuk senantiasa berjuang dengan sungguh-sungguh" },
        { kode: "TP.PAB.6.6", deskripsi: "Memahami sejarah dan nilai-nilai luhur Candi Borobudur sebagai mahakarya warisan budaya spiritual bangsa" },
        { kode: "TP.PAB.6.7", deskripsi: "Mempraktikkan cinta kasih universal (Metta) dan kasih sayang (Karuna) kepada seluruh makhluk hidup di dunia" },
        { kode: "TP.PAB.6.8", deskripsi: "Berperan aktif menjaga kerukunan antarumat beragama dan memperkokoh persatuan bangsa Indonesia" }
      ]
    }
  },

  // =========================================================================
  // I.6. PENDIDIKAN AGAMA KHONGHUCU DAN BUDI PEKERTI (PAKh-BP)
  // BSKAP No. 046/H/KR/2025
  // =========================================================================
  Khonghucu: {
    "1": {
      "1": [
        { kode: "TP.PAKh.1.1", deskripsi: "Memahami riwayat kelahiran dan silsilah keluarga Nabi Kŏngzĭ (孔子) yang luhur" },
        { kode: "TP.PAKh.1.2", deskripsi: "Memahami konsep Tiān (天) bahwa manusia diciptakan melalui kedua orang tua tercinta" },
        { kode: "TP.PAKh.1.3", deskripsi: "Memahami sikap bakti dan hormat kepada orang tua sebagai wujud hormat kepada Tiān (天)" },
        { kode: "TP.PAKh.1.4", deskripsi: "Mengenal perlengkapan dan sarana sembahyang di altar (hiolo, lilin, dan dupa)" },
        { kode: "TP.PAKh.1.5", deskripsi: "Membiasakan sikap berdoa dan menghormat (Bai) sebelum dan sesudah beraktivitas" }
      ],
      "2": [
        { kode: "TP.PAKh.1.6", deskripsi: "Memahami ayat suci dalam Kitab Bakti (Xiàojīng 孝经) tentang kasih sayang kepada orang tua" },
        { kode: "TP.PAKh.1.7", deskripsi: "Menceritakan kisah keteladanan bakti para tokoh agama Khonghucu (Rújiào 儒教)" },
        { kode: "TP.PAKh.1.8", deskripsi: "Menunjukkan sikap toleransi, ramah, dan suka berbagi bersama teman di sekolah" },
        { kode: "TP.PAKh.1.9", deskripsi: "Memiliki sikap tanggung jawab terhadap perawatan dan kebutuhan diri sendiri" },
        { kode: "TP.PAKh.1.10", deskripsi: "Meneladani masa kecil Nabi Kŏngzĭ yang gemar mempelajari tata krama dan sopan santun" }
      ]
    },
    "2": {
      "1": [
        { kode: "TP.PAKh.2.1", deskripsi: "Menceritakan kisah keteladanan sifat solidaritas dan kesetiaan sesama sahabat dari tokoh agama Khonghucu" },
        { kode: "TP.PAKh.2.2", deskripsi: "Memahami kedudukan Nabi Kŏngzĭ (孔子) sebagai Genta Rohani Tiān, Tiān Zhī Mùduó (天之木铎)" },
        { kode: "TP.PAKh.2.3", deskripsi: "Mempraktikkan sikap tangan hormat (Zuò Jī / Bào Quán) dan membungkuk dengan benar saat memberi salam" },
        { kode: "TP.PAKh.2.4", deskripsi: "Meneladani budi pekerti luhur para murid Nabi Kŏngzĭ dalam menuntut ilmu" },
        { kode: "TP.PAKh.2.5", deskripsi: "Menunjukkan sikap santun dan patuh kepada guru serta orang yang lebih tua di sekolah" }
      ],
      "2": [
        { kode: "TP.PAKh.2.6", deskripsi: "Memahami ayat-ayat suci Kitab Sìshū (四书) dan Wŭjīng (五经) tentang anak yang berbakti" },
        { kode: "TP.PAKh.2.7", deskripsi: "Memahami makna sembahyang dan penghormatan kepada arwah para leluhur di rumah" },
        { kode: "TP.PAKh.2.8", deskripsi: "Membiasakan perilaku disiplin waktu dan membantu tugas-tugas ringan di rumah" },
        { kode: "TP.PAKh.2.9", deskripsi: "Menjaga kejujuran dalam berucap dan menepati janji kepada teman" },
        { kode: "TP.PAKh.2.10", deskripsi: "Bergotong royong merawat kebersihan dan kerapian lingkungan belajar" }
      ]
    },
    "3": {
      "1": [
        { kode: "TP.PAKh.3.1", deskripsi: "Memahami ajaran watak sejati (xìng 性) manusia yang pada dasarnya membawa benih kebajikan menurut Mèngzĭ (孟子)" },
        { kode: "TP.PAKh.3.2", deskripsi: "Meneladani keteladanan ibunda Nabi Kŏngzĭ dan ibunda Mèngzĭ dalam mendidik dan membina budi pekerti anak" },
        { kode: "TP.PAKh.3.3", deskripsi: "Mengenal bagian-bagian Kitab Suci Yang Pokok (Sìshū 四书: Dàxué, Zhōngyōng, Lúnyŭ, Mèngzĭ)" },
        { kode: "TP.PAKh.3.4", deskripsi: "Memahami nilai-nilai Delapan Keimanan (bāchéngzhēnguī 八诚箴规) dalam keyakinan Khonghucu" },
        { kode: "TP.PAKh.3.5", deskripsi: "Memahami tata cara menancapkan dupa pada hiolo dengan ketulusan dan ketenangan hati" }
      ],
      "2": [
        { kode: "TP.PAKh.3.6", deskripsi: "Memahami ajaran tentang tiga kesukaan yang membawa faedah dan tiga kesukaan yang membawa celaka" },
        { kode: "TP.PAKh.3.7", deskripsi: "Meneladani cita-cita mulia dan semangat belajar tiada jemu dari Nabi Kŏngzĭ (孔子)" },
        { kode: "TP.PAKh.3.8", deskripsi: "Memahami sikap berdoa (bào xīn bādé 抱心八德) saat bersembahyang kepada Tiān" },
        { kode: "TP.PAKh.3.9", deskripsi: "Menerapkan sikap menghargai waktu, berhati-hati dalam berucap, dan saling mengasihi sesama manusia" },
        { kode: "TP.PAKh.3.10", deskripsi: "Membiasakan sikap ksatria: berani mengakui kesalahan dan bersungguh-sungguh memperbaiki diri" }
      ]
    },
    "4": {
      "1": [
        { kode: "TP.PAKh.4.1", deskripsi: "Meneladani budi pekerti luhur ibunda Ōuyáng Xiū (欧阳修) dan ibunda Yuè Fēi (岳飛) dalam menanamkan kesetiaan" },
        { kode: "TP.PAKh.4.2", deskripsi: "Memahami riwayat tugas suci pengembaraan Nabi Kŏngzĭ (孔子) menyebarkan ajaran kebajikan ke berbagai negeri" },
        { kode: "TP.PAKh.4.3", deskripsi: "Mengenal Kitab Suci Yang Mendasari (Wŭjīng 五经: Shījīng, Shūjīng, Yìjīng, Lĭjì, Chūnqiū)" },
        { kode: "TP.PAKh.4.4", deskripsi: "Memahami makna persembahyangan kepada Tiān (天), Nabi Kŏngzĭ, para suci (shénmíng 神明), dan leluhur" },
        { kode: "TP.PAKh.4.5", deskripsi: "Memahami tata cara dan pelaksanaan ibadah bersama di lĭtáng (礼堂), miào (庙), atau kelenteng" }
      ],
      "2": [
        { kode: "TP.PAKh.4.6", deskripsi: "Meneladani ketokohan Zhū Xī (朱熹) sebagai tokoh pembaharuan agama Khonghucu (Rújiào 儒教)" },
        { kode: "TP.PAKh.4.7", deskripsi: "Mengamalkan perilaku sesuai Delapan Kebajikan (bādé 八德: Xiao, Ti, Zhong, Xin, Li, Yi, Lian, Chi)" },
        { kode: "TP.PAKh.4.8", deskripsi: "Memahami peristiwa tanda-tanda khusus menjelang wafat Nabi Kŏngzĭ (孔子)" },
        { kode: "TP.PAKh.4.9", deskripsi: "Meneladani sikap para murid utama Nabi Kŏngzĭ yang tekun, setia, dan berbudi luhur (Jūnzĭ 君子)" },
        { kode: "TP.PAKh.4.10", deskripsi: "Membiasakan pergaulan yang rukun, mudah bergaul tanpa membeda-bedakan latar belakang sesama" }
      ]
    },
    "5": {
      "1": [
        { kode: "TP.PAKh.5.1", deskripsi: "Memahami wahyu Tiān (天) yang diterima oleh para nabi purba dan raja suci pembawa peradaban" },
        { kode: "TP.PAKh.5.2", deskripsi: "Menelaah ayat-ayat Kitab Sìshū dan Wŭjīng tentang Nabi Kŏngzĭ sebagai Tiān Zhī Mùduó dan persaudaraan sejati" },
        { kode: "TP.PAKh.5.3", deskripsi: "Memahami bahwa sembahyang adalah pokok dari agama dan membina iman yang kokoh" },
        { kode: "TP.PAKh.5.4", deskripsi: "Memahami makna dan tata upacara hari raya sembahyang kepada Tiān, Nabi Kŏngzĭ, dan para suci wujud kesusilaan (lĭ 礼)" },
        { kode: "TP.PAKh.5.5", deskripsi: "Memahami prinsip Empat Pantangan (sìwù 四勿): tidak melihat, tidak mendengar, tidak berbicara, dan tidak berbuat yang melanggar kesusilaan" }
      ],
      "2": [
        { kode: "TP.PAKh.5.6", deskripsi: "Meneladani tokoh-tokoh Rújiào (儒教) serta sumbangsih pemikirannya bagi kemajuan moral kemanusiaan" },
        { kode: "TP.PAKh.5.7", deskripsi: "Memahami hukum yīnyáng (阴阳) sebagai dasar hukum alam semesta dan konsep Tiga Dasar Kenyataan (sāncái 三才)" },
        { kode: "TP.PAKh.5.8", deskripsi: "Mengamalkan sikap cinta kasih kepada seluruh makhluk ciptaan Tiān (天) dan hidup rukun berdampingan" },
        { kode: "TP.PAKh.5.9", deskripsi: "Memahami tata cara dan perlengkapan sembahyang leluhur untuk menumbuhkan keimanan dan kepribadian luhur" },
        { kode: "TP.PAKh.5.10", deskripsi: "Menunjukkan rasa cinta tanah air dan menjaga kelestarian alam sebagai bakti kepada Tiāndìrén (天地人)" }
      ]
    },
    "6": {
      "1": [
        { kode: "TP.PAKh.6.1", deskripsi: "Memahami sejarah perkembangan agama Khonghucu di Indonesia dan peran berdirinya lembaga keagamaan MATAKIN" },
        { kode: "TP.PAKh.6.2", deskripsi: "Menelaah ayat-ayat suci Kitab Wŭjīng dan Sìshū yang mengajarkan kecintaan pada keadilan dan kebenaran" },
        { kode: "TP.PAKh.6.3", deskripsi: "Memahami keteraturan alam semesta berdasarkan hukum suci Tiān dan keseimbangan yīnyáng" },
        { kode: "TP.PAKh.6.4", deskripsi: "Memahami makna agamis dan etika perayaan Hari Tanggal Lahir dan Wafat Nabi Kŏngzĭ" },
        { kode: "TP.PAKh.6.5", deskripsi: "Mengamalkan Lima Hubungan Kemasyarakatan (wŭlún 五伦) dalam kehidupan bermasyarakat sehari-hari" }
      ],
      "2": [
        { kode: "TP.PAKh.6.6", deskripsi: "Memahami peran tokoh-tokoh Khonghucu dalam perjuangan kemerdekaan dan pembangunan bangsa Indonesia" },
        { kode: "TP.PAKh.6.7", deskripsi: "Mempraktikkan sikap tepa salira (Shu) dan harmonis kepada sesama tanpa membeda-bedakan keyakinan" },
        { kode: "TP.PAKh.6.8", deskripsi: "Memahami hakikat pembinaan diri menuju pribadi yang berbudi luhur (Jūnzĭ 君子) sejati" },
        { kode: "TP.PAKh.6.9", deskripsi: "Menerapkan prinsip harmoni dan musyawarah mufakat dalam menghadapi tantangan pergaulan zaman modern" },
        { kode: "TP.PAKh.6.10", deskripsi: "Berperan aktif memperkokoh moderasi beragama dan persatuan bangsa dalam bingkai Negara Kesatuan Republik Indonesia" }
      ]
    }
  }
};
