const fs = require('fs');
let code = fs.readFileSync('src/views/TujuanPembelajaran.tsx', 'utf8');

// Replace the generate logic with a smarter parsing logic and change tooltip
const newGenerateLogic = `  const handleGenerateDefaultTp = () => {
    if (!selectedMapel) return;
    const mapelObj = mapel.find(m => m.id === selectedMapel);
    if (!mapelObj) return;

    if (!mapelObj.nama.toLowerCase().includes('pancasila')) {
      alert("Maaf, muat TP otomatis saat ini baru tersedia untuk mata pelajaran Pendidikan Pancasila.");
      return;
    }

    const { kelas, semester } = state.sekolah;
    
    // Smart semester parsing
    const semStr = String(semester).toLowerCase();
    let sem = "1";
    if (semStr.includes('genap') || semStr.includes('2')) {
      sem = "2";
    }

    // Smart kelas parsing (extract numbers)
    let parsedKelas = String(kelas).replace(/[^0-9]/g, '');
    if (!parsedKelas) {
      alert("Sistem tidak dapat mendeteksi pengaturan angka Kelas. Silakan periksa kembali isian di menu Data Sekolah.");
      return;
    }

    const kelasData = defaultTpPancasila[parsedKelas];
    if (!kelasData) {
      alert(\`Maaf, data TP default untuk Kelas \${parsedKelas} belum tersedia.\`);
      return;
    }

    const tpsToInject = kelasData[sem];
    if (!tpsToInject || tpsToInject.length === 0) {
      alert(\`Maaf, data TP default untuk Kelas \${parsedKelas} Semester \${sem} belum tersedia.\`);
      return;
    }

    if (window.confirm(\`Apakah Anda yakin ingin memuat \${tpsToInject.length} TP default Pendidikan Pancasila untuk Kelas \${parsedKelas} Semester \${sem}?\`)) {
      let indexCounter = 0;
      const newTps = tpsToInject.map(item => ({
        id: 'tp_' + Date.now() + '_' + (indexCounter++),
        mapelId: selectedMapel,
        kode: item.kode,
        deskripsi: item.deskripsi
      }));

      updateState('tujuanPembelajaran', [...state.tujuanPembelajaran, ...newTps]);
    }
  };

  const handleDownloadTemplate = () => {`;

// We use regex to replace the whole old handleGenerateDefaultTp block
// Since the block spans multiple lines and is tricky, we'll match from "const handleGenerateDefaultTp = () => {" to "const handleDownloadTemplate = () => {"
code = code.replace(/const handleGenerateDefaultTp = \(\) => \{[\s\S]*?const handleDownloadTemplate = \(\) => \{/, newGenerateLogic);


// Change tooltip
code = code.replace(
  /Muat TP Default \(KurNas\)/,
  `Muat TP Default`
);

fs.writeFileSync('src/views/TujuanPembelajaran.tsx', code);
